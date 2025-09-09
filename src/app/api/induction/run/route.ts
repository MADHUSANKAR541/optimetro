import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const fastapiUrl = process.env.INDUCTION_API_URL;
    
    if (!fastapiUrl) {
      // Return mock data if FastAPI is not configured
      const mockData = {
        results: [
          {
            train_id: 'KMRL-001',
            decision: 'run',
            score: 85.2,
            reasons: ['Fitness valid', 'Branding exposure bonus 8.5']
          },
          {
            train_id: 'KMRL-002',
            decision: 'standby',
            score: 45.1,
            reasons: ['Open high-priority job cards', 'Mileage fatigue -3.2']
          },
          {
            train_id: 'KMRL-003',
            decision: 'maintenance',
            score: -25.8,
            reasons: ['Fitness expired', 'Mileage fatigue -4.5']
          },
          {
            train_id: 'KMRL-004',
            decision: 'run',
            score: 78.9,
            reasons: ['Fitness valid', 'Branding exposure bonus 6.7']
          },
          {
            train_id: 'KMRL-005',
            decision: 'standby',
            score: 32.4,
            reasons: ['Open high-priority job cards', 'Mileage fatigue -2.8']
          },
          {
            train_id: 'KMRL-006',
            decision: 'run',
            score: 72.3,
            reasons: ['Fitness valid', 'Branding exposure bonus 7.6']
          },
          {
            train_id: 'KMRL-007',
            decision: 'run',
            score: 91.5,
            reasons: ['Fitness valid', 'Branding exposure bonus 9.2']
          },
          {
            train_id: 'KMRL-008',
            decision: 'standby',
            score: 38.7,
            reasons: ['Open high-priority job cards', 'Mileage fatigue -2.1']
          },
          {
            train_id: 'KMRL-009',
            decision: 'run',
            score: 68.4,
            reasons: ['Fitness valid']
          },
          {
            train_id: 'KMRL-010',
            decision: 'run',
            score: 82.1,
            reasons: ['Fitness valid', 'Branding exposure bonus 7.8']
          },
          {
            train_id: 'KMRL-011',
            decision: 'standby',
            score: 29.6,
            reasons: ['Open high-priority job cards', 'Mileage fatigue -2.4']
          },
          {
            train_id: 'KMRL-012',
            decision: 'run',
            score: 75.8,
            reasons: ['Fitness valid', 'Branding exposure bonus 4.9']
          }
        ]
      };
      
      return NextResponse.json(mockData);
    }

    // Call FastAPI backend
    const response = await fetch(`${fastapiUrl}/induction/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`FastAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Induction API error:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to run induction optimization' },
      { status: 500 }
    );
  }
}