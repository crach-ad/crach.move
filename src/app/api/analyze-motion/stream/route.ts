import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key is not configured. Using mock response for development.');
      
      // Create a mock streaming response for development
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const mockResponse = createMockResponse(question, context);
          
          // Split the mock response into chunks to simulate streaming
          const chunks = mockResponse.split('. ');
          
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk + '. '));
            // Add a small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked'
        }
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
    
    // Create OpenAI streaming completion
    const stream = await openai.chat.completions.create({
      model: "gpt-4", // Use gpt-4-turbo if available in your account
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Motion data context:\n${context}\n\nUser question: ${question}` }
      ],
      temperature: 0.3,
      max_tokens: 750,
      stream: true, // Enable streaming
    });
    
    // Convert OpenAI stream to web stream
    const textEncoder = new TextEncoder();
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          controller.enqueue(textEncoder.encode(text));
        }
      }
    });
    
    // Pipe the OpenAI stream through our transform stream
    const responseStream = stream.toReadableStream().pipeThrough(transformStream);
    
    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Error processing streaming LLM request:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
