import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ trips: [] });
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    let query = supabase.from('gtfs_trips').select('*');
    if (routeId) {
      query = query.eq('route_id', routeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ trips: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load trips' }, { status: 500 });
  }
}
