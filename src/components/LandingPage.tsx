'use client';

import React, { useState } from 'react';
import { authService } from '../lib/supabase-auth';
import SupabaseAuthModal from './SupabaseAuthModal';

interface LandingPageProps {
  onLogin: (user: any) => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  const handleEmailAuth = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)' }}>
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, var(--primary-purple) 0%, transparent 70%)' }}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, var(--accent-purple) 0%, transparent 70%)' }}></div>
        </div>

        <div className="glass-card max-w-4xl w-full p-8 md:p-12 text-center relative">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 purple-gradient bg-clip-text text-transparent">
              ⚔️ AI D&D
            </h1>
            <p className="text-xl md:text-2xl mb-4" style={{ color: 'var(--text-light)' }}>
              Epic Adventures Await
            </p>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
              Create your character, embark on quests, and let AI be your Dungeon Master
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-panel p-6">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-light)' }}>
                Create Characters
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Build up to 4 unique characters with races, classes, and abilities
              </p>
            </div>
            
            <div className="glass-panel p-6">
              <div className="text-4xl mb-4">🧙‍♂️</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-light)' }}>
                AI Dungeon Master
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Advanced AI creates immersive stories and responds to your actions
              </p>
            </div>
            
            <div className="glass-panel p-6">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-light)' }}>
                Full D&D Experience
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Dice rolling, combat, inventory, spells, and character progression
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900 bg-opacity-50 border border-red-500 text-red-200">
              {error}
            </div>
          )}

          {/* Authentication Options */}
          <div className="space-y-4">
            <button
              onClick={handleEmailAuth}
              className="btn-primary w-full max-w-md mx-auto py-4 px-6 text-lg font-semibold"
            >
              🎮 Start Your Adventure
            </button>
            
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Create an account or sign in to save your characters and continue your journey
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Start your adventure today • Free to play • No downloads required
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <SupabaseAuthModal
          isOpen={true}
          onClose={() => setShowAuthModal(false)}
          onLogin={onLogin}
        />
      )}
    </div>
  );
}
