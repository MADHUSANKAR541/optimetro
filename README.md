# Kochi Metro - Smart Transit Management System

A comprehensive Next.js 14 application featuring role-based authentication, AI-powered optimization, and real-time monitoring for Kochi Metro transit management.

## 🚀 Features

### 🎨 Design & UX
- **Kochi Metro Theme**: Custom design inspired by Kochi metro with train/metro motifs
- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Advanced Animations**: Framer Motion animations, parallax effects, and micro-interactions
- **Responsive Design**: Mobile-first approach with glassmorphism and modern UI
- **PWA Support**: Progressive Web App with offline capabilities

### 🔐 Authentication & Authorization
- **NextAuth.js**: Secure authentication with credentials provider
- **Role-Based Access**: Separate interfaces for Admin and Commuter users
- **Protected Routes**: Middleware-based route protection
- **Demo Users**: Pre-configured test accounts for both roles

### 🚇 Commuter Portal
- **Dashboard**: Overview of next departure, recent trips, active tickets, and alerts
- **Trip Planner**: AI-powered journey planning with real-time route optimization
- **Trip History**: Comprehensive trip management with search and filtering
- **Ticket Management**: QR code tickets with validity tracking
- **Service Alerts**: Real-time notifications for service disruptions
- **Settings**: Personalized preferences and accessibility options

### 🏢 Admin Console
- **AI Induction Optimizer**: Machine learning-powered train scheduling optimization
- **Conflict Management**: Automated conflict detection and resolution
- **Maintenance Tracking**: Job card management with Maximo integration
- **Branding Management**: Advertiser contract management and SLA monitoring
- **Stabling Operations**: Depot bay management with shunting simulation
- **KPI Dashboard**: Comprehensive analytics with interactive charts

### 📊 Data & Analytics
- **Mock API**: Comprehensive mock data with realistic delays
- **Interactive Charts**: Recharts integration for data visualization
- **Real-time Updates**: Simulated real-time data updates
- **Export Functionality**: CSV export for reports and data analysis

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: SCSS with CSS Modules
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Maps**: Leaflet/React-Leaflet
- **Forms**: Zod validation
- **Notifications**: React Hot Toast
- **Icons**: React Icons
- **PWA**: Service Worker + Manifest

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kochi-metro-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_API_BASE=http://localhost:3000/api
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 👥 Demo Accounts

### Admin User
- **Email**: `admin@demo.com`
- **Password**: `demo`
- **Access**: Full admin console with all management features

### Commuter User
- **Email**: `user@demo.com`
- **Password**: `demo`
- **Access**: Commuter dashboard with trip planning and management

## 🗂️ Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (public)/                # Public routes (no auth required)
│   │   ├── page.tsx            # Landing page with parallax hero
│   │   ├── login/              # Authentication page
│   │   ├── about/              # About page
│   │   └── status/             # System status page
│   ├── (commuter)/             # Commuter portal
│   │   └── dashboard/          # Commuter dashboard pages
│   ├── (admin)/                # Admin console
│   │   └── admin/              # Admin management pages
│   ├── api/auth/               # NextAuth API routes
│   └── layout.tsx              # Root layout
├── components/                  # Reusable components
│   ├── ui/                     # Basic UI components
│   ├── layout/                 # Layout components
│   └── sections/               # Page sections
├── lib/                        # Utilities and configurations
│   ├── auth.ts                 # NextAuth configuration
│   ├── api.ts                  # Mock API helper
│   ├── types.ts                # TypeScript interfaces
│   └── theme.tsx               # Theme provider
└── styles/                     # Global styles and themes
    └── globals.scss            # Global SCSS with design tokens
```

## 🎯 Key Features Explained

### AI-Powered Optimization
The admin induction optimizer uses simulated AI algorithms to:
- Analyze passenger demand patterns
- Optimize train scheduling for revenue maximization
- Manage standby trains for maintenance windows
- Handle interchange service requirements
- Provide explainable recommendations

### Real-Time Data Simulation
All data is mocked with realistic delays to simulate:
- Live train positions and schedules
- Real-time service alerts and notifications
- Dynamic KPI updates and trend analysis
- Interactive charts with time-series data

### Responsive Design System
Built with a comprehensive design system featuring:
- CSS custom properties for theming
- Consistent spacing and typography scales
- Glassmorphism effects and modern UI patterns
- Smooth animations and micro-interactions
- Mobile-first responsive breakpoints

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in appropriate route groups
3. Update types in `src/lib/types.ts`
4. Add mock data endpoints in `src/lib/api.ts`
5. Style with SCSS modules following the design system

## 📱 PWA Features

The application includes Progressive Web App capabilities:
- **Offline Support**: Service worker caches essential resources
- **App-like Experience**: Standalone display mode
- **Installable**: Add to home screen on mobile devices
- **Fast Loading**: Optimized caching strategies

## 🎨 Design System

### Color Palette
- **Primary**: Metro Blue (#2563eb)
- **Secondary**: Metro Green (#059669)
- **Accent**: Metro Red (#dc2626)
- **Supporting**: Orange, Purple for variety

### Typography
- **Headings**: DM Sans (display font)
- **Body**: Inter (UI font)
- **Responsive**: Fluid typography scales

### Components
- **Cards**: Glassmorphism with hover effects
- **Buttons**: Gradient backgrounds with micro-interactions
- **Forms**: Consistent styling with validation states
- **Charts**: Themed Recharts components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Kochi Metro for inspiration
- Next.js team for the amazing framework
- Framer Motion for smooth animations
- React Icons for comprehensive iconography
- Recharts for beautiful data visualization

---

**Built with ❤️ for Kochi Metro**
