'use client';

import React, { useState, useEffect } from 'react';

interface ActionLogEntry {
  id: string;
  type: 'damage' | 'heal' | 'xp' | 'level' | 'item' | 'stat';
  message: string;
  timestamp: Date;
  icon: string;
}

interface ActionLogProps {
  entries: ActionLogEntry[];
  onClear?: () => void;
}

const ActionLog: React.FC<ActionLogProps> = ({ entries, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getEntryColor = (type: ActionLogEntry['type']) => {
    switch (type) {
      case 'damage': return 'text-red-400';
      case 'heal': return 'text-green-400';
      case 'xp': return 'text-yellow-400';
      case 'level': return 'text-purple-400';
      case 'item': return 'text-blue-400';
      case 'stat': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getEntryBg = (type: ActionLogEntry['type']) => {
    switch (type) {
      case 'damage': return 'bg-red-900/20 border-red-500/30';
      case 'heal': return 'bg-green-900/20 border-green-500/30';
      case 'xp': return 'bg-yellow-900/20 border-yellow-500/30';
      case 'level': return 'bg-purple-900/20 border-purple-500/30';
      case 'item': return 'bg-blue-900/20 border-blue-500/30';
      case 'stat': return 'bg-cyan-900/20 border-cyan-500/30';
      default: return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-purple-500/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <h3 className="text-purple-300 font-semibold text-sm">Action Log</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-400 hover:text-purple-300 transition-colors text-xs"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          {onClear && (
            <button
              onClick={onClear}
              className="text-gray-400 hover:text-gray-300 transition-colors text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {entries.length === 0 ? (
            <div className="text-center text-gray-500 text-xs py-4">
              No actions yet...
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`p-2 rounded border text-xs transition-all duration-300 ${getEntryBg(entry.type)} ${getEntryColor(entry.type)}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{entry.icon}</span>
                  <span className="flex-1">{entry.message}</span>
                  <span className="text-gray-500 text-xs">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ActionLog;
