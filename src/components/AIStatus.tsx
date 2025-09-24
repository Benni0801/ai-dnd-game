'use client';

import { useState, useEffect } from 'react';

interface AIStatusData {
  status: 'online' | 'offline' | 'error';
  message: string;
  models: Array<{
    name: string;
    size: number;
    modified: string;
  }>;
  hasModel: boolean;
  timestamp: string;
}

interface AIStatusProps {
  selectedModel?: string;
}

export default function AIStatus({ selectedModel }: AIStatusProps = {}) {
  const [status, setStatus] = useState<AIStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai-status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        status: 'error',
        message: 'Failed to check AI status',
        models: [],
        hasModel: false,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Update status every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Checking AI status...</span>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const getStatusColor = () => {
    switch (status.status) {
      case 'online':
        return status.hasModel ? 'bg-green-500' : 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'online':
        return status.hasModel ? 'AI Ready' : 'AI Service Running';
      case 'offline':
        return 'AI Offline';
      case 'error':
        return 'AI Error';
      default:
        return 'Unknown';
    }
  };

  const formatModelSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-600 max-w-xs">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      <div className="text-xs text-gray-300 mb-2">
        {status.message}
      </div>
      
      {selectedModel && (
        <div className="text-xs text-blue-300 mb-2">
          Active Model: {selectedModel}
        </div>
      )}
      
      {status.models.length > 0 && (
        <div className="text-xs">
          <div className="text-gray-400 mb-1">Loaded Models:</div>
          {status.models.map((model, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-blue-300 truncate">{model.name}</span>
              <span className="text-gray-400 ml-2">{formatModelSize(model.size)}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-2">
        Last updated: {new Date(status.timestamp).toLocaleTimeString()}
      </div>
      
      <button 
        onClick={fetchStatus}
        className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
      >
        Refresh Status
      </button>
    </div>
  );
}
