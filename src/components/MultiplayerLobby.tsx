'use client';

import React, { useState, useEffect } from 'react';

interface GameRoom {
  id: string;
  name: string;
  players: string[];
  dmId: string;
  isActive: boolean;
  createdAt: string;
}

interface MultiplayerLobbyProps {
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (roomName: string) => void;
  onBack: () => void;
  currentUserId?: string;
}

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onJoinRoom,
  onCreateRoom,
  onBack,
  currentUserId
}) => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setError('Please enter a room name');
      return;
    }

    if (!currentUserId) {
      setError('You must be logged in to create a room');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          dmId: currentUserId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onCreateRoom(data.room.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create room');
      }
    } catch (error) {
      setError('Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!currentUserId) {
      setError('You must be logged in to join a room');
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          userId: currentUserId
        }),
      });

      if (response.ok) {
        onJoinRoom(roomId);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join room');
      }
    } catch (error) {
      setError('Failed to join room');
    }
  };

  return (
    <div className="min-h-screen bg-dnd-darker text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-dnd-gold mb-2">Multiplayer Lobby</h1>
          <p className="text-gray-300">Join an existing game room or create your own</p>
        </div>

        {/* Create Room Section */}
        <div className="bg-dnd-dark border border-dnd-gold rounded p-6 mb-6">
          <h2 className="text-xl font-bold text-dnd-gold mb-4">Create New Room</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="flex-1 bg-dnd-darker border border-dnd-gold rounded px-3 py-2 text-white"
              placeholder="Enter room name"
            />
            <button
              onClick={handleCreateRoom}
              disabled={!newRoomName.trim() || isLoading}
              className="bg-dnd-gold hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-dnd-darker px-6 py-2 rounded font-bold"
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="bg-dnd-dark border border-dnd-gold rounded p-6">
          <h2 className="text-xl font-bold text-dnd-gold mb-4">Available Rooms</h2>
          
          {error && (
            <div className="bg-red-900 border border-red-500 rounded p-4 mb-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {rooms.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No active rooms available</p>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div key={room.id} className="bg-dnd-darker border border-dnd-gold rounded p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-dnd-gold">{room.name}</h3>
                      <p className="text-sm text-gray-400">
                        Players: {room.players.length} | Created: {new Date(room.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="bg-dnd-red hover:bg-red-700 text-white px-4 py-2 rounded font-bold"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={onBack}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded"
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;



