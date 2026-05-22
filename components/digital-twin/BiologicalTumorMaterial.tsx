"use client"

import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface BiologicalTumorMaterialProps {
  patientSeed: number
  timelineStatus: "shrinking" | "growing" | "stable" | string
  focusStrength: number
  focusX: number
  focusY: number
  opacity?: number
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

  uniform vec3 uColorC;
  uniform vec3 uColorD;
  uniform vec3 uVascularColor;
  uniform vec3 uNecroticColor;

  uniform vec3 uLightDirection;
  uniform float uAmbientStrength;

  varying float vDensity;
  varying float vOpacity;
  varying float vRegion;
  varying float vVascularMask;
  varying float vNecrosisMask;
  varying float vDepthCue;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uLightDirection);

    float ndotl = max(dot(N, L), 0.0);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.15) * uRimStrength;

    float shellW = smoothstep(0.6, 1.6, vRegion);
    float midW = smoothstep(1.4, 2.6, vRegion);
    float softW = smoothstep(2.3, 3.5, vRegion);

    vec3 layerColor =
      mix(uColorA, uColorB, shellW) * (1.0 - midW) +
      mix(uColorB, uColorC, midW) * (1.0 - softW) +
      mix(uColorC, uColorD, softW);

    vec3 densityColor = mix(layerColor * 1.18, layerColor * 0.62, vDensity);

    float moistSpec = pow(max(dot(reflect(-L, N), V), 0.0), mix(18.0, 7.0, vDensity));
    float roughSpec = moistSpec * mix(0.07, 0.18, 1.0 - vDensity);

    vec3 vascularTint = uVascularColor * vVascularMask * 0.2;
    vec3 necroticTint = uNecroticColor * vNecrosisMask * 0.38;

    float subsurface = pow(1.0 - max(dot(-N, V), 0.0), 1.35) * (0.28 + uPulseStrength * 1.6);
    vec3 scatterColor = mix(vec3(0.12, 0.02, 0.03), vec3(0.22, 0.06, 0.09), 1.0 - vDensity);

    vec3 rimTint = mix(vec3(0.12, 0.48, 0.56), vec3(0.72, 0.33, 0.46), 0.5 + 0.5 * sin(uTime * 0.08));
    vec3 lit = densityColor * (uAmbientStrength + ndotl * 0.82);
    lit += roughSpec;
    lit += vascularTint;
    lit -= necroticTint;
    lit += subsurface * scatterColor;
    lit += rim * rimTint * 0.42;

    lit *= mix(0.7, 1.04, vDepthCue);

    float alpha = clamp(vOpacity * (0.75 + ndotl * 0.25) - vNecrosisMask * 0.18, 0.08, 0.96);
    alpha *= mix(1.04, 0.92, clamp(uEffectiveness, 0.0, 1.0));

    gl_FragColor = vec4(lit, alpha);
  }
`

export function BiologicalTumorMaterial({
  patientSeed,
  timelineStatus,
  focusStrength,
  focusX,
  focusY,
  opacity = 0.9,
}: BiologicalTumorMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { scene } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEffectiveness: { value: 0.5 },
      uOpacity: { value: opacity },
      uPulseStrength: { value: 0.007 },
      uNoiseScale: { value: 1.0 },
      uColorA: { value: new THREE.Color("#5d0f22") },
      uColorB: { value: new THREE.Color("#7f1f3a") },
      uColorC: { value: new THREE.Color("#ad4966") },
      uColorD: { value: new THREE.Color("#2a1018") },
      uDensity: { value: 0.78 },
      uRimStrength: { value: 0.48 },
      uVascularColor: { value: new THREE.Color("#bf2435") },
      uNecroticColor: { value: new THREE.Color("#221114") },
      uSeed: { value: patientSeed * 97.31 + 1.79 },
      uGrowthAxis: { value: new THREE.Vector3(0.36, 0.5, -0.2).normalize() },
      uLightDirection: { value: new THREE.Vector3(0.5, 0.8, 0.24).normalize() },
      uAmbientStrength: { value: 0.34 },
    }),
    [patientSeed, opacity],
  )

  useFrame((_, delta) => {
    if (!materialRef.current) return

    const time = materialRef.current.uniforms.uTime.value + Math.min(delta, 0.05)
    materialRef.current.uniforms.uTime.value = time

    const isShrinking = timelineStatus === "shrinking"
    const isGrowing = timelineStatus === "growing"

    const effectiveness = isShrinking ? 0.88 : isGrowing ? 0.18 : 0.5
    const pulseStrength = isShrinking
      ? 0.0038 + focusStrength * 0.0022
      : isGrowing
      ? 0.0095 + focusStrength * 0.007
      : 0.0065 + focusStrength * 0.0042

    const noiseScale = isShrinking ? 0.92 : isGrowing ? 1.14 : 1.0
    const density = isShrinking ? 0.7 : isGrowing ? 0.86 : 0.78
    const rimStrength = isShrinking ? 0.38 : isGrowing ? 0.56 : 0.48

    materialRef.current.uniforms.uEffectiveness.value = effectiveness
    materialRef.current.uniforms.uPulseStrength.value = pulseStrength
    materialRef.current.uniforms.uNoiseScale.value = noiseScale
    materialRef.current.uniforms.uDensity.value = density
    materialRef.current.uniforms.uRimStrength.value = rimStrength
    materialRef.current.uniforms.uOpacity.value = opacity

    const axis = new THREE.Vector3(0.34 + focusX * 0.52, 0.44 + focusY * 0.36, -0.2 + focusX * 0.24).normalize()
    materialRef.current.uniforms.uGrowthAxis.value.copy(axis)

    const directional = scene.children.find((child) => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight | undefined
    if (directional) {
      const dir = directional.position.clone().normalize()
      materialRef.current.uniforms.uLightDirection.value.copy(dir)
    }

    const ambientLights = scene.children.filter((child) => child instanceof THREE.AmbientLight) as THREE.AmbientLight[]
    if (ambientLights.length > 0) {
      const ambientTotal = ambientLights.reduce((sum, light) => sum + light.intensity, 0)
      materialRef.current.uniforms.uAmbientStrength.value = Math.min(0.65, Math.max(0.12, ambientTotal * 0.65))
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
