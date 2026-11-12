from sqlalchemy import Column, Integer, String, DateTime, Float
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String)
    password_hash = Column(String)
    role = Column(String)
    created_at = Column(DateTime(timezone=True))


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    vehicle_id = Column(Integer)
    rating = Column(Float)
    status = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True)
    vehicle_number = Column(String)
    vehicle_type = Column(String)
    capacity = Column(Integer)
    model = Column(String)
    color = Column(String)
class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True)
    passenger_id = Column(Integer)
    driver_id = Column(Integer)
    pickup_latitude = Column(Float)
    pickup_longitude = Column(Float)
    destination_latitude = Column(Float)
    destination_longitude = Column(Float)
    status = Column(String)
    fare = Column(Float)
    distance = Column(Float)
    estimated_time = Column(Float)