// Sample motion capture data for testing
export const sampleMocapData = {
  mocap_data: Array.from({ length: 120 }, (_, frameIndex) => {
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
          position: [-0.12, 0.05, Math.sin(t + 2) * 0.1],
          type: "euler_zyx",
          rotations: [Math.sin(t) * 0.2, 0, 0],
          torques: [0, 0, 0],
          reaction_forces: 0
        },
        Left_toe: {
          position: [-0.12, 0, Math.sin(t + 2) * 0.15 + 0.1],
          type: "euler_x",
          rotations: [Math.sin(t) * 0.1],
          torques: [0],
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
          position: [0.12, 0.05, Math.sin(t + Math.PI + 2) * 0.1],
          type: "euler_zyx",
          rotations: [Math.sin(t + Math.PI) * 0.2, 0, 0],
          torques: [0, 0, 0],
          reaction_forces: 0
        },
        Right_toe: {
          position: [0.12, 0, Math.sin(t + Math.PI + 2) * 0.15 + 0.1],
          type: "euler_x",
          rotations: [Math.sin(t + Math.PI) * 0.1],
          torques: [0],
          reaction_forces: 0
        },
        Spine1: {
          position: [0, 0.8, 0],
          type: "euler_xyz",
          rotations: [Math.sin(t * 0.5) * 0.05, 0, 0],
          torques: [0, 0, 0],
          reaction_forces: 0
        },
        Spine2: {
          position: [0, 1.0, 0],
          type: "euler_xyz",
          rotations: [Math.sin(t * 0.5) * 0.05, 0, 0],
          torques: [0, 0, 0],
          reaction_forces: 0
        },
        Neck: {
          position: [0, 1.2, 0],
          type: "euler_zyx",
          rotations: [Math.sin(t * 0.5) * 0.05, 0, 0],
          torques: [0, 0, 0],
          reaction_forces: 0
        },
        Left_shoulder_rotation: {
          position: [-0.2, 1.1, 0],
          type: "euler_xyz",
          rotations: [Math.sin(t) * 0.2, 0, Math.cos(t) * 0.1],
          torques: [0, 0, 0],
          reaction_forces: 0
        },
        Left_elbow: {
          position: [-0.4, 0.9, 0],
          type: "euler_z",
          rotations: [Math.sin(t + 1) * 0.3],
          torques: [0],
          reaction_forces: 0
        },
        Left_wrist: {
          position: [-0.5, 0.7, Math.sin(t) * 0.1],
          type: "euler_zyx",
          rotations: [0, 0, Math.sin(t) * 0.1],
          torques: [0, 0, 0],
          reaction_forces: 0
        },
        Right_shoulder_rotation: {
          position: [0.2, 1.1, 0],
          type: "euler_xyz",
          rotations: [Math.sin(t + Math.PI) * 0.2, 0, Math.cos(t + Math.PI) * 0.1],
          torques: [0, 0, 0],
          reaction_forces: 0
        },
        Right_elbow: {
          position: [0.4, 0.9, 0],
          type: "euler_z",
          rotations: [Math.sin(t + Math.PI + 1) * 0.3],
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
  })
};

// Define the type for the motion capture data
export interface MocapData {
  mocap_data: {
    timestamp: string;
    joint_data: {
      [key: string]: {
        position: number[];
        type: string;
        rotations: number[];
        torques: number[];
        reaction_forces: number;
      };
    };
  }[];
}

// Define joint connections for the skeleton
export const jointConnections = [
  ["Root", "Spine1"],
  ["Spine1", "Spine2"],
  ["Spine2", "Neck"],
  ["Spine2", "Left_shoulder_rotation"],
  ["Spine2", "Right_shoulder_rotation"],
  ["Left_shoulder_rotation", "Left_elbow"],
  ["Left_elbow", "Left_wrist"],
  ["Right_shoulder_rotation", "Right_elbow"],
  ["Right_elbow", "Right_wrist"],
  ["Root", "Left_hip"],
  ["Root", "Right_hip"],
  ["Left_hip", "Left_knee"],
  ["Left_knee", "Left_ankle"],
  ["Left_ankle", "Left_toe"],
  ["Right_hip", "Right_knee"],
  ["Right_knee", "Right_ankle"],
  ["Right_ankle", "Right_toe"]
];

// List of all joint names
export const jointNames = [
  "Root",
  "Left_hip",
  "Left_knee",
  "Left_ankle",
  "Left_toe",
  "Right_hip",
  "Right_knee",
  "Right_ankle",
  "Right_toe",
  "Spine1",
  "Spine2",
  "Left_shoulder_rotation",
  "Left_elbow",
  "Left_wrist",
  "Neck",
  "Right_shoulder_rotation",
  "Right_elbow",
  "Right_wrist"
];
