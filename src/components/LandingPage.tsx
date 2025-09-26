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

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      await authService.signInWithGoogle();
    } catch (error: any) {
      setError(error.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

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
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full max-w-md mx-auto py-4 px-6 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-400">Or</span>
              </div>
            </div>

            <button
              onClick={handleEmailAuth}
              className="btn-primary w-full max-w-md mx-auto py-4 px-6 text-lg font-semibold"
            >
              📧 Sign in with Email
            </button>
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
