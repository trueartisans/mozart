import React, { useState, useEffect } from 'react';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import axios from 'axios';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch journeys on component mount
  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('/api/journeys');
        const journeyData = response.data.map((journey: any) => ({
          id: journey._id,
          name: journey.name,
        }));
        setJourneys(journeyData);

        // Auto-select the first journey if available and none selected
        if (journeyData.length > 0 && !selectedJourney) {
          setSelectedJourney(journeyData[0].id);
          onJourneySelect(journeyData[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch journeys:', err);
        setError('Failed to load journeys');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourneys();
  }, [onJourneySelect, selectedJourney]);

  const handleJourneySelect = (journeyId: string) => {
    setSelectedJourney(journeyId);
    onJourneySelect(journeyId);
  };

  const handleAddJourney = async () => {
    if (newJourneyName.trim()) {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.post('/api/journeys', {
          name: newJourneyName.trim(),
          description: '',
        });

        const newJourney = response.data;
        const updatedJourneys = [...journeys, {
          id: newJourney._id,
          name: newJourney.name,
        }];

        setJourneys(updatedJourneys);
        setNewJourneyName('');
        setIsAddingJourney(false);

        // Automatically select the new journey
        setSelectedJourney(newJourney._id);
        onJourneySelect(newJourney._id);
      } catch (err) {
        console.error('Failed to create journey:', err);
        setError('Failed to create journey');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteJourney = async (journeyId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent journey selection when clicking delete

    if (confirm('Are you sure you want to delete this journey? This will delete all associated flows.')) {
      try {
        setIsLoading(true);
        await axios.delete(`/api/journeys/${journeyId}`);

        // Remove from state
        const updatedJourneys = journeys.filter(journey => journey.id !== journeyId);
        setJourneys(updatedJourneys);

        // If the deleted journey was selected, select another one or null
        if (selectedJourney === journeyId) {
          const newSelectedJourney = updatedJourneys.length > 0 ? updatedJourneys[0].id : null;
          setSelectedJourney(newSelectedJourney);
          onJourneySelect(newSelectedJourney);
        }
      } catch (err) {
        console.error('Failed to delete journey:', err);
        setError('Failed to delete journey');
      } finally {
        setIsLoading(false);
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
            {isLoading && (
              <div className="text-[#D5A253]/70 text-sm flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-900/30 px-3 py-1 rounded-md">
                {error}
              </div>
            )}

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
                    <span className="flex items-center">
                      {journey.name}
                      {selectedJourney === journey.id && (
                        <button
                          onClick={(e) => handleDeleteJourney(journey.id, e)}
                          className="ml-2 text-[#0A3B3B]/70 hover:text-[#0A3B3B] p-1 rounded-full hover:bg-[#0A3B3B]/20"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      )}
                    </span>
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
                  disabled={isLoading}
                />
                <button
                  className={`p-2 text-[#D5A253] ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#0A2C2C]/80'}`}
                  onClick={handleAddJourney}
                  disabled={isLoading}
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  className="p-2 text-[#D5A253] hover:bg-[#0A2C2C]/80"
                  onClick={() => setIsAddingJourney(false)}
                  disabled={isLoading}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                className={`flex items-center space-x-1 bg-[#0A2C2C] hover:bg-[#0A2C2C]/80 text-[#D5A253] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => setIsAddingJourney(true)}
                disabled={isLoading}
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
