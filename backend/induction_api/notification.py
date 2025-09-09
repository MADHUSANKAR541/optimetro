from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
from dataclasses import dataclass
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic Models
class UserProfile(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly" 
    CASUAL = "casual"

class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    EXPIRED = "expired"
    CLAIMED = "claimed"

class User(BaseModel):
    user_id: int
    profile: UserProfile
    current_points: int = 0
    preferences: Dict[str, Any] = {}
    active: bool = True

class Trip(BaseModel):
    trip_id: int
    user_id: int
    departure_time: datetime
    station_id: int
    destination_id: int
    status: str = "booked"

class StationDemand(BaseModel):
    station_id: int
    hour: int
    demand_level: float  # 0.0 to 1.0
    congestion_score: float  # 0.0 to 1.0
    date: datetime

class Train(BaseModel):
    train_id: int
    route: List[int]
    departure_times: List[datetime]
    capacity: int
    current_occupancy: float = 0.0

class NotificationPayload(BaseModel):
    user_id: int
    notification: str
    reward_points: int
    valid_until: datetime
    notification_type: str = "shift_time"
    metadata: Dict[str, Any] = {}

class NotificationRequest(BaseModel):
    user_ids: Optional[List[int]] = None
    station_id: Optional[int] = None
    notification_type: str = "shift_time"

# Data Storage (In production, use a proper database)
@dataclass
class DataStore:
    users: Dict[int, User] = None
    trips: Dict[int, Trip] = None
    station_demands: Dict[int, List[StationDemand]] = None
    trains: Dict[int, Train] = None
    notifications: Dict[int, List[NotificationPayload]] = None
    
    def __post_init__(self):
        if self.users is None:
            self.users = {}
        if self.trips is None:
            self.trips = {}
        if self.station_demands is None:
            self.station_demands = {}
        if self.trains is None:
            self.trains = {}
        if self.notifications is None:
            self.notifications = {}

# Initialize data store and scheduler
data_store = DataStore()
scheduler = AsyncIOScheduler()

class NotificationEngine:
    """Core engine for generating smart notifications"""
    
    def __init__(self, data_store: DataStore):
        self.data_store = data_store
        self.reward_multipliers = {
            UserProfile.DAILY: 1.2,
            UserProfile.WEEKLY: 1.0,
            UserProfile.CASUAL: 0.8
        }
    
    def calculate_congestion_score(self, station_id: int, hour: int) -> float:
        """Calculate current congestion score for a station at given hour"""
        demands = self.data_store.station_demands.get(station_id, [])
        current_demand = next((d for d in demands if d.hour == hour), None)
        return current_demand.congestion_score if current_demand else 0.5
    
    def get_user_profile_multiplier(self, user_id: int) -> float:
        """Get reward multiplier based on user profile"""
        user = self.data_store.users.get(user_id)
        if not user:
            return 1.0
        return self.reward_multipliers.get(user.profile, 1.0)
    
    def calculate_reward_points(self, base_points: int, user_id: int, 
                              congestion_reduction: float) -> int:
        """Calculate reward points based on user profile and congestion reduction"""
        multiplier = self.get_user_profile_multiplier(user_id)
        congestion_bonus = int(congestion_reduction * 5)  # Up to 5 extra points
        return int((base_points + congestion_bonus) * multiplier)
    
    def generate_shift_time_notification(self, user_id: int, trip: Trip) -> Optional[NotificationPayload]:
        """Generate notification to shift travel time"""
        current_hour = trip.departure_time.hour
        station_id = trip.station_id
        
        # Get current congestion
        current_congestion = self.calculate_congestion_score(station_id, current_hour)
        
        # Don't send notification if congestion is already low
        if current_congestion < 0.4:
            return None
        
        # Find better time slots (1-2 hours earlier/later)
        better_slots = []
        for offset in [-2, -1, 1, 2]:
            new_hour = current_hour + offset
            if 5 <= new_hour <= 23:  # Only suggest reasonable hours
                congestion = self.calculate_congestion_score(station_id, new_hour)
                if congestion < current_congestion - 0.2:  # Significantly less congested
                    better_slots.append((new_hour, congestion))
        
        if not better_slots:
            return None
        
        # Choose the best slot (lowest congestion)
        best_slot = min(better_slots, key=lambda x: x[1])
        best_hour, best_congestion = best_slot
        
        # Calculate rewards
        congestion_reduction = current_congestion - best_congestion
        base_points = 10 if abs(best_hour - current_hour) == 1 else 15
        reward_points = self.calculate_reward_points(base_points, user_id, congestion_reduction)
        
        # Generate message
        time_diff = best_hour - current_hour
        if time_diff > 0:
            message = f"Board {abs(time_diff)} hour{'s' if abs(time_diff) > 1 else ''} later and earn +{reward_points} reward points!"
        else:
            message = f"Board {abs(time_diff)} hour{'s' if abs(time_diff) > 1 else ''} earlier and earn +{reward_points} reward points!"
        
        return NotificationPayload(
            user_id=user_id,
            notification=message,
            reward_points=reward_points,
            valid_until=datetime.now() + timedelta(hours=2),
            notification_type="shift_time",
            metadata={
                "original_time": trip.departure_time.isoformat(),
                "suggested_time": trip.departure_time.replace(hour=best_hour).isoformat(),
                "congestion_reduction": round(congestion_reduction, 2),
                "station_id": station_id
            }
        )
    
    def generate_alternative_route_notification(self, user_id: int, trip: Trip) -> Optional[NotificationPayload]:
        """Generate notification for alternative routes"""
        # Simplified logic - in reality, you'd analyze route networks
        base_points = 20
        reward_points = self.calculate_reward_points(base_points, user_id, 0.3)
        
        return NotificationPayload(
            user_id=user_id,
            notification=f"Take alternative route via Station {trip.destination_id + 1} and earn +{reward_points} points!",
            reward_points=reward_points,
            valid_until=datetime.now() + timedelta(hours=1),
            notification_type="alternative_route",
            metadata={
                "original_route": f"{trip.station_id}->{trip.destination_id}",
                "alternative_route": f"{trip.station_id}->{trip.destination_id + 1}->{trip.destination_id}"
            }
        )
    
    def generate_off_peak_notification(self, user_id: int) -> NotificationPayload:
        """Generate general off-peak travel notification"""
        base_points = 25
        reward_points = self.calculate_reward_points(base_points, user_id, 0.4)
        
        return NotificationPayload(
            user_id=user_id,
            notification=f"Travel during off-peak hours (10 AM - 4 PM) and earn +{reward_points} points!",
            reward_points=reward_points,
            valid_until=datetime.now() + timedelta(days=1),
            notification_type="off_peak",
            metadata={"peak_hours": "7-10 AM, 5-8 PM"}
        )

# Initialize notification engine
notification_engine = NotificationEngine(data_store)

# Scheduled Tasks
async def generate_smart_notifications():
    """Scheduled task to generate proactive notifications"""
    logger.info("Running smart notification generation...")
    
    current_time = datetime.now()
    upcoming_hour = current_time.hour + 1
    
    # Find trips in the next hour with high congestion
    upcoming_trips = [
        trip for trip in data_store.trips.values()
        if trip.departure_time.hour == upcoming_hour
    ]
    
    for trip in upcoming_trips:
        notification = notification_engine.generate_shift_time_notification(trip.user_id, trip)
        if notification:
            if trip.user_id not in data_store.notifications:
                data_store.notifications[trip.user_id] = []
            data_store.notifications[trip.user_id].append(notification)
    
    logger.info(f"Generated notifications for {len(upcoming_trips)} upcoming trips")

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting notification system...")
    scheduler.start()
    
    # Schedule smart notification generation every hour
    scheduler.add_job(
        generate_smart_notifications,
        trigger=CronTrigger(minute=0),  # Run at the top of every hour
        id="smart_notifications",
        replace_existing=True
    )
    
    logger.info("Notification system started successfully")
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("Shutting down notification system...")
    scheduler.shutdown()
    logger.info("Notification system shut down")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Smart Notification System", 
    version="1.0.0",
    lifespan=lifespan
)

