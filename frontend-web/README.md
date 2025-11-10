# EMS - Web Frontend

Modern React web frontend for the Employee Management System.

## Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Module-Based Architecture** - 8 core modules for comprehensive HR management
- **Real-time Data** - React Query for efficient data fetching and caching
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access** - Different views for Admin, HR, and Employee roles

## Technology Stack

- **React 18** - UI Library
- **React Router** - Navigation
- **TanStack Query** - Data fetching and state management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

## Installation

### Prerequisites
- Node.js 18+ and npm/yarn

### Setup Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

3. **Build for Production**
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # API services
├── context/            # React context providers
└── utils/              # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Development

Make sure the backend API is running on `http://localhost:8000` before starting the frontend.

## License

MIT License
