import { MocapData } from '@/utils/types';

// Process the motion data into a format suitable for LLM context
export function prepareDataContext(
  mocapData: MocapData, 
  currentFrame: number,
  selectedJoint: string | null,
  subFramePosition: number = 0
): string {
  // Ensure we have valid data
  if (!mocapData?.mocap_data || mocapData.mocap_data.length === 0) {
    return 'No motion data available for analysis.';
  }
  
  let context = `Motion data analysis context:\n`;
  
  // Add basic info about the data
  context += `- Total frames: ${mocapData.mocap_data.length}\n`;
  context += `- Current frame: ${currentFrame} (subframe position: ${subFramePosition.toFixed(2)})\n`;
  context += `- Capture type: Motion capture data\n`;
  
  // Extract frame data
  const currentFrameData = mocapData.mocap_data[currentFrame];
  
  // Add timestamp information
  if (currentFrameData && currentFrameData.timestamp) {
    context += `- Frame timestamp: ${currentFrameData.timestamp}\n`;
  }
  
  // If a specific joint is selected, focus analysis on that joint
  if (selectedJoint && currentFrameData && currentFrameData.joint_data) {
    const jointData = currentFrameData.joint_data[selectedJoint];
    
    if (jointData) {
      context += `\n## Selected Joint: ${selectedJoint}\n`;
      
      // Position information
      const position = jointData.position;
      if (position && position.length >= 3) {
        context += `- Position: x=${position[0].toFixed(2)}, y=${position[1].toFixed(2)}, z=${position[2].toFixed(2)}\n`;
      }
      
      // Rotation information
      if (jointData.rotations && jointData.rotations.length > 0) {
        context += `- Rotation type: ${jointData.type}\n`;
        if (jointData.type === 'euler_xyz' && jointData.rotations.length >= 3) {
          context += `- Rotation: x=${jointData.rotations[0].toFixed(2)}, y=${jointData.rotations[1].toFixed(2)}, z=${jointData.rotations[2].toFixed(2)}\n`;
        } else if (jointData.type === 'euler_x' && jointData.rotations.length >= 1) {
          context += `- Rotation: x=${jointData.rotations[0].toFixed(2)}\n`;
        } else if (jointData.type === 'euler_zyx' && jointData.rotations.length >= 3) {
          context += `- Rotation: z=${jointData.rotations[0].toFixed(2)}, y=${jointData.rotations[1].toFixed(2)}, x=${jointData.rotations[2].toFixed(2)}\n`;
        }
      }
      
      // Torque information if available
      if (jointData.torques && jointData.torques.length > 0) {
        let torqueStr = '- Torque: ';
        for (let i = 0; i < jointData.torques.length; i++) {
          torqueStr += `${i === 0 ? '' : ', '}axis${i+1}=${jointData.torques[i].toFixed(2)}`;
        }
        context += `${torqueStr}\n`;
      }
      
      // Reaction forces if available
      if (jointData.reaction_forces !== undefined) {
        context += `- Reaction force: ${jointData.reaction_forces.toFixed(2)}\n`;
      }
      
      // Velocity data if available
      if (jointData.velocity && jointData.velocity.length >= 3) {
        const velocity = jointData.velocity;
        context += `- Velocity: x=${velocity[0].toFixed(2)}, y=${velocity[1].toFixed(2)}, z=${velocity[2].toFixed(2)}\n`;
      }
      
      // Acceleration data if available
      if (jointData.acceleration && jointData.acceleration.length >= 3) {
        const acceleration = jointData.acceleration;
        context += `- Acceleration: x=${acceleration[0].toFixed(2)}, y=${acceleration[1].toFixed(2)}, z=${acceleration[2].toFixed(2)}\n`;
      }
      
      // Use parent/child joint information if available
      if (jointData.parent_joint) {
        context += `- Parent joint: ${jointData.parent_joint}\n`;
      }
      if (jointData.child_joints && jointData.child_joints.length > 0) {
        context += `- Child joints: ${jointData.child_joints.join(', ')}\n`;
      }
    }
  } else {
    // If no specific joint selected, include summary of multiple joints
    const currentFrameData = mocapData.mocap_data[currentFrame];
    if (currentFrameData && currentFrameData.joint_data) {
      const jointNames = Object.keys(currentFrameData.joint_data);
      const selectedJoints = jointNames.slice(0, 5); // Limit to 5 key joints to avoid overwhelming the LLM
      
      context += '\n## Summary of Key Joints\n';
      for (const jointName of selectedJoints) {
        const jointData = currentFrameData.joint_data[jointName];
        context += `### ${jointName} Joint\n`;
        
        // Position
        const position = jointData.position;
        context += `- Position: x=${position[0].toFixed(2)}, y=${position[1].toFixed(2)}, z=${position[2].toFixed(2)}\n`;
        
        // Check if velocity exists 
        if (jointData.velocity && jointData.velocity.length >= 3) {
          const velocity = jointData.velocity;
          context += `- Velocity: x=${velocity[0].toFixed(2)}, y=${velocity[1].toFixed(2)}, z=${velocity[2].toFixed(2)}\n`;
        }
      }
      
      if (jointNames.length > 5) {
        context += `\n*Note: Data for ${jointNames.length - 5} additional joints is available but not shown here for brevity.*\n`;
      }
      
      // Include motion analysis data if available
      if (currentFrameData.motion_analysis) {
        context += '\n## Motion Analysis\n';
        for (const [key, value] of Object.entries(currentFrameData.motion_analysis)) {
          // Format the key for better readability
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          context += `- ${formattedKey}: ${value}\n`;
        }
      }
    }
  }
  
  return context;
}

// Call the LLM API to get a response to the user's query
export async function callLLM(userMessage: string, dataContext: string): Promise<string> {
  try {
    // Prepare the request body with both the user query and the data context
    const body = JSON.stringify({
      userMessage,
      dataContext
    });
    
    // Call the API
    const response = await fetch('/api/analyze-motion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.message;
    
  } catch (error) {
    console.error('Error calling LLM:', error);
    return 'Sorry, I encountered an error analyzing your motion data. Please try again.';
  }
}
