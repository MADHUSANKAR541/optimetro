import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read train data from JSON file
function getTrainData() {
  try {
    const filePath = join(process.cwd(), 'src', 'data', 'admin', 'trains.json');
    const fileContent = readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading trains.json:', error);
    return [];
  }
}

export async function GET(_request: NextRequest) {
  try {
    const fastapiUrl = process.env.INDUCTION_API_URL;

    const mockResponse = () => {
      const trains = getTrainData();
      const items = trains.map((train: any) => {
        const conflicts = [];
        
        // Check fitness conflicts
        if (!train.fitness.rollingStock || !train.fitness.signalling || !train.fitness.telecom) {
          conflicts.push({ 
            rule: 'fitness', 
            status: 'failed', 
            reason: 'Fitness certificate expired or invalid' 
          });
        }
        
        // Check job card conflicts
        if (train.jobCards > 0) {
          conflicts.push({ 
            rule: 'job_card', 
            status: 'failed', 
            reason: `Open job cards: ${train.jobCards}` 
          });
        }
        
        // Check maintenance conflicts for high mileage trains
        if (train.mileage > 20000) {
          conflicts.push({ 
            rule: 'maintenance', 
            status: 'failed', 
            reason: 'High mileage - maintenance required' 
          });
        }

        return {
          train_id: train.id,
          conflicts
        };
      });
      return NextResponse.json(items);
    };

    if (!fastapiUrl) {
      return mockResponse();
    }

    const res = await fetch(`${fastapiUrl}/api/conflicts`, { cache: 'no-store' });
    if (!res.ok) {
      return mockResponse();
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (_e) {
    const items = Array.from({ length: 3 }, (_, i) => ({
      train_id: `KMRL-${String(i + 1).padStart(3, '0')}`,
      conflicts: [],
    }));
    return NextResponse.json(items);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conflictId, action } = body;

    if (action === 'resolve') {
      // In a real implementation, this would update the database
      // For now, we'll just return success
      return NextResponse.json({ 
        success: true, 
        message: `Conflict ${conflictId} resolved successfully` 
      });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action' 
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to resolve conflict' 
    }, { status: 500 });
  }
}


