import React, { useState, useEffect } from 'react';
import { PlusIcon, CodeBracketIcon, ShieldExclamationIcon, DocumentTextIcon, MagnifyingGlassIcon, ClockIcon, ChevronRightIcon, TrashIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

type Flow = {
  id: string;
  name: string;
  journeyId: string;
  createdAt: Date;
};

type SidebarProps = {
  journeyId: string | null;
  onFlowSelect: (flowId: string | null, flowName: string | null) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ journeyId, onFlowSelect }) => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [isAddingFlow, setIsAddingFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch flows when journeyId changes
  useEffect(() => {
    const fetchFlows = async () => {
      if (journeyId) {
        try {
          setIsLoading(true);
          setError(null);
          const response = await axios.get(`/api/flows?journeyId=${journeyId}`);
          const flowData = response.data.map((flow: any) => ({
            id: flow._id,
            name: flow.name,
            journeyId: flow.journeyId,
            createdAt: new Date(flow.createdAt),
          }));
          setFlows(flowData);

          // Auto-select the first flow if available and none selected
          if (flowData.length > 0 && !selectedFlow) {
            setSelectedFlow(flowData[0].id);
            onFlowSelect(flowData[0].id, flowData[0].name);
          } else if (flowData.length === 0) {
            // Clear selection if no flows
            setSelectedFlow(null);
            onFlowSelect(null, null);
          }
        } catch (err) {
          console.error('Failed to fetch flows:', err);
          setError('Failed to load flows');
        } finally {
          setIsLoading(false);
        }
      } else {
        setFlows([]);
        setSelectedFlow(null);
      }
    };

    fetchFlows();
  }, [journeyId, onFlowSelect]);

  const filteredFlows = journeyId
    ? flows
      .filter((flow) => flow.journeyId === journeyId)
      .filter((flow) => flow.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleFlowSelect = (flowId: string, flowName: string) => {
    setSelectedFlow(flowId);
    onFlowSelect(flowId, flowName);
  };

  const handleAddFlow = async () => {
    if (newFlowName.trim() && journeyId) {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.post('/api/flows', {
          journeyId,
          name: newFlowName.trim(),
          description: '',
          position: flows.length,
        });

        const newFlow = response.data;
        const updatedFlows = [...flows, {
          id: newFlow._id,
          name: newFlow.name,
          journeyId,
          createdAt: new Date(newFlow.createdAt),
        }];

        setFlows(updatedFlows);
        setNewFlowName('');
        setIsAddingFlow(false);

        // Automatically select the new flow
        setSelectedFlow(newFlow._id);
        onFlowSelect(newFlow._id, newFlow.name);
      } catch (err) {
        console.error('Failed to create flow:', err);
        setError('Failed to create flow');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteFlow = async (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent flow selection when clicking delete

    if (confirm('Are you sure you want to delete this flow?')) {
      try {
        setIsLoading(true);
        await axios.delete(`/api/flows/${flowId}`);

        // Remove from state
        const updatedFlows = flows.filter(flow => flow.id !== flowId);
        setFlows(updatedFlows);

        // If the deleted flow was selected, select another one or null
        if (selectedFlow === flowId) {
          const newSelectedFlow = updatedFlows.length > 0 ? updatedFlows[0] : null;
          if (newSelectedFlow) {
            setSelectedFlow(newSelectedFlow.id);
            onFlowSelect(newSelectedFlow.id, newSelectedFlow.name);
          } else {
            setSelectedFlow(null);
            onFlowSelect(null, null);
          }
        }
      } catch (err) {
        console.error('Failed to delete flow:', err);
        setError('Failed to delete flow');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!journeyId) {
    return (
      <div className="w-64 h-full bg-[#0A2C2C] border-r border-[#2A2A2A] shadow-sm flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#0A3B3B] p-4 rounded-full mb-4 shadow-lg border border-[#2A2A2A]/50">
            <ShieldExclamationIcon className="h-8 w-8 text-[#D5A253]" />
          </div>
          <h3 className="text-[#F5EFE0] font-medium mb-2">No journey selected</h3>
          <p className="text-[#D5A253]/70 text-sm mb-6">
            Create a journey in the top bar to start adding flows
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 h-full bg-[#0A2C2C] border-r border-[#2A2A2A] shadow-sm flex flex-col">
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#F5EFE0] flex items-center">
          <CodeBracketIcon className="h-5 w-5 mr-2 text-[#D5A253]" />
          Flows
        </h2>
        <div className="text-xs text-[#D5A253] bg-[#0A3B3B] px-2 py-1 rounded-md border border-[#D5A253]/20 shadow-sm">
          {filteredFlows.length} {filteredFlows.length === 1 ? 'flow' : 'flows'}
        </div>
      </div>

      {isLoading && (
        <div className="p-3 flex justify-center">
          <div className="text-[#D5A253]/70 text-sm flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      )}

      {error && (
        <div className="p-3">
          <div className="text-red-400 text-sm bg-red-900/30 px-3 py-2 rounded-md">
            {error}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filteredFlows.length === 0 && !searchTerm ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
            <div className="bg-[#0A3B3B] p-3 rounded-full mb-3 shadow-md border border-[#2A2A2A]/50">
              <DocumentTextIcon className="h-10 w-10 text-[#D5A253]/70" />
            </div>
            <p className="text-[#F5EFE0] font-medium mb-1">No flows found</p>
            <p className="text-[#D5A253]/70 text-sm mb-4">
              Create your first flow to start orchestrating your APIs
            </p>
            <button
              onClick={() => setIsAddingFlow(true)}
              className="flex items-center justify-center space-x-1 bg-[#D5A253] hover:bg-[#BF8A3D] text-[#0A3B3B] px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
              disabled={isLoading}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Create Flow</span>
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 px-1">
              <div className={`relative transition-all duration-200 ${isSearchFocused ? 'ring-2 ring-[#D5A253]' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className={`h-4 w-4 ${isSearchFocused ? 'text-[#D5A253]' : 'text-[#D5A253]/70'}`} />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm border border-[#333333] rounded-lg focus:outline-none bg-[#0A3B3B] text-[#F5EFE0] placeholder-[#F5EFE0]/30 shadow-sm"
                  placeholder="Search flows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#D5A253]/70 hover:text-[#D5A253]"
                    onClick={() => setSearchTerm('')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {searchTerm && filteredFlows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="bg-[#0A3B3B] p-3 rounded-full mb-3 opacity-70">
                  <MagnifyingGlassIcon className="h-8 w-8 text-[#D5A253]/50" />
                </div>
                <p className="text-[#F5EFE0] font-medium mb-1">No results</p>
                <p className="text-[#D5A253]/70 text-sm">
                  No flows found for "{searchTerm}"
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFlows.map((flow) => (
                  <div
                    key={flow.id}
                    className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                      selectedFlow === flow.id
                        ? 'bg-[#0F4D4D] text-[#D5A253] shadow-md border border-[#D5A253]/20'
                        : 'hover:bg-[#0F4D4D]/50 text-[#F5EFE0] border border-transparent hover:border-[#2A2A2A]'
                    }`}
                    onClick={() => handleFlowSelect(flow.id, flow.name)}
                    onMouseEnter={() => setHoveredFlow(flow.id)}
                    onMouseLeave={() => setHoveredFlow(null)}
                  >
                    <div className={`p-2 rounded-md mr-3 ${selectedFlow === flow.id ? 'bg-[#D5A253]/10' : 'bg-[#0A3B3B]'}`}>
                      <CodeBracketIcon className={`h-5 w-5 ${selectedFlow === flow.id ? 'text-[#D5A253]' : 'text-[#D5A253]/70 group-hover:text-[#D5A253]'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{flow.name}</div>
                      <div className="text-xs flex items-center mt-0.5">
                        <ClockIcon className="h-3 w-3 mr-1 text-[#D5A253]/50" />
                        <span className="text-[#D5A253]/50">
                          {flow.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {selectedFlow === flow.id && (
                      <button
                        onClick={(e) => handleDeleteFlow(flow.id, e)}
                        className="p-1.5 text-[#D5A253]/70 hover:text-[#D5A253] hover:bg-[#0A3B3B]/50 rounded-md transition-colors"
                        title="Delete flow"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}

                    <ChevronRightIcon className={`h-4 w-4 ${selectedFlow === flow.id ? 'text-[#D5A253]' : 'text-[#D5A253]/0 group-hover:text-[#D5A253]/50'} transition-all`} />

                    {/* Tooltip for long names */}
                    {hoveredFlow === flow.id && flow.name.length > 20 && (
                      <div className="absolute left-0 bottom-full mb-2 z-10 px-3 py-2 bg-[#0A3B3B] text-[#F5EFE0] text-sm rounded-lg shadow-lg border border-[#2A2A2A] whitespace-nowrap">
                        {flow.name}
                        <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-[#0A3B3B] border-r border-b border-[#2A2A2A]"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-3 border-t border-[#2A2A2A] bg-[#092424]">
        {isAddingFlow ? (
          <div className="space-y-2">
            <input
              type="text"
              className="w-full px-3 py-2.5 bg-[#0A3B3B] border border-[#333333] rounded-lg focus:ring-2 focus:ring-[#D5A253] focus:border-[#D5A253] text-sm text-[#F5EFE0] placeholder-[#F5EFE0]/50 shadow-inner"
              placeholder="Flow name"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFlow()}
              autoFocus
              disabled={isLoading}
            />
            <div className="flex space-x-2">
              <button
                className={`flex-1 bg-[#D5A253] hover:bg-[#BF8A3D] text-[#0A3B3B] px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleAddFlow}
                disabled={isLoading}
              >
                Add
              </button>
              <button
                className="flex-1 bg-[#0A3B3B] hover:bg-[#0F4D4D] text-[#F5EFE0] px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border border-[#2A2A2A] shadow-sm"
                onClick={() => setIsAddingFlow(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className={`w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#D5A253] to-[#BF8A3D] hover:from-[#E6B978] hover:to-[#D5A253] text-[#0A3B3B] px-3 py-3 rounded-lg text-sm font-medium transition-colors shadow-md ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => setIsAddingFlow(true)}
            disabled={isLoading}
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Flow</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
