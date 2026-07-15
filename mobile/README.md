# RPV Bible - React Native Mobile App

A full-featured Bible study application built with React Native and Expo, providing offline access to multiple Bible translations with advanced search capabilities.

## Features

- **Bible Search**: Fast, full-text search across multiple translations
- **Multiple Translations**: Support for KJV, ASV, and other translations
- **Offline Reading**: Download translations for offline access
- **Bookmarks**: Save and organize favorite verses
- **Sync**: Cloud sync of bookmarks and preferences via Firebase
- **Responsive Design**: Optimized for phones and tablets
- **Dark Mode**: Easy on the eyes reading experience

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android SDK (for building APK)
- Firebase project configured

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file with Firebase credentials:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Development

Start the development server:
```bash
npm start
```

Run on Android:
```bash
npm run android
```

Run on iOS:
```bash
npm run ios
```

## Building APK

### Prerequisites
- EAS CLI: `npm install -g eas-cli`
- EAS account (free)

### Build Steps

1. Configure EAS:
```bash
eas build:configure
```

2. Build APK:
```bash
npm run build:android
```

3. For preview build:
```bash
npm run build:android:preview
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # Firebase, database services
│   ├── components/       # Reusable components
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── App.tsx          # Root component
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript configuration
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Linting

Check code quality:
```bash
npm run lint
```

## Deployment

### Google Play Store

1. Build release APK:
```bash
eas build --platform android --profile production
```

2. Submit to Play Store:
```bash
npm run submit:android
```

## Troubleshooting

### Build Issues
- Clear cache: `expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Firebase Connection
- Verify `.env.local` has correct credentials
- Check Firebase project settings
- Ensure Android package name matches Firebase config

### Database Issues
- Clear app data and reinstall
- Check SQLite permissions in `app.json`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Proprietary - RPV Bible

## Support

For issues and questions, contact the development team.
