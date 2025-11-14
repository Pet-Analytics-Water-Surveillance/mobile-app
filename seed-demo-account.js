const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Service key for admin operations (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Demo user data
const demoUser = {
  email: 'demo@teampaws.app',
  password: 'TestPassword123!',
  user_metadata: {
    first_name: 'Demo',
    last_name: 'User'
  }
};

// Household data
const householdData = {
  name: 'Demo Household',
  timezone: 'America/Los_Angeles'
};

// Pet data
const petsData = [
  {
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    weight_kg: 30.5,
    birth_date: '2020-05-15',
    daily_water_goal_ml: 1000,
    rfid_tag: 'RFID001'
  },
  {
    name: 'Luna',
    species: 'dog',
    breed: 'Labrador',
    weight_kg: 28.0,
    birth_date: '2021-03-20',
    daily_water_goal_ml: 900,
    rfid_tag: 'RFID002'
  },
  {
    name: 'Bella',
    species: 'cat',
    breed: 'Siamese',
    weight_kg: 4.2,
    birth_date: '2019-08-10',
    daily_water_goal_ml: 250,
    rfid_tag: 'RFID003'
  }
];

// Device data
const deviceData = {
  name: 'Living Room Bowl',
  device_hardware_id: 'DEMO-DEVICE-001',
  is_online: true,
  firmware_version: '1.2.3',
  model: 'v1',
  wifi_rssi: -45,
  settings: { notification_enabled: true, led_brightness: 80 }
};

// Function to generate random hydration events
function generateHydrationEvents(petId, deviceId, days = 7) {
  const events = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate 3-8 events per day
    const eventsPerDay = Math.floor(Math.random() * 6) + 3;
    
    for (let j = 0; j < eventsPerDay; j++) {
      const hour = Math.floor(Math.random() * 16) + 6; // 6 AM to 10 PM
      const minute = Math.floor(Math.random() * 60);
      
      const eventTime = new Date(date);
      eventTime.setHours(hour, minute, 0, 0);
      
      // Random amount between 50-300ml
      const amount = Math.floor(Math.random() * 251) + 50;
      const duration = Math.floor(Math.random() * 30000) + 5000;
      const confidence = (Math.random() * 0.3 + 0.7).toFixed(2);
      
      events.push({
        pet_id: petId,
        device_id: deviceId,
        amount_ml: amount,
        duration_ms: duration,
        confidence: parseFloat(confidence),
        timestamp: eventTime.toISOString()
      });
    }
  }
  
  return events;
}

// Function to clean up existing demo user
async function cleanupDemoUser() {
  console.log('🧹 Cleaning up existing demo user...');
  
  try {
    // Try to sign in to get the user
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: demoUser.email,
      password: demoUser.password
    });
    
    if (signInData?.user) {
      // Delete user using admin client
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(signInData.user.id);
      if (deleteError) {
        console.log(`⚠️  Could not delete user: ${deleteError.message}`);
      } else {
        console.log(`🗑️  Deleted existing demo user`);
      }
    }
  } catch (error) {
    console.log('⚠️  No existing user to clean up (this is fine)');
  }
  
  // Sign out to clear session
  await supabase.auth.signOut();
}

// Function to create demo user
async function createDemoUser() {
  console.log('👤 Creating demo user...');
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: demoUser.email,
    password: demoUser.password,
    options: {
      data: demoUser.user_metadata,
      emailRedirectTo: undefined
    }
  });
  
  if (authError) {
    throw new Error(`Error creating user: ${authError.message}`);
  }
  
  console.log(`✅ Demo user created successfully`);
  return authData.user.id;
}

// Function to create household
async function createHousehold(userId) {
  console.log('🏠 Creating household...');
  
  // Sign in as the demo user
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: demoUser.email,
    password: demoUser.password
  });
  
  if (signInError) {
    throw new Error(`Error signing in: ${signInError.message}`);
  }

  // Create household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert(householdData)
    .select()
    .single();

  if (householdError) {
    throw new Error(`Error creating household: ${householdError.message}`);
  }

  console.log(`✅ Household created`);
  return household;
}

