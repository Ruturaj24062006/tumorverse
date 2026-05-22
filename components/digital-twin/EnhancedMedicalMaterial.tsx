"use client"

import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface EnhancedMedicalMaterialProps {
  patientSeed: number
  timelineStatus: "shrinking" | "growing" | "stable" | string
  focusStrength: number
  focusX: number
  focusY: number
  opacity?: number
  medicineEffect: "none" | "effective" | "ineffective"
  aggressiveness: "low" | "moderate" | "high"
  treatmentScore?: number
}

const vertexShader = `
  precision highp float;

  uniform float uTime;
  uniform float uEffectiveness;
  uniform float uOpacity;
  uniform float uPulseStrength;
  uniform float uNoiseScale;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uDensity;
  uniform float uRimStrength;
  uniform float uSubsurfaceStrength;

  uniform float uSeed;
  uniform vec3 uGrowthAxis;

  attribute float aDensity;
  attribute float aOpacity;
  attribute float aTissueRegion;

  varying float vDensity;
  varying float vOpacity;
  varying float vRegion;
  varying float vVascularMask;
  varying float vNecrosisMask;
  varying float vDepthCue;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vSubsurface;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yxz + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3d(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 4; i++) {
      value += amp * noise3d(p * freq);
      amp *= 0.52;
      freq *= 2.04;
    }
    return value;
  }

  void main() {
    vec3 nrm = normalize(normal);
    vec3 axis = normalize(uGrowthAxis);

    float dirMask = pow(max(0.0, dot(normalize(position + axis * 0.16), axis) * 0.5 + 0.5), 1.45);

    float macro = fbm(position * (1.25 * uNoiseScale) + vec3(uSeed, -uSeed * 0.4, uSeed * 0.23));
    float medium = fbm(position * (3.2 * uNoiseScale) + vec3(2.1, -1.4, 0.8) + uSeed * 0.3);
    float micro = noise3d(position * (10.8 * uNoiseScale) + vec3(uSeed * 0.2));
    float ridge = 1.0 - abs(noise3d(position * (5.9 * uNoiseScale) + uSeed * 0.8) * 2.0 - 1.0);

    float vascular = smoothstep(0.5, 0.88, fbm(position * 3.8 + vec3(-1.1, 1.7, 2.2) + uTime * 0.03));
    float necrosis = smoothstep(0.56, 0.92, fbm(position * 2.3 + vec3(4.0, -3.5, 1.5) - uTime * 0.01));

    float growthBias = mix(0.08, -0.07, clamp(uEffectiveness, 0.0, 1.0));
    float deform = (
      macro * 0.18 + medium * 0.1 + micro * 0.03 + ridge * 0.06 + growthBias
    ) * mix(0.62, 1.34, dirMask) * mix(0.75, 1.15, uDensity);

    float pulse = sin(uTime * 0.28 + macro * 6.2831853 + medium * 4.2) * uPulseStrength;
    vec3 deformed = position + nrm * clamp((deform + pulse) * 0.22, -0.06, 0.24);

    float densityMix = clamp(aDensity + ridge * 0.12 + vascular * 0.1 - necrosis * 0.24, 0.0, 1.0);
    float opacityMix = clamp(aOpacity * uOpacity + ridge * 0.08 - necrosis * 0.22, 0.06, 0.97);

    vec4 worldPos = modelMatrix * vec4(deformed, 1.0);
    vec4 viewPos = viewMatrix * worldPos;
    vDepthCue = clamp(1.0 - abs(viewPos.z) / 14.0, 0.22, 1.0);

    // Enhanced subsurface scattering calculation
    float subsurfaceMask = pow(1.0 - densityMix, 1.8) * (1.0 - necrosis * 0.6);
    vSubsurface = subsurfaceMask * uSubsurfaceStrength;

    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * nrm);
    vDensity = densityMix;
    vOpacity = opacityMix;
    vRegion = aTissueRegion;
    vVascularMask = vascular;
    vNecrosisMask = necrosis;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uEffectiveness;
  uniform float uOpacity;
  uniform float uPulseStrength;
  uniform float uNoiseScale;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uDensity;
  uniform float uRimStrength;
  uniform float uSubsurfaceStrength;

  uniform vec3 uColorC;
  uniform vec3 uColorD;
  uniform vec3 uVascularColor;
  uniform vec3 uNecroticColor;

  uniform vec3 uLightDirection;
  uniform vec3 uMainLightColor;
  uniform float uMainLightIntensity;
  uniform float uAmbientStrength;
  uniform vec3 uRimLightColor;
  uniform float uRimLightIntensity;

  varying float vDensity;
  varying float vOpacity;
  varying float vRegion;
  varying float vVascularMask;
  varying float vNecrosisMask;
  varying float vDepthCue;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vSubsurface;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uLightDirection);

    // Main light calculation with PBR-inspired approach
    float ndotl = max(dot(N, L), 0.0);
    float mainLighting = ndotl * uMainLightIntensity;

    // Rim lighting - medical tissue separation
    float rimFactor = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    vec3 rimLight = rimFactor * uRimLightColor * uRimLightIntensity * 0.8;

    // Enhanced subsurface scattering for biological tissue feel
    float backlight = pow(1.0 - max(dot(-N, V), 0.0), 1.2);
    float subsurfaceAmount = backlight * vSubsurface;
    vec3 subsurfaceColor = mix(
      vec3(0.14, 0.04, 0.06),
      vec3(0.28, 0.12, 0.16),
      1.0 - vDensity
    );
    vec3 subsurface = subsurfaceColor * subsurfaceAmount * 0.6;

    // Tissue layering and color
    float shellW = smoothstep(0.6, 1.6, vRegion);
    float midW = smoothstep(1.4, 2.6, vRegion);
    float softW = smoothstep(2.3, 3.5, vRegion);

    vec3 layerColor =
      mix(uColorA, uColorB, shellW) * (1.0 - midW) +
      mix(uColorB, uColorC, midW) * (1.0 - softW) +
      mix(uColorC, uColorD, softW);

    vec3 densityColor = mix(layerColor * 1.22, layerColor * 0.58, vDensity);

    // Specular highlights - medical tissue wetness
    float moistSpec = pow(max(dot(reflect(-L, N), V), 0.0), mix(22.0, 8.0, vDensity));
    float roughSpec = moistSpec * mix(0.1, 0.22, 1.0 - vDensity);

    // Vascular and necrotic features
    vec3 vascularTint = uVascularColor * vVascularMask * 0.25;
    vec3 necroticTint = uNecroticColor * vNecrosisMask * 0.42;

    // Depth-based ambient occlusion
    float depthAO = mix(0.9, 1.1, vDepthCue);

    // Combine all lighting components
    vec3 lit = densityColor * (uAmbientStrength + mainLighting * 0.95) * depthAO;
    lit += roughSpec * uMainLightColor;
    lit += vascularTint;
    lit -= necroticTint;
    lit += subsurface;
    lit += rimLight;

    float alpha = clamp(vOpacity * (0.78 + ndotl * 0.22) - vNecrosisMask * 0.2, 0.1, 0.98);
    alpha *= mix(1.08, 0.88, clamp(uEffectiveness, 0.0, 1.0));

    gl_FragColor = vec4(lit, alpha);
  }
`

