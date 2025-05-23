import { ObjectId } from 'mongodb';

export interface Journey {
  _id: ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // If you have authentication
}

export interface Flow {
  _id: ObjectId;
  journeyId: ObjectId; // Reference to the journey
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  position?: number; // Order in the journey
}

export interface FlowDefinition {
  _id: ObjectId;
  flowId: ObjectId; // Reference to the flow
  nodes: Node[]; // Complete structure of nodes
  edges: Edge[]; // Connections between nodes
  version: number; // For version control
  createdAt: Date;
  updatedAt: Date;
}

export interface Node {
  id: string;
  type: 'request' | 'response' | 'transform' | 'start';
  position: {
    x: number;
    y: number;
  };
  data: {
    label?: string;
    triggerExecution?: number;
    inputData?: unknown;
    result?: unknown;
    response?: unknown;
    headersInput?: Record<string, string> | string;
    bodyInput?: unknown;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface TypedFlowDefinition extends Omit<FlowDefinition, 'nodes' | 'edges'> {
  nodes: Node[];
  edges: Edge[];
}
