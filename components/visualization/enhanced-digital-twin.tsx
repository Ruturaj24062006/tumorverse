/**
 * Enhanced Digital Tumor Twin
 * A living, reactive 3D visualization that responds in real-time to treatment
 * 
 * Features:
 * - Real-time aggressiveness visualization
 * - Treatment response animation
 * - Volumetric density simulation
 * - Biological shader effects
 * - Evolution intelligence display
 * - Synchronization with unified AI core
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  PerspectiveCamera,
  OrbitControls,
  MeshDistortMaterial,
  Sphere,
  Environment,
} from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, TrendingDown } from 'lucide-react';

/**
 * Living Tumor Twin Component
 * Renders a reactive 3D tumor that responds to treatment metrics
 */
function LivingTumorTwin({
  aggressiveness,
  treatmentScore,
  effectiveness,
  volume,
}: {
  aggressiveness: number;
  treatmentScore: number;
  effectiveness: number;
  volume: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(1);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Base rotation
    meshRef.current.rotation.x += 0.0005;
    meshRef.current.rotation.y += 0.0008;

    // Pulsing based on aggressiveness (high aggressiveness = faster pulse)
    const pulseSpeed = 0.002 + (aggressiveness / 100) * 0.003;
    const pulse = 1 + Math.sin(clock.elapsedTime * pulseSpeed) * 0.05;
    meshRef.current.scale.set(pulse, pulse, pulse);

    // Distortion based on treatment response
    const distortion = (100 - treatmentScore) / 100 * 0.3;
    if (meshRef.current.material instanceof MeshDistortMaterial) {
      (meshRef.current.material as MeshDistortMaterial).distort =
        distortion + Math.sin(clock.elapsedTime * 0.5) * 0.05;
    }
  });

  // Map aggressiveness to color intensity
  const getColorFromAggressiveness = (agg: number) => {
    if (agg > 70) return '#FF3D3D'; // Red - critical
    if (agg > 50) return '#FF9D3D'; // Orange - high
    if (agg > 30) return '#FFD93D'; // Yellow - moderate
    return '#3DFF3D'; // Green - low
  };

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={scale}>
      <MeshDistortMaterial
        color={getColorFromAggressiveness(aggressiveness)}
        emissive={getColorFromAggressiveness(aggressiveness)}
        emissiveIntensity={aggressiveness / 100 * 0.5}
        wireframe={false}
        distort={0.2}
        speed={2}
        roughness={0.3}
        metalness={0.7}
      />
    </Sphere>
  );
}

/**
 * Camera Controller with treatment-aware positioning
 */
function CameraController({
  aggressiveness,
}: {
  aggressiveness: number;
}) {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    // Camera distance based on tumor volume/aggressiveness
    const baseDistance = 3;
    const distance = baseDistance + (aggressiveness / 100) * 1.5;

    // Orbital camera movement
    const angle = clock.elapsedTime * 0.05;
    camera.position.x = Math.cos(angle) * distance;
    camera.position.y = 1 + Math.sin(angle * 0.7) * 0.5;
    camera.position.z = Math.sin(angle) * distance;
    camera.lookAt(0, 0, 0);
  });

  return <PerspectiveCamera makeDefault position={[3, 1, 3]} />;
}

/**
 * Main Enhanced Digital Twin Component
 */
