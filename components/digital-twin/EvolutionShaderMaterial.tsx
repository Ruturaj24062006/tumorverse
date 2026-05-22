"use client"

import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface EvolutionShaderProps {
  patientSeed: number
  aggressiveness: number
  status: string
  pulsationStrength?: number
  treatmentScore?: number
  effectiveness?: number
  instability?: number
}

const vertexShader = `
  precision highp float;

  uniform float uTime;
  uniform float uAggressiveness;
  uniform float uPulseStrength;
  uniform float uEffectiveness;
  uniform float uInstability;
  uniform float uTreatmentScore;
  uniform int uStatus;  // 0: shrinking, 1: stable, 2: growing
  uniform float uNoiseScale;

  attribute float aDensity;
  attribute float aOpacity;
  attribute float aTissueRegion;

  varying float vDensity;
  varying float vOpacity;
  varying float vRegion;
  varying float vDepthCue;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vPulsation;

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
    float effectiveness = clamp(uEffectiveness, 0.0, 1.0);
    float instability = clamp(uInstability, 0.0, 1.0);
    
    // Pulsation effect based on status and aggressiveness
    float pulsationFreq = mix(0.45, 2.2, uAggressiveness);
    float pulsationFactor = sin(uTime * pulsationFreq + uTreatmentScore * 0.02) * uPulseStrength;
    pulsationFactor *= mix(1.18, 0.52, effectiveness);
    
    // Growing tumors pulse more
    if (uStatus == 2) {
      pulsationFactor *= 1.45 + instability * 0.35;
    }
    // Shrinking tumors pulse less
    else if (uStatus == 0) {
      pulsationFactor *= 0.42 + effectiveness * 0.2;
    }
    
    // Add small deformation noise for living tissue feel
    float deformNoise = fbm(position * uNoiseScale + vec3(uTime * 0.1 + uTreatmentScore * 0.01));
    float deform = (deformNoise - 0.5) * mix(0.03, 0.09, instability);
    float directionalBias = dot(nrm, normalize(vec3(0.34, 0.56, -0.24)));
    deform += directionalBias * mix(0.02, 0.08, 1.0 - effectiveness);
    
    float invasive = mix(0.0, 0.08, instability) * step(0.55, aDensity);
    vec3 deformed = position + nrm * (pulsationFactor + deform * aDensity - invasive);
    
    vec4 worldPos = modelMatrix * vec4(deformed, 1.0);
    vec4 viewPos = viewMatrix * worldPos;
    
    vDepthCue = clamp(1.0 - abs(viewPos.z) / 14.0, 0.22, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * nrm);
    
    vDensity = aDensity;
    vOpacity = aOpacity;
    vRegion = aTissueRegion;
    vPulsation = pulsationFactor;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uAggressiveness;
  uniform float uTreatmentScore;
  uniform float uEffectiveness;
  uniform float uInstability;
  uniform int uStatus;  // 0: shrinking, 1: stable, 2: growing
  
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;
  uniform vec3 uVascularColor;
  uniform vec3 uNecroticColor;
  
  uniform vec3 uLightDirection;
  uniform vec3 uMainLightColor;
  uniform float uMainLightIntensity;
  uniform float uAmbientStrength;

  varying float vDensity;
  varying float vOpacity;
  varying float vRegion;
  varying float vDepthCue;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vPulsation;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uLightDirection);

    // Main light calculation
    float ndotl = max(dot(N, L), 0.0);
    float mainLighting = ndotl * uMainLightIntensity;

    // Rim lighting
    float rimFactor = pow(1.0 - max(dot(N, V), 0.0), 2.5 + uInstability * 0.8);
    vec3 rimLight = rimFactor * vec3(0.42, 0.72, 0.85) * 0.5;

    // Tissue layering and color
    float shellW = smoothstep(0.6, 1.6, vRegion);
    float midW = smoothstep(1.4, 2.6, vRegion);
    float softW = smoothstep(2.3, 3.5, vRegion);

    vec3 layerColor =
      mix(uColorA, uColorB, shellW) * (1.0 - midW) +
      mix(uColorB, uColorC, midW) * (1.0 - softW) +
      mix(uColorC, uColorD, softW);

    vec3 densityColor = mix(layerColor * 1.22, layerColor * 0.58, vDensity);
    densityColor = mix(densityColor, densityColor * vec3(1.02, 1.06, 1.12), clamp(uEffectiveness, 0.0, 1.0));

    // Subsurface scattering
    float backlight = pow(1.0 - max(dot(-N, V), 0.0), 1.2);
    float subsurfaceAmount = backlight * mix(0.25, 0.45, clamp(uEffectiveness, 0.0, 1.0));
    vec3 subsurfaceColor = mix(
      vec3(0.14, 0.04, 0.06),
      vec3(0.28, 0.12, 0.16),
      1.0 - vDensity
    );
    vec3 subsurface = subsurfaceColor * subsurfaceAmount * 0.6;

    // Color shifts based on status
    vec3 statusTint = vec3(1.0);
    
    if (uStatus == 0) {
      // Shrinking: shift towards healthier greens/blues
      statusTint = mix(statusTint, vec3(0.4, 0.8, 0.6), 0.3);
    } else if (uStatus == 2) {
      // Growing: shift towards aggressive reds/purples
      statusTint = mix(statusTint, vec3(1.0, 0.3, 0.4), 0.4);
    }

    // Specular highlights
    float moistSpec = pow(max(dot(reflect(-L, N), V), 0.0), mix(22.0, 8.0, vDensity));
    float roughSpec = moistSpec * mix(0.1, 0.22, 1.0 - vDensity);

    // Vascular and necrotic features
    float vascularMask = sin(vWorldPos.x * 2.0 + uTime * 0.2) * 0.5 + 0.5;
    float necrosisMask = step(0.7, vDensity) * step(0.3, vRegion);
    
    vec3 vascularTint = uVascularColor * vascularMask * mix(0.14, 0.28, uInstability) * (1.0 + vPulsation * 2.0);
    vec3 necroticTint = uNecroticColor * necrosisMask * mix(0.18, 0.5, uInstability);

    // Combine all components
    vec3 lit = densityColor * (uAmbientStrength + mainLighting * 0.95);
    lit *= mix(0.7, 1.04, vDepthCue);
    lit += roughSpec * uMainLightColor;
    lit += vascularTint;
    lit -= necroticTint;
    lit += subsurface;
    lit += rimLight;
    lit *= statusTint;

    // Alpha based on density and status
    float alpha = clamp(vOpacity * (0.78 + ndotl * 0.22), 0.1, 0.98);
    alpha *= mix(1.12, 0.84, clamp(uEffectiveness, 0.0, 1.0));
    
    // Pulsation affects opacity slightly
    alpha *= (0.9 + vPulsation * 0.2);

    gl_FragColor = vec4(lit, alpha);
  }
`

