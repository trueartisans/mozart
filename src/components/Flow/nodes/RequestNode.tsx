import React, { useCallback, useEffect, useState } from 'react';
import { Handle, NodeProps, Position, useReactFlow } from 'reactflow';
import axios from 'axios';
import { GlobeAmericasIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';
import { HttpMethod, HttpRequestConfig, RequestNodeData } from '@/types/flow';

export const RequestNode: React.FC<NodeProps<RequestNodeData>> = ({ id, data, isConnectable }) => {
  const [url, setUrl] = useState('https://httpbin.org/ip');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('');
  const [useInputAsHeaders, setUseInputAsHeaders] = useState(false);
  const [useInputAsBody, setUseInputAsBody] = useState(false);
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [responseStatus, setResponseStatus] = useState<number>(0);
  const [responseStatusText, setResponseStatusText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setNodes, getEdges } = useReactFlow();

  // Load saved data when a component grows or changes data
  useEffect(() => {
    if (data?.url !== undefined) setUrl(data.url);
    if (data?.method !== undefined) setMethod(data.method);
    if (data?.headers !== undefined) setHeaders(data.headers);
    if (data?.body !== undefined) setBody(data.body);
    if (data?.useInputAsHeaders !== undefined) setUseInputAsHeaders(data.useInputAsHeaders);
    if (data?.useInputAsBody !== undefined) setUseInputAsBody(data.useInputAsBody);
  }, [data?.url, data?.method, data?.headers, data?.body, data?.useInputAsHeaders, data?.useInputAsBody]);

  const updateNodeData = useCallback((updates: Partial<RequestNodeData>) => {
    setNodes(nodes =>
      nodes.map(node =>
        node.id === id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [id, setNodes]);

  // Handlers for updating state and saving data
  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
    updateNodeData({ url: newUrl });
  }, [updateNodeData]);

  const handleMethodChange = useCallback((newMethod: HttpMethod) => {
    setMethod(newMethod);
    updateNodeData({ method: newMethod });
  }, [updateNodeData]);

  const handleHeadersChange = useCallback((newHeaders: string) => {
    setHeaders(newHeaders);
    updateNodeData({ headers: newHeaders });
  }, [updateNodeData]);

  const handleBodyChange = useCallback((newBody: string) => {
    setBody(newBody);
    updateNodeData({ body: newBody });
  }, [updateNodeData]);

  const handleUseInputAsHeadersChange = useCallback((checked: boolean) => {
    setUseInputAsHeaders(checked);
    updateNodeData({ useInputAsHeaders: checked });
  }, [updateNodeData]);

  const handleUseInputAsBodyChange = useCallback((checked: boolean) => {
    setUseInputAsBody(checked);
    updateNodeData({ useInputAsBody: checked });
  }, [updateNodeData]);

  const handleSendRequest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (error) {
        setError('Error parsing headers JSON');
        setLoading(false);

        if (error instanceof Error) {
          setError('Error starting execution: ' + error.message);
        } else if (typeof error === 'string') {
          setError('Error starting execution: ' + error);
        } else {
          setError('Error starting execution: unknown error');
        }
      }

      let parsedBody = undefined;
      if (method !== 'GET' && body) {
        try {
          parsedBody = JSON.parse(body);
        } catch (error) {
          parsedBody = body;

          if (error instanceof Error) {
            setError('Error starting execution: ' + error.message);
          } else if (typeof error === 'string') {
            setError('Error starting execution: ' + error);
          } else {
            setError('Error starting execution: unknown error');
          }
        }
      }

      const config: HttpRequestConfig = {
        method,
        url,
        headers: parsedHeaders as Record<string, string>,
        data: method !== 'GET' ? parsedBody : undefined,
      };

      const res = await axios(config);
      const responseData = res.data;

      setResponse(responseData);
      setResponseStatus(res.status);
      setResponseStatusText(res.statusText);

      setNodes(nodes =>
        nodes.map(node =>
          node.id === id
            ? {
              ...node,
              data: {
                ...node.data,
                response: responseData,
                status: res.status,
                statusText: res.statusText,
              },
            }
            : node
        )
      );

      const propagateDataToConnectedNodes = (
        data: Record<string, unknown> | string | number | boolean | null
      ) => {
        const edges = getEdges();
        const outgoingEdges = edges.filter(edge => edge.source === id);

        if (outgoingEdges.length > 0) {
          setNodes(nodes =>
            nodes.map(node => {
              const isConnectedTarget = outgoingEdges.some(edge => edge.target === node.id);

              if (isConnectedTarget) {
                const targetHandles = outgoingEdges
                  .filter(edge => edge.target === node.id)
                  .map(edge => edge.targetHandle);

                const updatedData = { ...node.data };

                if (targetHandles.includes('headers')) {
                  if (typeof data === 'object' || typeof data === 'string') {
                    updatedData.headersInput = data;
                  } else {
                    updatedData.headersInput = String(data);
                  }
                } else if (targetHandles.includes('body')) {
                  updatedData.bodyInput = data;
                } else {
                  updatedData.inputData = data;
                  if (node.type === 'response') {
                    updatedData.response =
                      data as Record<string, unknown> | string | number | boolean | null;
                  }
                }

                return {
                  ...node,
                  data: updatedData,
                };
              }
              return node;
            })
          );
        }
      };

      propagateDataToConnectedNodes(responseData);
    } catch (error: Error | unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Request failed');
      } else {
        setError('Request failed: unknown error');
      }
      setResponse(null);
      setResponseStatus(0);
      setResponseStatusText('');
    } finally {
      setLoading(false);
    }
  }, [method, body, url, setNodes, headers, id, getEdges]);

  useEffect(() => {
    if (data?.triggerExecution) {
      handleSendRequest().then(() => {});
    }
  }, [data?.triggerExecution, handleSendRequest]);

  useEffect(() => {
    if (useInputAsHeaders && data?.headersInput) {
      try {
        if (typeof data.headersInput === 'object') {
          setHeaders(JSON.stringify(data.headersInput, null, 2));
        } else {
          const headersInputString = String(data.headersInput);
          try {
            const parsedData = JSON.parse(headersInputString);
            setHeaders(JSON.stringify(parsedData, null, 2));
          } catch {
            setHeaders(headersInputString);
          }
        }
      } catch (error) {
        console.error('Error processing input headers:', error);
      }
    }
  }, [data?.headersInput, useInputAsHeaders, setHeaders]);

  useEffect(() => {
    if (useInputAsBody && data?.bodyInput && method !== 'GET') {
      try {
        if (typeof data.bodyInput === 'object') {
          setBody(JSON.stringify(data.bodyInput, null, 2));
        } else {
          const bodyInputString = String(data.bodyInput);
          try {
            const parsedData = JSON.parse(bodyInputString);
            setBody(JSON.stringify(parsedData, null, 2));
          } catch {
            setBody(bodyInputString);
          }
        }
      } catch (error) {
        console.error('Error processing input body:', error);
      }
    }
  }, [data?.bodyInput, useInputAsBody, method, setBody]);

  return (
    <div className="bg-[#1A1A1A] rounded-xl shadow-lg border border-[#2A2A2A] w-80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#D5A253] to-[#BF8A3D] text-[#0A3B3B]">
        <div className="flex items-center">
          <GlobeAmericasIcon className="h-5 w-5 mr-2" />
          <span className="font-bold">HTTP Request</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#0A3B3B]/80 hover:text-[#0A3B3B]"
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
          <div className="flex mb-3">
            <div className="w-1/3 mr-2">
              <label className="block text-xs font-medium text-[#F5EFE0] mb-1">Method</label>
              <select
                className="block w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-[#D5A253] focus:border-[#D5A253] bg-[#242424] border-[#333333] text-[#F5EFE0]"
                value={method}
                onChange={e => handleMethodChange(e.target.value as HttpMethod)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-medium text-[#F5EFE0] mb-1">URL</label>
              <input
                type="text"
                className="block w-full px-3 py-2 text-sm border border-[#333333] rounded-md focus:ring-2 focus:ring-[#D5A253] focus:border-[#D5A253] bg-[#242424] text-[#F5EFE0]"
                value={url}
                onChange={e => handleUrlChange(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-[#F5EFE0] mb-1">Headers (JSON)</label>

              {data?.headersInput && (
                <div className="flex items-center">
                  <label className="flex items-center text-xs font-medium text-[#F5EFE0]">
                    <input
                      type="checkbox"
                      checked={useInputAsHeaders}
                      onChange={e => handleUseInputAsHeadersChange(e.target.checked)}
                      className="mr-2 h-3 w-3 rounded border-[#333333] text-[#D5A253] focus:ring-[#D5A253] bg-[#242424]"
                    />
                    Use input
                  </label>
                </div>
              )}
            </div>

            {useInputAsHeaders && data?.headersInput && (
              <div className="mb-2 p-2 bg-[#0A3B3B]/20 border border-[#D5A253]/30 rounded-md">
                <div className="text-xs text-[#D5A253]/70 mb-1">Input headers:</div>
                <div className="text-xs text-[#F5EFE0]/70 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                  {typeof data.headersInput === 'object'
                    ? JSON.stringify(data.headersInput).substring(0, 50) +
                    (JSON.stringify(data.headersInput).length > 50 ? '...' : '')
                    : String(data.headersInput).substring(0, 50) +
                    (String(data.headersInput).length > 50 ? '...' : '')}
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-[#F5EFE0]/50 sm:text-sm">{}</span>
              </div>
              <textarea
                className={`block w-full pl-7 pr-3 py-2 text-sm border border-[#333333] rounded-md font-mono focus:ring-2 focus:ring-[#D5A253] focus:border-[#D5A253] bg-[#242424] text-[#F5EFE0] ${
                  useInputAsHeaders ? 'opacity-80' : ''
                }`}
                value={headers}
                onChange={e => handleHeadersChange(e.target.value)}
                rows={2}
                readOnly={useInputAsHeaders}
              />
            </div>
          </div>

          {method !== 'GET' && (
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#F5EFE0] mb-1">Body</label>

                {data?.bodyInput && (
                  <div className="flex items-center">
                    <label className="flex items-center text-xs font-medium text-[#F5EFE0]">
                      <input
                        type="checkbox"
                        checked={useInputAsBody}
                        onChange={e => handleUseInputAsBodyChange(e.target.checked)}
                        className="mr-2 h-3 w-3 rounded border-[#333333] text-[#D5A253] focus:ring-[#D5A253] bg-[#242424]"
                      />
                      Use input
                    </label>
                  </div>
                )}
              </div>

              {useInputAsBody && data?.bodyInput && (
                <div className="mb-2 p-2 bg-[#0A3B3B]/20 border border-[#D5A253]/30 rounded-md">
                  <div className="text-xs text-[#D5A253]/70 mb-1">Input body:</div>
                  <div className="text-xs text-[#F5EFE0]/70 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                    {typeof data.bodyInput === 'object'
                      ? JSON.stringify(data.bodyInput).substring(0, 50) +
                      (JSON.stringify(data.bodyInput).length > 50 ? '...' : '')
                      : String(data.bodyInput).substring(0, 50) +
                      (String(data.bodyInput).length > 50 ? '...' : '')}
                  </div>
                </div>
              )}

              <textarea
                className={`block w-full px-3 py-2 text-sm border border-[#333333] rounded-md font-mono focus:ring-2 focus:ring-[#D5A253] focus:border-[#D5A253] bg-[#242424] text-[#F5EFE0] ${
                  useInputAsBody ? 'opacity-80' : ''
                }`}
                value={body}
                onChange={e => handleBodyChange(e.target.value)}
                rows={3}
                readOnly={useInputAsBody}
              />
            </div>
          )}

          <button
            onClick={handleSendRequest}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-[#D5A253] text-[#0A3B3B] rounded-md hover:bg-[#BF8A3D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D5A253] disabled:bg-[#D5A253]/50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0A3B3B]"
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
                Sending...
              </>
            ) : (
              <>
                <GlobeAmericasIcon className="h-4 w-4 mr-1" />
                Send Request
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-2 bg-red-900/30 border border-red-800 rounded-md">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {response && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#F5EFE0]">Response:</span>
                <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 rounded-full">
                  Status: {responseStatus} {responseStatusText}
                </span>
              </div>
              <div className="p-2 bg-[#242424] border border-[#333333] rounded-md text-xs overflow-auto max-h-40 font-mono">
                <pre className="text-[#F5EFE0]">
                  {
                    typeof response === 'object' && true
                      ? JSON.stringify(response, null, 2)
                      : String(response)
                  }
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Handle for headers input */}
      <div className="absolute -left-[5px] top-[40%] flex items-center">
        <div className="absolute -left-[15px] text-xs text-[#F5EFE0] bg-[#0A3B3B] px-1 py-0.5 rounded">
          H
        </div>
        <Handle
          type="target"
          position={Position.Left}
          id="headers"
          isConnectable={isConnectable}
          className="w-3 h-3 bg-[#D5A253]"
          style={{ left: 0 }}
        />
      </div>

      {/* Handle for body input */}
      {method !== 'GET' && (
        <div className="absolute -left-[5px] top-[60%] flex items-center">
          <div className="absolute -left-[15px] text-xs text-[#F5EFE0] bg-[#0A3B3B] px-1 py-0.5 rounded">
            B
          </div>
          <Handle
            type="target"
            position={Position.Left}
            id="body"
            isConnectable={isConnectable}
            className="w-3 h-3 bg-[#D5A253]"
            style={{ left: 0 }}
          />
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-[#D5A253]"
      />
    </div>
  );
};
