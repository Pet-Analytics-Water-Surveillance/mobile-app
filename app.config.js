const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    // Import base config from app.json
    ...require('./app.json').expo,
    
    // Override with environment-specific values
    extra: {
      ...require('./app.json').expo.extra,
      
      // Use environment variables for credentials (required for production)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
  }
};
