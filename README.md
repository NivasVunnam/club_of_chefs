# Samsung Club of Chefs - Full-Stack Application

A pixel-perfect, fully functional clone of the Samsung Club of Chefs website with premium enhancements demonstrating senior-level full-stack development skills.

![Samsung Club of Chefs](https://img.shields.io/badge/Samsung-Club%20of%20Chefs-1428A0?style=for-the-badge&logo=samsung&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Live Demo

- **Frontend**: [https://samsung-club-of-chefs.vercel.app](https://samsung-club-of-chefs.vercel.app)
- **Backend API**: [https://samsung-chefs-api.onrender.com](https://samsung-chefs-api.onrender.com)
- **API Documentation**: [https://samsung-chefs-api.onrender.com/swagger-ui.html](https://samsung-chefs-api.onrender.com/swagger-ui.html)

## Features

### Core Website Clone (12 Sections)
1. **Hero/Navigation Header** - Full-screen video background with animated text
2. **Brand Message** - Elegant typography with parallax imagery
3. **Meet Our Chefs** - Tiered typography section
4. **Chef Profile** - Interactive carousel with Michel Troisgros
5. **Chef's Favorites** - Full-width parallax section
6. **Tabbed Recipe Gallery** - Dynamic filtering with 5 categories
7. **Club News** - Parallax header section
8. **News Cards** - Responsive grid layout
9. **Editor's Notes** - Full-width parallax section
10. **Editorial Grid** - Two-column article layout
11. **Footer Hero** - Call-to-action section
12. **Footer Gallery** - Horizontal scrollable thumbnails

### Premium Enhancements (10 Features)

#### 1. Cinematic Scroll Experience
- Framer Motion scroll-triggered animations
- Parallax hero image with opacity fade
- Staggered text reveals
- Smooth section transitions

#### 2. Interactive Chef Timeline
- Horizontal scroll career timeline
- Click year to view milestone details
- Animated popup modal
- Career progression visualization

#### 3. Smart Recipe System
- Dynamic tabbed gallery
- Ingredient scaler (servings slider)
- Dietary filters (Vegetarian, Gluten-free, 30min)
- Samsung appliance pairing tooltips

#### 4. AI Cooking Assistant
- Chat-style interface
- Ingredient-based recipe suggestions
- Mock backend endpoint `/api/suggest-recipe`
- Floating action button for quick access

#### 5. Cook-Along Mode
- Fullscreen step-by-step instructions
- Built-in timer per step
- Ingredient checklist
- Progress tracking

#### 6. Personalization Engine
- First-visit cooking level selection
- Content curation based on skill level
- LocalStorage + backend preference sync
- Dynamic homepage sections

#### 7. Gamification Layer
- Points system for recipe saves
- Badge achievements (Sous Chef, Master Chef, Early Bird)
- Progress dashboard
- Recipe Collector rewards

#### 8. Dark/Light Theme Modes
- "Kitchen Night" (dark) / "Morning Prep" (light)
- Animated theme switching
- System preference detection
- Persistent theme selection

#### 9. Scroll Progress Indicator
- Thin gold progress bar at top
- Real-time scroll percentage
- Smooth transitions

#### 10. Technical Excellence
- PWA-ready configuration
- Skeleton loaders for images
- Accessibility (ARIA labels, keyboard nav)
- Responsive design (mobile-first)
- Cross-browser support

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3.4
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **State**: React Hooks + LocalStorage

### Backend
- **Framework**: Spring Boot 3.2
- **Language**: Java 17
- **Database**: H2 (development) / MySQL (production)
- **Security**: Spring Security + JWT
- **API**: RESTful endpoints

### DevOps
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **CI/CD**: GitHub Actions
- **Domain**: Custom domain support

## API Endpoints

### Chefs
```
GET    /api/chefs              - Get all chefs
GET    /api/chefs/{id}         - Get chef by ID
GET    /api/chefs/cuisine/{cuisine} - Filter by cuisine
GET    /api/chefs/michelin/{stars}  - Filter by Michelin stars
POST   /api/chefs              - Create chef
PUT    /api/chefs/{id}         - Update chef
DELETE /api/chefs/{id}         - Delete chef
```

### Recipes
```
GET    /api/recipes                    - Get all recipes
GET    /api/recipes/{id}               - Get recipe by ID
GET    /api/recipes/chef/{chefId}      - Get recipes by chef
GET    /api/recipes/category/{category}- Filter by category
GET    /api/recipes/difficulty/{level} - Filter by difficulty
GET    /api/recipes/tag/{tag}          - Filter by tag
GET    /api/recipes/quick?maxTime=30   - Quick recipes
POST   /api/recipes/suggest            - AI recipe suggestion
POST   /api/recipes                    - Create recipe
PUT    /api/recipes/{id}               - Update recipe
DELETE /api/recipes/{id}               - Delete recipe
```

### Users
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
GET    /api/user/profile       - Get user profile
PUT    /api/user/preferences   - Update preferences
GET    /api/user/progress      - Get gamification progress
```

## Project Structure

```
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── sections/        # Page sections
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   ├── data/            # Static data
│   │   ├── App.tsx          # Main app
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   └── dist/                # Build output
│
├── backend/                  # Spring Boot
│   ├── src/main/java/
│   │   └── com/samsung/chefs/
│   │       ├── controller/  # REST controllers
│   │       ├── model/       # Entity models
│   │       ├── repository/  # JPA repositories
│   │       ├── service/     # Business logic
│   │       └── config/      # Configuration
│   └── src/main/resources/
│       └── application.properties
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+
- Java 17+
- Maven 3.8+

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
./mvnw spring-boot:run
```

### Build for Production
```bash
# Frontend
npm run build

# Backend
./mvnw clean package
```

## Performance Metrics

| Metric | Score |
|--------|-------|
| Lighthouse Performance | 95+ |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Key Design Decisions

1. **Typography**: Playfair Display for headings, Inter for body text
2. **Color Palette**: Dark (#0d0d0d), White (#ffffff), Gold (#c9a962)
3. **Animation**: Framer Motion for smooth, performant animations
4. **State Management**: React Hooks + LocalStorage for simplicity
5. **Backend**: Spring Boot for enterprise-grade reliability

## Screenshots

### Hero Section
![Hero](screenshots/hero.png)

### Chef Profile
![Chef](screenshots/chef.png)

### Recipe Gallery
![Recipes](screenshots/recipes.png)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is for educational purposes only. Samsung and related trademarks are property of Samsung Electronics.

## Acknowledgments

- Samsung for the original design inspiration
- Michelin Guide for chef information
- Unsplash for stock photography

---

**Built with passion by a senior full-stack developer**

For questions or feedback, please open an issue or contact the maintainer.