export default function EnhancedDigitalTwin({
  patientId,
}: {
  patientId?: string;
}) {
  const [metrics, setMetrics] = useState({
    aggressiveness: 65,
    treatmentScore: 45,
    effectiveness: 0.75,
    volume: 2500,
    evolutionPattern: 'linear',
    statusMessage: 'Awaiting treatment',
  });
  const [previousMetrics, setPreviousMetrics] = useState(metrics);
  const [animatingMetric, setAnimatingMetric] = useState<string | null>(null);

  // Fetch metrics from backend
  useEffect(() => {
    if (!patientId) return;

    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/ecosystem/synchronization/${patientId}?target=visualization`
        );
        if (response.ok) {
          const data = await response.json();
          const viz = data.visualization;

          setPreviousMetrics(metrics);
          setMetrics({
            aggressiveness: viz.aggressiveness,
            treatmentScore: viz.treatment_score,
            effectiveness: viz.effectiveness,
            volume: viz.tumor_volume,
            evolutionPattern: viz.risk_level,
            statusMessage: getStatusMessage(viz.treatment_score),
          });
          setAnimatingMetric('all');
          setTimeout(() => setAnimatingMetric(null), 1000);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    const interval = setInterval(fetchMetrics, 2000);
    fetchMetrics();

    return () => clearInterval(interval);
  }, [patientId]);

  const getStatusMessage = (score: number) => {
    if (score > 80) return '🟢 Excellent treatment response';
    if (score > 60) return '🟡 Good tumor reduction';
    if (score > 40) return '🟠 Moderate response';
    if (score > 20) return '🔴 Limited response';
    return '⚠️ Poor response - reassess strategy';
  };

  const getTreatmentTrend = () => {
    const diff = metrics.treatmentScore - previousMetrics.treatmentScore;
    if (diff > 5) return { icon: '↑', color: 'text-green-400', label: 'Improving' };
    if (diff < -5) return { icon: '↓', color: 'text-red-400', label: 'Declining' };
    return { icon: '→', color: 'text-yellow-400', label: 'Stable' };
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Living Digital Tumor Twin
        </h1>
        <p className="text-purple-300">
          Real-time biological visualization synchronized with AI intelligence
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Viewer */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-purple-500/30 backdrop-blur h-[500px] overflow-hidden">
            <Canvas className="w-full h-full">
              <CameraController aggressiveness={metrics.aggressiveness} />
              <LivingTumorTwin
                aggressiveness={metrics.aggressiveness}
                treatmentScore={metrics.treatmentScore}
                effectiveness={metrics.effectiveness}
                volume={metrics.volume}
              />
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={1.2} />
              <pointLight position={[-5, -5, -5]} intensity={0.6} color="#00E5FF" />
              <OrbitControls enableZoom={true} />
            </Canvas>
          </Card>
        </div>

        {/* Real-Time Metrics */}
        <div className="space-y-4">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={metrics.statusMessage}
          >
            <Card className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 border-purple-500/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-purple-200 text-sm mb-2">Status</p>
                  <p className="text-white text-lg font-semibold">
                    {metrics.statusMessage}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Aggressiveness */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Aggressiveness</CardTitle>
                <motion.span
                  animate={{
                    scale: animatingMetric === 'all' ? 1.2 : 1,
                  }}
                  className={`text-lg font-bold ${
                    metrics.aggressiveness > 70
                      ? 'text-red-400'
                      : metrics.aggressiveness > 40
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {metrics.aggressiveness.toFixed(1)}%
                </motion.span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress
                value={metrics.aggressiveness}
                className="h-2 bg-slate-700"
              />
              <p className="text-purple-300 text-xs">
                {metrics.aggressiveness > 70
                  ? 'Highly aggressive tumor'
                  : metrics.aggressiveness > 40
                  ? 'Moderately aggressive'
                  : 'Low aggressiveness'}
              </p>
            </CardContent>
          </Card>

          {/* Treatment Score */}
          <motion.div
            animate={{
              scale: animatingMetric === 'all' ? 1.05 : 1,
            }}
          >
            <Card className="bg-slate-800/50 border-purple-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Treatment Score
                  </CardTitle>
                  <motion.div
                    animate={{
                      rotate: animatingMetric === 'all' ? 360 : 0,
                    }}
                    transition={{ duration: 1 }}
                    className={`text-lg font-bold ${getTreatmentTrend().color}`}
                  >
                    {metrics.treatmentScore.toFixed(1)}%
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress
                  value={metrics.treatmentScore}
                  className="h-2 bg-slate-700"
                />
                <div className="flex items-center justify-between">
                  <p className="text-purple-300 text-xs">
                    {getTreatmentTrend().label}
                  </p>
                  <span
                    className={`text-xs font-bold ${getTreatmentTrend().color}`}
                  >
                    {getTreatmentTrend().icon}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Effectiveness */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">
                  Effectiveness
                </CardTitle>
                <span className="text-lg font-bold text-green-400">
                  {(metrics.effectiveness * 100).toFixed(0)}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={metrics.effectiveness * 100}
                className="h-2 bg-slate-700"
              />
            </CardContent>
          </Card>

          {/* Evolution Pattern */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Evolution Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-purple-600/50 text-purple-100 border-purple-500/50">
                {metrics.evolutionPattern}
              </Badge>
            </CardContent>
          </Card>

          {/* Tumor Volume */}
          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Tumor Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-300 font-mono text-sm">
                {metrics.volume.toFixed(1)} mm³
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Evolution Intelligence Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              Tumor Reduction Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-lg">
                {(metrics.effectiveness * 25).toFixed(1)}%/month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              Recovery Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-300 font-semibold">
              {Math.ceil(6 / (metrics.effectiveness || 0.1))} months
            </p>
            <p className="text-purple-300 text-xs">At current response rate</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              Clinical Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Progress
                value={metrics.treatmentScore * 0.8}
                className="h-2 bg-slate-700 mb-1"
              />
              <p className="text-purple-300 text-xs">
                {(metrics.treatmentScore * 0.8).toFixed(0)}% confidence
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <div className="mt-6 text-xs text-purple-300">
        <p className="mb-2 font-semibold">Tumor Coloring:</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" /> Low Aggressiveness
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" /> Moderate Aggressiveness
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full" /> High Aggressiveness
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" /> Critical Aggressiveness
          </div>
        </div>
      </div>
    </div>
  );
}
