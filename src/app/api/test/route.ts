import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: process.env.GOOGLE_API_KEY ? 'API key is set' : 'API key is missing'
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST endpoint is working!',
    timestamp: new Date().toISOString()
  });
}