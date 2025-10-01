'use client';

import React from 'react';

export default function EnvCheck() {
  const checkEnv = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Environment Check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    
    if (supabaseUrl) {
      console.log('URL value:', supabaseUrl);
    }
    
    if (supabaseKey) {
      console.log('Key value (first 20 chars):', supabaseKey.substring(0, 20) + '...');
    }
    
    return {
      urlSet: !!supabaseUrl,
      keySet: !!supabaseKey,
      url: supabaseUrl,
      key: supabaseKey
    };
  };

  return (
    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', margin: '1rem' }}>
      <h3>Environment Check</h3>
      <button 
        onClick={checkEnv}
        style={{
          padding: '0.5rem 1rem',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Check Environment Variables
      </button>
    </div>
  );
}




