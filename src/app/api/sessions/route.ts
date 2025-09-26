import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder for sessions API
export async function GET(request: NextRequest) {
  return NextResponse.json({ sessions: [] });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Sessions API temporarily disabled' });
}