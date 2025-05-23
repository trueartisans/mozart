import React, { useEffect, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { EyeIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { ResponseNodeData } from '@/types/flow';

const ResponseNode: React.FC<NodeProps<ResponseNodeData>> = ({ id, data, isConnectable }) => {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  // Effect to briefly show a loading state when new data arrives
  useEffect(() => {
    if (data?.inputData || data?.response || data?.triggerExecution) {
      console.log(`ResponseNode ${id} received update:`, {
        inputData: data?.inputData,
        response: data?.response,
        trigger: data?.triggerExecution,
      });

      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [data?.inputData, data?.response, data?.triggerExecution, id]);

  // Determine which data to show (prioritize data.response if it exists)
  const responseData =
    data?.response !== undefined
      ? (data.response as Record<string, unknown> | string | number | boolean | null | undefined)
      : (data?.inputData as Record<string, unknown> | string | number | boolean | null | undefined);

  return (
    <div className="bg-[#1A1A1A] rounded-xl shadow-lg border border-[#2A2A2A] w-80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white">
        <div className="flex items-center">
          <EyeIcon className="h-5 w-5 mr-2" />
          <span className="font-bold">Response</span>
          {data?.triggerExecution && (
            <span className="ml-2 text-xs bg-white/20 px-1 py-0.5 rounded">
              Trigger: {data.triggerExecution}
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
          <div className="mb-2">
            <span className="text-xs font-medium text-[#F5EFE0]">Response Data:</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-4">
              <svg
                className="animate-spin h-5 w-5 text-[#10B981]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : responseData ? (
            <div className="p-2 bg-[#242424] border border-[#333333] rounded-md text-xs overflow-auto max-h-60 font-mono">
              <pre className="text-[#F5EFE0]">
                {typeof responseData === 'object'
                  ? JSON.stringify(responseData, null, 2)
                  : String(responseData)}
              </pre>
            </div>
          ) : (
            <div className="p-4 bg-[#242424] border border-[#333333] rounded-md text-center">
              <p className="text-[#F5EFE0]/50 text-sm">Waiting for data...</p>
            </div>
          )}
        </div>
      )}

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#10B981]"
      />
    </div>
  );
};

export default ResponseNode;
