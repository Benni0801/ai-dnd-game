import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder for notes API
export async function GET(request: NextRequest) {
  return NextResponse.json({ notes: [] });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Notes API temporarily disabled' });
}