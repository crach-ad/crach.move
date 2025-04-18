import { NextRequest } from 'next/server';
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
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY.trim(),
    dangerouslyAllowBrowser: false,
  });
};

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();
    
    // Validate request
    if (!question || !context) {
      return new Response(
        JSON.stringify({ error: 'Question and context are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create OpenAI client only when needed
    const openaiClient = createOpenAIClient();
    
    // If API key is missing, use mock response
    if (!openaiClient) {
      console.warn('OpenAI API key is not configured. Using mock response for development.');
      
      // Create a mock streaming response for development
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const mockResponse = createMockResponse(question);
          
          // Split the mock response into chunks to simulate streaming
          const chunks = mockResponse.split(' ');
          
          // Send each chunk with a delay
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk + ' '));
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          controller.close();
        }
      });
      
      return new Response(stream);
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
      console.log("Making streaming API call to OpenAI...");
      console.log("Using model: gpt-4o");
      
      // Create OpenAI streaming completion
      const stream = await openaiClient.chat.completions.create({
        model: "gpt-4o", // Latest and most capable model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Motion data context:\n${context}\n\nUser question: ${question}` }
        ],
        temperature: 0.3,
        max_tokens: 750,
        stream: true,
      });
      
      // Process the stream and return it to the client
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        },
        cancel() {
          // Handle client disconnection by aborting the stream
          stream.controller.abort();
        }
      });
      
      return new Response(readableStream);
    } catch (error) {
      console.error("OpenAI API Streaming Error:", error);
      
      const apiError = error as OpenAIError;
      
      // Get more detailed error information if available
      if (apiError.response) {
        console.error("Status:", apiError.response.status);
        console.error("Data:", apiError.response.data);
      }
      
      // Return a more helpful error
      return new Response(
        JSON.stringify({ 
          error: 'Error from OpenAI API',
          details: apiError.message || "Unknown error",
          status: apiError.response?.status || 500
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    const requestError = error as Error;
    console.error('Error processing streaming request:', requestError);
    return new Response(
      JSON.stringify({ error: 'Error processing your request', details: requestError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
