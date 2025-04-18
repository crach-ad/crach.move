"use client";

import { useRef } from "react";
import { Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface JointProps {
  position: number[];
  name: string;
  color?: string;
  size?: number;
  highlight?: boolean;
}

export default function Joint({ 
  position, 
  name, 
  color = "#4299e1", 
  size = 0.03,
  highlight = false
}: JointProps) {
  const ref = useRef<THREE.Mesh>(null);
  
  // Use Three.js animation frame to update position
  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(position[0], position[1], position[2]);
    }
  });

  return (
    <Sphere 
      ref={ref} 
      args={[size, 16, 16]} 
      position={[position[0], position[1], position[2]]}
    >
      <meshStandardMaterial 
        color={color} 
        emissive={highlight ? color : "black"} 
        emissiveIntensity={highlight ? 0.5 : 0}
      />
    </Sphere>
  );
}
