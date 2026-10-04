import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, query, feedback, selected_verses } = body;
    
    console.log('Feedback received:', { 
      session_id, 
      query, 
      feedback, 
      selected_verses,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      message: 'Thank you for your feedback! This helps improve our search.',
      feedback_id: `fb_${Date.now()}`
    });
    
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({
      error: 'Failed to process feedback'
    }, { status: 500 });
  }
}
