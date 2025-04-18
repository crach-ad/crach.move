import { useState, useRef, useEffect } from 'react';

// Utility functions for LLM processing
import { callLLM, prepareDataContext } from '@/utils/llmUtils';
// Import types from shared definitions
import { Message, MotionAnalysisChatProps } from '@/utils/types';

// Custom hook for draggable functionality
function useDraggable() {
  const [position, setPosition] = useState({ x: 50, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent text selection during drag
    e.preventDefault();
    
    // Capture the mouse offset at the start of dragging
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    
    setIsDragging(true);
  };
  
  useEffect(() => {
    // Only attach listeners when we start dragging
    if (!isDragging) return;
    
    // Use RAF for smooth animation
    let animationFrameId: number;
    
    const onMouseMove = (e: MouseEvent) => {
      // Prevent default actions like text selection
      e.preventDefault();
      
      // Use requestAnimationFrame for smoother movement
      animationFrameId = requestAnimationFrame(() => {
        setPosition({
          x: e.clientX - dragOffsetRef.current.x,
          y: e.clientY - dragOffsetRef.current.y
        });
      });
    };
    
    const onMouseUp = () => {
      setIsDragging(false);
    };
    
    // Add listeners to document to catch events outside the component
    document.addEventListener('mousemove', onMouseMove, { passive: false });
    document.addEventListener('mouseup', onMouseUp);
    
    // Add a temporary class to the body to show a move cursor everywhere during drag
    document.body.classList.add('dragging-chat-window');
    
    return () => {
      // Clean up on unmount or when dragging stops
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.classList.remove('dragging-chat-window');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isDragging, setPosition]);
  
  return { position, isDragging, handleMouseDown };
}

export default function MotionAnalysisChat({ 
  mocapData, 
  currentFrame,
  subFramePosition = 0,
  selectedJoint 
}: MotionAnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use our draggable hook
  const { position, isDragging, handleMouseDown } = useDraggable();
  
  // Suggested questions based on the current context
  const suggestedQuestions = [
    "What's unusual about this movement pattern?",
    "How does this compare to an ideal form?",
    "Which joints show the most acceleration?",
    "Is there any imbalance in this movement?",
    "What metrics should I focus on to improve?"
  ];
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && !minimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, minimized]);
  
  // Function to handle sending a message
  const sendMessage = async (messageText: string = input) => {
    if (messageText.trim() === '') return;
    
    // Generate a unique ID for this message
    const messageId = Date.now().toString();
    
    // Add user message
    const userMessage: Message = { 
      id: messageId,
      role: 'user', 
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Scroll to the bottom
    scrollToBottom();
    
    try {
      // Create a type-safe wrapper for prepareDataContext to handle type compatibility
      const prepareContext = (data: any, frame: number, joint: string | null, subPos: number) => {
        // @ts-ignore: Bypassing type checking for cross-module compatibility
        return prepareDataContext(data, frame, joint, subPos);
      };
      
      // Prepare data context to send to LLM
      const dataContext = prepareContext(
        mocapData, 
        currentFrame,
        selectedJoint,
        subFramePosition
      );
      
      // Call LLM API
      const response = await callLLM(messageText, dataContext);
      
      // Add assistant message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant', 
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling LLM:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant', 
        content: 'Sorry, I encountered an error analyzing the motion data. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };
  
  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Add a global style for the dragging state
  useEffect(() => {
    // Create a style element for our dragging cursor
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .dragging-chat-window, .dragging-chat-window * {
        cursor: move !important;
        user-select: none !important;
      }
      .draggable-header {
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return (
    <div 
      className={`fixed flex flex-col z-50 rounded-lg shadow-xl transition-all duration-200 ease-in-out ${minimized ? 'w-64 h-12' : 'w-96 h-[450px]'} ${isDragging ? 'opacity-90' : 'opacity-100'}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        backgroundColor: 'rgba(17, 24, 39, 0.95)', /* gray-900 with opacity */
        backdropFilter: 'blur(8px)',
        boxShadow: isDragging 
          ? '0 15px 35px -5px rgba(0, 0, 0, 0.6), 0 15px 15px -5px rgba(0, 0, 0, 0.1)' 
          : '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: `1px solid ${isDragging ? 'rgba(59, 130, 246, 0.5)' : 'rgba(75, 85, 99, 0.4)'}`,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, opacity 0.2s, border-color 0.2s'
      }}
    >
      {/* Header - draggable area */}
      <div 
        className={`flex items-center justify-between px-4 py-2 ${minimized ? 'rounded-lg' : 'rounded-t-lg border-b border-gray-700'} cursor-move bg-gray-800 draggable-header`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"></path>
          </svg>
          <h2 className="text-md font-semibold truncate">Motion Analysis Assistant</h2>
        </div>
        <button 
          onClick={() => setMinimized(!minimized)}
          className="text-gray-400 hover:text-white focus:outline-none"
          aria-label={minimized ? 'Expand' : 'Minimize'}
        >
          {minimized ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Content - Only shown when not minimized */}
      {!minimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-sm">
                <p className="mb-2">Ask questions about the motion data to get insights and analysis. Here are some examples:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>What&apos;s the pattern of movement for the selected joint?</li>
                  <li>Are there any anomalies in this motion sequence?</li>
                  <li>How does the hip rotation compare to the shoulder movement?</li>
                  <li>What&apos;s the peak velocity of the right ankle?</li>
                </ul>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div 
                    key={message.id || `msg-${index}`} 
                    className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-600 ml-8 text-white' : 'bg-gray-700 mr-8 text-gray-100'}`}
                  >
                    <div className="text-sm">
                      {message.content}
                    </div>
                    <div className="text-xs mt-1 text-gray-300 text-right">
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
            {isLoading && (
              <div className="bg-gray-700 p-3 rounded-lg mr-8">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <span className="text-sm text-gray-300 ml-2">Analyzing...</span>
                </div>
              </div>
            )}
          </div>
          
          {messages.length === 0 && (
            <div className="px-4 pb-2">
              <h3 className="text-xs font-medium text-gray-300 mb-1">Try asking:</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(question)}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-2 border-t border-gray-700">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about the motion data..."
                className="flex-1 bg-gray-700 text-white p-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || input.trim() === ''}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex-shrink-0"
              >
                {isLoading ? 'Analyzing...' : 'Send'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
