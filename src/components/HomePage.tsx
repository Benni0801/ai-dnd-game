'use client';

import React, { useState } from 'react';
import SupabaseAuthModal from './SupabaseAuthModal';

interface HomePageProps {
  onStartGame: () => void;
  onLogin: () => void;
}

export default function HomePage({ onStartGame, onLogin }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<'updates' | 'blog'>('updates');
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const features = [
    {
      icon: "🎭",
      title: "Character Creation",
      description: "Build unique heroes with custom stats, races, and classes"
    },
    {
      icon: "🧙‍♂️",
      title: "AI Dungeon Master",
      description: "Experience dynamic storytelling and responsive NPCs"
    },
    {
      icon: "🎲",
      title: "Advanced Dice Rolling",
      description: "Roll any combination of dice with critical hit detection"
    },
    {
      icon: "⚔️",
      title: "Combat System",
      description: "Turn-based battles with strategic decision making"
    },
    {
      icon: "📈",
      title: "Character Progression",
      description: "Level up, gain abilities, and unlock powerful spells"
    },
    {
      icon: "🗺️",
      title: "Vast Worlds",
      description: "Explore rich lore, challenging quests, and endless possibilities"
    }
  ];

  const handleAuthSuccess = (user: any) => {
    setShowAuthModal(false);
    onLogin(); // This will trigger the login flow in the parent component
  };

  const handleStartGame = () => {
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-md border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">⚔️</div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    AI D&D
                  </h1>
                  <p className="text-gray-300 text-sm">Epic Adventures Powered by AI</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogin}
                  className="px-6 py-2 bg-purple-600/20 border border-purple-500/50 rounded-lg text-purple-300 hover:bg-purple-600/30 hover:border-purple-400/70 transition-all duration-300 font-medium"
                >
                  🔐 Login
                </button>
                <button
                  onClick={handleStartGame}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-purple-500/25"
                >
                  🎮 Start Game
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Epic Adventures
              </span>
              <br />
              <span className="text-white">Await</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Create your character, embark on quests, and let AI be your Dungeon Master. 
              Experience the most immersive D&D adventure ever created.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartGame}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-purple-500/25 transform hover:-translate-y-1"
              >
                🎮 Start Your Adventure
              </button>
              <button
                onClick={handleLogin}
                className="px-8 py-4 bg-black/20 border border-purple-500/50 rounded-xl text-purple-300 text-lg font-semibold hover:bg-purple-600/20 hover:border-purple-400/70 transition-all duration-300"
              >
                🔐 Sign In
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-white mb-4">Game Features</h3>
              <p className="text-xl text-gray-300">Everything you need for the ultimate D&D experience</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-xl p-1 mb-8">
                  <button
                    onClick={() => setActiveTab('updates')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === 'updates'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-purple-600/20'
                    }`}
                  >
                    📢 Updates
                  </button>
                  <button
                    onClick={() => setActiveTab('blog')}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === 'blog'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-purple-600/20'
                    }`}
                  >
                    📝 Blog
                  </button>
                </div>

                {/* Content */}
                <div className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8">
                  {activeTab === 'updates' && (
                    <div className="space-y-8">
                      <h3 className="text-2xl font-bold text-white mb-6">Latest Updates</h3>
                      {updates.map((update) => (
                        <div key={update.id} className="border-b border-purple-500/20 pb-6 last:border-b-0">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              update.type === 'launch' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                              update.type === 'feature' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {update.type === 'launch' ? '🚀 Launch' :
                               update.type === 'feature' ? '✨ Feature' : '📝 Update'}
                            </span>
                            <span className="text-sm text-gray-400">{update.date}</span>
                          </div>
                          <h4 className="text-xl font-bold text-white mb-2">{update.title}</h4>
                          <p className="text-gray-300">{update.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'blog' && (
                    <div className="space-y-8">
                      <h3 className="text-2xl font-bold text-white mb-6">Latest Blog Posts</h3>
                      {blogPosts.map((post) => (
                        <div key={post.id} className="border-b border-purple-500/20 pb-6 last:border-b-0">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm text-gray-400">{post.date}</span>
                            <span className="text-xs text-gray-500">{post.readTime}</span>
                          </div>
                          <h4 className="text-xl font-bold text-white mb-2">{post.title}</h4>
                          <p className="text-gray-300 mb-3">{post.excerpt}</p>
                          <button className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                            Read more →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Stats */}
                <div className="bg-black/20 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6">📊 Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">1000+</div>
                      <div className="text-sm text-gray-400">Characters Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">500+</div>
                      <div className="text-sm text-gray-400">Adventures Played</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">50+</div>
                      <div className="text-sm text-gray-400">Active Players</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">24/7</div>
                      <div className="text-sm text-gray-400">AI Available</div>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 text-center">
                  <h3 className="text-xl font-bold text-white mb-4">Ready to Start?</h3>
                  <p className="text-gray-300 mb-6">
                    Join thousands of players in epic AI-powered adventures!
                  </p>
                  <button
                    onClick={handleStartGame}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                  >
                    🎮 Start Your Adventure
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black/20 backdrop-blur-md border-t border-purple-500/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400">
              Start your adventure today • Free to play • No downloads required
            </p>
          </div>
        </footer>
      </div>

      {/* Authentication Modal */}
      <SupabaseAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleAuthSuccess}
      />
    </div>
  );
}