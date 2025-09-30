import { NextRequest, NextResponse } from 'next/server';
import { storyDb } from '../../../lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
}

// GET - Get all stories for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stories = storyDb.findByUserId(user.userId);
    
    return NextResponse.json({
      stories,
      count: stories.length,
      limit: 2
    });

  } catch (error) {
    console.error('Get stories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new story
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check story limit
    const currentCount = storyDb.countByUserId(user.userId);
    if (currentCount >= 2) {
      return NextResponse.json(
        { error: 'Story limit reached. Maximum 2 stories allowed.' },
        { status: 400 }
      );
    }

    const storyData = await request.json();

    // Validate required fields
    if (!storyData.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create story
    const result = storyDb.create(user.userId, storyData);
    
    return NextResponse.json({
      message: 'Story created successfully',
      storyId: result.lastInsertRowid
    });

  } catch (error) {
    console.error('Create story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


