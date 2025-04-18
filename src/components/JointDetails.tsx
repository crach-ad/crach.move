"use client";

import { MocapData } from "@/data/sampleMocapData";

interface JointDetailsProps {
  frameData: MocapData["mocap_data"][0];
  selectedJoint: string | null;
  onSelectJoint: (jointName: string | null) => void;
}

export default function JointDetails({
  frameData,
  selectedJoint,
  onSelectJoint
}: JointDetailsProps) {
  // If no joint is selected, show a message
  if (!selectedJoint) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-gray-300">
        <h3 className="text-lg font-medium text-white mb-2">Joint Details</h3>
        <p>Select a joint in the visualization to see its details.</p>
      </div>
    );
  }

  // Get the selected joint data
  const jointData = frameData.joint_data[selectedJoint];

  // If joint data is not available
  if (!jointData) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-gray-300">
        <h3 className="text-lg font-medium text-white mb-2">Joint Details</h3>
        <p>Joint data not available for {selectedJoint}.</p>
        <button
          onClick={() => onSelectJoint(null)}
          className="mt-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          Clear Selection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">{selectedJoint}</h3>
        <button
          onClick={() => onSelectJoint(null)}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          Clear
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Position</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-700 p-2 rounded">
              <span className="text-xs text-gray-400">X</span>
              <div className="text-sm font-mono">{jointData.position[0].toFixed(4)}</div>
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <span className="text-xs text-gray-400">Y</span>
              <div className="text-sm font-mono">{jointData.position[1].toFixed(4)}</div>
            </div>
            <div className="bg-gray-700 p-2 rounded">
              <span className="text-xs text-gray-400">Z</span>
              <div className="text-sm font-mono">{jointData.position[2].toFixed(4)}</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Rotation ({jointData.type})</h4>
          <div className="grid grid-cols-3 gap-2">
            {jointData.rotations.map((rot, idx) => (
              <div key={idx} className="bg-gray-700 p-2 rounded">
                <span className="text-xs text-gray-400">{idx === 0 ? 'X' : idx === 1 ? 'Y' : 'Z'}</span>
                <div className="text-sm font-mono">{rot.toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Torques</h4>
          <div className="grid grid-cols-3 gap-2">
            {jointData.torques.map((torque, idx) => (
              <div key={idx} className="bg-gray-700 p-2 rounded">
                <span className="text-xs text-gray-400">{idx === 0 ? 'X' : idx === 1 ? 'Y' : 'Z'}</span>
                <div className="text-sm font-mono">{torque.toFixed(4)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Reaction Forces</h4>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-sm font-mono">{jointData.reaction_forces.toFixed(4)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
