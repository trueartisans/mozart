import React, { useState } from 'react';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

type Journey = {
  id: string;
  name: string;
};

type NavbarProps = {
  onJourneySelect: (journeyId: string | null) => void;
};

const Navbar: React.FC<NavbarProps> = ({ onJourneySelect }) => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);
  const [isAddingJourney, setIsAddingJourney] = useState(false);
  const [newJourneyName, setNewJourneyName] = useState('');

  const handleJourneySelect = (journeyId: string) => {
    setSelectedJourney(journeyId);
    onJourneySelect(journeyId);
  };

  const handleAddJourney = () => {
    if (newJourneyName.trim()) {
      const newJourney = {
        id: `journey-${Date.now()}`,
        name: newJourneyName.trim(),
      };
      const updatedJourneys = [...journeys, newJourney];
      setJourneys(updatedJourneys);
      setNewJourneyName('');
      setIsAddingJourney(false);

      // Automatically select the first journey if none is selected
      if (selectedJourney === null) {
        setSelectedJourney(newJourney.id);
        onJourneySelect(newJourney.id);
      }
    }
  };

  return (
    <div className="bg-[#0A3B3B] shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Mozart Logo */}
            <div className="h-10 w-10 relative">
              <Image
                src="/logo.png"
                alt="Mozart Logo"
                fill
                sizes="40px"
                priority
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-[#D5A253] tracking-wide">Mozart</span>
            <span className="text-xs text-[#D5A253]/70 italic">Orchestrating APIs</span>
          </div>

          <div className="flex items-center space-x-3">
            {journeys.length > 0 ? (
              <div className="flex bg-[#0A2C2C] rounded-lg p-1">
                {journeys.map((journey) => (
                  <button
                    key={journey.id}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedJourney === journey.id
                        ? 'bg-[#D5A253] text-[#0A3B3B] shadow-sm'
                        : 'text-[#D5A253]/90 hover:text-[#D5A253] hover:bg-[#0A3B3B]/70'
                    }`}
                    onClick={() => handleJourneySelect(journey.id)}
                  >
                    {journey.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-[#D5A253]/70 text-sm italic mr-2">
                Create your first journey →
              </div>
            )}

            {isAddingJourney ? (
              <div className="flex items-center bg-[#0A2C2C] rounded-lg overflow-hidden">
                <input
                  type="text"
                  className="px-3 py-2 bg-transparent text-[#D5A253] placeholder-[#D5A253]/50 outline-none"
                  placeholder="Journey name"
                  value={newJourneyName}
                  onChange={(e) => setNewJourneyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddJourney()}
                  autoFocus
                />
                <button
                  className="p-2 text-[#D5A253] hover:bg-[#0A2C2C]/80"
                  onClick={handleAddJourney}
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  className="p-2 text-[#D5A253] hover:bg-[#0A2C2C]/80"
                  onClick={() => setIsAddingJourney(false)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                className="flex items-center space-x-1 bg-[#0A2C2C] hover:bg-[#0A2C2C]/80 text-[#D5A253] px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setIsAddingJourney(true)}
              >
                <PlusIcon className="h-4 w-4" />
                <span>{journeys.length === 0 ? 'New Journey' : 'Add Journey'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
