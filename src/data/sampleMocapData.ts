// Import types from utils
import { MocapData, FrameData } from '@/utils/types';

// Create the mocap frames data
const mocapFrames = Array.from({ length: 120 }, (_, frameIndex): FrameData => {
  const timestamp = `${frameIndex * 0.033}`;
  
  // Create simulated walking animation data
  const t = frameIndex * 0.05; // time parameter
  
  return {
    timestamp,
    joint_data: {
      Root: {
        position: [Math.sin(t) * 0.2, 0.9 + Math.sin(t * 2) * 0.05, frameIndex * 0.01],
        type: "euler_xyz",
        rotations: [0, Math.sin(t) * 0.1, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Left_hip: {
        position: [-0.1, 0.7, 0],
        type: "euler_xyz",
        rotations: [Math.sin(t) * 0.4, 0, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Left_knee: {
        position: [-0.12, 0.4, 0],
        type: "euler_x",
        rotations: [Math.sin(t + 2) * 0.7],
        torques: [0],
        reaction_forces: 0
      },
      Left_ankle: {
        position: [-0.12, 0.05, Math.sin(t) * 0.1],
        type: "euler_xyz",
        rotations: [Math.sin(t) * 0.2, 0, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Right_hip: {
        position: [0.1, 0.7, 0],
        type: "euler_xyz",
        rotations: [Math.sin(t + Math.PI) * 0.4, 0, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Right_knee: {
        position: [0.12, 0.4, 0],
        type: "euler_x",
        rotations: [Math.sin(t + Math.PI + 2) * 0.7],
        torques: [0],
        reaction_forces: 0
      },
      Right_ankle: {
        position: [0.12, 0.05, Math.sin(t + Math.PI) * 0.1],
        type: "euler_xyz",
        rotations: [Math.sin(t + Math.PI) * 0.2, 0, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Spine1: {
        position: [0, 1.1, 0],
        type: "euler_xyz",
        rotations: [Math.sin(t * 2) * 0.05, 0, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Spine2: {
        position: [0, 1.3, 0],
        type: "euler_xyz",
        rotations: [Math.sin(t * 2) * 0.03, 0, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Neck: {
        position: [0, 1.5, 0],
        type: "euler_xyz",
        rotations: [Math.sin(t * 1.5) * 0.05, 0, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Head: {
        position: [0, 1.65, 0],
        type: "euler_xyz",
        rotations: [Math.sin(t * 1.2) * 0.05, Math.sin(t) * 0.05, 0],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Left_shoulder: {
        position: [-0.2, 1.4, 0],
        type: "euler_xyz",
        rotations: [0, 0, Math.sin(t + 1) * 0.1],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Left_elbow: {
        position: [-0.4, 1.2, 0],
        type: "euler_x",
        rotations: [Math.sin(t + 0.5) * 0.5],
        torques: [0],
        reaction_forces: 0
      },
      Left_wrist: {
        position: [-0.5, 0.9, Math.sin(t) * 0.1],
        type: "euler_zyx",
        rotations: [0, 0, Math.sin(t) * 0.1],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Right_shoulder: {
        position: [0.2, 1.4, 0],
        type: "euler_xyz",
        rotations: [0, 0, Math.sin(t + Math.PI + 1) * 0.1],
        torques: [0, 0, 0],
        reaction_forces: 0
      },
      Right_elbow: {
        position: [0.4, 1.2, 0],
        type: "euler_x",
        rotations: [Math.sin(t + Math.PI + 0.5) * 0.5],
        torques: [0],
        reaction_forces: 0
      },
      Right_wrist: {
        position: [0.5, 0.7, Math.sin(t + Math.PI) * 0.1],
        type: "euler_zyx",
        rotations: [0, 0, Math.sin(t + Math.PI) * 0.1],
        torques: [0, 0, 0],
        reaction_forces: 0
      }
    }
  };
});

// Create complete sample mocap data with all required fields
export const sampleMocapData: MocapData = {
  id: "sample-001",
  name: "Sample Walking Motion",
  description: "Computer-generated walking motion for demonstration",
  capture_date: "2025-04-18",
  mocap_data: mocapFrames,
  frame_data: [...mocapFrames]
};

// Define joint connections for the skeleton
export const jointConnections = [
  ["Root", "Spine1"],
  ["Spine1", "Spine2"],
  ["Spine2", "Neck"],
  ["Neck", "Head"],
  ["Spine2", "Left_shoulder"],
  ["Left_shoulder", "Left_elbow"],
  ["Left_elbow", "Left_wrist"],
  ["Spine2", "Right_shoulder"],
  ["Right_shoulder", "Right_elbow"],
  ["Right_elbow", "Right_wrist"],
  ["Root", "Left_hip"],
  ["Left_hip", "Left_knee"],
  ["Left_knee", "Left_ankle"],
  ["Root", "Right_hip"],
  ["Right_hip", "Right_knee"],
  ["Right_knee", "Right_ankle"]
];

// List of all joint names for the UI
export const jointNames = Object.keys(mocapFrames[0].joint_data);
