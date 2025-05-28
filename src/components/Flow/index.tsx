import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  ReactFlowInstance
} from 'reactflow';
import { FlowNode } from '@/types/flow';
import 'reactflow/dist/style.css';
import { GlobeAmericasIcon, CubeTransparentIcon, EyeIcon, PlayIcon } from '@heroicons/react/24/solid';
import { debounce } from 'lodash';
import axios from 'axios';

import { RequestNode } from './nodes/RequestNode';
import ResponseNode from './nodes/ResponseNode';
import { TransformNode } from './nodes/TransformNode';

const nodeTypes = {
  request: RequestNode,
  response: ResponseNode,
  transform: TransformNode,
};

const fitViewOptions = {
  padding: 0.2,
  maxZoom: 1.5,
};

interface FlowProps {
  flowId: string | null;
}

const FlowContent: React.FC<FlowProps> = ({ flowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
  } | null>(null);
  const [flowInitialized, setFlowInitialized] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [fitViewOnLoad, setFitViewOnLoad] = useState(true);

  // TODO: Solve Any type
  const debouncedSaveRef = useRef<any>(null);

  // Initialize a debounced save function
  useEffect(() => {
    debouncedSaveRef.current = debounce(async (id: string, flowNodes: typeof nodes, flowEdges: typeof edges) => {
      try {
        setSaveStatus('saving');
        await axios.put(`/api/flow-definitions/${id}`, {
          nodes: flowNodes,
          edges: flowEdges,
        });
        console.log(`Flow ${id} saved to database`);
        setSaveStatus('saved');

        // Reset save status after a delay
        setTimeout(() => {
          setSaveStatus(null);
        }, 500);
      } catch (error) {
        console.error('Error saving flow:', error);
        setSaveStatus('error');
      }
    }, 1000);

    return () => {
      if (debouncedSaveRef.current?.cancel) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, []);

  // Load flow data when flowId changes
  useEffect(() => {
    if (flowId) {
      const fetchFlowDefinition = async () => {
        try {
          setIsLoading(true);
          setExecutionError(null);

          const response = await axios.get(`/api/flow-definitions/${flowId}`);
          const { nodes: savedNodes, edges: savedEdges } = response.data;

          if (savedNodes && savedEdges) {
            setNodes(savedNodes);
            setEdges(savedEdges);
            setFitViewOnLoad(true);
          } else {
            setNodes([]);
            setEdges([]);

            // Create an empty flow definition if none exists
            await axios.put(`/api/flow-definitions/${flowId}`, {
              nodes: [],
              edges: [],
            });
          }
        } catch (error) {
          console.error('Error loading flow data:', error);
          setNodes([]);
          setEdges([]);

          if (error instanceof Error) {
            setExecutionError(`Error loading flow: ${error.message}`);
          } else {
            setExecutionError('Error loading flow data');
          }

          // Create an empty flow definition if none exists
          try {
            await axios.put(`/api/flow-definitions/${flowId}`, {
              nodes: [],
              edges: [],
            });
          } catch (createError) {
            console.error('Error creating empty flow definition:', createError);
          }
        } finally {
          setIsLoading(false);
          setFlowInitialized(flowId);
        }
      };

      fetchFlowDefinition();
    } else {
      setNodes([]);
      setEdges([]);
      setFlowInitialized(null);
    }
  }, [flowId, setNodes, setEdges]);

  // Save flow data when nodes or edges change
  useEffect(() => {
    if (flowId && flowId === flowInitialized && debouncedSaveRef.current && (nodes.length > 0 || edges.length > 0)) {
      debouncedSaveRef.current(flowId, nodes, edges);
    }
  }, [flowId, flowInitialized, nodes, edges]);

  // Reset fit view after nodes are loaded
  useEffect(() => {
    if (nodes.length > 0) {
      setFitViewOnLoad(false);
    }
  }, [nodes.length]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onAddNode = useCallback(
    (type: 'request' | 'response' | 'transform', position?: { x: number; y: number }) => {
      if (!flowId) return;

      const pos = position || { x: 250, y: 250 };
      const newNode: FlowNode = {
        id: `${type}-${Date.now()}`,
        type,
        position: pos,
        data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
      };
      setNodes((nds) => nds.concat(newNode));
      setContextMenu(null);
    },
    [setNodes, flowId]
  );

  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      if (!flowId) return;

      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const x = event.clientX;
      const y = event.clientY;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      const position = reactFlowInstance.project({
        x: x - reactFlowBounds.left,
        y: y - reactFlowBounds.top,
      });

      setContextMenu({
        visible: true,
        x,
        y,
        flowPosition: position,
      });
    },
    [reactFlowInstance, flowId]
  );

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const executeFlow = useCallback(() => {
    if (!flowId || nodes.length === 0) return;

    setIsExecuting(true);
    setExecutionError(null);

    try {
      const incomingConnections = new Set(edges.map(edge => edge.target));
      const entryNodes = nodes.filter(node => !incomingConnections.has(node.id));

      if (entryNodes.length === 0) {
        setExecutionError("No entry nodes found to start execution");
        setIsExecuting(false);
        return;
      }

      const executionTimestamp = Date.now();

      setNodes(nodes =>
        nodes.map(node => {
          if (entryNodes.some(entryNode => entryNode.id === node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                triggerExecution: executionTimestamp
              }
            };
          }
          return node;
        })
      );

      setTimeout(() => {
        setIsExecuting(false);
      }, 500);

    } catch (error) {
      console.error("Error executing flow:", error);
      if (error instanceof Error) {
        setExecutionError(`Error executing flow: ${error.message}`);
      } else {
        setExecutionError("Unknown error executing flow");
      }
      setIsExecuting(false);
    }
  }, [flowId, nodes, edges, setNodes]);

  if (!flowId) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#121212]">
        <div className="text-center p-8 bg-[#0A2C2C] rounded-xl shadow-lg border border-[#2A2A2A] max-w-md">
          <div className="bg-[#0A3B3B] p-4 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#D5A253]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#F5EFE0] mb-2">No Flow Selected</h2>
          <p className="text-[#D5A253]/70 mb-6">
            Select a flow from the sidebar or create a new one to start building your API orchestration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#121212]" ref={reactFlowWrapper}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#121212]/80 flex items-center justify-center z-50">
          <div className="bg-[#0A2C2C] p-6 rounded-xl shadow-lg border border-[#2A2A2A] flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-[#D5A253] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-[#F5EFE0] text-lg">Loading flow...</p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView={fitViewOnLoad}
        fitViewOptions={fitViewOptions}
        className="bg-[#121212]"
        onContextMenu={onContextMenu}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Controls
          position="bottom-right"
          className="bg-[#0A2C2C] border border-[#2A2A2A] shadow-md rounded-lg mb-20 mr-4"
        />
        <MiniMap
          position="bottom-right"
          className="border border-[#2A2A2A] shadow-md rounded-lg bg-[#0A2C2C] mb-20 mr-4"
          nodeBorderRadius={8}
          maskColor="rgba(10, 44, 44, 0.7)"
          nodeColor={(node) => {
            switch (node.type) {
              case 'request':
                return '#D5A253';
              case 'response':
                return '#10B981';
              case 'transform':
                return '#8B5CF6';
              default:
                return '#64748B';
            }
          }}
        />
        <Background gap={16} size={1} color="#2A2A2A" />

        {/* Panel para o indicador de salvamento centralizado no topo */}
        <Panel position="top-center" className="mt-4">
          {saveStatus && (
            <div className={`px-3 py-1.5 rounded-md text-sm flex items-center shadow-md border ${
              saveStatus === 'saving' ? 'bg-[#0A3B3B] text-[#D5A253] border-[#D5A253]/20' :
                saveStatus === 'saved' ? 'bg-green-900/30 text-green-400 border-green-800/20' :
                  'bg-red-900/30 text-red-400 border-red-800/20'
            }`}>
              {saveStatus === 'saving' && (
                <>
                  <svg className="animate-spin h-3 w-3 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <svg className="h-3 w-3 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Flow saved
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <svg className="h-3 w-3 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Error saving
                </>
              )}
            </div>
          )}
        </Panel>

        {/* Panel para o botão de execução e mensagens de erro no canto superior direito */}
        <Panel position="top-right" className="mr-4 mt-4 flex flex-col items-end space-y-2">
          <button
            onClick={executeFlow}
            disabled={isExecuting || nodes.length === 0 || isLoading}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white rounded-lg hover:from-[#818CF8] hover:to-[#6366F1] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Executing...
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5 mr-2" />
                Execute
              </>
            )}
          </button>

          {executionError && (
            <div className="p-2 bg-red-900/30 border border-red-800 rounded-md">
              <p className="text-red-400 text-xs">{executionError}</p>
            </div>
          )}
        </Panel>

        <Panel position="bottom-center" className="flex justify-center items-center mb-4">
          <div className="bg-[#0A2C2C] p-2 rounded-lg shadow-md border border-[#2A2A2A] flex space-x-2">
            <button
              onClick={() => onAddNode('request')}
              className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#D5A253] to-[#BF8A3D] text-[#0A3B3B] text-sm font-medium rounded-md hover:from-[#E6B978] hover:to-[#D5A253] transition-all shadow-sm"
            >
              <GlobeAmericasIcon className="h-4 w-4 mr-1" />
              Request
            </button>
            <button
              onClick={() => onAddNode('response')}
              className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-medium rounded-md hover:from-[#34D399] hover:to-[#10B981] transition-all shadow-sm"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Response
            </button>
            <button
              onClick={() => onAddNode('transform')}
              className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-sm font-medium rounded-md hover:from-[#A78BFA] hover:to-[#8B5CF6] transition-all shadow-sm"
            >
              <CubeTransparentIcon className="h-4 w-4 mr-1" />
              Transform
            </button>
          </div>
        </Panel>

        {contextMenu?.visible && (
          <div
            className="fixed z-50 bg-[#0A2C2C] rounded-lg shadow-lg border border-[#2A2A2A] overflow-hidden"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <div className="p-1">
              <button
                onClick={() => onAddNode('request', contextMenu.flowPosition)}
                className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-[#D5A253]/20 rounded-md transition-colors"
              >
                <GlobeAmericasIcon className="h-4 w-4 mr-2 text-[#D5A253]" />
                Add Request
              </button>
              <button
                onClick={() => onAddNode('response', contextMenu.flowPosition)}
                className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-[#10B981]/20 rounded-md transition-colors"
              >
                <EyeIcon className="h-4 w-4 mr-2 text-[#10B981]" />
                Add Response
              </button>
              <button
                onClick={() => onAddNode('transform', contextMenu.flowPosition)}
                className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-[#8B5CF6]/20 rounded-md transition-colors"
              >
                <CubeTransparentIcon className="h-4 w-4 mr-2 text-[#8B5CF6]" />
                Add Transform
              </button>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
};

const Flow: React.FC<FlowProps> = ({ flowId }) => {
  return (
    <ReactFlowProvider>
      <FlowContent flowId={flowId} />
    </ReactFlowProvider>
  );
};

export default Flow;
