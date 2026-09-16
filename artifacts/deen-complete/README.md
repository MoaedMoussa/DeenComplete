# Quran Deen Helper

A beautifully designed, full-featured, and cross-platform Quran application built with React Native and Expo.

This application provides a seamless and immersive experience for reading, listening, and understanding the Holy Quran, alongside essential Islamic daily tools.

## ✨ Features

*   **Interactive Quran Reader**: High-quality Arabic typography with smooth scrolling and responsive design.
*   **Word-by-Word Audio**: Tap on any word to hear its precise pronunciation, featuring highlighting synchronized with the audio.
*   **Multiple Reciters**: Choose from a library of renowned reciters for full Surah playback.
*   **Audio Controls**: Advanced playback controls including play, pause, seek, and adjustable playback speed (0.5x to 2.0x) with pitch correction.
*   **Tafsir & Translations**: Access comprehensive Tafsir and translations in multiple languages.
*   **Private Notes & Bookmarks**: Long-press any verse to write personal reflections or save verses for later.
*   **Prayer Times & Qibla**: Accurate daily prayer times and a Qibla compass based on your location.
*   **Multilingual Support**: Fully localized interface.
*   **Offline First Architecture**: Optimized for performance and data conservation.

## 🛠 Tech Stack

*   **Framework**: [React Native](https://reactnative.dev/)
*   **Toolchain**: [Expo](https://expo.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **State Management & Storage**: React Hooks & Async Storage
*   **Audio Processing**: `expo-av`
*   **Routing**: Expo Router

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or newer)
*   npm or yarn
*   [Android Studio](https://developer.android.com/studio) (for Android emulation) or Xcode (for iOS)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MoaedMoussa/Quran-Deen-Helper.git
   cd Quran-Deen-Helper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

To start the Expo development server:

```bash
npx expo start
```

To generate the native Android project files and build locally:

```bash
npx expo prebuild --platform android
npx expo run:android
```

## 📱 Project Structure

*   `/app`: Contains all the Expo Router screens and tab navigators.
*   `/components`: Reusable UI components (Modals, Audio Player, Verse Frames).
*   `/hooks`: Custom React hooks for logic separation.
*   `/data`: Localized data, Surah lists, and static assets.
*   `/assets`: Fonts, icons, and splash screens.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
