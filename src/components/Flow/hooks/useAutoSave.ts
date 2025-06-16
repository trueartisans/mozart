import { useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

interface AutoSaveOptions {
  delay?: number;
  onSaveStart?: () => void;
  onSaveSuccess?: (version: number) => void;
  onSaveError?: (error: string) => void;
  onLocalSave?: () => void;
}

export const useAutoSave = (
  flowId: string | null,
  isViewingOldVersion: boolean,
  options: AutoSaveOptions = {}
) => {
  const {
    delay = 4000,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
    onLocalSave
  } = options;

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');
  const initialLoadRef = useRef<boolean>(true);
  const lastKnownDataRef = useRef<string>('');
  const isLoadingRef = useRef<boolean>(false);
  const hasUnsavedChangesRef = useRef<boolean>(false);

  const cleanNodeDataForSave = useCallback((nodes: any[]) => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        response: undefined,
        result: undefined,
        headersInput: undefined,
        bodyInput: undefined,
        status: undefined,
        statusText: undefined,
        triggerExecution: undefined,
      }
    }));
  }, []);

  const saveToServer = useCallback(async (
    id: string,
    nodes: any[],
    edges: any[]
  ) => {
    if (isViewingOldVersion || isLoadingRef.current) return;

    try {
      onSaveStart?.();

      const cleanedNodes = cleanNodeDataForSave(nodes);
      const response = await axios.put(`/api/flow-definitions/${id}`, {
        nodes: cleanedNodes,
        edges: edges,
      });

      console.log(`Flow ${id} saved to server - Version ${response.data.version}`);
      hasUnsavedChangesRef.current = false;
      onSaveSuccess?.(response.data.version);

    } catch (error) {
      console.error('Error saving flow to server:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onSaveError?.(errorMessage);
    }
  }, [isViewingOldVersion, cleanNodeDataForSave, onSaveStart, onSaveSuccess, onSaveError]);

  const hasDataChanged = useCallback((nodes: any[], edges: any[]) => {
    const cleanedNodes = cleanNodeDataForSave(nodes);
    const currentData = JSON.stringify({ nodes: cleanedNodes, edges });

    if (initialLoadRef.current) {
      lastKnownDataRef.current = currentData;
      initialLoadRef.current = false;
      return false;
    }

    const hasChanged = currentData !== lastKnownDataRef.current;

    if (hasChanged) {
      lastKnownDataRef.current = currentData;
    }

    return hasChanged;
  }, [cleanNodeDataForSave]);

  const scheduleAutoSave = useCallback((
    nodes: any[],
    edges: any[]
  ) => {
    if (!flowId || isViewingOldVersion || isLoadingRef.current) return;

    if (!hasDataChanged(nodes, edges)) {
      return;
    }

    hasUnsavedChangesRef.current = true;

    const flowData = {
      nodes: cleanNodeDataForSave(nodes),
      edges,
      timestamp: Date.now()
    };

    const localKey = `flow_${flowId}_draft`;
    localStorage.setItem(localKey, JSON.stringify(flowData));
    console.log(`Flow ${flowId} saved locally`);

    onLocalSave?.();

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentData = JSON.stringify({ nodes, edges });

      if (currentData !== lastSaveRef.current) {
        lastSaveRef.current = currentData;
        saveToServer(flowId, nodes, edges);
      }
    }, delay);

  }, [flowId, isViewingOldVersion, delay, saveToServer, cleanNodeDataForSave, hasDataChanged, onLocalSave]);

  const loadLocalDraft = useCallback(() => {
    if (!flowId) return null;

    const localKey = `flow_${flowId}_draft`;
    const savedData = localStorage.getItem(localKey);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log(`Loaded local draft for flow ${flowId}`);
        return parsed;
      } catch (error) {
        console.error('Error parsing local draft:', error);
        localStorage.removeItem(localKey);
      }
    }

    return null;
  }, [flowId]);

  const clearLocalDraft = useCallback(() => {
    if (!flowId) return;

    const localKey = `flow_${flowId}_draft`;
    localStorage.removeItem(localKey);
    hasUnsavedChangesRef.current = false;
    console.log(`Cleared local draft for flow ${flowId}`);
  }, [flowId]);

  // Reset initial load flag when flowId changes
  useEffect(() => {
    initialLoadRef.current = true;
    lastKnownDataRef.current = '';
    isLoadingRef.current = false;
    hasUnsavedChangesRef.current = false;
  }, [flowId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleAutoSave,
    loadLocalDraft,
    clearLocalDraft,
    saveToServer: (nodes: any[], edges: any[]) => {
      if (flowId && !isLoadingRef.current) {
        saveToServer(flowId, nodes, edges);
      }
    },
    markDataAsKnown: (nodes: any[], edges: any[]) => {
      const cleanedNodes = cleanNodeDataForSave(nodes);
      const currentData = JSON.stringify({ nodes: cleanedNodes, edges });
      lastKnownDataRef.current = currentData;
      initialLoadRef.current = false;
      hasUnsavedChangesRef.current = false;
    },
    setLoading: (loading: boolean) => {
      isLoadingRef.current = loading;
    },
    hasUnsavedChanges: () => hasUnsavedChangesRef.current
  };
};
