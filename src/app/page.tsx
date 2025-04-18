"use client";

import { useState, useEffect, useRef } from "react";
import { sampleMocapData, jointNames, MocapData } from "@/data/sampleMocapData";
import MotionScene from "@/components/MotionScene";
import PlaybackControls from "@/components/PlaybackControls";
import JointDetails from "@/components/JointDetails";
import FileUploader from "@/components/FileUploader";
import MotionAnalysisChat from "@/components/MotionAnalysisChat";
import { getInterpolatedFrame } from "@/utils/mocapUtils";

export default function Home() {
  // Data state
  const [mocapData, setMocapData] = useState<MocapData>(sampleMocapData);
  const [isUsingSampleData, setIsUsingSampleData] = useState(true);
  const [dataJustLoaded, setDataJustLoaded] = useState(false);
  
  // Animation state
  const [frameIndex, setFrameIndex] = useState(0);
  const [subFramePosition, setSubFramePosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedJoint, setSelectedJoint] = useState<string | null>(null);
  
  // UI state
  const [showAnalysisChat, setShowAnalysisChat] = useState(false);
  
  // Animation frame handling
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const frameProgressRef = useRef<number>(0);
  
  // Get current frame data
  const currentFrameData = getInterpolatedFrame(
    mocapData,
    frameIndex,
    subFramePosition
  );
  
  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }
    
    const totalFrames = mocapData.mocap_data.length;
    
    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const deltaTime = timestamp - lastTimeRef.current;
      const frameTime = (1000 / 30) / playbackSpeed; // 30fps normalized by playback speed
      
      // Accumulate progress through the frame
      frameProgressRef.current += deltaTime / frameTime;
      
      // If we've progressed past the current frame
      if (frameProgressRef.current >= 1) {
        // Calculate how many frames to advance
        const framesToAdvance = Math.floor(frameProgressRef.current);
        const newFrameIndex = (frameIndex + framesToAdvance) % totalFrames;
        
        // Update frame indices
        setFrameIndex(newFrameIndex);
        
        // Calculate subframe for smooth interpolation
        const remainingProgress = frameProgressRef.current - framesToAdvance;
        setSubFramePosition(remainingProgress);
        
        // Reset progress counter, accounting for remainder
        frameProgressRef.current = remainingProgress;
      } else {
        // Update subframe for smooth interpolation
        setSubFramePosition(frameProgressRef.current);
      }
      
      lastTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, frameIndex, playbackSpeed]);
  
  // Handle joint selection
  const handleSelectJoint = (jointName: string | null) => {
    setSelectedJoint(jointName);
  };
  
  // Handle uploaded mocap data
  const handleDataLoaded = (data: MocapData) => {
    // Reset animation state
    setFrameIndex(0);
    setSubFramePosition(0);
    setIsPlaying(false);
    
    // Update data
    setMocapData(data);
    setIsUsingSampleData(false);
    
    // Clear selected joint as the new data might not have the same joints
    setSelectedJoint(null);
    
    // Set flag that data was just loaded to reset position
    setDataJustLoaded(true);
    
    // Clear the flag after a short delay
    setTimeout(() => {
      setDataJustLoaded(false);
    }, 500);
  };
  
  // Reset to sample data
  const handleResetToSample = () => {
    setMocapData(sampleMocapData);
    setIsUsingSampleData(true);
    setFrameIndex(0);
    setSubFramePosition(0);
    setSelectedJoint(null);
    
    // Set flag that data was just loaded to reset position
    setDataJustLoaded(true);
    
    // Clear the flag after a short delay
    setTimeout(() => {
      setDataJustLoaded(false);
    }, 500);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header with animated logo */}
      <header className="bg-gray-800 py-4 px-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo with weight plates design - matching the image */}
            <div className="flex items-center">
              {/* Left weight plates - 3 plates, smallest to largest */}
              <div className="relative flex items-center h-14 mr-1">
                <div className="absolute w-0.5 h-14 bg-gray-600 left-1/2 transform -translate-x-1/2"></div>
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-gray-500 rounded-sm mx-0.5"></div>
                  <div className="w-2.5 h-11 bg-gray-900 rounded-sm mx-0.5 border border-gray-800"></div>
                  <div className="w-2.5 h-14 bg-gray-900 rounded-sm border border-gray-800"></div>
                </div>
              </div>
              
              {/* Logo text */}
              <h1 className="text-4xl font-bold text-white mx-3 tracking-tight">
                crach.Move
              </h1>
              
              {/* Right weight plates - 3 plates, smallest to largest */}
              <div className="relative flex items-center h-14 ml-1">
                <div className="absolute w-0.5 h-14 bg-gray-600 left-1/2 transform -translate-x-1/2"></div>
                <div className="flex items-center flex-row-reverse">
                  <div className="w-2 h-8 bg-gray-500 rounded-sm mx-0.5"></div>
                  <div className="w-2.5 h-11 bg-gray-900 rounded-sm mx-0.5 border border-gray-800"></div>
                  <div className="w-2.5 h-14 bg-gray-900 rounded-sm border border-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!isUsingSampleData && (
              <button
                onClick={handleResetToSample}
                className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200 transition-colors"
              >
                Reset to Sample Data
              </button>
            )}
            <button
              onClick={() => setShowAnalysisChat(!showAnalysisChat)}
              className={`text-sm px-3 py-1 rounded-md transition-colors ${showAnalysisChat ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
            >
              {showAnalysisChat ? 'Hide Analysis Assistant' : 'Show Analysis Assistant'}
            </button>
            <div className="text-sm text-gray-400">
              {isUsingSampleData ? "Sample Data" : "Uploaded Data"}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      {/* Floating chat assistant rendered independently of main layout */}
      {showAnalysisChat && (
        <MotionAnalysisChat
          mocapData={mocapData}
          currentFrame={frameIndex}
          subFramePosition={subFramePosition}
          selectedJoint={selectedJoint}
        />
      )}
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left panel - Compact UI with dropdown and mini controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Joint Selection Dropdown */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Joint Selection</h2>
                <div className="text-sm text-gray-400">
                  {selectedJoint ? selectedJoint.replace(/_/g, " ") : "None selected"}
                </div>
              </div>
              
              <div className="relative">
                <select
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-md py-2 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedJoint || ""}
                  onChange={(e) => handleSelectJoint(e.target.value || null)}
                >
                  <option value="">Select a joint...</option>
                  {jointNames.map((jointName) => (
                    <option key={jointName} value={jointName}>
                      {jointName.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              
              {selectedJoint && (
                <button
                  onClick={() => handleSelectJoint(null)}
                  className="mt-2 text-sm text-gray-400 hover:text-white"
                >
                  Clear selection
                </button>
              )}
            </div>
            

            
            {/* Full Playback Controls */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-4">
              <PlaybackControls
                mocapData={mocapData}
                frameIndex={frameIndex}
                setFrameIndex={setFrameIndex}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                setSubFramePosition={setSubFramePosition}
              />
            </div>
            
            {/* File uploader component */}
            <FileUploader onDataLoaded={handleDataLoaded} />
            
            {/* Joint details component */}
            <JointDetails
              frameData={currentFrameData}
              selectedJoint={selectedJoint}
              onSelectJoint={handleSelectJoint}
            />
          </div>
          
          {/* Main 3D visualization panel */}
          <div className="lg:col-span-3 h-[calc(100vh-10rem)]">
            <MotionScene
              mocapData={mocapData}
              frameIndex={frameIndex}
              subFramePosition={subFramePosition}
              highlightedJoint={selectedJoint}
              onNewDataLoaded={dataJustLoaded}
            />
          </div>
          
          {/* Right panel - removed and contents moved to left panel */}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 py-3 px-6 text-gray-400 text-sm">
        <div className="container mx-auto">
          <p>crach.move &copy; {new Date().getFullYear()} - Biometric Motion Analysis System</p>
        </div>
      </footer>
    </div>
  );
}
