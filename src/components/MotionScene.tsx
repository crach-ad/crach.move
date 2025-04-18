"use client";

import { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, TransformControls } from "@react-three/drei";
import { Suspense } from "react";
import { MocapData } from "@/data/sampleMocapData";
import Skeleton from "./Skeleton";
import { getInterpolatedFrame } from "@/utils/mocapUtils";
import * as THREE from "three";

interface MotionSceneProps {
  mocapData: MocapData;
  frameIndex: number;
  subFramePosition?: number;
  highlightedJoint?: string | null;
  onNewDataLoaded?: boolean;
}

// Camera setup component that will center the view when data changes
function CameraSetup({ resetView }: { resetView: boolean }) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (resetView) {
      // Reset camera to front-facing position
      camera.position.set(0, 1, 3);
      camera.lookAt(0, 1, 0);
    }
  }, [resetView, camera]);
  
  return null;
}

export default function MotionScene({
  mocapData,
  frameIndex,
  subFramePosition = 0,
  highlightedJoint,
  onNewDataLoaded = false
}: MotionSceneProps) {
  // State for figure position and movement controls
  const [figurePosition, setFigurePosition] = useState<[number, number, number]>([0, 0, 0]);
  const [showTransformControls, setShowTransformControls] = useState(false);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');
  const [resetCamera, setResetCamera] = useState(false);
  
  // Reference to the group containing the skeleton
  const skeletonGroupRef = useRef<THREE.Group>(null);
  
  // Reset camera when new data is loaded
  useEffect(() => {
    if (onNewDataLoaded) {
      setFigurePosition([0, 0, 0]);
      setResetCamera(true);
      // Reset camera flag after a short delay
      const timer = setTimeout(() => {
        setResetCamera(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onNewDataLoaded, mocapData]);
  
  const toggleTransformControls = () => {
    setShowTransformControls(prev => !prev);
  };
  
  const switchTransformMode = () => {
    setTransformMode(prev => prev === 'translate' ? 'rotate' : 'translate');
  };
  // Get the current frame data with interpolation if needed
  const frameData = getInterpolatedFrame(mocapData, frameIndex, subFramePosition);

  return (
    <div className="h-full w-full bg-gray-900 rounded-lg overflow-hidden relative">
      {/* Position Control UI */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button 
          onClick={toggleTransformControls}
          className={`px-3 py-1 rounded-md text-xs font-medium ${showTransformControls ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          {showTransformControls ? 'Hide Controls' : 'Show Controls'}
        </button>
        
        {showTransformControls && (
          <button 
            onClick={switchTransformMode}
            className="px-3 py-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 text-xs font-medium"
          >
            {transformMode === 'translate' ? 'Switch to Rotate' : 'Switch to Move'}
          </button>
        )}
        
        <button 
          onClick={() => {
            setFigurePosition([0, 0, 0]);
            setResetCamera(true);
            setTimeout(() => setResetCamera(false), 100);
          }}
          className="px-3 py-1 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 text-xs font-medium"
        >
          Reset Position
        </button>
      </div>
      
      <Canvas
        camera={{ position: [0, 1, 3], fov: 50 }}
        shadows
      >
        <Suspense fallback={null}>
          {/* Camera setup for initial view and resets */}
          <CameraSetup resetView={resetCamera} />
          
          {/* Environment and lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-10, 10, 5]} intensity={0.5} />
          
          {/* 3D Grid for reference */}
          <Grid 
            infiniteGrid 
            fadeDistance={10} 
            fadeStrength={1} 
            cellSize={0.2} 
            sectionSize={1}
            position={[0, 0, 0]}
          />
          
          {/* Group for the skeleton with position controls */}
          <group position={figurePosition} ref={skeletonGroupRef}>
            {/* The skeleton visualization */}
            <Skeleton 
              frameData={frameData} 
              scale={1}
              highlightedJoint={highlightedJoint}
            />
          </group>
          
          {/* Transform controls for moving the figure */}
          {showTransformControls && skeletonGroupRef.current && (
            <TransformControls
              object={skeletonGroupRef.current}
              mode={transformMode}
              size={0.5}
            />
          )}
          
          {/* Environment and controls */}
          <Environment preset="city" />
          <OrbitControls 
            enableDamping
            dampingFactor={0.1}
            rotateSpeed={0.5}
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
