# 🐕 Pet Hydration Monitor - Mobile App

A React Native mobile application for monitoring and tracking your pets' water intake using IoT hydration devices. Built with Expo, TypeScript, and Supabase.

## ✨ Features

- **Real-time Hydration Tracking** - Monitor water intake in real-time
- **Multi-Pet Support** - Manage multiple pets with individual hydration goals
- **Smart Analytics** - View detailed statistics and trends
- **Device Management** - Easy setup and management of IoT hydration devices
- **Push Notifications** - Get alerts for low water levels and device issues
- **Beautiful UI/UX** - Modern, intuitive interface with smooth animations
- **Cross-Platform** - Works on both iOS and Android

## 🏗️ Architecture

The app follows a clean, scalable architecture:

```
src/
├── navigation/          # Navigation configuration
├── screens/            # Screen components
│   ├── Auth/          # Authentication screens
│   ├── Main/          # Main app screens
│   ├── PetManagement/ # Pet management screens
│   └── DeviceSetup/   # Device setup screens
├── components/         # Reusable components
│   ├── common/        # Generic components
│   └── specific/      # Feature-specific components
├── services/          # API and external services
├── hooks/             # Custom React hooks
├── store/             # State management
├── utils/             # Utility functions
└── types/             # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pet-Analytics-Water-Surveillance/mobile-app.git
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 📱 Screens

### Authentication Flow
- **Welcome Screen** - Beautiful onboarding with app features
- **Login Screen** - Secure authentication with form validation
- **Signup Screen** - User registration with profile setup

### Main App
- **Home Screen** - Dashboard with pet cards and quick stats
- **Calendar Screen** - Visual timeline of hydration events
- **Statistics Screen** - Detailed analytics and charts
- **Settings Screen** - App configuration and user preferences

### Pet Management
- **Pet List** - View and manage all pets
- **Add Pet** - Add new pets with detailed information
- **Edit Pet** - Modify pet details and hydration goals

### Device Setup
- **Device Scan** - Bluetooth device discovery
- **WiFi Setup** - Device network configuration
- **Setup Complete** - Confirmation and testing

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **Charts**: React Native Chart Kit
- **Forms**: React Hook Form + Yup validation
- **UI Components**: React Native Elements + Vector Icons
- **Animations**: React Native Animatable
- **Notifications**: Expo Notifications
- **Bluetooth**: React Native BLE PLX

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Set up the database schema (see `database/schema.sql`)
3. Configure authentication providers
4. Set up Row Level Security (RLS) policies
5. Add your Supabase credentials to `.env`

### Database Schema

The app uses the following main tables:
- `households` - Family/household information
- `household_members` - User-household relationships
- `pets` - Pet profiles and hydration goals
- `devices` - IoT device information
- `hydration_events` - Water intake records
- `hydration_alerts` - System notifications

### iOS Configuration

Add to `ios/YourApp/Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth to connect to your pet hydration device</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs Bluetooth to setup your pet hydration device</string>
```

### Android Configuration

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

## 📊 Features in Detail

### Hydration Tracking
- Real-time water intake monitoring
- Individual pet hydration goals
- Daily, weekly, and monthly statistics
- Trend analysis and insights

### Device Management
- Bluetooth Low Energy (BLE) device discovery
- Automatic device pairing
- WiFi configuration for IoT devices
- Device health monitoring

### Analytics & Reporting
- Interactive charts and graphs
- Customizable time periods
- Pet comparison metrics
- Export functionality

### Notifications
- Low water level alerts
- Device offline notifications
- Hydration goal reminders
- Customizable alert preferences

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=ComponentName
```

## 📦 Building for Production

### Expo Build

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all
```

### Local Build

```bash
# iOS
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

## 🚀 Deployment

### App Store (iOS)
1. Archive the app in Xcode
2. Upload to App Store Connect
3. Submit for review

### Google Play Store (Android)
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Submit for review

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive documentation
- Write unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [Supabase](https://supabase.com/) for the backend infrastructure
- [React Navigation](https://reactnavigation.org/) for navigation
- [React Native Elements](https://reactnativeelements.com/) for UI components

## 📞 Support

- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)
- **Email**: support@yourdomain.com

## 🔮 Roadmap

- [ ] Dark mode support
- [ ] Offline functionality
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Social features
- [ ] Integration with pet health apps
- [ ] AI-powered hydration recommendations

---

**Made with ❤️ for happy, hydrated pets everywhere! 🐾**
