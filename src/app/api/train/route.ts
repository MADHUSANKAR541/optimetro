import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const fastapiUrl = process.env.INDUCTION_API_URL;
    if (!fastapiUrl) {
      return NextResponse.json({ message: 'Mock: training triggered' });
    }
    const res = await fetch(`${fastapiUrl}/api/train`, { method: 'POST' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to trigger training' }, { status: 500 });
  }
}