# API Endpoints
@app.get("/api/notifications/{user_id}")
async def get_user_notifications(user_id: int) -> List[NotificationPayload]:
    """Fetch pending notifications for a user"""
    user_notifications = data_store.notifications.get(user_id, [])
    
    # Filter out expired notifications
    current_time = datetime.now()
    valid_notifications = [
        notif for notif in user_notifications 
        if notif.valid_until > current_time
    ]
    
    # Update storage
    data_store.notifications[user_id] = valid_notifications
    
    return valid_notifications

@app.post("/api/notifications/send")
async def send_notifications(request: NotificationRequest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """Trigger notification dispatch"""
    generated_count = 0
    
    if request.user_ids:
        # Send to specific users
        for user_id in request.user_ids:
            user_trips = [trip for trip in data_store.trips.values() if trip.user_id == user_id]
            for trip in user_trips:
                notification = None
                
                if request.notification_type == "shift_time":
                    notification = notification_engine.generate_shift_time_notification(user_id, trip)
                elif request.notification_type == "alternative_route":
                    notification = notification_engine.generate_alternative_route_notification(user_id, trip)
                elif request.notification_type == "off_peak":
                    notification = notification_engine.generate_off_peak_notification(user_id)
                
                if notification:
                    if user_id not in data_store.notifications:
                        data_store.notifications[user_id] = []
                    data_store.notifications[user_id].append(notification)
                    generated_count += 1
    
    elif request.station_id:
        # Send to users with trips at specific station
        station_users = [
            trip.user_id for trip in data_store.trips.values() 
            if trip.station_id == request.station_id
        ]
        for user_id in set(station_users):
            notification = notification_engine.generate_off_peak_notification(user_id)
            if user_id not in data_store.notifications:
                data_store.notifications[user_id] = []
            data_store.notifications[user_id].append(notification)
            generated_count += 1
    
    # Schedule background task for notification delivery
    background_tasks.add_task(deliver_notifications, generated_count)
    
    return {
        "message": "Notifications generated successfully",
        "generated_count": generated_count,
        "timestamp": datetime.now().isoformat()
    }

async def deliver_notifications(count: int):
    """Background task to simulate notification delivery"""
    logger.info(f"Delivering {count} notifications...")
    await asyncio.sleep(1)  # Simulate delivery time
    logger.info(f"Successfully delivered {count} notifications")

@app.post("/api/notifications/claim/{user_id}/{notification_index}")
async def claim_notification_reward(user_id: int, notification_index: int) -> Dict[str, Any]:
    """Claim reward points from a notification"""
    user_notifications = data_store.notifications.get(user_id, [])
    
    if notification_index >= len(user_notifications):
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification = user_notifications[notification_index]
    
    if notification.valid_until <= datetime.now():
        raise HTTPException(status_code=400, detail="Notification expired")
    
    # Update user points
    user = data_store.users.get(user_id)
    if user:
        user.current_points += notification.reward_points
    
    # Remove claimed notification
    user_notifications.pop(notification_index)
    
    return {
        "message": "Reward claimed successfully",
        "points_earned": notification.reward_points,
        "total_points": user.current_points if user else 0
    }

# Data Management Endpoints (for testing and setup)
@app.post("/api/data/users")
async def add_user(user: User):
    """Add a user to the system"""
    data_store.users[user.user_id] = user
    return {"message": "User added successfully"}

@app.post("/api/data/trips")
async def add_trip(trip: Trip):
    """Add a trip to the system"""
    data_store.trips[trip.trip_id] = trip
    return {"message": "Trip added successfully"}

@app.post("/api/data/station-demands")
async def add_station_demand(demand: StationDemand):
    """Add station demand data"""
    if demand.station_id not in data_store.station_demands:
        data_store.station_demands[demand.station_id] = []
    data_store.station_demands[demand.station_id].append(demand)
    return {"message": "Station demand data added successfully"}

@app.get("/api/data/stats")
async def get_system_stats():
    """Get system statistics"""
    total_notifications = sum(len(notifications) for notifications in data_store.notifications.values())
    
    return {
        "users": len(data_store.users),
        "trips": len(data_store.trips),
        "station_demands": sum(len(demands) for demands in data_store.station_demands.values()),
        "trains": len(data_store.trains),
        "active_notifications": total_notifications,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)