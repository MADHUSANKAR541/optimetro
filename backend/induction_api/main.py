import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import warnings
warnings.filterwarnings('ignore')
import os
import json

# ML Libraries
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

# FastAPI
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
import yaml
from dateutil import parser as dateutil_parser

# Optional OR-Tools import (for induction optimizer). We handle absence gracefully.
try:
    from ortools.sat.python import cp_model  # type: ignore
    ORTOOLS_AVAILABLE = True
except Exception:
    ORTOOLS_AVAILABLE = False


class DemandForecaster:
    """
    Main class for demand forecasting model using scikit-learn
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}
        self.feature_columns = []
        self.stations = []
        self.historical_data = {}  # Store for proper lag features
        
    def load_datasets(self, ridership_path: str, events_path: str, weather_path: str = None):
        """Load and validate datasets"""
        print("📊 Loading datasets...")
        
        # Load ridership history
        self.ridership_df = pd.read_csv(ridership_path)
        self.ridership_df['datetime'] = pd.to_datetime(self.ridership_df['date'] + ' ' + self.ridership_df['hour'])
        
        # Load events calendar
        self.events_df = pd.read_csv(events_path)
        self.events_df['date'] = pd.to_datetime(self.events_df['date'])
        
        # Load weather (optional)
        if weather_path:
            self.weather_df = pd.read_csv(weather_path)
            self.weather_df['date'] = pd.to_datetime(self.weather_df['date'])
        else:
            self.weather_df = None
            
        self.stations = sorted(self.ridership_df['station'].unique())
        
        # Prepare historical data for proper lag features
        self._prepare_historical_data()
        
        print(f"✅ Loaded data for {len(self.stations)} stations")
        
    def _prepare_historical_data(self):
        """Prepare historical data lookup for proper lag features"""
        for station in self.stations:
            station_data = self.ridership_df[self.ridership_df['station'] == station].copy()
            station_data = station_data.sort_values('datetime')
            
            # Create lookup for historical values
            self.historical_data[station] = {
                'data': station_data.set_index('datetime')['passenger_count'].to_dict(),
                'overall_avg': station_data['passenger_count'].mean()
            }
        
    def feature_engineering(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create time-based and contextual features"""
        print("🔧 Engineering features...")
        
        # Time features
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek  # 0=Monday
        df['month'] = df['datetime'].dt.month
        df['day_of_month'] = df['datetime'].dt.day
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Peak hour indicators
        df['is_morning_peak'] = ((df['hour'] >= 7) & (df['hour'] <= 9)).astype(int)
        df['is_evening_peak'] = ((df['hour'] >= 17) & (df['hour'] <= 19)).astype(int)
        df['is_off_peak'] = ((df['is_morning_peak'] == 0) & (df['is_evening_peak'] == 0)).astype(int)
        
        # Season encoding
        df['season'] = df['month'].apply(self._get_season)
        
        # Add event flags
        df = self._add_event_features(df)
        
        # Add weather features (if available)
        if self.weather_df is not None:
            df = self._add_weather_features(df)
        
        # Add proper lag features
        df = self._add_proper_lag_features(df)
        
        return df
    
    def _get_season(self, month):
        """Map month to season (for India)"""
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'summer' 
        elif month in [6, 7, 8, 9]:
            return 'monsoon'
        else:
            return 'post_monsoon'
    
    def _add_event_features(self, df):
        """Add event flags from events calendar"""
        df['date_only'] = df['datetime'].dt.date
        
        # Initialize event flags
        df['is_holiday'] = 0
        df['is_festival'] = 0
        df['is_concert'] = 0
        
        # Merge with events
        for _, event in self.events_df.iterrows():
            event_date = event['date'].date()
            mask = df['date_only'] == event_date
            
            if event['type'] == 'holiday':
                df.loc[mask, 'is_holiday'] = 1
            elif event['type'] == 'festival':
                df.loc[mask, 'is_festival'] = 1
            elif event['type'] == 'concert':
                df.loc[mask, 'is_concert'] = 1
        
        df = df.drop('date_only', axis=1)
        return df
    
    def _add_weather_features(self, df):
        """Add weather features"""
        df['date_only'] = df['datetime'].dt.date
        weather_dict = {}
        
        for _, weather in self.weather_df.iterrows():
            weather_date = weather['date'].date()
            weather_dict[weather_date] = {
                'temperature': weather['temperature'],
                'is_rainy': weather['is_rainy']
            }
        
        df['temperature'] = df['date_only'].map(lambda x: weather_dict.get(x, {}).get('temperature', 25))
        df['is_rainy'] = df['date_only'].map(lambda x: weather_dict.get(x, {}).get('is_rainy', 0))
        
        # Temperature categories
        df['temp_category'] = pd.cut(df['temperature'], 
                                   bins=[0, 20, 30, 40, 50], 
                                   labels=['cool', 'mild', 'hot', 'very_hot'])
        
        df = df.drop('date_only', axis=1)
        return df
    
    def _add_proper_lag_features(self, df):
        """Add proper lag features using historical data"""
        # Sort by station and datetime
        df = df.sort_values(['station', 'datetime'])
        
        # Add previous day same hour demand (shift by 1 day worth of hours)
        df['prev_day_demand'] = df.groupby(['station', 'hour'])['passenger_count'].shift(1)
        
        # Add previous week same day/hour demand (shift by 1 week)
        df['prev_week_demand'] = df.groupby(['station', 'hour', 'day_of_week'])['passenger_count'].shift(1)
        
        # Rolling averages
        df['rolling_3h_avg'] = df.groupby('station')['passenger_count'].rolling(3, min_periods=1).mean().values
        df['rolling_24h_avg'] = df.groupby('station')['passenger_count'].rolling(24, min_periods=1).mean().values
        
        # Fill NaN values with station-specific averages
        for station in df['station'].unique():
            station_mask = df['station'] == station
            station_avg = df.loc[station_mask, 'passenger_count'].mean()
            
            df.loc[station_mask, 'prev_day_demand'] = df.loc[station_mask, 'prev_day_demand'].fillna(station_avg)
            df.loc[station_mask, 'prev_week_demand'] = df.loc[station_mask, 'prev_week_demand'].fillna(station_avg)
        
        return df
    
    def prepare_features(self, df: pd.DataFrame):
        """Prepare features for training"""
        print("🎯 Preparing features for training...")
        
        # Feature engineering
        df = self.feature_engineering(df)
        
        # Select feature columns
        self.feature_columns = [
            'hour', 'day_of_week', 'month', 'day_of_month', 'is_weekend',
            'is_morning_peak', 'is_evening_peak', 'is_off_peak', 'season',
            'is_holiday', 'is_festival', 'is_concert',
            'prev_day_demand', 'prev_week_demand', 'rolling_3h_avg', 'rolling_24h_avg'
        ]
        
        # Add weather features if available
        if self.weather_df is not None:
            self.feature_columns.extend(['temperature', 'is_rainy', 'temp_category'])
        
        # Encode categorical variables
        categorical_features = ['season', 'temp_category'] if self.weather_df is not None else ['season']
        
        for feature in categorical_features:
            if feature in df.columns:
                le = LabelEncoder()
                df[feature] = le.fit_transform(df[feature].astype(str))
                self.label_encoders[feature] = le
        
        return df
    
    def train_models(self):
        """Train linear regression models for each station"""
        print("🚂 Training linear regression models for each station...")
        
        # Prepare data
        df = self.prepare_features(self.ridership_df.copy())
        
        # Train model for each station
        for station in self.stations:
            print(f"  Training model for {station}...")
            
            # Filter data for current station
            station_data = df[df['station'] == station].copy()
            station_data = station_data.sort_values('datetime')
            
            # Prepare features and target
            X = station_data[self.feature_columns]
            y = station_data['passenger_count']
            
            # Handle missing values
            X = X.fillna(X.mean())
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            self.scalers[station] = scaler
            
            # Time series split (use last 20% for testing)
            split_idx = int(len(X_scaled) * 0.8)
            X_train, X_test = X_scaled[:split_idx], X_scaled[split_idx:]
            y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
            
            # Train Linear Regression model
            lr_model = LinearRegression()
            lr_model.fit(X_train, y_train)
            
            # Store model
            self.models[station] = lr_model
            
            # Evaluate model
            y_pred = lr_model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)
            
            print(f"    {station}: MAE={mae:.2f}, RMSE={rmse:.2f}, R²={r2:.3f}")
    
    def get_historical_lag_features(self, station: str, dt: datetime) -> Dict:
        """Get proper historical lag features for prediction"""
        
        if station not in self.historical_data:
            return self._get_default_lag_features(station)
        
        hist_data = self.historical_data[station]
        
        # Try to get actual historical values
        prev_day = dt - timedelta(days=1)
        prev_week = dt - timedelta(weeks=1)
        
        # Previous day demand (same hour)
        prev_day_demand = hist_data['data'].get(prev_day, hist_data['overall_avg'])
        
        # Previous week demand (same day and hour)
        prev_week_demand = hist_data['data'].get(prev_week, hist_data['overall_avg'])
        
        # Rolling averages (use recent historical data)
        recent_data = []
        for i in range(1, 25):  # Last 24 hours
            check_dt = dt - timedelta(hours=i)
            val = hist_data['data'].get(check_dt)
            if val is not None:
                recent_data.append(val)
        
        if recent_data:
            rolling_24h_avg = np.mean(recent_data)
            rolling_3h_avg = np.mean(recent_data[:3]) if len(recent_data) >= 3 else rolling_24h_avg
        else:
            rolling_24h_avg = rolling_3h_avg = hist_data['overall_avg']
        
        return {
            'prev_day_demand': prev_day_demand,
            'prev_week_demand': prev_week_demand,
            'rolling_3h_avg': rolling_3h_avg,
            'rolling_24h_avg': rolling_24h_avg
        }
    
    def _get_default_lag_features(self, station: str) -> Dict:
        """Get default lag features when no historical data available"""
        if station in self.historical_data:
            avg_demand = self.historical_data[station]['overall_avg']
        else:
            avg_demand = self.ridership_df[self.ridership_df['station'] == station]['passenger_count'].mean()
        
        return {
            'prev_day_demand': avg_demand,
            'prev_week_demand': avg_demand,
            'rolling_3h_avg': avg_demand,
            'rolling_24h_avg': avg_demand
        }
    
    def predict_demand(self, station: str, target_date: str, hours: List[str] = None) -> Dict:
        """Predict demand for specific station and date"""
        
        if station not in self.models:
            raise ValueError(f"No model available for station: {station}")
        
        target_date_obj = pd.to_datetime(target_date).date()
        
        # Default to all hours if not specified
        if hours is None:
            hours = [f"{h:02d}:00" for h in range(6, 24)]  # 6 AM to 11 PM
        
        predictions = []
        
        for hour_str in hours:
            # Create datetime
            datetime_str = f"{target_date} {hour_str}"
            dt = pd.to_datetime(datetime_str)
            
            # Create feature vector
            features = self._create_feature_vector(station, dt)
            
            # Scale features
            scaler = self.scalers[station]
            features_scaled = scaler.transform([features])
            
            # Predict
            model = self.models[station]
            demand = model.predict(features_scaled)[0]
            demand = max(0, int(demand))  # Ensure non-negative integer
            
            predictions.append({
                "hour": hour_str,
                "demand": demand
            })
        
        return {
            "station": station,
            "date": target_date,
            "predictions": predictions
        }
    
    def _create_feature_vector(self, station: str, dt: datetime) -> List:
        """Create feature vector for prediction with proper lag features"""
        
        # Time features
        hour = dt.hour
        day_of_week = dt.weekday()
        month = dt.month
        day_of_month = dt.day
        is_weekend = 1 if day_of_week >= 5 else 0
        
        # Peak hour indicators
        is_morning_peak = 1 if 7 <= hour <= 9 else 0
        is_evening_peak = 1 if 17 <= hour <= 19 else 0
        is_off_peak = 1 if (is_morning_peak == 0 and is_evening_peak == 0) else 0
        
        # Season
        season = self._get_season(month)
        if 'season' in self.label_encoders:
            season_encoded = self.label_encoders['season'].transform([season])[0]
        else:
            season_encoded = 0
        
        # Event flags (check events calendar)
        date_only = dt.date()
        is_holiday = is_festival = is_concert = 0
        
        for _, event in self.events_df.iterrows():
            if event['date'].date() == date_only:
                if event['type'] == 'holiday':
                    is_holiday = 1
                elif event['type'] == 'festival':
                    is_festival = 1
                elif event['type'] == 'concert':
                    is_concert = 1
        
        # Get proper lag features using historical data
        lag_features = self.get_historical_lag_features(station, dt)
        
        # Base features
        features = [
            hour, day_of_week, month, day_of_month, is_weekend,
            is_morning_peak, is_evening_peak, is_off_peak, season_encoded,
            is_holiday, is_festival, is_concert,
            lag_features['prev_day_demand'], 
            lag_features['prev_week_demand'], 
            lag_features['rolling_3h_avg'],
            lag_features['rolling_24h_avg']
        ]
        
        # Add weather features if available
        if self.weather_df is not None:
            # Default weather values
            temperature = 25
            is_rainy = 0
            temp_category = 1  # 'mild'
            
            # Try to get actual weather for the date
            weather_row = self.weather_df[self.weather_df['date'].dt.date == date_only]
            if not weather_row.empty:
                temperature = weather_row.iloc[0]['temperature']
                is_rainy = weather_row.iloc[0]['is_rainy']
                
                if temperature <= 20:
                    temp_category = 0  # 'cool'
                elif temperature <= 30:
                    temp_category = 1  # 'mild'
                elif temperature <= 40:
                    temp_category = 2  # 'hot'
                else:
                    temp_category = 3  # 'very_hot'
            
            features.extend([temperature, is_rainy, temp_category])
        
        return features
    
    def save_models(self, model_dir: str = "models/"):
        """Save trained models"""
        import os
        os.makedirs(model_dir, exist_ok=True)
        
        # Save models
        for station, model in self.models.items():
            joblib.dump(model, f"{model_dir}/model_{station.replace(' ', '_')}.pkl")
        
        # Save scalers and encoders
        joblib.dump(self.scalers, f"{model_dir}/scalers.pkl")
        joblib.dump(self.label_encoders, f"{model_dir}/label_encoders.pkl")
        joblib.dump(self.feature_columns, f"{model_dir}/feature_columns.pkl")
        joblib.dump(self.stations, f"{model_dir}/stations.pkl")
        joblib.dump(self.historical_data, f"{model_dir}/historical_data.pkl")
        
        print(f"✅ Models saved to {model_dir}")
    
    def load_models(self, model_dir: str = "models/"):
        """Load trained models"""
        # Load scalers and encoders
        self.scalers = joblib.load(f"{model_dir}/scalers.pkl")
        self.label_encoders = joblib.load(f"{model_dir}/label_encoders.pkl")
        self.feature_columns = joblib.load(f"{model_dir}/feature_columns.pkl")
        self.stations = joblib.load(f"{model_dir}/stations.pkl")
        self.historical_data = joblib.load(f"{model_dir}/historical_data.pkl")
        
        # Load models
        self.models = {}
        for station in self.stations:
            model_path = f"{model_dir}/model_{station.replace(' ', '_')}.pkl"
            self.models[station] = joblib.load(model_path)
        
        print(f"✅ Models loaded from {model_dir}")


