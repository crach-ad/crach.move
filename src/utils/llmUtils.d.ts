import type { MocapData } from './types';

// Function declarations
export function prepareDataContext(
  mocapData: MocapData, 
  currentFrame: number,
  selectedJoint: string | null,
  subFramePosition?: number
): string;

export function callLLM(
  userMessage: string, 
  dataContext: string
): Promise<string>;
