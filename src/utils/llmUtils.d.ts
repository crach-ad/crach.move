export interface MocapJointData {
  position: number[];
  type: string;
  rotations: number[];
  torques: number[];
  reaction_forces: number;
}

export interface MocapFrameData {
  timestamp: string;
  joint_data: {
    [key: string]: MocapJointData;
  };
}

export interface MocapData {
  mocap_data: MocapFrameData[];
}

export function prepareDataContext(
  mocapData: MocapData, 
  currentFrame: number,
  subFramePosition?: number,
  selectedJoint?: string | null
): string;

export function callLLM(userQuestion: string, dataContext: string): Promise<string>;