# FastAPI Application
app = FastAPI(title="Metro Demand Forecasting API", version="1.0.0")

# Global forecaster instance
forecaster = DemandForecaster()

# Pydantic models for API
class ForecastRequest(BaseModel):
    station: str
    date: str
    hours: Optional[List[str]] = None

class PredictionResponse(BaseModel):
    hour: str
    demand: int

class ForecastResponse(BaseModel):
    station: str
    date: str
    predictions: List[PredictionResponse]


@app.get("/")
def root():
    return {
        "message": "🚆 Metro Demand Forecasting API is running",
        "endpoints": {
            "forecast": "/api/demand/forecast"
        }
    }


@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    try:
        # Try to load existing models
        # Load models from a path relative to this file so CWD doesn't matter
        model_dir = os.path.join(os.path.dirname(__file__), "models")
        forecaster.load_models(model_dir=model_dir)
        print("✅ Models loaded successfully")
    except:
        print("⚠️  No pre-trained models found. Train models first using /train endpoint")

@app.post("/api/demand/forecast", response_model=ForecastResponse)
async def forecast_demand(request: ForecastRequest):
    """Forecast hourly passenger demand for a station"""
    try:
        prediction = forecaster.predict_demand(
            station=request.station,
            target_date=request.date,
            hours=request.hours
        )
        return prediction
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/train")
async def train_models():
    """Train forecasting models (use this endpoint to train with your datasets)"""
    try:
        # Load datasets using absolute paths based on this file's directory
        data_dir = os.path.dirname(__file__)
        forecaster.load_datasets(
            ridership_path=os.path.join(data_dir, "ridership_history.csv"),
            events_path=os.path.join(data_dir, "events_calendar.csv"),
            weather_path=os.path.join(data_dir, "weather.csv"),
        )
        
        # Train models
        forecaster.train_models()
        
        # Save models to a directory relative to this file
        model_dir = os.path.join(os.path.dirname(__file__), "models")
        forecaster.save_models(model_dir=model_dir)
        
        return {"message": "Models trained and saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stations")
