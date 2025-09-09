import os
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd

try:
    # OR-Tools is optional at import time; we handle absence gracefully
    from ortools.sat.python import cp_model
    ORTOOLS_AVAILABLE = True
except Exception:
    ORTOOLS_AVAILABLE = False


class InductionRequest(BaseModel):
    # Optional filters or parameters for future extension
    max_run: Optional[int] = None
    max_standby: Optional[int] = None
    max_maintenance: Optional[int] = None


class TrainDecision(BaseModel):
    train_id: str
    decision: str  # "run" | "standby" | "maintenance"
    score: float
    reasons: List[str]


class InductionResponse(BaseModel):
    results: List[TrainDecision]


app = FastAPI(title="Induction Optimizer API", version="0.1.0")


def read_csv_or_empty(path: str, required_columns: Optional[List[str]] = None) -> pd.DataFrame:
    if not os.path.exists(path):
        return pd.DataFrame(columns=required_columns or [])
    df = pd.read_csv(path)
    if required_columns:
        for col in required_columns:
            if col not in df.columns:
                df[col] = pd.Series(dtype="object")
    return df


def load_datasets(data_dir: str):
    fitness = read_csv_or_empty(
        os.path.join(data_dir, "fitness_certificates.csv"),
        ["train_id", "component", "expiry_date", "is_valid"],
    )
    job_cards = read_csv_or_empty(
        os.path.join(data_dir, "job_cards.csv"),
        ["train_id", "priority", "status"],
    )
    branding = read_csv_or_empty(
        os.path.join(data_dir, "branding_contracts.csv"),
        ["train_id", "exposure_hours", "sla_priority"],
    )
    mileage = read_csv_or_empty(
        os.path.join(data_dir, "mileage_logs.csv"),
        ["train_id", "daily_km"],
    )
    cleaning = read_csv_or_empty(
        os.path.join(data_dir, "cleaning_slots.csv"),
        ["date", "crew_available", "max_trains"],
    )
    stabling = read_csv_or_empty(
        os.path.join(data_dir, "stabling_state.csv"),
        ["train_id", "bay", "status"],
    )

    return fitness, job_cards, branding, mileage, cleaning, stabling


def derive_train_set(fitness: pd.DataFrame, job_cards: pd.DataFrame, branding: pd.DataFrame, mileage: pd.DataFrame, stabling: pd.DataFrame) -> List[str]:
    trains = set()
    for df in [fitness, job_cards, branding, mileage, stabling]:
        if not df.empty and "train_id" in df.columns:
            trains.update(df["train_id"].dropna().astype(str).tolist())
    return sorted(trains)


def compute_scores(train_ids: List[str], fitness: pd.DataFrame, job_cards: pd.DataFrame, branding: pd.DataFrame, mileage: pd.DataFrame) -> dict:
    scores = {t: 0.0 for t in train_ids}
    reasons = {t: [] for t in train_ids}

    # Fitness: invalid => heavy penalty; valid => small bonus
    if not fitness.empty:
        fitness_valid = (
            fitness.groupby("train_id")["is_valid"].apply(lambda s: bool(all(s.fillna(True))))
            if "is_valid" in fitness.columns
            else pd.Series({})
        )
        for t in train_ids:
            valid = bool(fitness_valid.get(t, True))
            if valid:
                scores[t] += 5.0
                reasons[t].append("Fitness valid")
            else:
                scores[t] -= 100.0
                reasons[t].append("Fitness expired")

    # Job cards: open high-priority => maintenance leaning
    if not job_cards.empty:
        open_high = job_cards[(job_cards["status"].str.lower() == "open") & (job_cards["priority"].str.lower().isin(["high", "urgent"]))]
        has_open_high = open_high.groupby("train_id").size()
        for t in train_ids:
            if int(has_open_high.get(t, 0)) > 0:
                scores[t] -= 20.0
                reasons[t].append("Open high-priority job cards")

    # Branding exposure: higher exposure => prefer to run
    if not branding.empty:
        bh = branding.groupby("train_id")["exposure_hours"].sum()
        if not bh.empty:
            max_exp = max(1.0, float(bh.max()))
            for t in train_ids:
                exp = float(bh.get(t, 0.0))
                bonus = 10.0 * (exp / max_exp)
                scores[t] += bonus
                if exp > 0:
                    reasons[t].append(f"Branding exposure bonus {bonus:.1f}")

    # Mileage balancing: very high recent mileage => lean standby/maintenance
    if not mileage.empty:
        mk = mileage.groupby("train_id")["daily_km"].sum()
        if not mk.empty:
            max_km = max(1.0, float(mk.max()))
            for t in train_ids:
                km = float(mk.get(t, 0.0))
                fatigue = 5.0 * (km / max_km)
                scores[t] -= fatigue
                if km > 0:
                    reasons[t].append(f"Mileage fatigue -{fatigue:.1f}")

    return scores, reasons


