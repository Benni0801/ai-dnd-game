import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder for rooms API
export async function GET(request: NextRequest) {
  return NextResponse.json({ rooms: [] });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Rooms API temporarily disabled' });
}