async def get_stations():
    """Get list of available stations"""
    return {"stations": forecaster.stations}

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "models_loaded": len(forecaster.models) > 0}


# =============================
# Induction Optimizer (New)
# =============================

class InductionRequest(BaseModel):
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


def derive_train_set(
    fitness: pd.DataFrame,
    job_cards: pd.DataFrame,
    branding: pd.DataFrame,
    mileage: pd.DataFrame,
    stabling: pd.DataFrame,
) -> List[str]:
    trains = set()
    for df in [fitness, job_cards, branding, mileage, stabling]:
        if not df.empty and "train_id" in df.columns:
            trains.update(df["train_id"].dropna().astype(str).tolist())
    return sorted(trains)


def compute_scores(
    train_ids: List[str],
    fitness: pd.DataFrame,
    job_cards: pd.DataFrame,
    branding: pd.DataFrame,
    mileage: pd.DataFrame,
) -> dict:
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
        if "status" in job_cards.columns and "priority" in job_cards.columns:
            open_high = job_cards[
                job_cards["status"].astype(str).str.lower().eq("open")
                & job_cards["priority"].astype(str).str.lower().isin(["high", "urgent"])
            ]
            has_open_high = open_high.groupby("train_id").size()
            for t in train_ids:
                if int(has_open_high.get(t, 0)) > 0:
                    scores[t] -= 20.0
                    reasons[t].append("Open high-priority job cards")

    # Branding exposure: higher exposure => prefer to run
    if not branding.empty:
        if "exposure_hours" in branding.columns:
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
        if "daily_km" in mileage.columns:
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
    # Heuristic fallback when OR-Tools not present
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
        model.Add(x_run[t] + x_standby[t] + x_maint[t] == 1)

    if req.max_run is not None:
        model.Add(sum(x_run[t] for t in train_ids) <= req.max_run)
    if req.max_standby is not None:
        model.Add(sum(x_standby[t] for t in train_ids) <= req.max_standby)
    if req.max_maintenance is not None:
        model.Add(sum(x_maint[t] for t in train_ids) <= req.max_maintenance)

    objective_terms = []
    for t in train_ids:
        s = int(round(scores[t] * 100))
        objective_terms.append(s * x_run[t])
        objective_terms.append(int(0.3 * s) * x_standby[t])
        objective_terms.append(int(-0.2 * s) * x_maint[t])
    model.Maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    try:
        if hasattr(solver, 'parameters') and hasattr(solver.parameters, 'num_search_workers'):
            solver.parameters.num_search_workers = 4
    except Exception:
        pass
    solver.parameters.max_time_in_seconds = 5.0
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
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

    priority = {"run": 0, "standby": 1, "maintenance": 2}
    results.sort(key=lambda r: (priority.get(r.decision, 3), -r.score, r.train_id))
    return results


