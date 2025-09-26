import { NextRequest, NextResponse } from 'next/server';

// Temporary placeholder for users API
export async function GET(request: NextRequest) {
  return NextResponse.json({ users: [] });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Users API temporarily disabled' });
}