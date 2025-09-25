'use client';

import React, { useState } from 'react';

interface RusticGameLayoutProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  header?: React.ReactNode;
}

export default function RusticGameLayout({ 
  children, 
  leftPanel, 
  rightPanel, 
  header 
}: RusticGameLayoutProps) {
  return (
    <div className="min-h-screen rustic-background">
      {/* Rustic Wooden Background */}
      <div className="fixed inset-0 rustic-wood-bg opacity-20"></div>
      
      {/* Main Container */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        {header && (
          <div className="rustic-header">
            {header}
          </div>
        )}

        {/* Three Panel Layout */}
        <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
          {/* Left Panel - Character Sheet */}
          <div className="w-80 rustic-panel">
            <div className="rustic-panel-content">
              {leftPanel || (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-4">⚔️</div>
                  <p>Character Sheet</p>
                </div>
              )}
            </div>
          </div>

          {/* Middle Panel - Main Content */}
          <div className="flex-1 rustic-panel">
            <div className="rustic-panel-content h-full">
              {children}
            </div>
          </div>

          {/* Right Panel - Game Tools */}
          <div className="w-80 rustic-panel">
            <div className="rustic-panel-content">
              {rightPanel || (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-4">🎲</div>
                  <p>Game Tools</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



