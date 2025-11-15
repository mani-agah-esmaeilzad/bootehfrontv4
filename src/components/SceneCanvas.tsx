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
      color: "#7f74ff",
      wireframe: false,
      transparent: true,
      opacity: 0.2,
      metalness: 0.35,
      roughness: 0.4,
    });
    const icosahedronMesh = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
    scene.add(icosahedronMesh);

    const wireMaterial = new THREE.LineBasicMaterial({
      color: "#c4b5fd",
      transparent: true,
      opacity: 0.75,
    });
    const wireframe = new THREE.LineSegments(new THREE.WireframeGeometry(icosahedronGeometry), wireMaterial);
    scene.add(wireframe);

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
      color: "#d8b4fe",
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particlesMaterial);
    scene.add(particles);

    const connectorGeometry = new THREE.BufferGeometry();
    const connectorPairs = smallScreenQuery.matches ? 120 : 220;
    const connectorPositions = new Float32Array(connectorPairs * 6);
    for (let i = 0; i < connectorPairs; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 3.5;
      const px = radius * Math.sin(phi) * Math.cos(theta);
      const py = radius * Math.sin(phi) * Math.sin(theta);
      const pz = radius * Math.cos(phi);
      connectorPositions.set([0, 0, 0, px, py, pz], i * 6);
    }
    connectorGeometry.setAttribute("position", new THREE.BufferAttribute(connectorPositions, 3));
    const connectorMaterial = new THREE.LineBasicMaterial({
      color: "#7dd3fc",
      transparent: true,
      opacity: 0.25,
    });
    const connectors = new THREE.LineSegments(connectorGeometry, connectorMaterial);
    scene.add(connectors);

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
      wireframe.rotation.copy(icosahedronMesh.rotation);
      particles.rotation.y -= baseSpeed * 0.75;
      particles.rotation.x -= baseSpeed * 0.75;
      connectors.rotation.y += baseSpeed * 0.5;
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
      connectorGeometry.dispose();
      connectorMaterial.dispose();
      icosahedronGeometry.dispose();
      particleGeometry.dispose();
      particlesMaterial.dispose();
      wireMaterial.dispose();
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
      className={`pointer-events-none absolute inset-0 -z-10 ${className ?? ""}`}
    />
  );
}
