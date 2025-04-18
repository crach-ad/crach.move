import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with proper configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(), // Ensure no whitespace
  dangerouslyAllowBrowser: false, // Make sure it only runs on server
});

// For debugging - log sanitized info about the API key
console.log("API Key available:", !!process.env.OPENAI_API_KEY);
console.log("API Key length:", process.env.OPENAI_API_KEY?.length);
console.log("API Key format check:", process.env.OPENAI_API_KEY?.startsWith("sk-"));

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();
    
    // Validate request
    if (!question || !context) {
      return NextResponse.json(
        { error: 'Question and context are required' },
        { status: 400 }
      );
    }
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key is not configured. Using mock response for development.');
      return NextResponse.json({
        response: createMockResponse(question, context)
      });
    }
    
    // System prompt for motion analysis
    const systemPrompt = `You are a biomechanical motion analysis expert that provides detailed, 
    scientific insights on movement patterns from motion capture data. 
    
    Your analysis should:
    - Be precise and technically accurate, using proper biomechanical terminology
    - Identify notable patterns, asymmetries, or anomalies in the movement
    - Explain the potential implications for performance and injury risk
    - Suggest potential improvements based on established principles of movement science
    - Reference the specific numerical data from the context when relevant
    
    Format your responses concisely, but include all relevant insights.`;
    
    try {
      console.log("Making API call to OpenAI...");
      
      // Call OpenAI with proper configuration for the Project API format key
      // Note: Keys starting with 'sk-proj-' are Project API keys which have different requirements
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",  // More widely available model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Motion data context:\n${context}\n\nUser question: ${question}` }
        ],
        temperature: 0.3, // Lower temperature for more technical precision
        max_tokens: 750,  // Reasonable length for detailed answers
      });
      
      // If we get here, the API call was successful
      console.log("API call successful, response received");
      
      console.log("API call successful");
      
      return NextResponse.json({
        response: completion.choices[0].message.content
      });
    } catch (error: any) {
      // Detailed error logging with specific error message extraction
      console.error('Error from OpenAI API:', error?.message || error);
      
      // Extract useful error details without exposing sensitive information
      const errorDetails = {
        message: error?.message,
        type: error?.type,
        status: error?.status,
        code: error?.code
      };
      console.error('Error details:', JSON.stringify(errorDetails, null, 2));
      
      // Provide a helpful error message based on error type
      let errorMessage = "There was an error processing your request. ";
      
      if (error?.message?.includes("authentication") || error?.message?.includes("API key")) {
        errorMessage += "There seems to be an issue with the API authentication. ";
      } else if (error?.message?.includes("billing") || error?.message?.includes("insufficient")) {
        errorMessage += "There might be an issue with the account billing. ";
      } else if (error?.message?.includes("rate limit")) {
        errorMessage += "We've hit a rate limit. Please try again in a moment. ";
      }
      
      // Use fallback response with specific error message
      return NextResponse.json({
        response: createMockResponse(question, context) + 
                "\n\n(Note: This is a fallback response. " + errorMessage + "Please try again later.)"
      });
    }
  } catch (error) {
    console.error('Error processing LLM request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Fallback for development without API key
function createMockResponse(question: string, context: string): string {
  // Extract some data from the context to make the response relevant
  const contextLines = context.split('\n');
  const currentFrame = contextLines.find(line => line.includes('Current frame:'))?.replace('- Current frame:', '').trim() || 'unknown';
  const totalFrames = contextLines.find(line => line.includes('Total frames:'))?.replace('- Total frames:', '').trim() || 'unknown';
  
  // Find the selected joint if any
  const selectedJointLine = contextLines.find(line => line.includes('Selected joint:'));
  const selectedJoint = selectedJointLine?.replace('Selected joint:', '').trim();
  
  // Check what the question is about to generate a relevant response
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('unusual') || questionLower.includes('anomal')) {
    return `Based on the motion data from frame ${currentFrame}/${totalFrames}, I can identify several unusual patterns. The movement shows some asymmetry between left and right sides, and there's a slight irregularity in the acceleration pattern. This could indicate compensatory movement or possible coordination issues.`;
  }
  
  if (questionLower.includes('compare') || questionLower.includes('ideal form')) {
    return `Compared to ideal form, this movement shows some deviations. Proper form typically maintains a more vertical spine alignment and symmetric weight distribution. In your motion data, I notice slightly more weight shifted to one side and some excess lateral movement that could be optimized for better performance and reduced injury risk.`;
  }
  
  if (questionLower.includes('acceleration') || questionLower.includes('velocity')) {
    return `The acceleration data shows interesting patterns. The highest accelerations occur in the ankle and wrist joints, which is typical for many athletic movements. The peak acceleration value is approximately 2.3 units per frame squared, which occurs around the middle of the movement sequence.`;
  }
  
  if (questionLower.includes('imbalance')) {
    return `There is a notable imbalance between left and right sides in this movement. The right side appears to bear approximately 15% more load than the left side, and the movement pattern shows some asymmetry in the trajectory. This could potentially lead to overcompensation issues over time.`;
  }
  
  if (selectedJoint && questionLower.includes(selectedJoint.toLowerCase())) {
    return `The ${selectedJoint} shows an interesting movement pattern. It begins with moderate velocity, peaks in the middle of the movement with the highest acceleration, and then decelerates smoothly. The trajectory forms a slight arc rather than a straight line, which is normal for this type of movement. The position data suggests good range of motion overall.`;
  }
  
  // Default response for other questions
  return `Based on the motion data analysis (frame ${currentFrame}/${totalFrames}), I observe a typical biomechanical sequence with proper joint coordination. The velocity and acceleration profiles are within normal ranges, and the joint positions indicate a balanced posture. For more specific analysis, you could ask about particular joints or phases of the movement.`;
}
