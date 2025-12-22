# VentaFácil - Offline-First PWA for Inventory & Sales

## Overview
VentaFácil is a Progressive Web App (PWA) designed for small businesses that need to manage inventory and sales, especially in areas with unreliable internet connectivity. The app prioritizes offline functionality using IndexedDB for local storage and automatically syncs data when connectivity is restored.

## Current State
- **Status**: MVP Complete
- **Last Updated**: December 2024

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React with Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **State Management**: React hooks + IndexedDB for persistence
- **Animations**: Framer Motion for smooth transitions

### Backend (Express)
- **Framework**: Express.js with TypeScript
- **Storage**: In-memory storage (MemStorage class)
- **API**: RESTful endpoints for products, categories, sales, and sync

### PWA Features
- **Service Worker**: Caches static assets for offline access
- **Manifest**: Enables installation as native app
- **IndexedDB**: Stores products, categories, and sales locally
- **Auto-sync**: Detects online status and syncs pending changes

## Key Features

### 1. Inventory Management (`/`)
- Add, edit products with name, price, quantity, category
- Search and filter products by category
- Visual stock indicators (low stock, out of stock)
- Offline indicator for unsynced items

### 2. Point of Sale (`/pos`)
- Quick product selection with search
- Cart management with quantity controls
- Sale completion with success animation
- Automatic stock deduction

### 3. Daily Reports (`/reports`)
- Date navigation (view any day's sales)
- Summary cards: Total sales, items sold, transactions, average
- Product breakdown table
- Visual distribution chart

### 4. Offline Support
- All data stored in IndexedDB
- Pending changes tracked for sync
- Visual sync status indicator (online/offline/syncing)
- Silent background sync when connection restored

## File Structure

```
client/
├── src/
│   ├── components/
│   │   ├── AddProductDialog.tsx    # Add/edit product modal
│   │   ├── BottomNavigation.tsx    # Mobile navigation bar
│   │   ├── ProductCard.tsx         # Product display card
│   │   ├── SplashScreen.tsx        # App loading screen
│   │   └── SyncStatus.tsx          # Connection status indicator
│   ├── lib/
│   │   ├── indexedDB.ts            # IndexedDB operations
│   │   ├── syncService.ts          # Online/offline sync logic
│   │   ├── queryClient.ts          # React Query config
│   │   └── utils.ts                # Utility functions
│   ├── pages/
│   │   ├── Inventory.tsx           # Main inventory page
│   │   ├── POS.tsx                 # Point of sale page
│   │   └── Reports.tsx             # Daily reports page
│   └── App.tsx                     # Main app component
├── public/
│   ├── manifest.json               # PWA manifest
│   └── sw.js                       # Service worker

server/
├── routes.ts                       # API endpoints
├── storage.ts                      # In-memory data storage
└── index.ts                        # Server entry point

shared/
└── schema.ts                       # Data types and schemas
```

## API Endpoints

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - List all sales (optional `?date=YYYY-MM-DD`)
- `POST /api/sales` - Record a sale

### Sync
- `POST /api/sync` - Bulk sync pending changes

## Design System
- **Colors**: Emerald green (#10B981) as primary accent
- **Typography**: Inter font family
- **Components**: shadcn/ui with custom styling
- **Mobile-first**: Bottom navigation, large touch targets

## User Preferences
- Language: Spanish (es)
- Currency: USD ($)
- Thumb-friendly design for quick sales
