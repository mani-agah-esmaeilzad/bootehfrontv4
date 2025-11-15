"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface SceneCanvasProps {
  className?: string;
}
export function SceneCanvas({ className }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 12;

    const icosahedronGeometry = new THREE.IcosahedronGeometry(5, 1);
    const icosahedronMaterial = new THREE.MeshStandardMaterial({
      color: "#6366f1",
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const icosahedronMesh = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
    scene.add(icosahedronMesh);

    const smallScreenQuery = window.matchMedia("(max-width: 768px)");
    const particleCount = smallScreenQuery.matches ? 300 : 800;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 12 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      particlePositions.set([x, y, z], i * 3);
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: "#a855f7",
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particlesMaterial);
    scene.add(particles);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight("#a78bfa", 1.2);
    directionalLight.position.set(5, 5, 10);
    scene.add(directionalLight);

    const handleResize = () => {
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    handleResize();

    const prefersReducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = prefersReducedMotionQuery.matches;

    let frameId: number | null = null;

    const animate = () => {
      const baseSpeed = prefersReducedMotion ? 0.0002 : 0.0008;
      icosahedronMesh.rotation.x += baseSpeed;
      icosahedronMesh.rotation.y += baseSpeed;
      particles.rotation.y -= baseSpeed * 0.75;
      particles.rotation.x -= baseSpeed * 0.75;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (frameId === null) {
        frameId = requestAnimationFrame(animate);
      }
    };

    const stopAnimation = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
    };
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (prefersReducedMotionQuery.addEventListener) {
      prefersReducedMotionQuery.addEventListener("change", handleMotionChange);
    } else {
      prefersReducedMotionQuery.addListener(handleMotionChange);
    }

    startAnimation();

    return () => {
      stopAnimation();
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (prefersReducedMotionQuery.removeEventListener) {
        prefersReducedMotionQuery.removeEventListener("change", handleMotionChange);
      } else {
        prefersReducedMotionQuery.removeListener(handleMotionChange);
      }
      renderer.dispose();
      icosahedronGeometry.dispose();
      particleGeometry.dispose();
      particlesMaterial.dispose();
      icosahedronMaterial.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 ${className}`} // className را اینجا اضافه کنید
    />
  );
}
