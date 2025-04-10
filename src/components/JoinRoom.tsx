'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const joinRoom = async () => {
    if (!roomId.trim() || !playerName.trim()) return;
    
    setIsJoining(true);
    
    // Store player info in localStorage
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('playerId', Math.random().toString(36).substring(2, 9));
    
    // Navigate to the room
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto p-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
      <div className="text-center mb-6">
        <div className="bg-indigo-100 text-indigo-700 p-3 rounded-full inline-flex mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-900">Join a Game Room</h2>
        <p className="text-gray-600 mt-2">Enter the room ID shared by your friend to join their game</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
            Room ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <input
              type="text"
              id="roomId"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID (e.g. a1b2c3d)"
            />
          </div>
        </div>
        
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
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4">
        <button
          onClick={joinRoom}
          disabled={!roomId.trim() || !playerName.trim() || isJoining}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-700 to-purple-700 text-white font-semibold rounded-lg hover:from-indigo-800 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
        >
          {isJoining ? (
            <>
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
              Joining...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Join Room
            </>
          )}
        </button>
      </div>
      
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mt-4">
        <p className="text-indigo-800 text-sm">
          <span className="font-bold">Tip:</span> Make sure you have the correct room ID. Ask the room creator if you're unsure.
        </p>
      </div>
    </div>
  );
} 