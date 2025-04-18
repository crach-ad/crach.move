import { MocapData, JointData } from "@/utils/types";

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate position arrays
 */
export function lerpPosition(pos1: number[], pos2: number[], t: number): number[] {
  return [
    lerp(pos1[0], pos2[0], t),
    lerp(pos1[1], pos2[1], t),
    lerp(pos1[2], pos2[2], t),
  ];
}

/**
 * Interpolate rotation arrays
 */
export function lerpRotation(rot1: number[], rot2: number[], t: number): number[] {
  return rot1.map((val, idx) => lerp(val, rot2[idx], t));
}

/**
 * Get interpolated frame data between two actual frames
 */
export function getInterpolatedFrame(
  data: MocapData,
  frameIndex: number,
  subFramePosition: number
): MocapData["mocap_data"][0] {
  const totalFrames = data.mocap_data.length;
  
  // Handle edge cases
  if (totalFrames === 0) {
    throw new Error("No frames in mocap data");
  }
  
  if (totalFrames === 1 || subFramePosition === 0) {
    return data.mocap_data[frameIndex % totalFrames];
  }
  
  // Get current and next frames for interpolation
  const currentFrame = data.mocap_data[frameIndex % totalFrames];
  const nextFrameIndex = (frameIndex + 1) % totalFrames;
  const nextFrame = data.mocap_data[nextFrameIndex];
  
  // Create new interpolated frame
  const interpolatedFrame = {
    timestamp: String(
      parseFloat(currentFrame.timestamp) +
      (parseFloat(nextFrame.timestamp) - parseFloat(currentFrame.timestamp)) * subFramePosition
    ),
    joint_data: {} as typeof currentFrame.joint_data,
  };
  
  // Interpolate each joint's data
  Object.keys(currentFrame.joint_data).forEach((jointName) => {
    const currentJoint = currentFrame.joint_data[jointName];
    const nextJoint = nextFrame.joint_data[jointName];
    
    // Start with the required properties
    const interpolatedJoint: JointData = {
      position: lerpPosition(currentJoint.position, nextJoint.position, subFramePosition),
      type: currentJoint.type,
    };
    
    // Add optional properties only if they exist in both frames
    if (currentJoint.rotations && nextJoint.rotations) {
      interpolatedJoint.rotations = lerpRotation(currentJoint.rotations, nextJoint.rotations, subFramePosition);
    }
    
    if (currentJoint.torques && nextJoint.torques) {
      interpolatedJoint.torques = lerpRotation(currentJoint.torques, nextJoint.torques, subFramePosition);
    }
    
    if (currentJoint.reaction_forces !== undefined && nextJoint.reaction_forces !== undefined) {
      interpolatedJoint.reaction_forces = lerp(currentJoint.reaction_forces, nextJoint.reaction_forces, subFramePosition);
    }
    
    interpolatedFrame.joint_data[jointName] = interpolatedJoint;
  });
  
  return interpolatedFrame;
}

/**
 * Calculate world positions for all joints based on hierarchy and local positions
 */
export function calculateWorldPositions(
  frameData: MocapData["mocap_data"][0],
  scale: number = 1
): Record<string, number[]> {
  const positions: Record<string, number[]> = {};
  
  // Extract positions from joint data
  Object.keys(frameData.joint_data).forEach((jointName) => {
    const joint = frameData.joint_data[jointName];
    positions[jointName] = joint.position.map(val => val * scale);
  });
  
  return positions;
}