// Function to add user to household
async function addUserToHousehold(householdId, userId) {
  console.log('👥 Adding user to household...');
  
  const { error: memberError } = await supabaseAdmin
    .from('household_members')
    .insert({
      household_id: householdId,
      user_id: userId,
      role: 'owner'
    });

  if (memberError) {
    throw new Error(`Error adding user to household: ${memberError.message}`);
  }

  console.log('✅ User added to household');
}

// Function to create device
async function createDevice(householdId) {
  console.log('📱 Creating device...');
  
  const deviceWithHousehold = {
    ...deviceData,
    household_id: householdId,
    last_seen: new Date().toISOString()
  };

  const { data: device, error: deviceError } = await supabaseAdmin
    .from('devices')
    .insert(deviceWithHousehold)
    .select()
    .single();

  if (deviceError) {
    throw new Error(`Error creating device: ${deviceError.message}`);
  }

  console.log(`✅ Device created`);
  return device;
}

// Function to create pets
async function createPets(householdId) {
  console.log('🐕 Creating pets...');
  
  const petsWithHousehold = petsData.map(pet => ({
    ...pet,
    household_id: householdId
  }));

  const { data: pets, error: petsError } = await supabaseAdmin
    .from('pets')
    .insert(petsWithHousehold)
    .select();

  if (petsError) {
    throw new Error(`Error creating pets: ${petsError.message}`);
  }

  console.log(`✅ Created ${pets.length} pets`);
  return pets;
}

// Function to create hydration events
async function createHydrationEvents(pets, device) {
  console.log('💧 Generating hydration events...');
  
  const allHydrationEvents = [];
  
  for (const pet of pets) {
    const events = generateHydrationEvents(pet.id, device.id, 7);
    allHydrationEvents.push(...events);
  }

  const { error: eventsError } = await supabaseAdmin
    .from('hydration_events')
    .insert(allHydrationEvents);

  if (eventsError) {
    throw new Error(`Error creating hydration events: ${eventsError.message}`);
  }

  console.log(`✅ Created ${allHydrationEvents.length} hydration events`);
  return allHydrationEvents;
}

// Function to create sample alert
async function createSampleAlert(householdId, petId) {
  console.log('🔔 Creating sample alert...');
  
  const alert = {
    household_id: householdId,
    pet_id: petId,
    alert_type: 'low_hydration',
    message: `${petsData.find(p => p.name === 'Bella').name} has only consumed 150ml today, below the ${petsData.find(p => p.name === 'Bella').daily_water_goal_ml}ml daily goal.`,
    severity: 'warning',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  };

  const { error: alertError } = await supabaseAdmin
    .from('hydration_alerts')
    .insert(alert);

  if (alertError) {
    throw new Error(`Error creating alert: ${alertError.message}`);
  }

  console.log('✅ Sample alert created');
}

async function seedDemoAccount() {
  try {
    console.log('🌱 Starting demo account creation...\n');

    // Step 1: Clean up existing demo user
    await cleanupDemoUser();

    // Step 2: Create demo user
    const userId = await createDemoUser();

    // Step 3: Create household
    const household = await createHousehold(userId);

    // Step 4: Add user to household
    await addUserToHousehold(household.id, userId);

    // Step 5: Create device
    const device = await createDevice(household.id);

    // Step 6: Create pets
    const pets = await createPets(household.id);

    // Step 7: Generate hydration events
    const hydrationEvents = await createHydrationEvents(pets, device);

    // Step 8: Create sample alert (for Bella - the cat)
    const bella = pets.find(p => p.name === 'Bella');
    await createSampleAlert(household.id, bella.id);

    // Summary
    console.log('\n🎉 Demo account created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Email: ${demoUser.email}`);
    console.log(`- Password: ${demoUser.password}`);
    console.log(`- Household: ${household.name}`);
    console.log(`- Pets: ${pets.map(p => p.name).join(', ')}`);
    console.log(`- Device: ${device.name}`);
    console.log(`- Hydration events: ${hydrationEvents.length}`);
    console.log(`- Alerts: 1 sample alert created`);
    
    console.log('\n🔑 Login with:');
    console.log(`   Email: ${demoUser.email}`);
    console.log(`   Password: ${demoUser.password}`);

  } catch (error) {
    console.error('\n❌ Error creating demo account:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  seedDemoAccount();
}

module.exports = { seedDemoAccount };

