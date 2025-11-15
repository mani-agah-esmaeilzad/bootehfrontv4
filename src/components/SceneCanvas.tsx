import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface SceneCanvasProps {
  className?: string;
}

export function SceneCanvas({ className }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const group = new THREE.Group();
    scene.add(group);

    const icoGeometry = new THREE.IcosahedronGeometry(1.8, 1);
    const wireGeometry = new THREE.WireframeGeometry(icoGeometry);
    const wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color("#7c3aed"),
      transparent: true,
      opacity: 0.55,
      linewidth: 1,
    });
    const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
    group.add(wireframe);

    const glowMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#a78bfa"),
      transparent: true,
      opacity: 0.08,
      metalness: 0.2,
      roughness: 0.35,
      side: THREE.DoubleSide,
    });
    const glowMesh = new THREE.Mesh(icoGeometry.clone(), glowMaterial);
    group.add(glowMesh);

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 700;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.8 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: new THREE.Color("#c4b5fd"),
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particlesMaterial);
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.PointLight(0x93c5fd, 0.9);
    keyLight.position.set(2, 2, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xf472b6, 0.6);
    rimLight.position.set(-3, -1, 3);
    scene.add(rimLight);

    const clock = new THREE.Clock();
    const resizeRenderer = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resizeRenderer();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resizeRenderer);
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", resizeRenderer);
    }

    let frameId: number;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      group.rotation.x = 0.35 + elapsed * 0.25;
      group.rotation.y = elapsed * 0.18;
      particles.rotation.y = elapsed * 0.06;
      particles.rotation.x = Math.sin(elapsed * 0.2) * 0.1;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resizeRenderer);
      }
      icoGeometry.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      glowMaterial.dispose();
      particleGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("absolute inset-0", className)}>
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/60" />
    </div>
  );
}
