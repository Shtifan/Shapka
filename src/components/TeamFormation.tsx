'use client';

import { useState, useEffect } from 'react';
import { Player, Team } from '../lib/types';

interface TeamFormationProps {
  players: Player[];
  onTeamsFormed: (teams: Team[]) => void;
  roomOwner: boolean;
  playerId: string;
}

export default function TeamFormation({ players, onTeamsFormed, roomOwner, playerId }: TeamFormationProps) {
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Team 1', players: [], score: 0 },
    { id: '2', name: 'Team 2', players: [], score: 0 }
  ]);
  const [unassignedPlayers, setUnassignedPlayers] = useState<Player[]>(players);
  const [selectedTeams, setSelectedTeams] = useState<{[playerId: string]: string}>({});
  const [canStart, setCanStart] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Update unassigned players when props change
    const assignedPlayerIds = teams.flatMap(team => team.players.map(p => p.id));
    
    // Remove duplicates before setting unassigned players
    const uniquePlayers = players.filter((player, index, self) => 
      self.findIndex(p => p.id === player.id) === index
    );
    
    const newUnassignedPlayers = uniquePlayers.filter(p => !assignedPlayerIds.includes(p.id));
    setUnassignedPlayers(newUnassignedPlayers);
    
    // Check if we can start (at least 2 teams with at least 2 players each)
    const validTeams = teams.filter(team => team.players.length >= 2);
    const canStartGame = validTeams.length >= 2;
    setCanStart(canStartGame);
    
    if (!canStartGame && teams.some(team => team.players.length > 0)) {
      // Find teams with fewer than 2 players
      const invalidTeams = teams.filter(team => team.players.length > 0 && team.players.length < 2)
                               .map(team => team.name);
      
      if (invalidTeams.length > 0) {
        setErrorMessage(`Teams need at least 2 players each. ${invalidTeams.join(', ')} ${invalidTeams.length === 1 ? 'needs' : 'need'} more players.`);
      } else {
        setErrorMessage('At least 2 teams with at least 2 players each are required.');
      }
    } else {
      setErrorMessage('');
    }
  }, [players, teams]);

  // Initialize default team selection for each player
  useEffect(() => {
    const newSelectedTeams = {...selectedTeams};
    unassignedPlayers.forEach(player => {
      if (!newSelectedTeams[player.id]) {
        newSelectedTeams[player.id] = teams[0]?.id || '1';
      }
    });
    setSelectedTeams(newSelectedTeams);
  }, [unassignedPlayers, teams]);

  const handleJoinTeam = (playerId: string) => {
    // Get the selected team for this player
    const teamId = selectedTeams[playerId] || teams[0]?.id;
    if (!teamId) return;
    
    // Find the player
    const player = unassignedPlayers.find(p => p.id === playerId);
    if (!player) return;
    
    // Update teams
    const updatedTeams = teams.map(team => {
      if (team.id === teamId) {
        return { ...team, players: [...team.players, { ...player, teamId }] };
      }
      return team;
    });
    
    setTeams(updatedTeams);
    setUnassignedPlayers(unassignedPlayers.filter(p => p.id !== playerId));
  };

  const handleAddTeam = () => {
    const newTeamId = (teams.length + 1).toString();
    setTeams([...teams, { id: newTeamId, name: `Team ${newTeamId}`, players: [], score: 0 }]);
  };

  const handleRemoveTeam = (teamId: string) => {
    // Move players back to unassigned
    const teamToRemove = teams.find(t => t.id === teamId);
    if (!teamToRemove) return;
    
    setUnassignedPlayers([...unassignedPlayers, ...teamToRemove.players]);
    setTeams(teams.filter(t => t.id !== teamId));
  };

  const handleRemovePlayerFromTeam = (playerId: string, teamId: string) => {
    // Find the team and player
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const player = team.players.find(p => p.id === playerId);
    if (!player) return;
    
    // Update teams
    const updatedTeams = teams.map(t => {
      if (t.id === teamId) {
        return { ...t, players: t.players.filter(p => p.id !== playerId) };
      }
      return t;
    });
    
    setTeams(updatedTeams);
    setUnassignedPlayers([...unassignedPlayers, player]);
  };

  const handleStartGame = () => {
    if (canStart && roomOwner) {
      onTeamsFormed(teams.filter(team => team.players.length >= 2));
    }
  };

  const isPlayerInTeam = (team: Team) => {
    return team.players.some(player => player.id === playerId);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg h-[80vh] max-h-[600px] flex flex-col">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-center text-gray-900">Form Teams</h2>
        <p className="text-gray-700 text-center text-sm">At least 2 teams with at least 2 players each are required</p>
      </div>
      
      {errorMessage && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center text-sm mb-2">
          {errorMessage}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto">
        {/* Teams */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">Teams</span>
            {canStart && roomOwner && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Ready to Start!
              </span>
            )}
          </h3>
          
          <div className="space-y-2 overflow-y-auto pr-1" style={{maxHeight: "calc(100% - 2rem)"}}>
            {teams.map(team => (
              <div 
                key={team.id} 
                className={`p-3 border rounded-lg bg-white transition-all ${
                  team.players.length < 2 && team.players.length > 0 
                    ? 'border-yellow-300 shadow-md' 
                    : team.players.length >= 2 
                      ? 'border-green-300 shadow-md' 
                      : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium text-sm text-gray-900">
                    {team.name}
                    {team.players.length > 0 && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {team.players.length} {team.players.length === 1 ? 'player' : 'players'}
                      </span>
                    )}
                  </h4>
                  {teams.length > 2 && roomOwner && (
                    <button
                      onClick={() => handleRemoveTeam(team.id)}
                      className="text-red-600 hover:text-red-800 px-1 py-0.5 rounded hover:bg-red-50 transition-colors text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <ul className="space-y-1">
                  {(roomOwner ? team.players : team.players.filter(p => p.id === playerId)).map(player => (
                    <li key={`team-${team.id}-player-${player.id}`} className="flex items-center justify-between p-1 bg-gray-50 rounded-md text-sm">
                      <span className="text-gray-800">{player.name} {player.id === playerId && <span className="text-xs text-blue-600">(You)</span>}</span>
                      {(roomOwner || player.id === playerId) && (
                        <button 
                          onClick={() => handleRemovePlayerFromTeam(player.id, team.id)}
                          className="text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                  {team.players.length === 0 && (
                    <li className="text-xs text-gray-500 p-1 bg-gray-50 rounded-md">No players in this team yet</li>
                  )}
                  {!roomOwner && team.players.length > 0 && !team.players.some(p => p.id === playerId) && (
                    <li className="text-xs text-gray-500 p-1 bg-gray-50 rounded-md">Join this team to see members</li>
                  )}
                </ul>
              </div>
            ))}
            
            {roomOwner && (
              <button
                onClick={handleAddTeam}
                className="w-full py-1 px-2 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400 flex items-center justify-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Team
              </button>
            )}
          </div>
        </div>
        
        {/* Unassigned Players */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">Unassigned Players</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {unassignedPlayers.length} available
            </span>
          </h3>
          
          <div className="space-y-2 overflow-y-auto pr-1" style={{maxHeight: "calc(100% - 2rem)"}}>
            {unassignedPlayers.map((player, index) => (
              <div key={`unassigned-${player.id}-${index}`} className="p-2 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-medium text-sm">{player.name}</span>
                  
                  <div className="flex items-center space-x-1">
                    <select
                      value={selectedTeams[player.id] || '1'}
                      onChange={(e) => setSelectedTeams({...selectedTeams, [player.id]: e.target.value})}
                      className="p-1 text-xs border border-gray-300 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {teams.map(team => (
                        <option key={`team-option-${team.id}`} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => handleJoinTeam(player.id)}
                      className="py-1 px-2 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-md hover:from-blue-800 hover:to-indigo-800 transition-colors flex items-center text-xs"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {unassignedPlayers.length === 0 && (
              <div className="p-3 border border-gray-200 rounded-lg bg-white text-center text-gray-500 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p>All players have been assigned to teams!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        {roomOwner && (
          <button
            onClick={handleStartGame}
            disabled={!canStart}
            className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Game
          </button>
        )}
        
        {!roomOwner && (
          <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-t-2 border-blue-600 border-solid rounded-full animate-spin mr-2"></div>
              <p className="text-center text-blue-700 font-medium text-sm">Waiting for room owner to start the game...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 