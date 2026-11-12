from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User, Driver, Vehicle, Ride
from fastapi import UploadFile, File, HTTPException
from PIL import Image
import numpy as np
import joblib
from io import BytesIO
from pathlib import Path

app = FastAPI(
    title="AI-Powered Secure Dynamic Ride-Sharing",
    description="Backend API for intelligent ride sharing",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Driver Safety Detection

SAFETY_MODEL_PATH = (
    Path(__file__).resolve().parent.parent
    / "ml"
    / "safety_detection"
    / "models"
    / "driver_safety_model.pkl"
)

SAFETY_CLASSES = {
    "c0": "Safe Driving",
    "c1": "Texting - Right Hand",
    "c2": "Talking on Phone - Right Hand",
    "c3": "Texting - Left Hand",
    "c4": "Talking on Phone - Left Hand",
    "c5": "Operating Radio",
    "c6": "Drinking",
    "c7": "Reaching Behind",
    "c8": "Hair or Makeup",
    "c9": "Talking to Passenger"
}

safety_model = joblib.load(SAFETY_MODEL_PATH)


@app.post("/detect-driver-safety")
async def detect_driver_safety(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG or PNG image"
        )

    try:
        image_bytes = await file.read()

        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Image must be smaller than 5 MB"
            )

        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image = image.resize((32, 32))

        features = np.asarray(
            image, dtype=np.float32
        ).flatten().reshape(1, -1) / 255.0

        prediction = safety_model.predict(features)[0]
        probabilities = safety_model.predict_proba(features)[0]

        return {
            "predicted_class": str(prediction),
            "behaviour": SAFETY_CLASSES.get(
                prediction, str(prediction)
            ),
            "confidence": round(
                float(max(probabilities)) * 100, 2
            ),
            "status": (
                "Potential distraction detected"
                if prediction != "c0"
                else "Safe behaviour predicted"
            )
        }

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Image prediction failed: {str(error)}"
        )

@app.get("/")
def home():
    return {
        "message": "AI Ride-Sharing API is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "OK",
        "project": "AI Ride-Sharing"
    }


@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
@app.get("/rides")
def get_rides(db: Session = Depends(get_db)):
    rides = db.query(Ride).all()
    return rides

@app.post("/users")
def create_user(
    name: str,
    email: str,
    password_hash: str,
    role: str,
    db: Session = Depends(get_db)
):
    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@app.get("/drivers")
def get_drivers(db: Session = Depends(get_db)):
    drivers = db.query(Driver).all()
    return drivers

@app.post("/drivers")
def create_driver(
    user_id: int,
    vehicle_id: int,
    rating: float,
    status: str,
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db)
):
    driver = Driver(
        user_id=user_id,
        vehicle_id=vehicle_id,
        rating=rating,
        status=status,
        latitude=latitude,
        longitude=longitude
    )

    db.add(driver)
    db.commit()
    db.refresh(driver)

    return driver
@app.post("/vehicles")
def create_vehicle(
    vehicle_number: str,
    vehicle_type: str,
    capacity: int,
    model: str,
    color: str,
    db: Session = Depends(get_db)
):
    vehicle = Vehicle(
        vehicle_number=vehicle_number,
        vehicle_type=vehicle_type,
        capacity=capacity,
        model=model,
        color=color
    )

    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return vehicle
@app.post("/rides")
def create_ride(
    passenger_id: int,
    driver_id: int,
    pickup_latitude: float,
    pickup_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
    status: str,
    fare: float,
    distance: float,
    estimated_time: float,
    db: Session = Depends(get_db)
):
    ride = Ride(
        passenger_id=passenger_id,
        driver_id=driver_id,
        pickup_latitude=pickup_latitude,
        pickup_longitude=pickup_longitude,
        destination_latitude=destination_latitude,
        destination_longitude=destination_longitude,
        status=status,
        fare=fare,
        distance=distance,
        estimated_time=estimated_time
    )

    db.add(ride)
    db.commit()
    db.refresh(ride)

    return ride
@app.get("/match-driver")
def match_driver(db: Session = Depends(get_db)):

    driver = db.query(Driver).filter(
        Driver.status == "available"
    ).first()

    if driver:
        return {
            "message": "Driver matched successfully",
            "driver_id": driver.id,
            "rating": driver.rating,
            "status": driver.status
        }

    return {
        "message": "No available drivers found"
    }

@app.put("/rides/{ride_id}/status")
def update_ride_status(
    ride_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    ride = db.query(Ride).filter(
        Ride.id == ride_id
    ).first()

    if not ride:
        return {"message": "Ride not found"}

    allowed_statuses = [
        "requested",
        "accepted",
        "ongoing",
        "completed",
        "cancelled"
    ]

    if status not in allowed_statuses:
        return {"message": "Invalid ride status"}

    ride.status = status

    if status in ["completed", "cancelled"]:
        driver = db.query(Driver).filter(
            Driver.id == ride.driver_id
        ).first()

        if driver:
            driver.status = "available"

    db.commit()
    db.refresh(ride)

    return {
        "message": "Ride status updated",
        "ride_id": ride.id,
        "status": ride.status
    }

@app.post("/drivers/{driver_id}/location")
def update_driver_location(
    driver_id: int,
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(
        Driver.id == driver_id
    ).first()

    if not driver:
        return {"message": "Driver not found"}

    driver.latitude = latitude
    driver.longitude = longitude

    db.commit()
    db.refresh(driver)

    return {
        "message": "Driver location updated",
        "driver_id": driver.id,
        "latitude": driver.latitude,
        "longitude": driver.longitude
    }
