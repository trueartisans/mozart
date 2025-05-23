import { Node as ReactFlowNode } from 'reactflow';

export type TransformResult = Record<string, unknown> | string | number | boolean | null;
export type HeadersType = Record<string, string>;
export type BodyType = Record<string, unknown> | string | number | boolean | null;

export interface NodeData {
  label?: string;
  triggerExecution?: number;
  inputData?: TransformResult;
  result?: TransformResult;
  response?: TransformResult;
  headersInput?: HeadersType;
  bodyInput?: BodyType;
}

export interface TransformNodeData extends NodeData {
  result?: TransformResult;
}

export interface RequestNodeData extends NodeData {
  response?: Record<string, unknown>;
  headersInput?: HeadersType;
  bodyInput?: BodyType;
  status?: number;
  statusText?: string;
}

export interface ResponseNodeData extends NodeData {
  response?: TransformResult;
  inputData?: TransformResult;
}

export type StartNodeData = NodeData;

export interface FlowNode<T extends NodeData = NodeData> extends ReactFlowNode {
  data: T;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  data?: unknown;
}
