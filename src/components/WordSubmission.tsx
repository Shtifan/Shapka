'use client';

import { useState } from 'react';
import { Word } from '../lib/types';

interface WordSubmissionProps {
  playerId: string;
  onSubmit: (words: string[]) => void;
}

export default function WordSubmission({ playerId, onSubmit }: WordSubmissionProps) {
  const [words, setWords] = useState<string[]>(Array(5).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    
    // Validate all words are filled
    if (words.some(word => !word.trim())) {
      alert('Please fill in all 5 words');
      return;
    }
    
    setIsSubmitting(true);
    onSubmit(words);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md h-[80vh] max-h-[600px] flex flex-col">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-center text-gray-900">Submit Your Words</h2>
        <p className="text-gray-700 text-center text-sm">Enter 5 words that will be used in the game</p>
      </div>
      
      <div className="space-y-2 flex-1 overflow-y-auto">
        {words.map((word, index) => (
          <div key={index} className="flex items-center space-x-2">
            <label htmlFor={`word-${index}`} className="text-sm font-medium text-gray-700 w-16">
              Word {index + 1}:
            </label>
            <input
              type="text"
              id={`word-${index}`}
              className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 bg-white text-sm"
              value={word}
              onChange={(e) => handleWordChange(index, e.target.value)}
              placeholder={`Enter word ${index + 1}`}
              maxLength={30}
            />
          </div>
        ))}
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || words.some(word => !word.trim())}
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white font-semibold rounded-md hover:from-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-3"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Words'}
      </button>
    </div>
  );
} 