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
    <div className="bg-[#1A1A1A] rounded-xl shadow-lg border border-[#2A2A2A] w-80 overflow-hidden transition-shadow hover:shadow-xl">
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
          className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
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
          <div className="mb-2 flex items-center">
            <svg className="h-4 w-4 mr-1 text-[#10B981]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-[#F5EFE0]">Response Data:</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-6 bg-[#242424]/50 border border-[#333333] rounded-md">
              <svg
                className="animate-spin h-8 w-8 text-[#10B981]"
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
            <div className="p-2 bg-[#242424] border border-[#333333] rounded-md text-xs overflow-auto max-h-60 font-mono hover:border-[#10B981]/50 transition-colors">
              <pre className="text-[#F5EFE0]">
                {typeof responseData === 'object'
                  ? JSON.stringify(responseData, null, 2)
                  : String(responseData)}
              </pre>
            </div>
          ) : (
            <div className="p-6 bg-[#242424] border border-[#333333] rounded-md text-center">
              <svg className="h-10 w-10 mx-auto mb-2 text-[#F5EFE0]/20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[#F5EFE0]/50 text-sm">Waiting for data...</p>
              <p className="text-[#F5EFE0]/30 text-xs mt-1">Connect an input source to display data here</p>
            </div>
          )}
        </div>
      )}

      {/* Input handle */}
      <div className="absolute -left-[5px] top-[50%] flex items-center">
        <div className="absolute -left-[15px] text-xs text-[#F5EFE0] bg-[#0A3B3B] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Input
        </div>
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          isConnectable={isConnectable}
          className="w-3 h-3 bg-[#10B981] transition-all hover:w-4 hover:h-4"
        />
      </div>
    </div>
  );
};

export default ResponseNode;
