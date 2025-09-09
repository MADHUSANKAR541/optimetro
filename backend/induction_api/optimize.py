import json
import csv
import random
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from deap import base, creator, tools, algorithms
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEPOT_FILE = os.path.join(BASE_DIR, "depot_layout.json")
RAKES_FILE = os.path.join(BASE_DIR, "rakes.csv")
CLEANING_FILE = os.path.join(BASE_DIR, "cleaning_slots.csv")



@dataclass
class DepotBay:
    """Represents a depot bay where trains can be stabled"""
    id: str
    capacity: int  # length in meters
    cleaning_enabled: bool
    distance_to_exit: int  # priority for early departure (lower = closer)
    connections: List[str]  # connected bays for shunting

    def __post_init__(self):
        """Validate bay data after initialization"""
        if self.capacity <= 0:
            raise ValueError(f"Bay {self.id}: capacity must be positive")
        if self.distance_to_exit < 0:
            raise ValueError(f"Bay {self.id}: distance_to_exit cannot be negative")


@dataclass
class Train:
    """Represents a train requiring stabling"""
    id: str
    length: int  # length in meters
    needs_cleaning: bool
    departure_time: str  # "HH:MM" format
    readiness: str  # "ready", "maintenance", "cleaning"
    priority: int  # 1=highest, 5=lowest

    def __post_init__(self):
        """Validate train data after initialization"""
        if self.length <= 0:
            raise ValueError(f"Train {self.id}: length must be positive")
        if self.priority not in range(1, 6):
            raise ValueError(f"Train {self.id}: priority must be 1-5")
        if self.readiness not in ["ready", "maintenance", "cleaning"]:
            raise ValueError(f"Train {self.id}: invalid readiness status")

    @property
    def departure_minutes(self) -> int:
        """Convert departure time to minutes since midnight for comparison"""
        try:
            hours, minutes = map(int, self.departure_time.split(':'))
            return hours * 60 + minutes
        except ValueError:
            raise ValueError(f"Train {self.id}: invalid departure time format")


@dataclass
class CleaningSlot:
    """Represents a cleaning time slot at a specific bay"""
    bay_id: str
    start_time: str
    end_time: str
    available: bool

    def __post_init__(self):
        """Validate cleaning slot data"""
        try:
            start_h, start_m = map(int, self.start_time.split(':'))
            end_h, end_m = map(int, self.end_time.split(':'))
            start_minutes = start_h * 60 + start_m
            end_minutes = end_h * 60 + end_m
            if end_minutes <= start_minutes:
                raise ValueError(f"Invalid time slot: {self.start_time}-{self.end_time}")
        except ValueError as e:
            raise ValueError(f"Cleaning slot for bay {self.bay_id}: {str(e)}")


