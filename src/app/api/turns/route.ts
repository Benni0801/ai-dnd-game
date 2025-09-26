import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder for turns API
export async function GET(request: NextRequest) {
  return NextResponse.json({ turns: [] });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Turns API temporarily disabled' });
}