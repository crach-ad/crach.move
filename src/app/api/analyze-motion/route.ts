import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define error interface for better type safety
interface OpenAIErrorResponse {
  status?: number;
  data?: unknown;
}

interface OpenAIError extends Error {
  response?: OpenAIErrorResponse;
}

// Create a factory function for OpenAI client to avoid initialization during build time
const createOpenAIClient = () => {
  // Check if API key exists before creating the client
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key is missing. API calls will use mock responses.');
    return null;
  }
  
  // Only create the client when API key is available
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY.trim(), // Ensure no whitespace
    dangerouslyAllowBrowser: false, // Make sure it only runs on server
  });
  
  // Log sanitized info about the API key for debugging
  console.log("API Key available:", true);
  console.log("API Key length:", process.env.OPENAI_API_KEY.length);
  console.log("API Key format check:", process.env.OPENAI_API_KEY.startsWith("sk-"));
  
  return openai;
};

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
    
    // Create OpenAI client only when needed
    const openai = createOpenAIClient();
    
    // Use mock response if API key is not available
    if (!openai) {
      console.warn('OpenAI API key is not configured. Using mock response for development.');
      return NextResponse.json({
        message: createMockResponse(question)
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
      console.log("Using model: gpt-4o");
      
      // Call OpenAI with proper configuration
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
      
      return NextResponse.json({
        message: completion.choices[0].message.content
      });
    } catch (error) {
      // Log detailed error information
      console.error("OpenAI API Error:", error);
      
      const apiError = error as OpenAIError;
      
      // Get more detailed error information if available
      if (apiError.response) {
        console.error("Status:", apiError.response.status);
        console.error("Data:", apiError.response.data);
      }
      
      // Return a helpful error to the client
      return NextResponse.json(
        { 
          error: 'Error from OpenAI API', 
          details: apiError.message || "Unknown error",
          status: apiError.response?.status || 500
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const requestError = error as Error;
    console.error('Error processing request:', requestError);
    return NextResponse.json(
      { error: 'Error processing your request', details: requestError.message },
      { status: 500 }
    );
  }
}

// Create a mock response for development or when OpenAI is not available
function createMockResponse(question: string): string {
  if (question.toLowerCase().includes('speed') || question.toLowerCase().includes('velocity')) {
    return "Your movement speed looks good! I noticed your velocity is consistent throughout the motion. Try focusing on maintaining this rhythm while adding a bit more power to your finish.";
  } else if (question.toLowerCase().includes('form') || question.toLowerCase().includes('posture')) {
    return "Your form looks solid overall. I noticed your back remains straight and your shoulders are well-aligned. Consider keeping your core a bit tighter through the full range of motion.";
  } else {
    return "Your motion looks fluent and coordinated. I can see good balance throughout the movement. Try focusing on your breathing pattern to get even more stability.";
  }
}
