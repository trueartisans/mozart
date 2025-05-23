import React, { useCallback, useState } from 'react';
import { Handle, NodeProps, Position, useReactFlow } from 'reactflow';
import { MinusIcon, PlayIcon, PlusIcon } from '@heroicons/react/24/solid';
import { StartNodeData } from '@/types/flow';

const StartNode: React.FC<NodeProps<StartNodeData>> = ({ id, isConnectable }) => {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTrigger, setLastTrigger] = useState<number | null>(null);

  const { setNodes, getEdges } = useReactFlow();

  // Start execution of connected nodes
  const handleStart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Find all nodes connected to this node
      const edges = getEdges();
      const outgoingEdges = edges.filter(edge => edge.source === id);

      if (outgoingEdges.length === 0) {
        setError('No connected nodes to start');
        setLoading(false);
        return;
      }

      // Generate a new timestamp for this trigger
      const triggerTimestamp = Date.now();
      setLastTrigger(triggerTimestamp);

      // Signal to connected nodes that they should start execution
      setNodes(nodes =>
        nodes.map(node => {
          // Check if this node is a target of any outgoing edge
          const isConnectedTarget = outgoingEdges.some(edge => edge.target === node.id);

          if (isConnectedTarget) {
            return {
              ...node,
              data: {
                ...node.data,
                triggerExecution: triggerTimestamp
              }
            } as typeof node;
          }
          return node;
        })
      );

      setExecuted(true);

    } catch (error) {
      if (error instanceof Error) {
        setError('Error starting execution: ' + error.message);
      } else {
        setError('Error starting execution: unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, setNodes, getEdges]);

  return (
    <div className="bg-[#1A1A1A] rounded-xl shadow-lg border border-[#2A2A2A] w-64 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white">
        <div className="flex items-center">
          <PlayIcon className="h-5 w-5 mr-2" />
          <span className="font-bold">Start</span>
          {lastTrigger && (
            <span className="ml-2 text-xs bg-white/20 px-1 py-0.5 rounded">
              Last: {lastTrigger}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white/80 hover:text-white"
        >
          {expanded ? (
            <MinusIcon className="h-5 w-5" />
          ) : (
            <PlusIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-[#F5EFE0] mb-2">
              Starts the execution of all connected nodes simultaneously.
            </p>
            <p className="text-xs text-[#F5EFE0]/70">
              Connect this node to multiple flows to start their execution in parallel.
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 bg-[#6366F1] text-white rounded-md hover:bg-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] disabled:bg-[#6366F1]/50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting...
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5 mr-2" />
                Start Execution
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-2 bg-red-900/30 border border-red-800 rounded-md">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {executed && !error && !loading && (
            <div className="mt-4 p-2 bg-indigo-900/30 border border-indigo-800 rounded-md">
              <p className="text-indigo-400 text-xs">Execution started successfully!</p>
            </div>
          )}
        </div>
      )}

      {/* Only one output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#6366F1]"
      />
    </div>
  );
};

export default StartNode;
