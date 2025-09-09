import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ routes: [] });
    const { data, error } = await supabase.from('gtfs_routes').select('*');
    if (error) throw error;
    return NextResponse.json({ routes: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load routes' }, { status: 500 });
  }
}