export function EvolutionShaderMaterial({
  patientSeed,
  aggressiveness,
  status,
  pulsationStrength = 0.008,
  treatmentScore = 50,
  effectiveness = 0.5,
  instability = 0.5,
}: EvolutionShaderProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { scene } = useThree()

  const statusToInt = (status: string) => {
    switch (status) {
      case "shrinking":
        return 0
      case "growing":
        return 2
      default:
        return 1 // stable
    }
  }

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAggressiveness: { value: aggressiveness },
      uStatus: { value: statusToInt(status) },
      uPulseStrength: { value: pulsationStrength },
      uEffectiveness: { value: effectiveness },
      uInstability: { value: instability },
      uTreatmentScore: { value: treatmentScore },
      uNoiseScale: { value: 1.0 },
      
      // Colors
      uColorA: { value: new THREE.Color("#5d0f22") },
      uColorB: { value: new THREE.Color("#7f1f3a") },
      uColorC: { value: new THREE.Color("#ad4966") },
      uColorD: { value: new THREE.Color("#2a1018") },
      uVascularColor: { value: new THREE.Color("#bf2435") },
      uNecroticColor: { value: new THREE.Color("#221114") },
      
      // Lighting
      uLightDirection: { value: new THREE.Vector3(0.5, 0.8, 0.24).normalize() },
      uMainLightColor: { value: new THREE.Color(0xfbfcff) },
      uMainLightIntensity: { value: 1.15 },
      uAmbientStrength: { value: 0.42 },
    }),
    [aggressiveness, status, pulsationStrength, treatmentScore, effectiveness, instability],
  )

  useFrame((state, delta) => {
    if (!materialRef.current) return

    // Update time
    materialRef.current.uniforms.uTime.value += delta

    // Update aggressiveness smoothly
    materialRef.current.uniforms.uAggressiveness.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uAggressiveness.value,
      aggressiveness,
      0.02,
    )

    // Update status
    materialRef.current.uniforms.uStatus.value = statusToInt(status)
    materialRef.current.uniforms.uTreatmentScore.value = treatmentScore
    materialRef.current.uniforms.uEffectiveness.value = effectiveness
    materialRef.current.uniforms.uInstability.value = instability

    // Adjust pulsation based on status
    let targetPulsation = pulsationStrength
    if (status === "growing") {
      targetPulsation *= 1.5 - Math.min(0.4, treatmentScore / 250)
    } else if (status === "shrinking") {
      targetPulsation *= 0.35 + treatmentScore / 500
    }

    materialRef.current.uniforms.uPulseStrength.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uPulseStrength.value,
      targetPulsation,
      0.05,
    )

    // Sync with scene lighting
    const directionalLights = scene.children.filter(
      (child) => child instanceof THREE.DirectionalLight,
    ) as THREE.DirectionalLight[]

    if (directionalLights.length > 0) {
      const mainLight = directionalLights[0]
      const dir = mainLight.position.clone().normalize()
      materialRef.current.uniforms.uLightDirection.value.copy(dir)
      materialRef.current.uniforms.uMainLightColor.value.copy(mainLight.color)
      materialRef.current.uniforms.uMainLightIntensity.value = mainLight.intensity
    }

    // Adjust color based on status for visual feedback
    if (status === "shrinking") {
      // Shift towards healthier tones
      materialRef.current.uniforms.uColorA.value.lerp(
        new THREE.Color("#4a8f5e"),
        0.01,
      )
    } else if (status === "growing") {
      // Shift towards aggressive tones
      materialRef.current.uniforms.uColorA.value.lerp(
        new THREE.Color("#8f2f3f"),
        0.01,
      )
    } else {
      // Return to neutral
      materialRef.current.uniforms.uColorA.value.lerp(
        new THREE.Color("#5d0f22"),
        0.01,
      )
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
