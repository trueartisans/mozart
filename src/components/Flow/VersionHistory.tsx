import React, { useState, useEffect } from 'react';
import { ClockIcon, ArrowUturnLeftIcon, XMarkIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

interface FlowDefinition {
  _id: string;
  flowId: string;
  nodes: any[];
  edges: any[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface VersionHistoryProps {
  flowId: string;
  onVersionSelect: (version: FlowDefinition) => void;
  onClose: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ flowId, onVersionSelect, onClose }) => {
  const [versions, setVersions] = useState<FlowDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/flow-definitions/${flowId}/versions`);
        setVersions(response.data);
      } catch (error) {
        console.error('Error fetching versions:', error);
        setError('Failed to load version history');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [flowId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-80 bg-[#0A2C2C] border-l border-[#2A2A2A] shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] bg-[#0A2C2C] flex-shrink-0">
          <h3 className="text-lg font-semibold text-[#F5EFE0] flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-[#D5A253]" />
            Version History
          </h3>
          <button
            onClick={onClose}
            className="text-[#F5EFE0]/70 hover:text-[#F5EFE0] p-1 rounded-md hover:bg-[#2A2A2A] transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-[#D5A253] border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-[#F5EFE0]/70 text-sm">Loading versions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="bg-red-900/30 p-3 rounded-full mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                  <XMarkIcon className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-red-400 text-sm mb-2">Error loading versions</p>
                <p className="text-[#F5EFE0]/50 text-xs">{error}</p>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="bg-[#0A3B3B] p-3 rounded-full mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-[#D5A253]" />
                </div>
                <p className="text-[#F5EFE0]/70 text-sm mb-1">No versions found</p>
                <p className="text-[#F5EFE0]/50 text-xs">Save your flow to create the first version</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-[#0A2C2C] scrollbar-thumb-[#2A2A2A] hover:scrollbar-thumb-[#3A3A3A]">
              {versions.map((version, index) => (
                <div
                  key={version._id}
                  className="bg-[#0A3B3B] rounded-lg p-4 border border-[#2A2A2A] hover:border-[#D5A253]/30 transition-all duration-200 cursor-pointer group hover:bg-[#0F4040]"
                  onClick={() => onVersionSelect(version)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#D5A253] font-semibold text-sm">
                        Version {version.version}
                      </span>
                      {index === 0 && (
                        <span className="text-xs bg-[#D5A253]/20 text-[#D5A253] px-2 py-0.5 rounded-full font-medium">
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs text-[#F5EFE0]/70 mb-1">
                      {formatDate(version.createdAt)}
                    </div>
                    <div className="text-xs text-[#F5EFE0]/50" title={formatFullDate(version.createdAt)}>
                      {formatFullDate(version.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex space-x-4 text-xs text-[#F5EFE0]/60">
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-[#D5A253] rounded-full mr-1.5" />
                        {version.nodes.length} nodes
                      </span>
                      <span className="flex items-center">
                        <div className="w-2 h-2 bg-[#10B981] rounded-full mr-1.5" />
                        {version.edges.length} connections
                      </span>
                    </div>
                  </div>

                  <button
                    className="flex items-center text-xs text-[#D5A253] hover:text-[#BF8A3D] transition-colors group-hover:text-[#E6B978]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVersionSelect(version);
                    }}
                  >
                    <ArrowUturnLeftIcon className="h-3 w-3 mr-1.5" />
                    {index === 0 ? 'Current version' : 'Restore this version'}
                  </button>
                </div>
              ))}

              {versions.length > 5 && (
                <div className="text-center py-4">
                  <div className="text-xs text-[#F5EFE0]/40">
                    {versions.length} versions total
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-[#2A2A2A] p-3 bg-[#0A2C2C] flex-shrink-0">
          <div className="text-xs text-[#F5EFE0]/50 text-center">
            Versions are automatically saved when you make changes
          </div>
        </div>
      </div>
    </>
  );
};

export default VersionHistory;
