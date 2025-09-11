const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Service key for admin operations (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test user data
const testUsers = [
  {
    email: 'test1@teampaws.app',
    password: 'TestPassword123!',
    user_metadata: {
      first_name: 'Alice',
      last_name: 'Johnson'
    }
  },
  {
    email: 'test2@teampaws.app',
    password: 'TestPassword123!',
    user_metadata: {
      first_name: 'Bob',
      last_name: 'Smith'
    }
  }
];

// Household data
const householdData = {
  name: 'Test Household - Team Paws'
};

// Pet data - matching actual database schema
const petsData = [
  {
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    weight_kg: 25.5,
    daily_water_goal_ml: 1500,
    rfid_tag: 'RFID001'
  },
  {
    name: 'Whiskers',
    species: 'cat',
    breed: 'Maine Coon',
    weight_kg: 6.2,
    daily_water_goal_ml: 300,
    rfid_tag: 'RFID002'
  },
  {
    name: 'Luna',
    species: 'dog',
    breed: 'Border Collie',
    weight_kg: 18.3,
    daily_water_goal_ml: 1200,
    rfid_tag: 'RFID003'
  }
];

// Device data - matching actual database schema
const devicesData = [
  {
    name: 'Main Water Station',
    device_hardware_id: 'WD-001-2024',
    is_online: true,
    firmware_version: '1.2.3',
    model: 'v1',
    settings: {}
  },
  {
    name: 'Kitchen Water Station',
    device_hardware_id: 'WD-002-2024',
    is_online: true,
    firmware_version: '1.2.3',
    model: 'v1',
    settings: {}
  }
];

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
      
      events.push({
        pet_id: petId,
        device_id: deviceId,
        amount_ml: amount,
        timestamp: eventTime.toISOString()
      });
    }
  }
  
  return events;
}

// Function to generate sample pet photos
function generatePetPhotos(petId) {
  const photos = [
    {
      pet_id: petId,
      photo_url: `https://example.com/photos/${petId}_1.jpg`,
      thumbnail_url: `https://example.com/thumbnails/${petId}_1_thumb.jpg`,
      is_primary: true,
      features: { color: 'brown', size: 'large' }
    }
  ];
  
  return photos;
}

// Function to clean up existing test data
async function cleanupTestData() {
  console.log('🧹 Cleaning up existing test data...');
  
  try {
    // Delete test users from auth (this will cascade delete their data due to foreign keys)
    for (const userData of testUsers) {
      // First try to sign in to get the user ID
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });
      
      if (signInData?.user) {
        // Delete user using admin client
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(signInData.user.id);
        if (deleteError) {
          console.log(`⚠️  Could not delete user ${userData.email}: ${deleteError.message}`);
        } else {
          console.log(`🗑️  Deleted user ${userData.email}`);
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Error during cleanup (this is normal if users don\'t exist):', error.message);
  }
}

// Function to create users and get their IDs
async function createTestUsers() {
  console.log('👤 Creating test users...');
  const userIds = [];
  
  for (const userData of testUsers) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: userData.user_metadata
      }
    });
    
    if (authError) {
      console.error(`Error creating user ${userData.email}:`, authError.message);
      // If user already exists, try to sign in to get the user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });
      
      if (signInError) {
        console.error(`Error signing in user ${userData.email}:`, signInError.message);
        continue;
      }
      
      userIds.push(signInData.user.id);
      console.log(`✅ User ${userData.email} signed in successfully`);
    } else {
      userIds.push(authData.user.id);
      console.log(`✅ User ${userData.email} created successfully`);
    }
  }

  if (userIds.length === 0) {
    throw new Error('No users were created or found');
  }

  return userIds;
}

// Function to create household using authenticated user context
async function createHouseholdWithUser(userId) {
  console.log('🏠 Creating household...');
  
  // Sign in as the first user to create household with proper RLS context
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testUsers[0].email,
    password: testUsers[0].password
  });
  
  if (signInError) {
    throw new Error(`Error signing in to create household: ${signInError.message}`);
  }

  // Create household using the authenticated user
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert(householdData)
    .select()
    .single();

  if (householdError) {
    throw new Error(`Error creating household: ${householdError.message}`);
  }

  console.log(`✅ Household created with ID: ${household.id}`);
  return household;
}

