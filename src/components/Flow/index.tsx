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

import RequestNode from './nodes/RequestNode';
import ResponseNode from './nodes/ResponseNode';
import { TransformNode } from './nodes/TransformNode';
import StartNode from './nodes/StartNode';

const nodeTypes = {
  request: RequestNode,
  response: ResponseNode,
  transform: TransformNode,
  start: StartNode,
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

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [fitViewOnLoad, setFitViewOnLoad] = useState(true);

  useEffect(() => {
    if (flowId) {
      // TODO: Adapt a backend for this
      const savedFlow = localStorage.getItem(`flow-${flowId}`);

      if (savedFlow) {
        try {
          const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedFlow);
          setNodes(savedNodes);
          setEdges(savedEdges);
          setFitViewOnLoad(true);
        } catch (error) {
          console.error('Error loading flow data:', error);
          setNodes([]);
          setEdges([]);
        }
      } else {
        setNodes([]);
        setEdges([]);
        localStorage.setItem(`flow-${flowId}`, JSON.stringify({ nodes: [], edges: [] }));
      }

      setFlowInitialized(flowId);
    } else {
      setNodes([]);
      setEdges([]);
      setFlowInitialized(null);
    }
  }, [flowId, setNodes, setEdges]);

  useEffect(() => {
    if (flowId && flowId === flowInitialized) {
      const flowData = JSON.stringify({ nodes, edges });
      localStorage.setItem(`flow-${flowId}`, flowData);
    }
  }, [flowId, flowInitialized, nodes, edges]);

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
    (type: 'request' | 'response' | 'transform' | 'start', position?: { x: number; y: number }) => {
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
              case 'start':
                return '#6366F1';
              default:
                return '#64748B';
            }
          }}
        />
        <Background gap={16} size={1} color="#2A2A2A" />

        <Panel position="bottom-center" className="flex justify-center items-center mb-4">
          <div className="bg-[#0A2C2C] p-2 rounded-lg shadow-md border border-[#2A2A2A] flex space-x-2">
            <button
              onClick={() => onAddNode('start')}
              className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-sm font-medium rounded-md hover:from-[#818CF8] hover:to-[#6366F1] transition-all shadow-sm"
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              Start
            </button>
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
                onClick={() => onAddNode('start', contextMenu.flowPosition)}
                className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-[#6366F1]/20 rounded-md transition-colors"
              >
                <PlayIcon className="h-4 w-4 mr-2 text-[#6366F1]" />
                Add Start
              </button>
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