export function EnhancedMedicalMaterial({
  patientSeed,
  timelineStatus,
  focusStrength,
  focusX,
  focusY,
  opacity = 0.9,
  medicineEffect,
  aggressiveness,
  treatmentScore = 50,
}: EnhancedMedicalMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { scene } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEffectiveness: { value: treatmentScore / 100 },
      uOpacity: { value: opacity },
      uPulseStrength: { value: 0.007 },
      uNoiseScale: { value: 1.0 },
      uColorA: { value: new THREE.Color("#5d0f22") },
      uColorB: { value: new THREE.Color("#7f1f3a") },
      uColorC: { value: new THREE.Color("#ad4966") },
      uColorD: { value: new THREE.Color("#2a1018") },
      uDensity: { value: 0.78 },
      uRimStrength: { value: 0.48 },
      uSubsurfaceStrength: { value: 0.45 },
      uVascularColor: { value: new THREE.Color("#bf2435") },
      uNecroticColor: { value: new THREE.Color("#221114") },
      uSeed: { value: patientSeed * 97.31 + 1.79 },
      uGrowthAxis: { value: new THREE.Vector3(0.36, 0.5, -0.2).normalize() },
      uLightDirection: { value: new THREE.Vector3(0.5, 0.8, 0.24).normalize() },
      uMainLightColor: { value: new THREE.Color(0xfbfcff) },
      uMainLightIntensity: { value: 1.15 },
      uAmbientStrength: { value: 0.42 },
      uRimLightColor: { value: new THREE.Color(0x6bb9cc) },
      uRimLightIntensity: { value: 0.4 },
    }),
    [patientSeed, opacity, treatmentScore],
  )

  useFrame((_, delta) => {
    if (!materialRef.current) return

    const time = materialRef.current.uniforms.uTime.value + Math.min(delta, 0.05)
    materialRef.current.uniforms.uTime.value = time

    const isShrinking = timelineStatus === "shrinking"
    const isGrowing = timelineStatus === "growing"

    const effectiveness = Math.max(0.05, Math.min(0.95, treatmentScore / 100))
    const pulseStrength = isShrinking
      ? 0.003 + focusStrength * 0.002 * (1.0 - effectiveness)
      : isGrowing
        ? 0.008 + focusStrength * 0.008 * (1.0 - effectiveness)
        : 0.0055 + focusStrength * 0.004 * (1.0 - effectiveness)

    const noiseScale = isShrinking ? 0.86 + (1.0 - effectiveness) * 0.1 : isGrowing ? 1.08 + (1.0 - effectiveness) * 0.12 : 0.96 + (1.0 - effectiveness) * 0.06
    const density = isShrinking ? 0.62 + effectiveness * 0.08 : isGrowing ? 0.88 - effectiveness * 0.1 : 0.74 + (1.0 - effectiveness) * 0.06
    const rimStrength = isShrinking ? 0.34 + effectiveness * 0.08 : isGrowing ? 0.5 + (1.0 - effectiveness) * 0.08 : 0.42 + effectiveness * 0.05

    // Enhanced subsurface based on medicine effect
    const subsurfaceStrength =
      medicineEffect === "effective" ? 0.28 + effectiveness * 0.12 : medicineEffect === "ineffective" ? 0.5 + (1.0 - effectiveness) * 0.14 : 0.36 + (1.0 - effectiveness) * 0.08

    materialRef.current.uniforms.uEffectiveness.value = effectiveness
    materialRef.current.uniforms.uPulseStrength.value = pulseStrength
    materialRef.current.uniforms.uNoiseScale.value = noiseScale
    materialRef.current.uniforms.uDensity.value = density
    materialRef.current.uniforms.uRimStrength.value = rimStrength
    materialRef.current.uniforms.uSubsurfaceStrength.value = subsurfaceStrength
    materialRef.current.uniforms.uOpacity.value = opacity

    const axis = new THREE.Vector3(0.34 + focusX * 0.52, 0.44 + focusY * 0.36, -0.2 + focusX * 0.24).normalize()
    materialRef.current.uniforms.uGrowthAxis.value.copy(axis)

    // Sync with scene lighting
    const directionalLights = scene.children.filter((child) => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight[]

    // Main light (first directional light)
    if (directionalLights.length > 0) {
      const mainLight = directionalLights[0]
      const dir = mainLight.position.clone().normalize()
      materialRef.current.uniforms.uLightDirection.value.copy(dir)
      materialRef.current.uniforms.uMainLightColor.value.copy(mainLight.color)
      materialRef.current.uniforms.uMainLightIntensity.value = mainLight.intensity
    }

    // Rim light (second directional light if available)
    if (directionalLights.length > 1) {
      const rimLight = directionalLights[1]
      materialRef.current.uniforms.uRimLightColor.value.copy(rimLight.color)
      materialRef.current.uniforms.uRimLightIntensity.value = rimLight.intensity
    }

    // Ambient from ambient lights
    const ambientLights = scene.children.filter((child) => child instanceof THREE.AmbientLight) as THREE.AmbientLight[]
    if (ambientLights.length > 0) {
      const ambientTotal = ambientLights.reduce((sum, light) => sum + light.intensity, 0)
      materialRef.current.uniforms.uAmbientStrength.value = Math.min(0.7, Math.max(0.15, ambientTotal * 0.7))
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent
      side={THREE.DoubleSide}
      depthWrite={false}
      depthTest
    />
  )
}
