"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  cancer_type: string;
  history: any[]; // Past treatments and scans
}

interface PatientContextType {
  activePatient: Patient | null;
  setActivePatient: (patient: Patient) => void;
  patientsList: Patient[];
  setPatientsList: (patients: Patient[]) => void;
  isLoading: boolean;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to load patients from the new backend DB would go here
  // const fetchPatients = async () => { ... }

  return (
    <PatientContext.Provider 
      value={{ 
        activePatient, 
        setActivePatient, 
        patientsList, 
        setPatientsList,
        isLoading
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};