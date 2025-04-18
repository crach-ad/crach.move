"use client";

import { useState, useRef, useCallback } from "react";
import { MocapData } from "@/data/sampleMocapData";

// Icons
const UploadIcon = () => (
  <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
  </svg>
);

const FileIcon = () => (
  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
  </svg>
);

interface FileUploaderProps {
  onDataLoaded: (data: MocapData) => void;
}

export default function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Process file function (used by both drag-and-drop and file input)
  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    
    setFileName(file.name);
    setIsLoading(true);
    setError(null);

    try {
      // Read the file as text
      const text = await file.text();
      
      // Parse the JSON data
      const jsonData = JSON.parse(text);
      
      // Validate the data structure
      if (!validateMocapData(jsonData)) {
        throw new Error("Invalid motion capture data format");
      }
      
      // Call the callback with the parsed data
      onDataLoaded(jsonData as MocapData);
      
      // Minimize card after successful upload
      setIsMinimized(true);
      
    } catch (err) {
      console.error("Error processing file:", err);
      setError(err instanceof Error ? err.message : "Unknown error processing the file");
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Validate the uploaded data has the expected structure
  const validateMocapData = (data: unknown): boolean => {
    // Type guard to ensure data is an object
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Type assertion after validation
    const mocapData = data as { mocap_data?: unknown };
    
    // Basic structure validation
    if (!mocapData.mocap_data || !Array.isArray(mocapData.mocap_data)) {
      return false;
    }
    
    // Validate at least one frame exists
    if (mocapData.mocap_data.length === 0) {
      return false;
    }
    
    // Check if first frame has the expected structure
    const firstFrame = mocapData.mocap_data[0];
    if (typeof firstFrame !== 'object' || firstFrame === null) {
      return false;
    }
    
    // Type assertion after validation
    const frameData = firstFrame as { timestamp?: unknown, joint_data?: unknown };
    if (!frameData.timestamp || !frameData.joint_data || typeof frameData.joint_data !== 'object') {
      return false;
    }
    
    // Check if at least one joint exists
    const jointNames = Object.keys(firstFrame.joint_data);
    if (jointNames.length === 0) {
      return false;
    }
    
    // Check if first joint has expected properties
    const firstJoint = firstFrame.joint_data[jointNames[0]];
    return (
      Array.isArray(firstJoint.position) &&
      firstJoint.type &&
      Array.isArray(firstJoint.rotations)
    );
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Check if it's a JSON file
      if (file.type === "application/json" || file.name.endsWith('.json')) {
        processFile(file);
      } else {
        setError("Please upload a JSON file");
      }
    }
  };

  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  // Reset the uploader
  const handleNewUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    setError(null);
    setIsMinimized(false);
  };

  // Render minimized card if we have a filename and minimized state is true
  if (fileName && isMinimized) {
    return (
      <div 
        className="bg-gray-800 rounded-lg p-3 shadow-lg cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={toggleMinimized}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FileIcon />
            <span className="text-sm text-white truncate max-w-[140px]">{fileName}</span>
          </div>
          <button
            onClick={handleNewUpload}
            className="p-1 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
            aria-label="Upload new file"
            title="Upload new file"
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, render the full uploader
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white">Upload Motion Data</h3>
        <p className="text-sm text-gray-400 mt-1">
          Drag & drop or click to upload JSON file with biometric motion data
        </p>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      
      <div className="flex flex-col space-y-3">
        <div 
          className={`border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'} 
                       rounded-lg p-6 transition-colors cursor-pointer hover:border-blue-500/70 hover:bg-blue-500/5`}
          onClick={handleButtonClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-blue-400">Processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <UploadIcon />
              <p className="text-gray-400 text-center">
                Drop your JSON file here, or <span className="text-blue-400">browse</span>
              </p>
            </div>
          )}
        </div>
        
        {fileName && !isMinimized && (
          <div className="text-sm text-gray-300 flex items-center justify-between mt-2">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {fileName}
            </div>
            
            {/* Minimize button */}
            <button 
              onClick={toggleMinimized}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Minimize"
            >
              Minimize
            </button>
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-400 flex items-center mt-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
