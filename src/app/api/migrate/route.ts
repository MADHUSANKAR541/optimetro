import { NextRequest, NextResponse } from 'next/server';
import { migrateToSupabase, generateSampleData } from '@/lib/migrateToSupabase';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

function parseCsv(filePath: string) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [] as any[];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => row[h] = (values[i] ?? '').trim());
    return row;
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'migrate') {
      const success = await migrateToSupabase();
      
      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Migration completed successfully' 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          message: 'Migration failed' 
        }, { status: 500 });
      }
    }

    if (action === 'generate-sample') {
      const success = await generateSampleData();
      
      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Sample data generated successfully' 
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          message: 'Sample data generation failed' 
        }, { status: 500 });
      }
    }

    if (action === 'migrate-all') {
      const migrateSuccess = await migrateToSupabase();
      const sampleSuccess = await generateSampleData();
      // GTFS import (optional)
      try {
        const gtfsDir = process.env.GTFS_DIR || path.resolve(process.cwd(), 'KMRLOpenData');
        if (fs.existsSync(gtfsDir)) {
          const db = supabaseAdmin ?? supabase;
          if (!db) throw new Error('Supabase is not configured');
          const upsert = async (table: string, rows: any[]) => {
            if (!rows || rows.length === 0) return;
            const { error } = await db.from(table).upsert(rows);
            if (error) throw error;
          };
          const read = (name: string) => {
            const p = path.join(gtfsDir, name);
            return fs.existsSync(p) ? parseCsv(p) : [];
          };
          // Agency
          await upsert('gtfs_agency', read('agency.txt'));
          // Routes
          await upsert('gtfs_routes', read('routes.txt'));
          // Trips
          await upsert('gtfs_trips', read('trips.txt'));
          // Stops (map columns to our schema order)
          const stopsRaw = read('stops.txt');
          const stops = stopsRaw.map((r: any) => ({
            stop_id: r.stop_id,
            stop_name: r.stop_name,
            stop_lat: Number(r.stop_lat),
            stop_lon: Number(r.stop_lon),
            zone_id: r.zone_id || null
          }));
          await upsert('gtfs_stops', stops);
          // Stop times (ensure numeric sequence)
          const stopTimesRaw = read('stop_times.txt');
          const stop_times = stopTimesRaw.map((r: any) => ({
            trip_id: r.trip_id,
            arrival_time: r.arrival_time,
            departure_time: r.departure_time,
            stop_id: r.stop_id,
            stop_sequence: Number(r.stop_sequence || r.stop_sequence === 0 ? r.stop_sequence : r.stop_sequence),
            pickup_type: r.pickup_type ? Number(r.pickup_type) : null,
            drop_off_type: r.drop_off_type ? Number(r.drop_off_type) : null
          }));
          await upsert('gtfs_stop_times', stop_times);
          // Shapes (ensure numeric fields)
          const shapesRaw = read('shapes.txt');
          const shapes = shapesRaw.map((r: any) => ({
            shape_id: r.shape_id,
            shape_pt_sequence: Number(r.shape_pt_sequence),
            shape_pt_lat: Number(r.shape_pt_lat),
            shape_pt_lon: Number(r.shape_pt_lon),
            shape_dist_traveled: r.shape_dist_traveled ? Number(r.shape_dist_traveled) : null
          }));
          await upsert('gtfs_shapes', shapes);
          // Calendar, fares, etc. (pass-through)
          await upsert('gtfs_calendar', read('calendar.txt'));
          await upsert('gtfs_fare_attributes', read('fare_attributes.txt'));
          await upsert('gtfs_fare_rules', read('fare_rules.txt'));
          await upsert('gtfs_feed_info', read('feed_info.txt'));
          await upsert('gtfs_translations', read('translations.txt'));
        }
      } catch (e) {
        console.error('GTFS import failed:', e);
      }
      
      if (migrateSuccess && sampleSuccess) {
        return NextResponse.json({ 
          success: true, 
          message: 'Full migration completed successfully (including GTFS if present)'
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          message: 'Full migration failed' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Invalid action. Use "migrate", "generate-sample", or "migrate-all"' 
    }, { status: 400 });

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
