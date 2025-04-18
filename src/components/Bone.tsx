"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BoneProps {
  startPosition: number[];
  endPosition: number[];
  color?: string;
  thickness?: number;
}

export default function Bone({ 
  startPosition, 
  endPosition, 
  color = "#a0aec0", 
  thickness = 0.01 
}: BoneProps) {
  const ref = useRef<THREE.Mesh>(null);
  
  // Calculate the midpoint, length, and orientation of the bone
  const { position, rotation } = useMemo(() => {
    // Create vectors from the positions
    const start = new THREE.Vector3(startPosition[0], startPosition[1], startPosition[2]);
    const end = new THREE.Vector3(endPosition[0], endPosition[1], endPosition[2]);
    
    // Calculate midpoint for cylinder position
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    
    // Calculate the height (length) of the cylinder
    const height = start.distanceTo(end);
    
    // Calculate the rotation to align the cylinder with the bone direction
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    
    // Handle the special case where the bone is parallel to the up vector
    if (Math.abs(direction.y) > 0.99999) {
      quaternion.setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        direction.y > 0 ? 0 : Math.PI
      );
    } else {
      quaternion.setFromUnitVectors(up, direction);
    }
    
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    // Return as properly typed arrays for Three.js
    return {
      position: midpoint.toArray() as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      height
    };
  }, [startPosition, endPosition]);
  
  // Update the bone's position and rotation on each frame
  useFrame(() => {
    if (ref.current) {
      // Recalculate the bone properties
      const start = new THREE.Vector3(startPosition[0], startPosition[1], startPosition[2]);
      const end = new THREE.Vector3(endPosition[0], endPosition[1], endPosition[2]);
      
      // Update position (midpoint)
      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      ref.current.position.set(midpoint.x, midpoint.y, midpoint.z);
      
      // Update height (scale)
      const height = start.distanceTo(end);
      ref.current.scale.set(1, height, 1);
      
      // Update rotation
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const quaternion = new THREE.Quaternion();
      
      if (Math.abs(direction.y) > 0.99999) {
        quaternion.setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          direction.y > 0 ? 0 : Math.PI
        );
      } else {
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      }
      
      ref.current.quaternion.copy(quaternion);
    }
  });

  return (
    <mesh 
      ref={ref} 
      position={position} 
      rotation={rotation}
    >
      <cylinderGeometry args={[thickness, thickness, 1, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
