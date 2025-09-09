import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const fastapiUrl = process.env.INDUCTION_API_URL;
    if (!fastapiUrl) {
      // Minimal mock list
      return NextResponse.json({ stations: ['ALUVA', 'M. G. ROAD', 'THYKOODAM'] });
    }

    const res = await fetch(`${fastapiUrl}/api/stations`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (e) {
    return NextResponse.json({ stations: [] }, { status: 200 });
  }
}


