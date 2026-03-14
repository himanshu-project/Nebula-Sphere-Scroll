import { useRef, useLayoutEffect, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useControls } from 'leva';
import './NebulaMaterial';
import { playSound, SoundEffectType } from '../utils/audio';

gsap.registerPlugin(ScrollTrigger);

const InteractiveParticles = ({ count = 800, color1, color2 }: { count?: number, color1: string, color2: string }) => {
  const mesh = useRef<THREE.Points>(null);
  const hoverRef = useRef(new THREE.Vector3(0, 0, 0));

  const [positions, originalPositions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const mixedColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = 1.2 + Math.random() * 2.5;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      mixedColor.lerpColors(c1, c2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    return [positions, originalPositions, colors];
  }, [count, color1, color2]);

  useFrame((state, delta) => {
    if (!mesh.current) return;

    const viewport = state.viewport;
    hoverRef.current.set((state.pointer.x * viewport.width) / 2, (state.pointer.y * viewport.height) / 2, 0);

    const positionsAttr = mesh.current.geometry.attributes.position;
    const posArray = positionsAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const px = posArray[ix];
      const py = posArray[iy];
      const pz = posArray[iz];

      const ox = originalPositions[ix];
      const oy = originalPositions[iy];
      const oz = originalPositions[iz];

      const dx = px - hoverRef.current.x;
      const dy = py - hoverRef.current.y;
      const dz = pz - hoverRef.current.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      const interactionRadius = 2.5;
      
      if (distSq < interactionRadius * interactionRadius) {
        const dist = Math.sqrt(distSq);
        const force = (interactionRadius - dist) / interactionRadius;
        
        posArray[ix] += (dx / dist) * force * delta * 8;
        posArray[iy] += (dy / dist) * force * delta * 8;
        posArray[iz] += (dz / dist) * force * delta * 8;
      } else {
        posArray[ix] = THREE.MathUtils.lerp(px, ox, delta * 2);
        posArray[iy] = THREE.MathUtils.lerp(py, oy, delta * 2);
        posArray[iz] = THREE.MathUtils.lerp(pz, oz, delta * 2);
      }
    }
    positionsAttr.needsUpdate = true;
    
    mesh.current.rotation.y += delta * 0.05;
    mesh.current.rotation.x += delta * 0.02;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default function Scene() {
  const gsapRef = useRef<THREE.Group>(null);
  const mouseRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  const targetRotation = useRef({ x: 0, y: 0 });
  const targetZoom = useRef(1);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const { gl } = useThree();

  const { color1, color2, color3, speed, displacement, soundEffect } = useControls('Nebula Shader', {
    color1: '#ff00cc',
    color2: '#3333ff',
    color3: '#00ffff',
    speed: { value: 1, min: 0, max: 5, step: 0.1 },
    displacement: { value: 0.15, min: 0, max: 1, step: 0.01 },
    soundEffect: { options: ['click', 'laser', 'chime', 'bass'], value: 'click' }
  });

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;

        if (e.buttons === 2 || e.shiftKey) {
          // Right click or Shift+Left click to zoom
          targetZoom.current += deltaY * -0.005;
          targetZoom.current = THREE.MathUtils.clamp(targetZoom.current, 0.5, 3.0);
        } else {
          // Left click to rotate
          targetRotation.current.y += deltaX * 0.005;
          targetRotation.current.x += deltaY * 0.005;
        }

        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onDoubleClick = () => {
      targetRotation.current = { x: 0, y: 0 };
      targetZoom.current = 1;
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('dblclick', onDoubleClick);
    canvas.addEventListener('contextmenu', onContextMenu);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('dblclick', onDoubleClick);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime * speed;
    }
    // Add a slow continuous rotation on top of the scroll animation
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x += 0.001;
    }

    // Mouse interaction (tilt & zoom)
    if (mouseRef.current) {
      // Apply hover zoom effect slightly if not manually zoomed
      const activeZoom = hovered && targetZoom.current === 1 ? 1.05 : targetZoom.current;

      // Calculate subtle parallax from mouse position
      const parallaxX = (state.pointer.y * Math.PI) / 10;
      const parallaxY = (state.pointer.x * Math.PI) / 10;

      // Combine manual drag rotation with mouse tracking parallax
      mouseRef.current.rotation.x = THREE.MathUtils.damp(mouseRef.current.rotation.x, targetRotation.current.x - parallaxX, 6, delta);
      mouseRef.current.rotation.y = THREE.MathUtils.damp(mouseRef.current.rotation.y, targetRotation.current.y + parallaxY, 6, delta);

      mouseRef.current.scale.x = THREE.MathUtils.damp(mouseRef.current.scale.x, activeZoom, 6, delta);
      mouseRef.current.scale.y = THREE.MathUtils.damp(mouseRef.current.scale.y, activeZoom, 6, delta);
      mouseRef.current.scale.z = THREE.MathUtils.damp(mouseRef.current.scale.z, activeZoom, 6, delta);
    }
  });

  useLayoutEffect(() => {
    if (!gsapRef.current) return;

    let ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".main-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        }
      });

      // Section 2: Move right, scale down, rotate
      tl.to(gsapRef.current.position, {
        x: 1.5,
        y: -0.5,
        z: -1,
        ease: "power1.inOut"
      }, 0);

      tl.to(gsapRef.current.scale, {
        x: 0.8,
        y: 0.8,
        z: 0.8,
        ease: "power1.inOut"
      }, 0);

      tl.to(gsapRef.current.rotation, {
        x: Math.PI * 0.5,
        y: Math.PI,
        ease: "none"
      }, 0);

      // Section 3: Move left, scale up slightly, rotate more
      tl.to(gsapRef.current.position, {
        x: -1.5,
        y: -1,
        z: 0.5,
        ease: "power1.inOut"
      }, 0.5);

      tl.to(gsapRef.current.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        ease: "power1.inOut"
      }, 0.5);

      tl.to(gsapRef.current.rotation, {
        x: Math.PI,
        y: Math.PI * 2,
        ease: "none"
      }, 0.5);
    });

    return () => ctx.revert();
  }, []);

  useLayoutEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  return (
    <group ref={gsapRef}>
      <group ref={mouseRef}>
        <InteractiveParticles color1={color1} color2={color3} />
        <mesh 
          ref={meshRef} 
          position={[0, 0, 0]}
          onClick={() => playSound(soundEffect as SoundEffectType)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Icosahedron provides a nice organic base for displacement compared to a standard Sphere */}
          <icosahedronGeometry args={[1.5, 64]} />
          <nebulaMaterial
            ref={materialRef}
            uColor1={new THREE.Color(color1)}
            uColor2={new THREE.Color(color2)}
            uColor3={new THREE.Color(color3)}
            uDisplacement={displacement}
          />
        </mesh>
      </group>
    </group>
  );
}