@app.post("/induction/run", response_model=InductionResponse)
def run_induction(req: InductionRequest):
    data_dir = os.environ.get(
        "INDUCTION_DATA_DIR",
        os.path.join(os.path.dirname(__file__), "sample_data"),
    )
    fitness, job_cards, branding, mileage, cleaning, stabling = load_datasets(data_dir)

    if not cleaning.empty and req.max_run is None:
        try:
            req.max_run = int(pd.to_numeric(cleaning["max_trains"], errors="coerce").max())
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

# Training Script
def main():
    """Main training function"""
    print("🚂 Metro Demand Forecasting Model - Training")
    
    # Initialize forecaster
    forecaster = DemandForecaster()
    
    # Load datasets
    forecaster.load_datasets(
        ridership_path="ridership_history.csv",
        events_path="events_calendar.csv",
        weather_path="weather.csv"  # Optional
    )
    
    # Train models
    forecaster.train_models()
    
    # Save models
    forecaster.save_models()
    
    print("\n🎉 Training completed!")
    print("Run: uvicorn demand_forecasting_model:app --reload")
    print("Then test: POST /api/demand/forecast")


def create_sample_data():
    """Create sample datasets for testing"""
    print("📊 Creating sample datasets...")
    
    # Create sample ridership data
    dates = pd.date_range('2023-01-01', '2023-12-31', freq='H')
    stations = ['Central Station', 'Airport', 'Business District', 'University', 'Mall']
    
    ridership_data = []
    for date in dates:
        for station in stations:
            # Create realistic patterns
            base_demand = np.random.poisson(50)
            
            # Add time-based patterns
            if 7 <= date.hour <= 9 or 17 <= date.hour <= 19:  # Peak hours
                base_demand *= 2
            if date.weekday() >= 5:  # Weekend
                base_demand *= 0.7
            if station == 'Business District' and date.weekday() < 5:
                base_demand *= 1.5
            
            ridership_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'hour': date.strftime('%H:%M'),
                'station': station,
                'passenger_count': max(5, int(base_demand + np.random.normal(0, 10)))
            })
    
    pd.DataFrame(ridership_data).to_csv('ridership_history.csv', index=False)
    
    # Create sample events data
    events_data = [
        {'date': '2023-01-01', 'type': 'holiday', 'name': 'New Year'},
        {'date': '2023-01-26', 'type': 'holiday', 'name': 'Republic Day'},
        {'date': '2023-03-08', 'type': 'festival', 'name': 'Holi'},
        {'date': '2023-08-15', 'type': 'holiday', 'name': 'Independence Day'},
        {'date': '2023-10-24', 'type': 'festival', 'name': 'Diwali'},
        {'date': '2023-12-25', 'type': 'holiday', 'name': 'Christmas'},
        {'date': '2023-06-15', 'type': 'concert', 'name': 'Summer Music Festival'},
        {'date': '2023-11-10', 'type': 'concert', 'name': 'Rock Concert'},
    ]
    
    pd.DataFrame(events_data).to_csv('events_calendar.csv', index=False)
    
    # Create sample weather data
    weather_dates = pd.date_range('2023-01-01', '2023-12-31', freq='D')
    weather_data = []
    
    for date in weather_dates:
        # Seasonal temperature patterns for India
        if date.month in [12, 1, 2]:  # Winter
            temp = np.random.normal(20, 5)
        elif date.month in [3, 4, 5]:  # Summer
            temp = np.random.normal(35, 7)
        elif date.month in [6, 7, 8, 9]:  # Monsoon
            temp = np.random.normal(28, 4)
        else:  # Post-monsoon
            temp = np.random.normal(25, 5)
        
        is_rainy = 1 if (date.month in [6, 7, 8, 9] and np.random.random() < 0.4) else 0
        
        weather_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'temperature': max(15, min(45, temp)),
            'is_rainy': is_rainy
        })
    
    pd.DataFrame(weather_data).to_csv('weather.csv', index=False)
    
    print(" Sample datasets created:")
    print("  📄 ridership_history.csv")
    print("  📄 events_calendar.csv") 
    print("  📄 weather.csv")


