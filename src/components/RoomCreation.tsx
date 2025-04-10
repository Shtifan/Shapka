'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomCreation() {
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createRoom = async () => {
    if (!playerName.trim()) return;
    
    setIsCreating(true);
    
    // In a real app, we would create the room on the server
    // For now, we'll just generate a random room ID
    const roomId = Math.random().toString(36).substring(2, 9);
    
    // Store player info in localStorage
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('playerId', Math.random().toString(36).substring(2, 9));
    
    // Navigate to the room
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <div className="bg-blue-100 text-blue-700 p-3 rounded-full inline-flex mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-900">Create a Game Room</h2>
        <p className="text-gray-600 mt-2">Enter your name to start a new Shapka game</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              id="playerName"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4">
        <button
          onClick={createRoom}
          disabled={!playerName.trim() || isCreating}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
        >
          {isCreating ? (
            <>
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
              Creating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              Create Room
            </>
          )}
        </button>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
        <p className="text-blue-800 text-sm">
          <span className="font-bold">Tip:</span> After creating a room, you can share the room ID with friends so they can join your game.
        </p>
      </div>
    </div>
  );
} 