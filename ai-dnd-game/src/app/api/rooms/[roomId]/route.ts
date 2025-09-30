import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  return NextResponse.json(
    { error: 'Multiplayer rooms are handled by Supabase' },
    { status: 501 }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  return NextResponse.json(
    { error: 'Multiplayer rooms are handled by Supabase' },
    { status: 501 }
  );
}
