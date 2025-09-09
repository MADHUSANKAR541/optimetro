import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const fastapiUrl = process.env.INDUCTION_API_URL;
    const body = await request.json();

    const mockResponse = () => {
      // Mock simple hourly curve
      const { station = 'Station', date } = body || {};
      const hours = Array.from({ length: 18 }, (_, i) => 6 + i);
      const predictions = hours.map(h => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        demand: Math.max(0, Math.round(50 + 40 * Math.sin(((h - 6) / 17) * Math.PI)))
      }));
      return NextResponse.json({ station, date: date || new Date().toISOString().slice(0,10), predictions });
    };

    if (!fastapiUrl) {
      return mockResponse();
    }

    const res = await fetch(`${fastapiUrl}/api/demand/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    // Fallback to mock if backend returns an error (e.g., models not trained or station unknown)
    if (!res.ok) {
      return mockResponse();
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    // Final fallback
    const today = new Date().toISOString().slice(0,10);
    const hours = Array.from({ length: 18 }, (_, i) => 6 + i);
    const predictions = hours.map(h => ({ hour: `${String(h).padStart(2, '0')}:00`, demand: 30 }));
    return NextResponse.json({ station: 'Station', date: today, predictions });
  }
}


