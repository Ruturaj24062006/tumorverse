from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    hospital_affiliation = Column(String)
    is_active = Column(Boolean, default=True)
    
    patients = relationship("Patient", back_populates="primary_doctor")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    patient_mrn = Column(String, unique=True, index=True) # Medical Record Number
    doctor_id = Column(String, ForeignKey("doctors.id"))
    age = Column(Integer)
    gender = Column(String)
    cancer_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    primary_doctor = relationship("Doctor", back_populates="patients")
    scans = relationship("MedicalScan", back_populates="patient")
    simulations = relationship("TreatmentSimulation", back_populates="patient")

class MedicalScan(Base):
    __tablename__ = "medical_scans"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"))
    scan_date = Column(DateTime, default=datetime.utcnow)
    image_url = Column(String) # Cloud storage link (AWS S3)
    
    # AI Extracted Features
    tumor_size_mm = Column(Float)
    segmentation_confidence = Column(Float)
    tumor_geometry_hash = Column(String)
    base_aggressiveness = Column(Float)
    
    patient = relationship("Patient", back_populates="scans")

class TreatmentSimulation(Base):
    __tablename__ = "treatment_simulations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"))
    scan_id = Column(String, ForeignKey("medical_scans.id"))
    simulation_date = Column(DateTime, default=datetime.utcnow)
    
    # Medicine Details
    medicine_name = Column(String)
    dosage_mg = Column(Float)
    
    # Core AI Unified Metrics
    treatment_score = Column(Float)
    medical_state = Column(String)
    effectiveness = Column(Float)
    
    # Complex JSON outputs from engines
    tumor_behavior = Column(JSON)
    risk_profile = Column(JSON)
    ai_explanations = Column(JSON)
    recovery_timeline = Column(JSON)
    
    patient = relationship("Patient", back_populates="simulations")