class StablingOptimizer:
    """
    Main optimization class using genetic algorithms to solve train stabling problem
    """
    
    def __init__(self):
        self.depot_bays: Dict[str, DepotBay] = {}
        self.trains: List[Train] = []
        self.cleaning_slots: List[CleaningSlot] = []
        self.toolbox = None
        self._fitness_weights = {
            'constraint_violation': -100,  # Heavy penalty for constraint violations
            'cleaning_mismatch': -50,      # Penalty for cleaning requirement mismatch
            'early_departure_bonus': 10,   # Bonus for early trains near exit
            'priority_bonus': 2,           # Bonus multiplier for high priority trains
            'readiness_bonus': 5,          # Bonus for ready trains
            'overcrowding_penalty': -20,   # Penalty per extra train in bay
            'shunting_penalty': -1         # Penalty per estimated shunting move
        }
    
    def load_depot_layout(self, filepath: str) -> None:
        """Load depot layout configuration from JSON file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            self.depot_bays.clear()
            for bay_data in data['bays']:
                bay = DepotBay(
                    id=bay_data['id'],
                    capacity=bay_data['capacity'],
                    cleaning_enabled=bay_data['cleaning_enabled'],
                    distance_to_exit=bay_data['distance_to_exit'],
                    connections=bay_data.get('connections', [])
                )
                self.depot_bays[bay.id] = bay
                
            print(f"✅ Loaded {len(self.depot_bays)} depot bays")
            
        except FileNotFoundError:
            raise FileNotFoundError(f"Depot layout file not found: {filepath}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in depot layout file: {e}")
        except KeyError as e:
            raise ValueError(f"Missing required field in depot layout: {e}")
        except Exception as e:
            raise Exception(f"Error loading depot layout: {e}")
    
    def load_trains(self, filepath: str) -> None:
        """Load train data from CSV file"""
        try:
            self.trains.clear()
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row_num, row in enumerate(reader, 1):
                    try:
                        train = Train(
                            id=row['train_id'],
                            length=int(row['length']),
                            needs_cleaning=row['needs_cleaning'].lower() == 'true',
                            departure_time=row['departure_time'],
                            readiness=row['readiness'],
                            priority=int(row['priority'])
                        )
                        self.trains.append(train)
                    except (ValueError, KeyError) as e:
                        raise ValueError(f"Error in row {row_num}: {e}")
                        
            print(f"✅ Loaded {len(self.trains)} trains")
            
        except FileNotFoundError:
            raise FileNotFoundError(f"Trains file not found: {filepath}")
        except Exception as e:
            raise Exception(f"Error loading trains: {e}")
    
    def load_cleaning_slots(self, filepath: str) -> None:
        """Load cleaning schedule from CSV file"""
        try:
            self.cleaning_slots.clear()
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row_num, row in enumerate(reader, 1):
                    try:
                        slot = CleaningSlot(
                            bay_id=row['bay_id'],
                            start_time=row['start_time'],
                            end_time=row['end_time'],
                            available=row['available'].lower() == 'true'
                        )
                        self.cleaning_slots.append(slot)
                    except (ValueError, KeyError) as e:
                        raise ValueError(f"Error in row {row_num}: {e}")
                        
            print(f"✅ Loaded {len(self.cleaning_slots)} cleaning slots")
            
        except FileNotFoundError:
            raise FileNotFoundError(f"Cleaning slots file not found: {filepath}")
        except Exception as e:
            raise Exception(f"Error loading cleaning slots: {e}")
    
    def setup_genetic_algorithm(self) -> None:
        """Initialize DEAP genetic algorithm components"""
        if not self.trains or not self.depot_bays:
            raise ValueError("Cannot setup GA: no trains or bays loaded")
        
        # Clear any existing fitness/individual classes
        if hasattr(creator, "FitnessMax"):
            del creator.FitnessMax
        if hasattr(creator, "Individual"):
            del creator.Individual
            
        # Create fitness and individual classes
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMax)
        
        self.toolbox = base.Toolbox()
        
        # Define genetic operators
        bay_count = len(self.depot_bays)
        
        def create_individual():
            """Create random individual (bay assignment for each train)"""
            return [random.randint(0, bay_count - 1) for _ in range(len(self.trains))]
        
        self.toolbox.register("individual", tools.initIterate, creator.Individual, create_individual)
        self.toolbox.register("population", tools.initRepeat, list, self.toolbox.individual)
        self.toolbox.register("evaluate", self.evaluate_assignment)
        self.toolbox.register("mate", tools.cxTwoPoint)
        self.toolbox.register("mutate", self.mutate_assignment, indpb=0.1)
        self.toolbox.register("select", tools.selTournament, tournsize=3)
    
    def evaluate_assignment(self, individual: List[int]) -> Tuple[float,]:
        """
        Fitness function - evaluates quality of train-to-bay assignments
        Higher scores are better
        """
        bay_ids = list(self.depot_bays.keys())
        assignments = [(self.trains[i], bay_ids[individual[i]]) 
                      for i in range(len(individual))]
        
        score = 0.0
        
        # Track bay usage for constraint checking
        bay_usage = {bay_id: [] for bay_id in bay_ids}
        
        for train, bay_id in assignments:
            bay = self.depot_bays[bay_id]
            bay_usage[bay_id].append(train)
            
            # HARD CONSTRAINT: Train must fit in bay
            if train.length > bay.capacity:
                score += self._fitness_weights['constraint_violation']
                continue
            
            # SOFT CONSTRAINT: Cleaning requirements
            if train.needs_cleaning and not bay.cleaning_enabled:
                score += self._fitness_weights['cleaning_mismatch']
                continue
            
            # OPTIMIZATION OBJECTIVES
            
            # Reward early departure trains closer to exit
            if train.departure_minutes < 8 * 60:  # Before 8:00 AM
                distance_bonus = max(0, 10 - bay.distance_to_exit)
                score += distance_bonus * self._fitness_weights['early_departure_bonus']
            
            # Reward high priority trains
            priority_bonus = (6 - train.priority)
            score += priority_bonus * self._fitness_weights['priority_bonus']
            
            # Reward ready trains
            if train.readiness == "ready":
                score += self._fitness_weights['readiness_bonus']
        
        # Penalty for bay overcrowding (assuming 1 train per bay)
        for bay_id, trains_in_bay in bay_usage.items():
            if len(trains_in_bay) > 1:
                excess_trains = len(trains_in_bay) - 1
                score += excess_trains * self._fitness_weights['overcrowding_penalty']
        
        # Add shunting penalty
        shunting_moves = self.calculate_shunting_moves(assignments)
        score += shunting_moves * self._fitness_weights['shunting_penalty']
        
        # Ensure non-negative fitness
        final_score = max(0, score)
        return (final_score,)
    
    def calculate_shunting_moves(self, assignments: List[Tuple[Train, str]]) -> float:
        """
        Estimate number of shunting moves required
        Simple heuristic: later departing trains in front of earlier ones need moves
        """
        moves = 0.0
        
        # Group trains by departure time
        departure_groups = {}
        for train, bay_id in assignments:
            dep_minutes = train.departure_minutes
            if dep_minutes not in departure_groups:
                departure_groups[dep_minutes] = []
            departure_groups[dep_minutes].append((train, bay_id))
        
        # Check for trains that will need to be moved
        sorted_times = sorted(departure_groups.keys())
        
        for i, early_time in enumerate(sorted_times):
            for j, late_time in enumerate(sorted_times[i + 1:], i + 1):
                # If a later train is closer to exit than earlier train, add penalty
                for early_train, early_bay in departure_groups[early_time]:
                    for late_train, late_bay in departure_groups[late_time]:
                        early_distance = self.depot_bays[early_bay].distance_to_exit
                        late_distance = self.depot_bays[late_bay].distance_to_exit
                        
                        if early_distance > late_distance:
                            moves += 1.0
        
        return moves
    
    def mutate_assignment(self, individual: List[int], indpb: float) -> Tuple[List[int],]:
        """Custom mutation function with probability indpb per gene"""
        bay_count = len(self.depot_bays)
        for i in range(len(individual)):
            if random.random() < indpb:
                individual[i] = random.randint(0, bay_count - 1)
        return individual,
    
    def optimize(self, generations: int = 50, population_size: int = 100) -> Dict:
        """
        Run genetic algorithm optimization
        
        Args:
            generations: Number of generations to evolve
            population_size: Size of population in each generation
            
        Returns:
            Dict containing optimization results and assignments
        """
        if not self.trains or not self.depot_bays:
            raise ValueError("Cannot optimize: no trains or bays loaded")
        
        # Setup genetic algorithm if not already done
        if self.toolbox is None:
            self.setup_genetic_algorithm()
        
        print(f"🧬 Starting optimization: {generations} generations, population {population_size}")
        
        # Create initial population
        population = self.toolbox.population(n=population_size)
        
        # Statistics tracking
        stats = tools.Statistics(lambda ind: ind.fitness.values)
        stats.register("avg", np.mean)
        stats.register("min", np.min)
        stats.register("max", np.max)
        
        # Run evolutionary algorithm
        population, logbook = algorithms.eaSimple(
            population, self.toolbox,
            cxpb=0.7,  # Crossover probability
            mutpb=0.3,  # Mutation probability
            ngen=generations,
            stats=stats,
            verbose=False
        )
        
        # Extract best solution
        best_individual = tools.selBest(population, 1)[0]
        best_fitness = best_individual.fitness.values[0]
        
        # Convert to readable format
        bay_ids = list(self.depot_bays.keys())
        assignments = []
        
        for i, bay_index in enumerate(best_individual):
            train = self.trains[i]
            bay_id = bay_ids[bay_index]
            bay = self.depot_bays[bay_id]
            
            # Check for constraint violations
            violations = []
            if train.length > bay.capacity:
                violations.append("length_exceeds_capacity")
            if train.needs_cleaning and not bay.cleaning_enabled:
                violations.append("cleaning_not_available")
            
            assignments.append({
                "trainId": train.id,
                "bayId": bay_id,
                "trainLength": train.length,
                "bayCapacity": bay.capacity,
                "needsCleaning": train.needs_cleaning,
                "cleaningAvailable": bay.cleaning_enabled,
                "departureTime": train.departure_time,
                "priority": train.priority,
                "readiness": train.readiness,
                "distanceToExit": bay.distance_to_exit,
                "violations": violations
            })
        
        # Calculate summary statistics
        total_violations = sum(len(a["violations"]) for a in assignments)
        ready_trains = sum(1 for a in assignments if a["readiness"] == "ready")
        cleaning_matches = sum(1 for a in assignments 
                             if a["needsCleaning"] == a["cleaningAvailable"])
        
        result = {
            "assignments": assignments,
            "optimization_summary": {
                "objectiveScore": round(best_fitness, 2),
                "totalTrains": len(self.trains),
                "totalBays": len(self.depot_bays),
                "generationsRun": generations,
                "populationSize": population_size,
                "totalViolations": total_violations,
                "readyTrainsAssigned": ready_trains,
                "cleaningRequirementMatches": cleaning_matches
            },
            "statistics": {
                "bestFitness": float(best_fitness),
                "avgFitness": float(logbook.select("avg")[-1]),
                "minFitness": float(logbook.select("min")[-1]),
                "convergenceData": [float(x) for x in logbook.select("max")]
            }
        }
        
        print(f"✅ Optimization complete! Score: {best_fitness:.1f}, Violations: {total_violations}")
        return result


# FastAPI Application Setup
app = FastAPI(
    title="Railway Stabling Optimization API",
    description="Genetic algorithm-based optimization for train depot allocation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global optimizer instance
optimizer = StablingOptimizer()


@app.on_event("startup")
async def startup_event():
    """Load data files on application startup"""
    print("🚄 Starting Railway Stabling Optimization API...")
    
    required_files = [
        ("depot_layout.json", "depot layout"),
        ("rakes.csv", "train data"),
        ("cleaning_slots.csv", "cleaning schedule")
    ]
    
    for filename, description in required_files:
        try:
            if filename == "depot_layout.json":
                optimizer.load_depot_layout(filename)
            elif filename == "rakes.csv":
                optimizer.load_trains(filename)
            elif filename == "cleaning_slots.csv":
                optimizer.load_cleaning_slots(filename)
                
        except Exception as e:
            print(f"❌ Failed to load {description} from {filename}: {e}")
            print(f"   Please ensure {filename} exists in the application directory")
    
    if optimizer.trains and optimizer.depot_bays:
        print("✅ All required data loaded successfully")
        print(f"📊 System ready: {len(optimizer.trains)} trains, "
              f"{len(optimizer.depot_bays)} bays, {len(optimizer.cleaning_slots)} cleaning slots")
    else:
        print("⚠️  System started with incomplete data - some endpoints may not function")


# API ENDPOINTS

@app.get("/", summary="API Status")
async def root():
    """Root endpoint returning API information"""
    return {
        "message": "Railway Stabling Optimization API",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/status", summary="System Status")
async def get_status():
    """Get detailed system status and loaded data counts"""
    return {
        "status": "operational",
        "data_loaded": {
            "trains": len(optimizer.trains),
            "depot_bays": len(optimizer.depot_bays),
            "cleaning_slots": len(optimizer.cleaning_slots)
        },
        "ready_for_optimization": bool(optimizer.trains and optimizer.depot_bays)
    }


@app.post("/api/optimize", summary="Run Optimization")
async def optimize_stabling(request: Optional[Dict] = None):
    """
    Run the genetic algorithm optimization
    
    Request body (optional):
    {
        "generations": 50,
        "population_size": 100
    }
    """
    try:
        # Extract parameters with defaults
        generations = 50
        population_size = 100
        
        if request:
            generations = request.get("generations", 50)
            population_size = request.get("population_size", 100)
            
            # Validate parameters
            if not (10 <= generations <= 500):
                raise HTTPException(status_code=400, 
                                  detail="generations must be between 10 and 500")
            if not (20 <= population_size <= 1000):
                raise HTTPException(status_code=400,
                                  detail="population_size must be between 20 and 1000")
        
        result = optimizer.optimize(
            generations=generations,
            population_size=population_size
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.get("/api/depot/layout", summary="Get Depot Layout")
async def get_depot_layout():
    """Get information about all depot bays"""
    bays = []
    for bay_id, bay in optimizer.depot_bays.items():
        bays.append({
            "id": bay.id,
            "capacity": bay.capacity,
            "cleaning_enabled": bay.cleaning_enabled,
            "distance_to_exit": bay.distance_to_exit,
            "connections": bay.connections
        })
    
    return {
        "bays": bays,
        "total_bays": len(bays)
    }


@app.get("/api/trains", summary="Get Train Information")
async def get_trains():
    """Get information about all trains requiring stabling"""
    trains = []
    for train in optimizer.trains:
        trains.append({
            "id": train.id,
            "length": train.length,
            "needs_cleaning": train.needs_cleaning,
            "departure_time": train.departure_time,
            "readiness": train.readiness,
            "priority": train.priority
        })
    
    return {
        "trains": trains,
        "total_trains": len(trains)
    }


@app.get("/api/cleaning-slots", summary="Get Cleaning Schedule")
async def get_cleaning_slots():
    """Get information about cleaning time slots"""
    slots = []
    for slot in optimizer.cleaning_slots:
        slots.append({
            "bay_id": slot.bay_id,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "available": slot.available
        })
    
    return {
        "cleaning_slots": slots,
        "total_slots": len(slots)
    }


@app.post("/api/simulate", summary="Simulate Scenario")
async def simulate_scenario(request: Dict):
    """
    Simulate optimization with modified parameters
    
    Request body:
    {
        "generations": 30,
        "population_size": 50,
        "scenario_name": "peak_hours"
    }
    """
    try:
        scenario_name = request.get("scenario_name", "custom")
        print(f"🎭 Running simulation: {scenario_name}")
        
        # For now, run standard optimization
        # Future enhancement: modify constraints based on scenario
        result = await optimize_stabling(request)
        result["scenario"] = scenario_name
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


if __name__ == "__main__":
    print("🚄 Starting Railway Stabling Optimization API...")
    print("📁 Make sure these files exist in the same directory:")
    print("  - depot_layout.json (depot bay configuration)")
    print("  - rakes.csv (train data)")
    print("  - cleaning_slots.csv (cleaning schedule)")
    print()
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False,
        access_log=True
    )