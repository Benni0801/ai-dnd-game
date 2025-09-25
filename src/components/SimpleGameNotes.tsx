'use client';

import React, { useState, useEffect } from 'react';

interface GameNote {
  id: string;
  content: string;
  category: 'general' | 'quest' | 'npc' | 'location' | 'loot';
  createdAt: Date;
}

interface SimpleGameNotesProps {
  className?: string;
}

const SimpleGameNotes: React.FC<SimpleGameNotesProps> = ({ className = '' }) => {
  const [notes, setNotes] = useState<GameNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameNote['category']>('general');
  const [showAddForm, setShowAddForm] = useState(false);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('dnd_game_notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt)
        }));
        setNotes(parsedNotes);
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('dnd_game_notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: GameNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      category: selectedCategory,
      createdAt: new Date()
    };

    setNotes(prev => [note, ...prev]);
    setNewNote('');
    setShowAddForm(false);
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const getCategoryIcon = (category: GameNote['category']) => {
    switch (category) {
      case 'quest': return '📜';
      case 'npc': return '👤';
      case 'location': return '🗺️';
      case 'loot': return '💎';
      default: return '📝';
    }
  };

  const getCategoryColor = (category: GameNote['category']) => {
    switch (category) {
      case 'quest': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'npc': return 'bg-green-100 text-green-800 border-green-200';
      case 'location': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'loot': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`fantasy-card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="rustic-title text-lg">📝 Adventure Notes</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rustic-button text-sm"
        >
          {showAddForm ? 'Cancel' : '+ Add Note'}
        </button>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-dnd-darker rounded-lg border border-dnd-gold">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-dnd-gold mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as GameNote['category'])}
                className="rustic-input text-sm"
              >
                <option value="general">📝 General</option>
                <option value="quest">📜 Quest</option>
                <option value="npc">👤 NPC</option>
                <option value="location">🗺️ Location</option>
                <option value="loot">💎 Loot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dnd-gold mb-1">
                Note
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your note here..."
                className="rustic-input text-sm min-h-[80px]"
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="rustic-button text-sm disabled:opacity-50"
              >
                Save Note
              </button>
              <button
                onClick={() => {
                  setNewNote('');
                  setShowAddForm(false);
                }}
                className="rustic-button text-sm bg-gray-600 hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto rustic-scrollbar">
        {notes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-sm">No notes yet. Add your first note above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-dnd-dark rounded-lg border border-gray-700 hover:border-dnd-gold transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(note.category)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(note.category)}`}>
                    {note.category}
                  </span>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-gray-400 hover:text-red-400 text-sm"
                  title="Delete note"
                >
                  ✕
                </button>
              </div>
              <p className="rustic-text text-sm leading-relaxed">{note.content}</p>
              <div className="text-xs text-gray-400 mt-2">
                {note.createdAt.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SimpleGameNotes;


