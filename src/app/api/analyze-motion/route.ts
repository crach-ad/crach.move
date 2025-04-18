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
    
    // System prompt for concise, conversational motion analysis assistant
    const systemPrompt = `You are Movo, a friendly motion coach who gives brief, helpful feedback.
    
    EXTREMELY IMPORTANT: Keep all responses under 3 sentences when possible. Never exceed 5 sentences.
    
    Your style is:
    - Casual and friendly - like a text from a coach friend
    - Ultra-concise - get to the point immediately
    - Use simple language instead of technical terms
    - One quick insight + one short suggestion when relevant
    
    Always be:
    - Encouraging but honest
    - Conversational but brief
    - Helpful without overwhelming
    
    End with a simple question only when it adds value. Avoid asking questions in every response.`;
    
    try {
      console.log("Making API call to OpenAI...");
      
      // Call OpenAI with proper configuration for the Project API format key
      // Note: Keys starting with 'sk-proj-' are Project API keys which have different requirements
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",  // Latest and most capable model
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
    } catch (error: unknown) {
      // Define error type for better handling
      type OpenAIError = {
        message?: string;
        type?: string;
        status?: number;
        code?: string;
      };

      // Detailed error logging with specific error message extraction
      console.error('Error from OpenAI API:', error instanceof Error ? error.message : String(error));
      
      // Cast to appropriate error type for handling
      const openAIError = error as OpenAIError;
      
      // Extract useful error details without exposing sensitive information
      const errorDetails = {
        message: openAIError.message || 'Unknown error',
        type: openAIError.type || 'Unknown type',
      };
      console.error('Error details:', JSON.stringify(errorDetails, null, 2));
      
      // Try to check what kind of error occurred for better error messages
      let errorMessage = "An error occurred while analyzing motion data";
      
      const errorMsg = errorDetails.message;
      if (typeof errorMsg === 'string') {
        if (errorMsg.includes("authentication") || errorMsg.includes("API key")) {
          errorMessage += "There seems to be an issue with the API authentication. ";
        } else if (errorMsg.includes("billing") || errorMsg.includes("insufficient")) {
          errorMessage += "There might be an issue with the account billing. ";
        } else if (errorMsg.includes("rate limit")) {
          errorMessage += "We've hit a rate limit. Please try again in a moment. ";
        }
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

// Fallback for development without API key - with conversational style
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
    return `I see some asymmetry between your left and right sides in frame ${currentFrame}. Your acceleration pattern has small irregularities - might be compensation. Are you feeling any discomfort?`;
  }
  
  if (questionLower.includes('compare') || questionLower.includes('ideal form')) {
    return `Your form is good overall! You're shifting weight slightly to one side with some extra lateral movement. Try keeping your weight more centered next time.`;
  }
  
  if (questionLower.includes('acceleration') || questionLower.includes('velocity')) {
    return `Your ankles and wrists move fastest - exactly what we want! Peak acceleration hits mid-movement at about 2.3 units. Power looks well-distributed.`;
  }
  
  if (questionLower.includes('imbalance')) {
    return `Your right side works about 15% harder than your left. Movement paths differ slightly side to side. Try some balance exercises to even things out.`;
  }
  
  if (selectedJoint && questionLower.includes(selectedJoint.toLowerCase())) {
    return `Your ${selectedJoint} shows a nice flow - moderate start, powerful middle, smooth finish. The slight arc is perfect, and your range of motion looks good!`;
  }
  
  // Default response for other questions
  return `Looking at frame ${currentFrame}/${totalFrames}, your movement looks solid! Good coordination and balanced posture overall. Anything specific you'd like me to check?`;
}
