"use client"

import { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface VolumetricMedicalLightingProps {
  medicineEffect: "none" | "effective" | "ineffective"
  aggressiveness: "low" | "moderate" | "high"
  tumorIntensity: number
  treatmentScore?: number
}

export function VolumetricMedicalLighting({
  medicineEffect,
  aggressiveness,
  tumorIntensity,
  treatmentScore = 50,
}: VolumetricMedicalLightingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()

  // Custom volumetric shader for medical atmosphere
  const volumetricShader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.08 },
        uDensity: { value: 0.12 },
        uScatterColor: { value: new THREE.Color(0x1f4f7f) },
        uMedicineEffect: { value: 0.5 },
        uTumorIntensity: { value: 0.5 },
        uTreatmentScore: { value: 50.0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = mvPosition.xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uDensity;
        uniform vec3 uScatterColor;
        uniform float uMedicineEffect;
        uniform float uTumorIntensity;
        uniform float uTreatmentScore;

        varying vec3 vPosition;
        varying vec3 vViewPosition;
        varying vec3 vNormal;

        float noise3D(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yxz + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        void main() {
          // Volumetric fog based on depth
          float depth = length(vViewPosition) / 20.0;
          float fog = exp(-depth * uDensity);

          // Turbulent scattering
          vec3 noisePos = vPosition + uTime * 0.02;
          float turbulence = noise3D(noisePos * 2.0);
          turbulence += noise3D(noisePos * 4.0) * 0.5;
          turbulence += noise3D(noisePos * 8.0) * 0.25;

          // Medicine effect modulation
          float medicineModulation = mix(1.0, 0.5, uMedicineEffect);

          // Base scattering
          float scattering = uIntensity * turbulence * medicineModulation;
          scattering *= fog;

          // Directional scattering from main light
          vec3 lightDir = normalize(vec3(1.0, 1.2, 0.8));
          float lightFactor = max(0.0, dot(vNormal, lightDir)) * 0.5 + 0.5;
          scattering *= lightFactor;

          // Tumor intensity variation
          scattering *= mix(0.8, 1.3, uTumorIntensity);
          scattering *= mix(1.18, 0.72, clamp(uTreatmentScore / 100.0, 0.0, 1.0));

          vec3 color = uScatterColor * scattering;
          gl_FragColor = vec4(color, scattering * 0.15);
        }
      `,
    }),
    [],
  )

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: volumetricShader.uniforms,
      vertexShader: volumetricShader.vertexShader,
      fragmentShader: volumetricShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    })
    return mat
  }, [volumetricShader])

  useFrame((state) => {
    if (!meshRef.current || !meshRef.current.material) return

    const mat = meshRef.current.material as THREE.ShaderMaterial

    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uTreatmentScore.value = treatmentScore

    // Adjust volumetric intensity based on medicine effect
    if (medicineEffect === "effective") {
      mat.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        mat.uniforms.uIntensity.value,
        0.05,
        0.05,
      )
      mat.uniforms.uDensity.value = THREE.MathUtils.lerp(mat.uniforms.uDensity.value, 0.08, 0.05)
      mat.uniforms.uMedicineEffect.value = THREE.MathUtils.lerp(
        mat.uniforms.uMedicineEffect.value,
        0.9,
        0.05,
      )
    } else if (medicineEffect === "ineffective") {
      mat.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        mat.uniforms.uIntensity.value,
        0.12,
        0.05,
      )
      mat.uniforms.uDensity.value = THREE.MathUtils.lerp(mat.uniforms.uDensity.value, 0.18, 0.05)
      mat.uniforms.uMedicineEffect.value = THREE.MathUtils.lerp(
        mat.uniforms.uMedicineEffect.value,
        0.2,
        0.05,
      )
    } else {
      mat.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        mat.uniforms.uIntensity.value,
        0.08,
        0.05,
      )
      mat.uniforms.uDensity.value = THREE.MathUtils.lerp(mat.uniforms.uDensity.value, 0.12, 0.05)
      mat.uniforms.uMedicineEffect.value = THREE.MathUtils.lerp(
        mat.uniforms.uMedicineEffect.value,
        0.5,
        0.05,
      )
    }

    const scoreRatio = Math.max(0, Math.min(1, treatmentScore / 100))
    mat.uniforms.uIntensity.value = THREE.MathUtils.lerp(mat.uniforms.uIntensity.value, 0.12 - scoreRatio * 0.06, 0.03)
    mat.uniforms.uDensity.value = THREE.MathUtils.lerp(mat.uniforms.uDensity.value, 0.18 - scoreRatio * 0.08, 0.03)

    // Aggressiveness affects tumor intensity
    const aggressivenessMultiplier =
      aggressiveness === "low" ? 0.7 : aggressiveness === "high" ? 1.3 : 1.0
    mat.uniforms.uTumorIntensity.value = tumorIntensity * aggressivenessMultiplier

    // Adjust scattering color based on medicine effect
    if (medicineEffect === "effective") {
      mat.uniforms.uScatterColor.value.lerp(new THREE.Color(0x2f6f9f), 0.02)
    } else if (medicineEffect === "ineffective") {
      mat.uniforms.uScatterColor.value.lerp(new THREE.Color(0x5f3a4a), 0.02)
    } else {
      mat.uniforms.uScatterColor.value.lerp(new THREE.Color(0x1f4f7f), 0.02)
    }
  })

  return (
    <mesh ref={meshRef} scale={20} material={material} position={[0, 0, 0]}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  )
}
