# NitroWind Monorepo

Turborepo monorepo for **NitroWind**, powered by [Nitro Modules](https://nitro.margelo.com/), formatted and linted with [Biome](https://biomejs.dev/).

## Structure

```
├── apps/
│   ├── bare-example/     # Bare React Native 0.86 example app
│   └── expo-example/     # Expo SDK 57 (React Native 0.86) example app
├── packages/
│   └── react-native-nitrowind/ # Nitro Module core library
├── biome.json            # Biome linter & formatter configuration
├── turbo.json            # Turborepo task pipeline configuration
└── package.json          # Monorepo workspaces & scripts
```

## Prerequisites

- [Bun](https://bun.sh/) (recommended package manager) or [Node.js](https://nodejs.org/) >= 22
- CocoaPods & Xcode (for iOS)
- Android Studio & NDK (for Android)

## Getting Started

Install dependencies across the monorepo:

```bash
bun install
```

### Scripts

- `bun run lint` - Run Biome lint checks
- `bun run lint:fix` - Automatically fix lint and format issues
- `bun run format` - Format all files with Biome
- `bun run typecheck` - Run TypeScript checks across all workspaces via Turborepo
- `bun run build` - Build packages across workspaces via Turborepo

### Codegen for Nitro Module

To run Nitrogen codegen for `react-native-nitrowind`:

```bash
cd packages/react-native-nitrowind
bun run codegen
```

### Running Example Apps

#### Bare React Native Example (`apps/bare-example`)

```bash
# iOS Pod install
cd apps/bare-example/ios
pod install
cd ..

# Run iOS / Android
bun run ios
bun run android
```

#### Expo Example (`apps/expo-example`)

```bash
cd apps/expo-example
bun run start
```