// Function to add users to household
async function addUsersToHousehold(householdId, userIds) {
  console.log('👥 Adding users to household...');
  
  const householdMembers = userIds.map((userId, index) => ({
    household_id: householdId,
    user_id: userId,
    role: index === 0 ? 'owner' : 'member'
  }));

  // Use admin client to bypass RLS for household_members
  const { error: membersError } = await supabaseAdmin
    .from('household_members')
    .insert(householdMembers);

  if (membersError) {
    throw new Error(`Error adding users to household: ${membersError.message}`);
  }

  console.log('✅ Users added to household');
}

// Function to create devices
async function createDevices(householdId) {
  console.log('📱 Creating devices...');
  
  const devicesWithHousehold = devicesData.map(device => ({
    ...device,
    household_id: householdId,
    last_seen: new Date().toISOString()
  }));

  // Use admin client to bypass RLS
  const { data: devices, error: devicesError } = await supabaseAdmin
    .from('devices')
    .insert(devicesWithHousehold)
    .select();

  if (devicesError) {
    throw new Error(`Error creating devices: ${devicesError.message}`);
  }

  console.log(`✅ Created ${devices.length} devices`);
  return devices;
}

// Function to create pets
async function createPets(householdId) {
  console.log('🐕 Creating pets...');
  
  const petsWithHousehold = petsData.map(pet => ({
    ...pet,
    household_id: householdId
  }));

  // Use admin client to bypass RLS
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
async function createHydrationEvents(pets, devices) {
  console.log('💧 Generating hydration events...');
  
  const allHydrationEvents = [];
  
  for (const pet of pets) {
    // Each pet gets events from both devices
    for (const device of devices) {
      const events = generateHydrationEvents(pet.id, device.id, 7);
      allHydrationEvents.push(...events);
    }
  }

  // Use admin client to bypass RLS
  const { error: eventsError } = await supabaseAdmin
    .from('hydration_events')
    .insert(allHydrationEvents);

  if (eventsError) {
    throw new Error(`Error creating hydration events: ${eventsError.message}`);
  }

  console.log(`✅ Created ${allHydrationEvents.length} hydration events`);
  return allHydrationEvents;
}

// Function to create pet photos
async function createPetPhotos(pets) {
  console.log('📸 Generating pet photos...');
  
  const allPhotos = [];
  
  for (const pet of pets) {
    const photos = generatePetPhotos(pet.id);
    allPhotos.push(...photos);
  }

  // Use admin client to bypass RLS
  const { error: photosError } = await supabaseAdmin
    .from('pet_photos')
    .insert(allPhotos);

  if (photosError) {
    throw new Error(`Error creating pet photos: ${photosError.message}`);
  }

  console.log(`✅ Created ${allPhotos.length} pet photos`);
  return allPhotos;
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Step 1: Clean up existing test data
    await cleanupTestData();

    // Step 2: Create test users
    const userIds = await createTestUsers();

    // Step 3: Create household with proper authentication
    const household = await createHouseholdWithUser(userIds[0]);

    // Step 4: Add users to household
    await addUsersToHousehold(household.id, userIds);

    // Step 5: Create devices
    const devices = await createDevices(household.id);

    // Step 6: Create pets
    const pets = await createPets(household.id);

    // Step 7: Generate hydration events
    const hydrationEvents = await createHydrationEvents(pets, devices);

    // Step 8: Generate pet photos
    const petPhotos = await createPetPhotos(pets);

    // Summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users created: ${userIds.length}`);
    console.log(`- Household: ${household.name} (ID: ${household.id})`);
    console.log(`- Pets: ${pets.length}`);
    console.log(`- Devices: ${devices.length}`);
    console.log(`- Hydration events: ${hydrationEvents.length}`);
    console.log(`- Pet photos: ${petPhotos.length}`);
    
    console.log('\n🔑 Test User Credentials:');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Password: ${user.password}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
