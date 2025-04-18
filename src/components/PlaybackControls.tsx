"use client";

import { useState, useEffect } from "react";
import { MocapData } from "@/data/sampleMocapData";

interface PlaybackControlsProps {
  mocapData: MocapData;
  frameIndex: number;
  setFrameIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  setSubFramePosition: (position: number) => void;
}

export default function PlaybackControls({
  mocapData,
  frameIndex,
  setFrameIndex,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  setSubFramePosition
}: PlaybackControlsProps) {
  const totalFrames = mocapData.mocap_data.length;
  const [progress, setProgress] = useState(frameIndex / Math.max(totalFrames - 1, 1));

  // Update progress when frame index changes
  useEffect(() => {
    setProgress(frameIndex / Math.max(totalFrames - 1, 1));
  }, [frameIndex, totalFrames]);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    
    // Calculate the new frame index and sub-frame position
    const exactFrame = newProgress * (totalFrames - 1);
    const newFrameIndex = Math.floor(exactFrame);
    const newSubFramePosition = exactFrame - newFrameIndex;
    
    setFrameIndex(newFrameIndex);
    setSubFramePosition(newSubFramePosition);
  };

  // Handle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle speed change
  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
  };

  // Skip to frame
  const skipToStart = () => {
    setFrameIndex(0);
    setSubFramePosition(0);
  };

  const skipToEnd = () => {
    setFrameIndex(totalFrames - 1);
    setSubFramePosition(0);
  };

  const frameBack = () => {
    setFrameIndex(Math.max(0, frameIndex - 1));
    setSubFramePosition(0);
  };

  const frameForward = () => {
    setFrameIndex(Math.min(totalFrames - 1, frameIndex + 1));
    setSubFramePosition(0);
  };

  return (
    <div className="w-full bg-gray-800 p-4 rounded-lg shadow-lg">
      {/* Top section with frame info and play/pause button */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-white font-medium">
          Frame: {frameIndex + 1}/{totalFrames}
        </div>
        
        {/* Primary Play/Pause Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayback}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${isPlaying 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-green-500 hover:bg-green-600"} text-white transition-all`}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Playback speed controls */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2 w-full justify-between">
          {[0.25, 0.5, 1, 1.5, 2].map((speed) => (
            <button
              key={speed}
              className={`px-3 py-2 text-sm rounded w-full ${
                playbackSpeed === speed
                  ? "bg-blue-500 text-white font-medium"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
      
      {/* Timeline slider */}
      <div className="flex items-center mb-4">
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          onChange={handleSliderChange}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
      
      {/* Navigation controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={skipToStart}
          className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
          aria-label="Skip to start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 5a1 1 0 011-1h1a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" />
            <path d="M10.293 15.707a1 1 0 001.414 0l6-6a1 1 0 000-1.414l-6-6a1 1 0 00-1.414 1.414L15.586 9H10a1 1 0 000 2h5.586l-5.293 5.293a1 1 0 000 1.414z" />
          </svg>
        </button>
        
        <button
          onClick={frameBack}
          className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
          aria-label="Previous frame"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={togglePlayback}
          className="p-3 rounded-md bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <button
          onClick={frameForward}
          className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
          aria-label="Next frame"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={skipToEnd}
          className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center"
          aria-label="Skip to end"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 15.707a1 1 0 001.414 0L10 11.414l4.293 4.293a1 1 0 001.414-1.414l-5-5a1 1 0 00-1.414 0l-5 5a1 1 0 000 1.414z" />
            <path d="M5 5a1 1 0 011-1h1a1 1 0 011 1v10a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
