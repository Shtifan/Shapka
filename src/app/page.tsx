'use client';

import { useState } from 'react';
import RoomCreation from '@/components/RoomCreation';
import JoinRoom from '@/components/JoinRoom';

export default function Home() {
  const [view, setView] = useState<'main' | 'create' | 'join'>('main');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <header className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
            Shapka
          </h1>
          <p className="text-gray-700 text-xl font-medium max-w-2xl mx-auto">
            A fun team-based word game for friends and family to enjoy together!
          </p>
        </header>

        {view === 'main' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 transform transition-all hover:scale-[1.02] flex flex-col">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 flex items-center">
                <span className="bg-blue-100 text-blue-700 p-2 rounded-full mr-3 inline-flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                How to Play
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-800 flex-grow">
                <li className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  Form teams of at least <strong className="text-blue-700">2 players</strong> each (minimum 2 teams)
                </li>
                <li className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  Each player submits 5 words that will be used in the game
                </li>
                <li className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <strong className="text-blue-700">Round 1:</strong> Describe the word to your teammate without saying the word itself (60 seconds per team)
                </li>
                <li className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <strong className="text-blue-700">Round 2:</strong> Describe the word using only ONE word (60 seconds per team)
                </li>
                <li className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <strong className="text-blue-700">Round 3:</strong> Draw the word for your teammate to guess (60 seconds per team)
                </li>
                <li className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  The team with the most points at the end wins!
                </li>
              </ol>
            </div>

            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 flex flex-col">
              <h2 className="text-3xl font-bold mb-4 text-center text-gray-900 flex items-center justify-center">
                <span className="bg-indigo-100 text-indigo-700 p-2 rounded-full mr-3 inline-flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </span>
                Get Started
              </h2>
              
              <div className="flex-grow flex flex-col justify-center space-y-4 mb-2">
                <div className="rounded-lg bg-blue-50 p-4 text-blue-800 border border-blue-100">
                  <h3 className="font-semibold text-xl mb-2">Create a Room</h3>
                  <p className="mb-3 text-blue-700">Start a new game and invite your friends to join.</p>
                  <button
                    onClick={() => setView('create')}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-semibold rounded-lg hover:from-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all hover:scale-[1.02] shadow-lg mt-2 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create a Room
                  </button>
                </div>
                
                <div className="rounded-lg bg-indigo-50 p-4 text-indigo-800 border border-indigo-100">
                  <h3 className="font-semibold text-xl mb-2">Join a Room</h3>
                  <p className="mb-3 text-indigo-700">Enter a room ID to join an existing game.</p>
                  <button
                    onClick={() => setView('join')}
                    className="w-full py-3 px-6 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transform transition-all hover:scale-[1.02] shadow-lg border border-gray-200 mt-2 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    Join a Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setView('main')}
              className="mb-6 text-blue-700 hover:text-blue-800 flex items-center group transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
            <RoomCreation />
          </div>
        )}

        {view === 'join' && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setView('main')}
              className="mb-6 text-blue-700 hover:text-blue-800 flex items-center group transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </button>
            <JoinRoom />
          </div>
        )}
        
        <footer className="mt-10 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Shapka Game. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
