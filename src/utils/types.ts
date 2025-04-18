// Motion data type definitions

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface JointData {
  position: number[];
  type: string;
  rotations?: number[];
  torques?: number[];
  reaction_forces?: number;
  velocity?: number[];
  acceleration?: number[];
  parent_joint?: string;
  child_joints?: string[];
}

export interface FrameData {
  timestamp: string;
  joint_data: {
    [key: string]: JointData;
  };
  motion_analysis?: {
    [key: string]: string | number | boolean | null;
  };
}

export interface MocapData {
  id: string;
  name: string;
  description?: string;
  capture_date?: string;
  mocap_data: FrameData[];
  frame_data: FrameData[];
  metadata?: {
    [key: string]: string | number | boolean | null | object;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id?: string; // Optional for backward compatibility
}

export interface MotionAnalysisChatProps {
  mocapData: MocapData;
  currentFrame: number;
  subFramePosition?: number;
  selectedJoint: string | null;
}
