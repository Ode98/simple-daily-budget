# Daily Budget

A simple daily budget tracking application built with React Native and Expo.

## Features

- **Daily Budget Tracking**: Keep track of your daily spending.
- **Android Widget**: View your budget directly from your home screen with the `BudgetWidget`.
- **Notification Listening**: Automatically track expenses via Android notifications

## Getting Started

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the development server:

```bash
npx expo start
```

Run on Android (requires Android Studio or connected device):

```bash
npx expo run:android
```

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language**: TypeScript
- **Storage**: @react-native-async-storage/async-storage
- **Widgets**: react-native-android-widget
