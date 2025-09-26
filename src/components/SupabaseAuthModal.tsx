'use client';

import React, { useState, useEffect } from 'react';
import { authService } from '../lib/supabase-auth';

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
  initialMode?: 'login' | 'register';
}

export default function SupabaseAuthModal({ isOpen, onClose, onLogin, initialMode = 'register' }: SupabaseAuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update mode when initialMode prop changes
  useEffect(() => {
    setIsLogin(initialMode === 'login');
    setError('');
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('Form submission started:', { isLogin, formData });
    console.log('Email field:', formData.email);
    console.log('Password field length:', formData.password.length);
    console.log('Username field:', formData.username);

    try {
      if (isLogin) {
        console.log('Attempting login...');
        // Validate login fields
        if (!formData.email || !formData.password) {
          setError('Please enter both email and password');
          setIsLoading(false);
          return;
        }
        
        // Login with email and password
        console.log('About to call authService.signIn...');
        try {
          const result = await authService.signIn(formData.email, formData.password);
          console.log('Login result:', result);
          
          if (result.user) {
            console.log('Login successful, calling onLogin...');
            onLogin(result.user);
            onClose();
          } else {
            console.log('Login failed - no user in result');
            setError('Login failed - please check your credentials');
          }
        } catch (loginError: any) {
          console.error('Login error caught:', loginError);
          setError(loginError.message || 'Login failed');
        }
      } else {
        console.log('Attempting registration...');
        // Register with email and password
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        if (!formData.username || !formData.email || !formData.password) {
          setError('Please fill in all required fields');
          setIsLoading(false);
          return;
        }

        console.log('Calling signUp with:', { email: formData.email, username: formData.username });
        const result = await authService.signUp(formData.email, formData.password, formData.username);
        console.log('Signup result:', result);
        
        if (result.user) {
          console.log('Registration successful!');
          // Check if email confirmation is required
          if (result.user.email_confirmed_at) {
            console.log('Email already confirmed, auto-login...');
            // Auto-login after registration
            const loginResult = await authService.signIn(formData.email, formData.password);
            console.log('Auto-login result:', loginResult);
            if (loginResult.user) {
              onLogin(loginResult.user);
              onClose();
            }
          } else {
            console.log('Email confirmation required');
            setError('✅ Registration successful! Please check your email and click the confirmation link, then try logging in.');
            // Switch to login mode so they can try to login after confirming
            setIsLogin(true);
            // Keep the email and password for easy login after confirmation
            setFormData({ username: '', email: formData.email, password: formData.password, confirmPassword: '' });
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error details:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error status:', error.status);
      
      let errorMessage = 'An error occurred during authentication';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error_description) {
        errorMessage = error.error_description;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            {isLogin ? '🔐 Login' : '📝 Register'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'color 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '8px',
            background: error.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: error.includes('✅') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: error.includes('✅') ? '#6ee7b7' : '#fca5a5'
          }}>
            {error}
          </div>
        )}


        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#94a3b8'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(26, 26, 46, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '1rem'
              }}
              placeholder="Enter your username"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#94a3b8'
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(26, 26, 46, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
                placeholder="Enter your email"
                required
              />
            </div>
          )}

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#94a3b8'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(26, 26, 46, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '1rem'
              }}
              placeholder="Enter your password"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem',
                color: '#94a3b8'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(26, 26, 46, 0.8)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? '⏳ Processing...' : (isLogin ? '🔐 Login' : '📝 Register')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '1px',
              background: '#374151'
            }}></div>
            <div style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <span style={{
                padding: '0 1rem',
                background: '#1a1a2e',
                color: '#9ca3af',
                fontSize: '0.875rem'
              }}>
                Or
              </span>
            </div>
          </div>
          
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  // Only clear form if switching from register to login, keep email/password if switching from login to register
                  if (isLogin) {
                    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                  } else {
                    setFormData({ username: '', email: formData.email, password: formData.password, confirmPassword: '' });
                  }
                }}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '8px',
              color: '#a78bfa',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            }}
          >
            {isLogin ? "📝 Create New Account" : "🔐 Sign In to Existing Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
