"use client";

import { useMemo } from "react";
import { MocapData, jointConnections } from "@/data/sampleMocapData";
import Joint from "./Joint";
import Bone from "./Bone";

interface SkeletonProps {
  frameData: MocapData["mocap_data"][0];
  scale?: number;
  highlightedJoint?: string | null;
}

export default function Skeleton({ 
  frameData, 
  scale = 1, 
  highlightedJoint 
}: SkeletonProps) {
  // Extract joint positions
  const jointPositions = useMemo(() => {
    const positions: Record<string, number[]> = {};
    
    Object.entries(frameData.joint_data).forEach(([jointName, jointData]) => {
      positions[jointName] = jointData.position.map(val => val * scale);
    });
    
    return positions;
  }, [frameData, scale]);

  return (
    <group>
      {/* Render all joints */}
      {Object.entries(jointPositions).map(([jointName, position]) => (
        <Joint 
          key={jointName}
          position={position as [number, number, number]}
          highlight={highlightedJoint === jointName}
          color={highlightedJoint === jointName ? "#f56565" : "#4299e1"}
        />
      ))}
      
      {/* Render all bones (connections between joints) */}
      {jointConnections.map(([startJoint, endJoint]) => {
        // Skip if either joint doesn't exist in the data
        if (!jointPositions[startJoint] || !jointPositions[endJoint]) {
          return null;
        }
        
        return (
          <Bone 
            key={`${startJoint}-${endJoint}`}
            startPosition={jointPositions[startJoint]}
            endPosition={jointPositions[endJoint]}
          />
        );
      })}
    </group>
  );
}
