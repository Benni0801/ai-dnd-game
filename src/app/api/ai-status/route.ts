import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if we have Google API key for AI functionality
    const hasGoogleAPI = !!process.env.GOOGLE_API_KEY;
    
    if (hasGoogleAPI) {
      return NextResponse.json({
        status: 'online',
        message: 'AI ready with Google Gemini',
        models: [{
          name: 'gemini-1.5-flash',
          size: 0,
          modified: new Date().toISOString()
        }],
        hasModel: true,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fallback mode - no AI but still functional
      return NextResponse.json({
        status: 'fallback',
        message: 'AI in fallback mode - using predefined responses',
        models: [{
          name: 'fallback-dm',
          size: 0,
          modified: new Date().toISOString()
        }],
        hasModel: true,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error checking AI status:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Error checking AI status',
      models: [],
      hasModel: false,
      timestamp: new Date().toISOString()
    });
  }
}



