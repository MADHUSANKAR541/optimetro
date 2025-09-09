import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ stop_times: [] });
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    let query = supabase.from('gtfs_stop_times').select('*');
    if (tripId) {
      query = query.eq('trip_id', tripId);
    }
    const { data, error } = await query.order('stop_sequence', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ stop_times: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load stop_times' }, { status: 500 });
  }
}
