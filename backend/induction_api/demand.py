import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import warnings
warnings.filterwarnings('ignore')

# ML Libraries
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# FastAPI
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn


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
        self.is_trained = False  # Track training status
        
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
            
            # Store model in memory
            self.models[station] = lr_model
            
            # Evaluate model
            y_pred = lr_model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)
            
            print(f"    {station}: MAE={mae:.2f}, RMSE={rmse:.2f}, R²={r2:.3f}")
        
        # Mark as trained
        self.is_trained = True
        print("✅ All models trained and stored in memory")
    
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
        
        if not self.is_trained:
            raise ValueError("Models not trained yet. Please train the models first.")
        
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
    
    def get_model_status(self):
        """Get current model status"""
        return {
            "is_trained": self.is_trained,
            "stations": self.stations,
            "models_loaded": len(self.models),
            "has_weather_data": self.weather_df is not None
        }


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
            "forecast": "/api/demand/forecast",
            "train": "/api/train",
            "stations": "/api/stations",
            "status": "/api/status",
            "health": "/api/health"
        }
    }


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
        import os
        base_dir = os.path.dirname(__file__)
        forecaster.load_datasets(
            ridership_path=os.path.join(base_dir, "ridership_history.csv"),
            events_path=os.path.join(base_dir, "events_calendar.csv"),
            weather_path=os.path.join(base_dir, "weather.csv")
        )
        
        # Train models (stored in memory only)
        forecaster.train_models()
        
        return {
            "message": "Models trained and stored in memory successfully",
            "status": forecaster.get_model_status()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stations")
async def get_stations():
    """Get list of available stations"""
    return {"stations": forecaster.stations}

@app.get("/api/status")
async def get_status():
    """Get model training status"""
    return forecaster.get_model_status()

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    status = forecaster.get_model_status()
    return {
        "status": "healthy", 
        "models_trained": status["is_trained"],
        "models_count": status["models_loaded"]
    }


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
    
    # Train models (stored in memory only)
    forecaster.train_models()
    
    print("\n🎉 Training completed!")
    print("📊 Models are stored in memory and ready for predictions")
    print("🚀 Run: uvicorn demand:app --reload")
    print("📝 Then test: POST /api/demand/forecast")


if __name__ == "__main__":
    main()