import { supabaseAdmin, TABLES } from './supabase';
import { mockData, formatForSupabase } from './exportMockData';
import bcrypt from 'bcryptjs';

export async function migrateToSupabase() {
  console.log('Starting Supabase migration...');

  if (!supabaseAdmin) {
    console.error('Supabase is not configured. Please set your environment variables.');
    return false;
  }

  try {
    // Migrate Metro Lines FIRST (stations depend on them)
    console.log('Migrating metro lines...');
    const formattedLines = formatForSupabase(mockData.metroLines, 'metro_lines');
    const { error: linesError } = await supabaseAdmin
      .from(TABLES.METRO_LINES)
      .upsert(formattedLines, { onConflict: 'id' });
    
    if (linesError) {
      console.error('Error migrating metro lines:', linesError);
      return false;
    }
    console.log('✅ Metro lines migrated successfully');

    // Migrate Stations (after metro lines)
    console.log('Migrating stations...');
    const formattedStations = formatForSupabase(mockData.stations, 'stations');
    const { error: stationsError } = await supabaseAdmin
      .from(TABLES.STATIONS)
      .upsert(formattedStations, { onConflict: 'id' });
    
    if (stationsError) {
      console.error('Error migrating stations:', stationsError);
      return false;
    }
    console.log('✅ Stations migrated successfully');

    // Migrate Routes
    console.log('Migrating routes...');
    const formattedRoutes = formatForSupabase(mockData.routes, 'routes');
    const { error: routesError } = await supabaseAdmin
      .from(TABLES.ROUTES)
      .upsert(formattedRoutes, { onConflict: 'id' });
    
    if (routesError) {
      console.error('Error migrating routes:', routesError);
      return false;
    }
    console.log('✅ Routes migrated successfully');

    // Migrate Alerts
    console.log('Migrating alerts...');
    const formattedAlerts = formatForSupabase(mockData.alerts, 'alerts');
    const { error: alertsError } = await supabaseAdmin
      .from(TABLES.ALERTS)
      .upsert(formattedAlerts, { onConflict: 'id' });
    
    if (alertsError) {
      console.error('Error migrating alerts:', alertsError);
      return false;
    }
    console.log('✅ Alerts migrated successfully');

    // Migrate Trains
    console.log('Migrating trains...');
    const formattedTrains = formatForSupabase(mockData.trains, 'trains');
    const { error: trainsError } = await supabaseAdmin
      .from(TABLES.TRAINS)
      .upsert(formattedTrains, { onConflict: 'id' });
    
    if (trainsError) {
      console.error('Error migrating trains:', trainsError);
      return false;
    }
    console.log('✅ Trains migrated successfully');

    // Migrate Depot Schematic
    console.log('Migrating depot schematic...');
    const formattedDepotSchematic = formatForSupabase(mockData.depot, 'depot_schematic');
    const { error: depotSchematicError } = await supabaseAdmin
      .from(TABLES.DEPOT_SCHEMATIC)
      .upsert(formattedDepotSchematic, { onConflict: 'id' });
    
    if (depotSchematicError) {
      console.error('Error migrating depot schematic:', depotSchematicError);
      return false;
    }
    console.log('✅ Depot schematic migrated successfully');

    // Migrate Depot Bays
    console.log('Migrating depot bays...');
    const formattedDepotBays = formatForSupabase(mockData.depot, 'depot_bays');
    const { error: depotBaysError } = await supabaseAdmin
      .from(TABLES.DEPOT_BAYS)
      .upsert(formattedDepotBays, { onConflict: 'id' });
    
    if (depotBaysError) {
      console.error('Error migrating depot bays:', depotBaysError);
      return false;
    }
    console.log('✅ Depot bays migrated successfully');

    console.log('🎉 Migration completed successfully!');
    return true;

  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Helper function to generate sample data for other tables
export async function generateSampleData() {
  console.log('Generating sample data...');

  if (!supabaseAdmin) {
    console.error('Supabase is not configured. Please set your environment variables.');
    return false;
  }

  try {
    // Get actual train IDs from the migrated data
    const { data: trains } = await supabaseAdmin
      .from(TABLES.TRAINS)
      .select('id');
    
    if (!trains || trains.length === 0) {
      console.error('No trains found. Please migrate trains first.');
      return false;
    }

    const trainIds = trains.map(train => train.id);
    
    // Generate sample job cards using actual train IDs
    const jobCards = Array.from({ length: 15 }, (_, i) => ({
      id: `JC-${String(i + 1).padStart(3, '0')}`,
      train_id: trainIds[i % trainIds.length], // Use actual train IDs
      title: ['Brake Inspection', 'Door Mechanism Check', 'AC Service', 'Wheel Alignment'][i % 4],
      description: `Detailed inspection and maintenance for ${['brake system', 'door mechanism', 'air conditioning', 'wheel alignment'][i % 4]}`,
      status: ['open', 'in_progress', 'completed'][i % 3],
      priority: ['low', 'medium', 'high', 'critical'][i % 4],
      assigned_to: `Technician ${i + 1}`,
      due_date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString()
    }));

    const { error: jobCardsError } = await supabaseAdmin
      .from(TABLES.JOB_CARDS)
      .upsert(jobCards, { onConflict: 'id' });

    if (jobCardsError) {
      console.error('Error creating job cards:', jobCardsError);
      return false;
    }

    // Generate sample branding contracts
    const brandingContracts = Array.from({ length: 8 }, (_, i) => ({
      id: `BC-${String(i + 1).padStart(3, '0')}`,
      advertiser: ['Tech Corp', 'Fashion Brand', 'Food Chain', 'Bank', 'Insurance', 'Retail', 'Automotive', 'Healthcare'][i],
      contract_value: 50000 + (i * 25000),
      exposure_hours: 1000 + (i * 200),
      hours_delivered: 800 + (i * 150),
      sla_risk: ['low', 'medium', 'high'][i % 3],
      start_date: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      end_date: new Date(Date.now() + ((8 - i) * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      status: ['active', 'expired', 'pending'][i % 3]
    }));

    const { error: brandingError } = await supabaseAdmin
      .from(TABLES.BRANDING_CONTRACTS)
      .upsert(brandingContracts, { onConflict: 'id' });

    if (brandingError) {
      console.error('Error creating branding contracts:', brandingError);
      return false;
    }

    // Generate sample stabling bays using actual train IDs
    const stablingBays = Array.from({ length: 12 }, (_, i) => ({
      id: `BAY-${String(i + 1).padStart(2, '0')}`,
      bay_number: `Bay ${i + 1}`,
      capacity: 2,
      occupied: i % 3,
      train_ids: Array.from({ length: i % 3 }, (_, j) => trainIds[(i * 2 + j) % trainIds.length]),
      estimated_turnout: new Date(Date.now() + (i * 30 * 60 * 1000)).toISOString()
    }));

    const { error: stablingError } = await supabaseAdmin
      .from(TABLES.STABLING_BAYS)
      .upsert(stablingBays, { onConflict: 'id' });

    if (stablingError) {
      console.error('Error creating stabling bays:', stablingError);
      return false;
    }

    // Generate sample KPIs
    const kpis = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      punctuality: 85 + Math.random() * 10,
      energy_usage: 1000 + Math.random() * 200,
      sla_breaches: Math.floor(Math.random() * 5),
      mtbf: 500 + Math.random() * 100,
      wait_time_reduction: 10 + Math.random() * 5
    }));

    const { error: kpisError } = await supabaseAdmin
      .from(TABLES.KPIS)
      .upsert(kpis, { onConflict: 'id' });

    if (kpisError) {
      console.error('Error creating KPIs:', kpisError);
      return false;
    }

    // Generate sample conflicts using actual train IDs
    const conflicts = Array.from({ length: 8 }, (_, i) => ({
      id: `CONFLICT-${String(i + 1).padStart(3, '0')}`,
      type: ['fitness', 'jobcard', 'branding'][i % 3],
      severity: ['low', 'medium', 'high'][i % 3],
      description: `Conflict detected in ${['fitness certificate', 'job card assignment', 'branding schedule'][i % 3]} for train ${trainIds[i % trainIds.length]}`,
      affected_trains: [trainIds[i % trainIds.length]],
      resolution: i % 2 === 0 ? `Resolved by ${['automatic scheduling', 'manual intervention'][i % 2]}` : null,
      status: ['open', 'resolved'][i % 2]
    }));

    const { error: conflictsError } = await supabaseAdmin
      .from(TABLES.CONFLICTS)
      .upsert(conflicts, { onConflict: 'id' });

    if (conflictsError) {
      console.error('Error creating conflicts:', conflictsError);
      return false;
    }

    // Generate sample maintenance records using actual train IDs
    const maintenanceRecords = Array.from({ length: 12 }, (_, i) => ({
      id: `MAINT-${String(i + 1).padStart(3, '0')}`,
      train_id: trainIds[i % trainIds.length],
      type: ['preventive', 'corrective', 'emergency'][i % 3],
      description: `${['Preventive', 'Corrective', 'Emergency'][i % 3]} maintenance for ${['brake system', 'door mechanism', 'air conditioning', 'wheel alignment'][i % 4]}`,
      status: ['scheduled', 'in_progress', 'completed'][i % 3],
      assigned_to: `Technician ${i + 1}`,
      scheduled_date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
      completed_date: i % 3 === 2 ? new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString() : null
    }));

    const { error: maintenanceError } = await supabaseAdmin
      .from(TABLES.MAINTENANCE_RECORDS)
      .upsert(maintenanceRecords, { onConflict: 'id' });

    if (maintenanceError) {
      console.error('Error creating maintenance records:', maintenanceError);
      return false;
    }

    console.log('✅ Sample data generated successfully!');
    
    // Create initial admin account if none exists
    await createInitialAdmin();
    
    return true;

  } catch (error) {
    console.error('Error generating sample data:', error);
    return false;
  }
}

async function createInitialAdmin() {
  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .single();

    if (existingAdmin) {
      console.log('✅ Admin account already exists');
      return;
    }

    // Create default admin account
    const adminEmail = 'admin@kochimetro.com';
    const adminPassword = 'admin123';
    const adminName = 'System Administrator';

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Try to insert with password_hash, if it fails, try without (for existing tables)
    let insertData = {
      email: adminEmail,
      name: adminName,
      password_hash: passwordHash,
      role: 'admin',
      is_active: true
    };

    const { data: newAdmin, error } = await supabaseAdmin
      .from('users')
      .insert(insertData)
      .select('id, email, name, role')
      .single();

    if (error) {
      // If password_hash column doesn't exist, try without it
      if (error.message.includes('password_hash')) {
        console.log('⚠️  password_hash column not found, creating admin without password');
        const { data: newAdminWithoutPassword, error: error2 } = await supabaseAdmin
          .from('users')
          .insert({
            email: adminEmail,
            name: adminName,
            role: 'admin'
          })
          .select('id, email, name, role')
          .single();

        if (error2) {
          console.error('Error creating admin account:', error2);
          return;
        }

        console.log('✅ Initial admin account created (without password)!');
        console.log(`   Email: ${adminEmail}`);
        console.log('   ⚠️  Please run the database migration to add password support!');
        return;
      }
      
      console.error('Error creating admin account:', error);
      return;
    }

    console.log('✅ Initial admin account created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('Error creating initial admin:', error);
  }
}
