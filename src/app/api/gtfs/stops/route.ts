import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ stops: [] });

    const { searchParams } = new URL(request.url);
    const centerParam = searchParams.get('center'); // "lat,lon"
    const radiusKmParam = searchParams.get('radiusKm');

    let query = supabase.from('gtfs_stops').select('*');

    let center: [number, number] | null = null;
    let radiusKm: number | null = null;

    if (centerParam) {
      const [latStr, lonStr] = centerParam.split(',');
      const lat = Number(latStr);
      const lon = Number(lonStr);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        center = [lat, lon];
      }
    }
    if (radiusKmParam) {
      const r = Number(radiusKmParam);
      if (!Number.isNaN(r)) radiusKm = r;
    }

    // If we have center+radius, prefilter using a bounding box to reduce rows
    if (center && radiusKm) {
      const [clat, clon] = center;
      const dLat = radiusKm / 111.32; // approx degrees per km
      const dLon = radiusKm / (111.32 * Math.cos(clat * Math.PI / 180));
      const minLat = clat - dLat;
      const maxLat = clat + dLat;
      const minLon = clon - dLon;
      const maxLon = clon + dLon;

      // Supabase range filter
      query = query.gte('stop_lat', minLat).lte('stop_lat', maxLat)
                   .gte('stop_lon', minLon).lte('stop_lon', maxLon);
    }

    const { data, error } = await query;
    if (error) throw error;

    // If circle filter requested, compute distance and keep those within radius, sorted by distance
    let stops = data || [];
    if (center && radiusKm) {
      const [clat, clon] = center;
      const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      stops = stops
        .map((s: any) => ({
          ...s,
          __distanceKm: distanceKm(clat, clon, Number(s.stop_lat), Number(s.stop_lon))
        }))
        .filter((s: any) => s.__distanceKm <= (radiusKm as number))
        .sort((a: any, b: any) => a.__distanceKm - b.__distanceKm);
    }

    return NextResponse.json({ stops });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load stops' }, { status: 500 });
  }
}
