'use client';

import { useEffect, useState } from 'react';
import { Team } from '../lib/types';
import { useRouter } from 'next/navigation';

interface GameResultsProps {
  teams: Team[];
}

export default function GameResults({ teams }: GameResultsProps) {
  const [sortedTeams, setSortedTeams] = useState<Team[]>([]);
  const [winner, setWinner] = useState<Team | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    // Sort teams by score (descending)
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    setSortedTeams(sorted);
    
    // Set winner (first team in sorted array)
    if (sorted.length > 0) {
      setWinner(sorted[0]);
    }
  }, [teams]);
  
  const handlePlayAgain = () => {
    // Navigate back to home
    router.push('/');
  };
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-center text-gray-900">Game Results</h2>
      
      {winner && (
        <div className="text-center p-6 bg-yellow-100/90 backdrop-blur-sm rounded-lg mb-8 border border-yellow-200">
          <h3 className="text-2xl font-bold text-yellow-900 mb-2">
            🎉 Winner: {winner.name} 🎉
          </h3>
          <p className="text-xl font-semibold text-yellow-800">
            Score: {winner.score} points
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Final Standings</h3>
        
        <div className="space-y-2">
          {sortedTeams.map((team, index) => (
            <div 
              key={team.id} 
              className={`p-4 rounded-md flex justify-between ${
                index === 0 
                  ? 'bg-yellow-50/90 backdrop-blur-sm border border-yellow-200' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <span className="font-bold mr-3 text-lg text-gray-900">{index + 1}.</span>
                <div>
                  <h4 className="font-medium text-lg text-gray-900">{team.name}</h4>
                  <div className="text-sm text-gray-700">
                    Players: {team.players.map(p => p.name).join(', ')}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-700">{team.score}</div>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={handlePlayAgain}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-semibold rounded-md hover:from-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Play Again
      </button>
    </div>
  );
} 