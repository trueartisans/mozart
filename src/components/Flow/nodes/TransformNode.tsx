import React, { useCallback, useEffect, useState } from 'react';
import { Handle, NodeProps, Position, useReactFlow } from 'reactflow';
import { CodeBracketIcon, CubeTransparentIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { TransformNodeData, TransformResult, HeadersType } from '@/types/flow';

export const TransformNode: React.FC<NodeProps<TransformNodeData>> = ({ id, data, isConnectable }) => {
  const [code, setCode] = useState(`// Transform input data or create new data
// You can access 'data' for input data
// or simply return a new object

// Example to transform input data:
// return { ...data, modified: true };

// Example to create data from scratch:
return {
  test: 123,
  timestamp: Date.now()
};`);

  const [mode, setMode] = useState<'transform' | 'create'>('create');
  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  const { setNodes, getEdges } = useReactFlow();

  const handleTransform = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Input data (can be undefined if none)
      const inputData = data?.inputData;

      // Create a function from the code
      const transformFn = new Function('data', code);

      // Execute the function with the input data
      const transformedData = transformFn(inputData);

      // Validate the result type
      if (
        transformedData !== null &&
        typeof transformedData !== 'string' &&
        typeof transformedData !== 'number' &&
        typeof transformedData !== 'boolean' &&
        typeof transformedData !== 'object'
      ) {
        throw new Error('Invalid result: must be an object, string, number, boolean or null');
      }

      const typedResult: TransformResult = transformedData as TransformResult;

      console.log(`TransformNode ${id} generated result:`, typedResult);

      setResult(typedResult);

      // Update this node's data
      setNodes(nodes =>
        nodes.map(node =>
          node.id === id
            ? { ...node, data: { ...node.data, result: typedResult } }
            : node
        )
      );

      // Propagate data to connected nodes
      const propagateDataToConnectedNodes = (data: TransformResult) => {
        const edges = getEdges();
        const outgoingEdges = edges.filter(edge => edge.source === id);

        if (outgoingEdges.length > 0) {
          console.log(`TransformNode ${id} propagating data to ${outgoingEdges.length} connected nodes`);

          setNodes(nodes =>
            nodes.map(node => {
              const isConnectedTarget = outgoingEdges.some(edge => edge.target === node.id);

              if (isConnectedTarget) {
                console.log(`TransformNode ${id} sending data to node ${node.id}`);

                const targetHandles = outgoingEdges
                  .filter(edge => edge.target === node.id)
                  .map(edge => edge.targetHandle);

                const updatedData = { ...node.data };

                if (targetHandles.includes('headers')) {
                  // Check if data is compatible with HeadersType
                  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
                    // Convert to HeadersType ensuring all values are strings
                    const headersData: HeadersType = Object.entries(data).reduce(
                      (acc, [key, value]) => ({
                        ...acc,
                        [key]: String(value)
                      }),
                      {}
                    );
                    updatedData.headersInput = headersData;
                  } else {
                    console.warn('Incompatible data for headers, using empty object');
                    updatedData.headersInput = {};
                  }
                } else if (targetHandles.includes('body')) {
                  // bodyInput accepts various types, so we can assign directly
                  updatedData.bodyInput = data;
                } else {
                  // Default handle (in or unspecified)
                  updatedData.inputData = data;

                  // If it's a response node, explicitly set the response property
                  if (node.type === 'response') {
                    console.log(`TransformNode ${id} setting response for node ${node.id}:`, data);
                    updatedData.response = data;
                  }
                }

                // Add an execution trigger
                updatedData.triggerExecution = Date.now();

                return {
                  ...node,
                  data: updatedData
                };
              }
              return node;
            })
          );
        }
      };

      propagateDataToConnectedNodes(typedResult);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error in transformation';
      console.error('Transform error:', error);
      setError(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [code, data?.inputData, id, setNodes, getEdges]);

  // Respond to Start node execution trigger
  useEffect(() => {
    if (data?.triggerExecution) {
      console.log(`TransformNode ${id} received trigger:`, data.triggerExecution);
      handleTransform();
    }
  }, [data?.triggerExecution, id, handleTransform]);

  // Execute transformation when input data changes (if in transform mode)
  useEffect(() => {
    if (mode === 'transform' && data?.inputData) {
      console.log(`TransformNode ${id} received input data:`, data.inputData);
      handleTransform();
    }
  }, [data?.inputData, mode, id, handleTransform]);

  return (
    <div className="bg-[#1A1A1A] rounded-xl shadow-lg border border-[#2A2A2A] w-80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white">
        <div className="flex items-center">
          <CubeTransparentIcon className="h-5 w-5 mr-2" />
          <span className="font-bold">Transform</span>
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
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-[#F5EFE0]">Mode</label>
              <div className="flex bg-[#242424] rounded-md p-0.5">
                <button
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    mode === 'transform'
                      ? 'bg-[#8B5CF6] text-white'
                      : 'text-[#F5EFE0]/70 hover:text-[#F5EFE0]'
                  }`}
                  onClick={() => setMode('transform')}
                >
                  Transform
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    mode === 'create'
                      ? 'bg-[#8B5CF6] text-white'
                      : 'text-[#F5EFE0]/70 hover:text-[#F5EFE0]'
                  }`}
                  onClick={() => setMode('create')}
                >
                  Create
                </button>
              </div>
            </div>

            {/* Input data preview (only in transform mode) */}
            {mode === 'transform' && data?.inputData && (
              <div className="mb-3 p-2 bg-[#2D1D60]/30 border border-[#8B5CF6]/30 rounded-md">
                <div className="text-xs text-[#8B5CF6]/70 mb-1">Input data:</div>
                <div className="text-xs text-[#F5EFE0]/70 font-mono overflow-auto max-h-20">
                  <pre>{typeof data.inputData === 'object'
                    ? JSON.stringify(data.inputData, null, 2)
                    : String(data.inputData)
                  }</pre>
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute top-0 right-0 bg-[#242424] text-[#F5EFE0]/50 text-xs px-2 py-1 rounded-bl-md border-b border-l border-[#333333]">
                <CodeBracketIcon className="h-3 w-3 inline mr-1" />
                JavaScript
              </div>
              <textarea
                className="block w-full px-3 py-2 text-sm border border-[#333333] rounded-md font-mono focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] bg-[#242424] text-[#F5EFE0]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={8}
                style={{ paddingTop: '2rem' }}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleTransform}
              disabled={loading}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-[#8B5CF6] text-white rounded-md hover:bg-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B5CF6] disabled:bg-[#8B5CF6]/50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CubeTransparentIcon className="h-4 w-4 mr-1" />
                  {mode === 'transform' ? 'Transform' : 'Generate Data'}
                </>
              )}
            </button>

            <input
              type="file"
              accept=".js"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const content = ev.target?.result as string;
                    setCode(content);
                  };
                  reader.readAsText(file);
                }
              }}
              className="hidden"
              id={`import-js-${id}`}
            />
            <label
              htmlFor={`import-js-${id}`}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-[#8B5CF6] text-white rounded-md hover:bg-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B5CF6] cursor-pointer transition-colors"
            >
              <CodeBracketIcon className="h-4 w-4 mr-1" />
              Import JS
            </label>
          </div>

          {error && (
            <div className="mt-4 p-2 bg-red-900/30 border border-red-800 rounded-md">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#F5EFE0]">Result:</span>
              </div>
              <div className="p-2 bg-[#242424] border border-[#333333] rounded-md text-xs overflow-auto max-h-40 font-mono">
                <pre className="text-[#F5EFE0]">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input handle - always visible to allow connection with Start */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        isConnectable={isConnectable}
        className="w-3 h-3"
        style={{
          backgroundColor: mode === 'create' ? '#1A1A1A' : '#8B5CF6',
          border: mode === 'create' ? '2px dashed #8B5CF6' : '2px solid #8B5CF6'
        }}
      />

      {/* Output handle to send data to other nodes */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#8B5CF6]"
      />
    </div>
  );
};