def solve_decisions(train_ids: List[str], scores: dict, reasons: dict, req: InductionRequest) -> List[TrainDecision]:
    # If OR-Tools not available, do a heuristic fallback
    if not ORTOOLS_AVAILABLE:
        ranked = sorted(train_ids, key=lambda t: scores[t], reverse=True)
        results: List[TrainDecision] = []
        for idx, t in enumerate(ranked):
            decision = "run" if idx < max(1, len(ranked) // 2) else "standby"
            if scores[t] < -50:
                decision = "maintenance"
            results.append(TrainDecision(train_id=t, decision=decision, score=float(scores[t]), reasons=reasons[t]))
        return results

    model = cp_model.CpModel()

    x_run = {}
    x_standby = {}
    x_maint = {}
    for t in train_ids:
        x_run[t] = model.NewBoolVar(f"run_{t}")
        x_standby[t] = model.NewBoolVar(f"standby_{t}")
        x_maint[t] = model.NewBoolVar(f"maint_{t}")
        # exactly one decision
        model.Add(x_run[t] + x_standby[t] + x_maint[t] == 1)

        # if score is very negative, prefer maintenance via soft constraints in objective

    # Capacity constraints if provided
    if req.max_run is not None:
        model.Add(sum(x_run[t] for t in train_ids) <= req.max_run)
    if req.max_standby is not None:
        model.Add(sum(x_standby[t] for t in train_ids) <= req.max_standby)
    if req.max_maintenance is not None:
        model.Add(sum(x_maint[t] for t in train_ids) <= req.max_maintenance)

    # Objective: maximize sum(scores * run + 0.3*scores * standby - 0.2*scores * maintenance)
    # Encourage high-score trains to run, medium to standby, low to maintenance
    objective_terms = []
    for t in train_ids:
        s = int(round(scores[t] * 100))
        objective_terms.append(s * x_run[t])
        objective_terms.append(int(0.3 * s) * x_standby[t])
        objective_terms.append(int(-0.2 * s) * x_maint[t])
    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    try:
        # Set threads only if the parameter exists in this OR-Tools version
        if hasattr(solver, 'parameters') and hasattr(solver.parameters, 'num_search_workers'):
            solver.parameters.num_search_workers = 4
    except Exception:
        pass
    solver.parameters.max_time_in_seconds = 5.0
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # Fallback to heuristic ranking when solver cannot find a solution
        ranked = sorted(train_ids, key=lambda t: scores[t], reverse=True)
        results: List[TrainDecision] = []
        for idx, t in enumerate(ranked):
            decision = "run" if idx < max(1, len(ranked) // 2) else "standby"
            if scores[t] < -50:
                decision = "maintenance"
            results.append(TrainDecision(train_id=t, decision=decision, score=float(scores[t]), reasons=reasons[t]))
        return results

    results: List[TrainDecision] = []
    for t in train_ids:
        vals = {
            "run": solver.Value(x_run[t]),
            "standby": solver.Value(x_standby[t]),
            "maintenance": solver.Value(x_maint[t]),
        }
        decision = max(vals, key=vals.get)
        results.append(TrainDecision(train_id=t, decision=decision, score=float(scores[t]), reasons=reasons[t]))

    # Rank by decision importance (run first) then score
    priority = {"run": 0, "standby": 1, "maintenance": 2}
    results.sort(key=lambda r: (priority.get(r.decision, 3), -r.score, r.train_id))
    return results


@app.post("/induction/run", response_model=InductionResponse)
def run_induction(req: InductionRequest):
    data_dir = os.environ.get("INDUCTION_DATA_DIR", os.path.join(os.path.dirname(__file__), "sample_data"))
    fitness, job_cards, branding, mileage, cleaning, stabling = load_datasets(data_dir)

    # Basic inferred capacities from cleaning data if available
    if not cleaning.empty and req.max_run is None:
        try:
            req.max_run = int(cleaning["max_trains"].astype(float).max())
        except Exception:
            pass

    train_ids = derive_train_set(fitness, job_cards, branding, mileage, stabling)
    scores, reasons = compute_scores(train_ids, fitness, job_cards, branding, mileage)
    results = solve_decisions(train_ids, scores, reasons, req)
    return InductionResponse(results=results)


class ChatRequest(BaseModel):
    message: str
    role: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    text = (req.message or "").strip()
    if not text:
        return ChatResponse(reply="Please enter a question.")

    # Lightweight rule-based helper; branch by role
    q = text.lower()
    role = (req.role or "commuter").lower()
    if role == "admin":
        if any(k in q for k in ["induction", "optimizer", "schedule"]):
            return ChatResponse(reply="Admin → Induction: run the optimizer and review results.")
        if any(k in q for k in ["stabling", "depot"]):
            return ChatResponse(reply="Admin → Stabling: view depot schematic and simulate moves.")
        if any(k in q for k in ["maintenance", "job card", "job cards"]):
            return ChatResponse(reply="Admin → Maintenance: review job cards and statuses.")
        if any(k in q for k in ["kpi", "metrics"]):
            return ChatResponse(reply="Admin → KPI: view performance charts.")
        if "conflict" in q:
            return ChatResponse(reply="Admin → Conflicts: inspect fitness or job card conflicts.")
        if any(k in q for k in ["migrate", "supabase"]):
            return ChatResponse(reply="Admin → Migrate: run migration or generate sample data.")
        return ChatResponse(reply="I can guide you through Induction, Stabling, Maintenance, KPI, Conflicts, and Migrate.")
    else:
        if any(k in q for k in ["ticket", "tickets"]):
            return ChatResponse(reply="Go to Dashboard → Tickets to view or manage your tickets.")
        if any(k in q for k in ["trip", "plan", "route", "routes"]):
            return ChatResponse(reply="Use Dashboard → Plan to plan a trip and view suggested routes.")
        if "alert" in q:
            return ChatResponse(reply="Check Dashboard → Alerts for service updates and disruptions.")
        if any(k in q for k in ["setting", "account", "profile", "login", "signup"]):
            return ChatResponse(reply="Open Dashboard → Settings to update your profile and preferences.")
        return ChatResponse(reply="I can help with tickets, trips/plan, alerts, and settings. What do you need?")

