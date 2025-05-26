import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Flow from '../components/Flow';

const Home: React.FC = () => {
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [selectedFlowName, setSelectedFlowName] = useState<string | null>(null);

  const handleJourneySelect = (journeyId: string | null) => {
    setSelectedJourney(journeyId);
    setSelectedFlow(null);
    setSelectedFlowName(null);
  };

  const handleFlowSelect = (flowId: string | null, flowName: string | null) => {
    setSelectedFlow(flowId);
    setSelectedFlowName(flowName);
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212]">
      <Navbar onJourneySelect={handleJourneySelect} />

      {selectedFlowName && (
        <div className="bg-[#0A2C2C] border-b border-[#2A2A2A] py-2 px-4 flex items-center justify-center">
          <h1 className="text-[#F5EFE0] font-medium text-lg flex items-center">
            <span className="text-[#D5A253] mr-2">Flow:</span> {selectedFlowName}
          </h1>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar journeyId={selectedJourney} onFlowSelect={handleFlowSelect} />
        <div className="flex-1 overflow-hidden">
          <Flow flowId={selectedFlow} />
        </div>
      </div>
    </div>
  );
};

export default Home;