if __name__ == "__main__":
    main()

# =============================
# Conflicts Engine Integration
# =============================

# Paths to conflict system assets with local override
def _resolve_conflict_paths():
    local_dir = os.path.join(os.path.dirname(__file__), "conflict")
    legacy_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "conflict_system", "conflict_system")
    # Prefer local_dir if both files exist; otherwise fallback to legacy_dir
    local_rules = os.path.join(local_dir, "rules.yaml")
    local_trains = os.path.join(local_dir, "trains.json")
    legacy_rules = os.path.join(legacy_dir, "rules.yaml")
    legacy_trains = os.path.join(legacy_dir, "trains.json")
    if os.path.exists(local_rules) and os.path.exists(local_trains):
        return local_rules, local_trains
    return legacy_rules, legacy_trains

def _safe_load_rules_and_trains():
    try:
        rules_path, trains_path = _resolve_conflict_paths()
        with open(rules_path, "r", encoding="utf-8") as f:
            rules_cfg = yaml.safe_load(f) or {}
        rules_list = rules_cfg.get("rules", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load rules.yaml: {e}")
    try:
        with open(trains_path, "r", encoding="utf-8") as f:
            trains = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load trains.json: {e}")
    return rules_list, trains

def _extract_field(data: dict, field_path: str):
    parts = field_path.split(".")
    current: any = data
    for i, part in enumerate(parts):
        if "[*]" in part:
            list_field = part.replace("[*]", "")
            if list_field not in current or not isinstance(current[list_field], list):
                return None
            sub_field = ".".join(parts[i + 1:])
            return [_extract_field(item, sub_field) for item in current[list_field]]
        else:
            if part not in current:
                return None
            current = current[part]
    return current

def _evaluate(operator: str, field_value, expected):
    if operator == "eq":
        return field_value == expected
    if operator == "date_gt":
        if not field_value:
            return False
        try:
            date_val = dateutil_parser.parse(field_value)
        except Exception:
            return False
        return date_val > datetime.now()
    if operator == "empty":
        return not field_value
    if operator == "all_eq":
        if not isinstance(field_value, list):
            return False
        return all(v == expected for v in field_value)
    return False

def _detect_conflicts_for_train(train_id: str):
    rules, trains = _safe_load_rules_and_trains()
    train_data = trains.get(train_id)
    if not train_data:
        return {"train_id": train_id, "conflicts": [{"rule": "system", "status": "failed", "reason": "Train not found"}]}
    conflicts = []
    for rule in rules:
        field_val = _extract_field(train_data, rule.get("field", ""))
        result = _evaluate(rule.get("operator", "eq"), field_val, rule.get("value"))
        if rule.get("invert"):
            result = not result
        if not result:
            conflicts.append({
                "rule": rule.get("name", "unknown"),
                "status": "failed",
                "reason": rule.get("message", "Rule failed"),
            })
    return {"train_id": train_id, "conflicts": conflicts}

@app.get("/api/conflicts")
def api_get_all_conflicts():
    rules, trains = _safe_load_rules_and_trains()
    return [_detect_conflicts_for_train(tid) for tid in trains.keys()]

@app.get("/api/conflicts/{train_id}")
def api_get_conflicts(train_id: str):
    return _detect_conflicts_for_train(train_id)