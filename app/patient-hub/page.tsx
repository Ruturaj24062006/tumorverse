/**
 * Patient Management Hub
 * Central interface for managing multiple patient profiles and their AI-driven healthcare records
 * 
 * This component provides:
 * - Multi-patient dashboard
 * - Patient profile creation
 * - Treatment tracking
 * - Session management
 * - Synchronized metrics display
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Eye,
  Settings,
} from 'lucide-react';

interface PatientMetrics {
  patient_id: string;
  name: string;
  cancer_type: string;
  status: string;
  treatment_score: number;
  effectiveness: number;
  aggressiveness: number;
  current_medicine?: string;
  risk_level: string;
  stabilization_confidence: number;
  last_updated: string;
}

interface PatientSession {
  session_id: string;
  patient_id: string;
  current_view: string;
  is_active: boolean;
  last_accessed: string;
}

export default function PatientManagementHub() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientMetrics[]>([]);
  const [activeSession, setActiveSession] = useState<PatientSession | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientMetrics | null>(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M',
    cancer_type: 'glioblastoma',
    initial_tumor_volume: '',
    initial_aggressiveness: '',
  });

  // Load all patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/ecosystem/patients');
      const data: PatientMetrics[] = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/ecosystem/patients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          cancer_type: formData.cancer_type,
          initial_tumor_volume: parseFloat(formData.initial_tumor_volume),
          initial_aggressiveness: parseFloat(formData.initial_aggressiveness),
        }),
      });

      if (response.ok) {
        await loadPatients();
        setShowNewPatientForm(false);
        setFormData({
          name: '',
          age: '',
          gender: 'M',
          cancer_type: 'glioblastoma',
          initial_tumor_volume: '',
          initial_aggressiveness: '',
        });
      }
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };

  const createPatientSession = async (patientId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/ecosystem/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId }),
      });

      if (response.ok) {
        const session = await response.json();
        setActiveSession(session);
        
        if (selectedPatient) {
          const aggr = selectedPatient.aggressiveness > 70 ? 'high' : selectedPatient.aggressiveness > 40 ? 'moderate' : 'low';
          router.push(`/tumor-twin?cancer=${selectedPatient.cancer_type}&aggr=${aggr}&conf=${selectedPatient.stabilization_confidence}`);
        }
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-blue-500/20 text-blue-700';
      case 'stabilized':
        return 'bg-green-500/20 text-green-700';
      case 'remission':
        return 'bg-emerald-500/20 text-emerald-700';
      case 'progressing':
        return 'bg-yellow-500/20 text-yellow-700';
      case 'critical':
        return 'bg-red-500/20 text-red-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'text-green-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'remission':
        return <CheckCircle className="w-4 h-4" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      case 'stabilized':
        return <Activity className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-24">
        {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Patient Management Hub</h1>
              <p className="text-purple-300">AI-Powered Healthcare Ecosystem</p>
            </div>
          </div>
          <Button
            onClick={() => setShowNewPatientForm(!showNewPatientForm)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </Button>
        </div>
      </div>

      {/* New Patient Form */}
      <AnimatePresence>
        {showNewPatientForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Create New Patient</CardTitle>
                <CardDescription className="text-purple-300">
                  Initialize patient profile and AI metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createNewPatient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Patient Name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Age"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                    <select
                      value={formData.cancer_type}
                      onChange={(e) =>
                        setFormData({ ...formData, cancer_type: e.target.value })
                      }
                      className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
                    >
                      <option>glioblastoma</option>
                      <option>lung_adenocarcinoma</option>
                      <option>invasive_ductal_carcinoma</option>
                      <option>breast_cancer</option>
                      <option>colorectal_cancer</option>
                      <option>melanoma</option>
                      <option>ovarian_cancer</option>
                      <option>prostate_cancer</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Initial Tumor Volume (mm³)"
                      value={formData.initial_tumor_volume}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initial_tumor_volume: e.target.value,
                        })
                      }
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Initial Aggressiveness (0-100)"
                      min="0"
                      max="100"
                      value={formData.initial_aggressiveness}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initial_aggressiveness: e.target.value,
                        })
                      }
                      className="bg-slate-700/50 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      Create Patient
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewPatientForm(false)}
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur h-full">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Patients ({patients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-purple-300 text-sm">Loading patients...</div>
                ) : patients.length === 0 ? (
                  <div className="text-purple-300 text-sm">No patients yet</div>
                ) : (
                  patients.map((patient) => (
                    <motion.button
                      key={patient.patient_id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedPatient?.patient_id === patient.patient_id
                          ? 'bg-purple-600/40 border border-purple-500'
                          : 'bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">
                            {patient.name}
                          </p>
                          <p className="text-purple-300 text-xs">
                            {patient.cancer_type}
                          </p>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            patient.status.toLowerCase() === 'active'
                              ? 'bg-blue-500'
                              : patient.status.toLowerCase() === 'remission'
                              ? 'bg-green-500'
                              : 'bg-yellow-500'
                          }`}
                        />
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={selectedPatient.patient_id}
            >
              <Tabs defaultValue="metrics" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-purple-500/30">
                  <TabsTrigger value="metrics" className="text-white">
                    Metrics
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="text-white">
                    Risk Analysis
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="text-white">
                    Actions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="metrics" className="space-y-4 mt-4">
                  <Card className="bg-slate-800/50 border-purple-500/30">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">
                            {selectedPatient.name}
                          </CardTitle>
                          <CardDescription className="text-purple-300">
                            {selectedPatient.cancer_type} • Status:{' '}
                            <Badge className={`ml-2 ${getStatusColor(selectedPatient.status)}`}>
                              {selectedPatient.status}
                            </Badge>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedPatient.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Treatment Score */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            Treatment Score
                          </span>
                          <span className="text-purple-300 font-bold">
                            {selectedPatient.treatment_score.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={selectedPatient.treatment_score}
                          className="h-2 bg-slate-700"
                        />
                      </div>

                      {/* Effectiveness */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            Medicine Effectiveness
                          </span>
                          <span className="text-green-400 font-bold">
                            {(selectedPatient.effectiveness * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={selectedPatient.effectiveness * 100}
                          className="h-2 bg-slate-700"
                        />
                      </div>

                      {/* Aggressiveness */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            Aggressiveness Level
                          </span>
                          <span
                            className={
                              selectedPatient.aggressiveness > 70
                                ? 'text-red-400 font-bold'
                                : selectedPatient.aggressiveness > 40
                                ? 'text-yellow-400 font-bold'
                                : 'text-green-400 font-bold'
                            }
                          >
                            {selectedPatient.aggressiveness.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={selectedPatient.aggressiveness}
                          className="h-2 bg-slate-700"
                        />
                      </div>

                      {/* Current Medicine */}
                      {selectedPatient.current_medicine && (
                        <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                          <span className="text-purple-300 text-sm">
                            Current Medicine:
                          </span>
                          <p className="text-white font-medium">
                            {selectedPatient.current_medicine}
                          </p>
                        </div>
                      )}

                      {/* Stabilization Confidence */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            Stabilization Confidence
                          </span>
                          <span className="text-blue-400 font-bold">
                            {(selectedPatient.stabilization_confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={selectedPatient.stabilization_confidence * 100}
                          className="h-2 bg-slate-700"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risk" className="space-y-4 mt-4">
                  <Card className="bg-slate-800/50 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white">Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-purple-300">Risk Level</span>
                          <Badge
                            className={`${getRiskColor(selectedPatient.risk_level)} bg-transparent border`}
                          >
                            {selectedPatient.risk_level.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => createPatientSession(selectedPatient.patient_id)}
                      className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Eye className="w-4 h-4" />
                      Open 3D Viewer
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Settings className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-purple-300">
                  Select a patient to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
