import { MocapData } from '@/data/sampleMocapData';

// Process the motion data into a format suitable for LLM context
export function prepareDataContext(
  mocapData: MocapData, 
  currentFrame: number,
  subFramePosition: number = 0,
  selectedJoint: string | null
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
  
  // If a specific joint is selected, add detailed analysis about it
  if (selectedJoint) {
    const currentFrameData = mocapData.mocap_data[currentFrame];
    if (currentFrameData && currentFrameData.joint_data && currentFrameData.joint_data[selectedJoint]) {
      const jointData = currentFrameData.joint_data[selectedJoint];
      const position = jointData.position;
      context += `\nSelected joint: ${selectedJoint}\n`;
      context += `- Position: x=${position[0].toFixed(2)}, y=${position[1].toFixed(2)}, z=${position[2].toFixed(2)}\n`;
      context += `- Rotation type: ${jointData.type}\n`;
      
      // Calculate velocity if we have previous frames
      if (currentFrame > 0) {
        const prevFrameData = mocapData.mocap_data[currentFrame-1];
        if (prevFrameData && prevFrameData.joint_data && prevFrameData.joint_data[selectedJoint]) {
          const prevJointData = prevFrameData.joint_data[selectedJoint];
          const prevPosition = prevJointData.position;
          const velocity = {
            x: position[0] - prevPosition[0],
            y: position[1] - prevPosition[1],
            z: position[2] - prevPosition[2]
          };
          const speed = Math.sqrt(
            Math.pow(velocity.x, 2) + 
            Math.pow(velocity.y, 2) + 
            Math.pow(velocity.z, 2)
          );
          
          context += `- Velocity: x=${velocity.x.toFixed(2)}, y=${velocity.y.toFixed(2)}, z=${velocity.z.toFixed(2)}\n`;
          context += `- Speed: ${speed.toFixed(2)} units per frame\n`;
          
          // Calculate acceleration if we have at least 2 previous frames
          if (currentFrame > 1) {
            const prevPrevFrameData = mocapData.mocap_data[currentFrame-2];
            if (prevPrevFrameData && prevPrevFrameData.joint_data && prevPrevFrameData.joint_data[selectedJoint]) {
              const prevPrevJointData = prevPrevFrameData.joint_data[selectedJoint];
              const prevPrevPosition = prevPrevJointData.position;
              const prevVelocity = {
                x: prevPosition[0] - prevPrevPosition[0],
                y: prevPosition[1] - prevPrevPosition[1],
                z: prevPosition[2] - prevPrevPosition[2]
              };
              
              const acceleration = {
                x: velocity.x - prevVelocity.x,
                y: velocity.y - prevVelocity.y,
                z: velocity.z - prevVelocity.z
              };
              
              context += `- Acceleration: x=${acceleration.x.toFixed(2)}, y=${acceleration.y.toFixed(2)}, z=${acceleration.z.toFixed(2)}\n`;
            }
          }
        }
      }
      
      // Add trajectory information if we have enough frames
      const trajectoryFrames = 5;
      
      // Add relationships to other joints if available
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
        
        // Only add velocity for key joints
        if (jointData.velocity) {
          const velocity = jointData.velocity;
          context += `- Velocity: x=${velocity[0].toFixed(2)}, y=${velocity[1].toFixed(2)}, z=${velocity[2].toFixed(2)}\n`;
        }
      }
      
      if (jointNames.length > 5) {
        context += `\n*Note: Data for ${jointNames.length - 5} additional joints is available but not shown here for brevity.*\n`;
      }
      
      // Add motion analysis if available
      if (currentFrameData.motion_analysis) {
        context += '\n## Motion Analysis\n';
        for (const [key, value] of Object.entries(currentFrameData.motion_analysis)) {
          context += `- ${key}: ${value}\n`;
        }
      }
    }
  }
  
  return context;
}

// Function to call the LLM API (non-streaming)
export async function callLLM(userQuestion: string, dataContext: string): Promise<string> {
  try {
    const response = await fetch('/api/analyze-motion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion,
        context: dataContext
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get response from LLM: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error calling LLM API:', error);
    throw error;
  }
}

// Function to call the streaming LLM API
export async function callLLMWithStreaming(
  userQuestion: string, 
  dataContext: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    const response = await fetch('/api/analyze-motion/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: userQuestion,
        context: dataContext
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get streaming response: ${response.status} ${response.statusText}`);
    }
    
    // Handle the streaming response
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');
    
    const decoder = new TextDecoder();
    let result = '';
    
    // Read the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      result += chunk;
      onChunk(chunk);
    }
    
    return result;
  } catch (error) {
    console.error('Error calling streaming LLM API:', error);
    throw error;
  }
}
