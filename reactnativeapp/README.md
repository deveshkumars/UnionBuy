# Metropolis - Community Bulk Buy App

A cyberpunk-themed React Native mobile application for community bulk buying, designed to help financially challenged communities save money through collective purchasing power.

## Overview

Metropolis enables neighbors to pool their buying power for bulk purchases, coordinated through AI agents that optimize pricing, logistics, and distribution. The app features a distinctive "command center" aesthetic inspired by smart city infrastructure.

## Features

### Customer Features
- **Market View**: Browse available bulk buy opportunities with real-time pricing
- **Smart Pledging**: AI-verified bulk purchases with fund authorization
- **Live Operations**: Track your orders in real-time on a matrix-style map
- **Wallet**: Manage funds, view transaction history, and track savings
- **Trust Score**: Community reputation system

### Runner Features
- **Job Board**: Accept delivery missions with earning estimates
- **Mission HUD**: Full navigation with route optimization
- **Pick & Pay**: Virtual card system for store purchases
- **Distribution Scanner**: QR-based verification for handoffs

## Tech Stack

- **Framework**: React Native with Expo (SDK 54)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context API
- **Animations**: React Native Reanimated
- **Styling**: Custom Metropolis design system

## Design System

The Metropolis theme features:
- **Dark Mode**: Deep slate background (#0A0E14)
- **Accent Colors**: 
  - Electric Cyan (#00D9FF) - confirmed/safe
  - Warning Orange (#FF6B35) - pending/alerts
  - Success Green (#00FF88) - completed
- **Typography**: Monospace for data, sans-serif for headers
- **Components**: Bounding box cards, glow effects, radar animations

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Navigate to the app directory
cd reactnativeapp

# Install dependencies
npm install

# Start the development server
npm start
```

### Running the App

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

## Project Structure

```
reactnativeapp/
├── app/                    # Screen components (file-based routing)
│   ├── (customer)/         # Customer tab screens
│   ├── (runner)/           # Runner tab screens
│   ├── item/               # Item detail modal
│   └── _layout.tsx         # Root layout
├── components/
│   └── metro/              # Metropolis UI components
├── constants/
│   └── theme.ts            # Design system tokens
├── context/
│   └── AppContext.tsx      # Global state management
├── services/
│   ├── api.ts              # Mock API functions
│   ├── agents.ts           # AI agent simulations
│   └── mockData.ts         # Sample data
├── types/
│   └── index.ts            # TypeScript definitions
└── hooks/                  # Custom React hooks
```

## Key Components

### Metro UI Components

| Component | Description |
|-----------|-------------|
| `MetroCard` | Bounding box container with corner accents |
| `MetroButton` | Sharp-edged buttons with glow states |
| `DataDisplay` | Monospace number/price displays |
| `ProgressRing` | Circular progress for pledges |
| `StatusBadge` | Confidence scores, status indicators |
| `DataTicker` | Scrolling ticker for trending items |
| `ScanOverlay` | Camera viewfinder for QR scanning |
| `PulseRadar` | Animated radar for location features |

## Demo Flow

1. **Customer View**: Search for rice → View price comparison → Join bulk buy
2. **Agent Analysis**: Watch AI evaluate the purchase viability
3. **Runner View**: Accept mission → Navigate to store → Distribute items
4. **Settlement**: View final price and savings

## Environment Variables

Create a `.env` file for production configuration:

```env
EXPO_PUBLIC_API_URL=your-api-url
EXPO_PUBLIC_AWS_REGION=us-east-1
```

## Contributing

This project was built for HackBrown 2026. Contributions welcome!

## Award Track Targets

- **AWS**: AI agents + hosting + security
- **Marshall Wace**: Agent-based trading logic
- **Visa/Capital One**: Pre-authorization payment flow
- **Metropolis**: Urban logistics theme

## License

MIT License - Built with ❤️ at Brown University

## Team

HackBrown 2026 Team
