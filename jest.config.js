module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest-setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // keep unit tests fast and node-only; no native/UI rendering here
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
};
