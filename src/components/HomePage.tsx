'use client';

import React, { useState } from 'react';

interface HomePageProps {
  onStartGame: () => void;
  onLogin: () => void;
}

export default function HomePage({ onStartGame, onLogin }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<'updates' | 'blog'>('updates');

  const updates = [
    {
      id: 1,
      title: "🎮 AI D&D Game Launched!",
      date: "September 26, 2024",
      content: "Welcome to the most immersive AI-powered D&D experience! Create characters, embark on epic quests, and let our advanced AI be your Dungeon Master.",
      type: "launch"
    },
    {
      id: 2,
      title: "⚔️ Combat System Enhanced",
      date: "September 25, 2024",
      content: "New turn-based combat system with dice rolling, damage calculation, and strategic decision making. Experience battles like never before!",
      type: "feature"
    },
    {
      id: 3,
      title: "🎲 Advanced Dice Rolling",
      date: "September 24, 2024",
      content: "Roll any combination of dice with our advanced dice roller. Supports all D&D dice types with critical hit detection and fumble mechanics.",
      type: "feature"
    },
    {
      id: 4,
      title: "📚 Character Progression System",
      date: "September 23, 2024",
      content: "Level up your characters, gain new abilities, and unlock powerful spells. Track your XP and watch your character grow stronger!",
      type: "feature"
    }
  ];

  const blogPosts = [
    {
      id: 1,
      title: "The Future of AI in Tabletop Gaming",
      date: "September 26, 2024",
      excerpt: "Exploring how artificial intelligence is revolutionizing the way we play D&D and other tabletop games...",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Creating Memorable D&D Characters",
      date: "September 25, 2024",
      excerpt: "Tips and tricks for building characters that will stand out in your campaigns and create lasting memories...",
      readTime: "7 min read"
    },
    {
      id: 3,
      title: "The Art of AI Dungeon Mastering",
      date: "September 24, 2024",
      excerpt: "How our AI creates dynamic, engaging stories that adapt to your choices and keep you on the edge of your seat...",
      readTime: "6 min read"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)' }}>
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="glass-panel m-4 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold purple-gradient bg-clip-text text-transparent mb-2">
                ⚔️ AI D&D
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
                Epic Adventures Powered by AI
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onLogin}
                className="btn-secondary px-6 py-2"
              >
                🔐 Login
              </button>
              <button
                onClick={onStartGame}
                className="btn-primary px-6 py-2"
              >
                🎮 Start Game
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 m-4">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tab Navigation */}
            <div className="glass-panel p-4 mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('updates')}
                  className={`tab-button ${activeTab === 'updates' ? 'active' : ''}`}
                >
                  📢 Updates
                </button>
                <button
                  onClick={() => setActiveTab('blog')}
                  className={`tab-button ${activeTab === 'blog' ? 'active' : ''}`}
                >
                  📝 Blog
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="glass-panel p-6">
              {activeTab === 'updates' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-light)' }}>
                    Latest Updates
                  </h2>
                  {updates.map((update) => (
                    <div key={update.id} className="border-b border-gray-700 pb-6 last:border-b-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          update.type === 'launch' ? 'bg-green-900 text-green-200' :
                          update.type === 'feature' ? 'bg-blue-900 text-blue-200' :
                          'bg-purple-900 text-purple-200'
                        }`}>
                          {update.type === 'launch' ? '🚀 Launch' :
                           update.type === 'feature' ? '✨ Feature' : '📝 Update'}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {update.date}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-light)' }}>
                        {update.title}
                      </h3>
                      <p style={{ color: 'var(--text-muted)' }}>
                        {update.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'blog' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-light)' }}>
                    Latest Blog Posts
                  </h2>
                  {blogPosts.map((post) => (
                    <div key={post.id} className="border-b border-gray-700 pb-6 last:border-b-0">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {post.date}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-light)' }}>
                        {post.title}
                      </h3>
                      <p style={{ color: 'var(--text-muted)' }}>
                        {post.excerpt}
                      </p>
                      <button className="mt-3 text-sm hover:text-purple-300 transition-colors" style={{ color: 'var(--primary-purple)' }}>
                        Read more →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Game Features */}
            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-light)' }}>
                🎮 Game Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎭</span>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-light)' }}>Character Creation</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Build unique heroes</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧙‍♂️</span>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-light)' }}>AI Dungeon Master</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Intelligent storytelling</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎲</span>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-light)' }}>Dice Rolling</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>All D&D dice types</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-light)' }}>Combat System</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Turn-based battles</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📈</span>
                  <div>
                    <div className="font-medium" style={{ color: 'var(--text-light)' }}>Character Progression</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Level up & gain abilities</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-panel p-6">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-light)' }}>
                📊 Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary-purple)' }}>1000+</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Characters Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary-purple)' }}>500+</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Adventures Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary-purple)' }}>50+</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Active Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary-purple)' }}>24/7</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>AI Available</div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="glass-panel p-6 text-center">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-light)' }}>
                Ready to Start?
              </h3>
              <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
                Join thousands of players in epic AI-powered adventures!
              </p>
              <button
                onClick={onStartGame}
                className="btn-primary w-full py-3"
              >
                🎮 Start Your Adventure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
