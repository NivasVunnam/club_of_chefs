import { useState, useEffect, useMemo, useRef, type RefObject } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from 'framer-motion';
import { 
  Menu, X, ChevronLeft, ChevronRight, Bookmark, Clock, Users, 
  ChefHat, Search, User, Sun, Moon, Flame, Award, Trophy, Star,
  Sparkles, ThumbsUp, ThumbsDown, LogOut, Heart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';
import type { Chef, EditorialArticle, NewsArticle, Recipe } from '@/types';
import { apiUrl } from '@/lib/api';

function getReactionUserId() {
  const key = 'newsReactionUserId';
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const generated = `user-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, generated);
  return generated;
}

// Animation variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

function App() {
  const navigate = useNavigate();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [editorialArticles, setEditorialArticles] = useState<EditorialArticle[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeChef, setActiveChef] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [completedRecipesCount, setCompletedRecipesCount] = useState(0);
  const [showChefTimeline, setShowChefTimeline] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reactionUserId, setReactionUserId] = useState('');
  const [brandImageIndex, setBrandImageIndex] = useState(0);
  const [recipesCount, setRecipesCount] = useState(500);
  const [membersCount, setMembersCount] = useState(50000);
  const [displayRecipesCount, setDisplayRecipesCount] = useState(500);
  const [displayMembersCount, setDisplayMembersCount] = useState(50000);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('clubAuthUser')));
  const [loggedInUserName, setLoggedInUserName] = useState('');
  const [favoriteChefIds, setFavoriteChefIds] = useState<string[]>([]);
  const [recipeRotationTick, setRecipeRotationTick] = useState(0);
  const hasRestoredNewsScroll = useRef(false);
  const popularCarouselRef = useRef<HTMLDivElement>(null);
  const latestCarouselRef = useRef<HTMLDivElement>(null);
  const editorialCarouselRef = useRef<HTMLDivElement>(null);
  const popularAnimationRef = useRef<number | null>(null);
  const latestAnimationRef = useRef<number | null>(null);
  const editorialAnimationRef = useRef<number | null>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'night' : 'day');
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    localStorage.setItem('themeMode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    if (isDataLoading || hasRestoredNewsScroll.current) return;

    const savedNewsScroll = sessionStorage.getItem('newsScrollY');
    const shouldReturnToNewsSection = sessionStorage.getItem('returnToNewsSection') === 'true';
    const shouldReturnToChefsSection = sessionStorage.getItem('returnToChefsSection') === 'true';
    if (!savedNewsScroll && !shouldReturnToNewsSection && !shouldReturnToChefsSection) return;

    hasRestoredNewsScroll.current = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (savedNewsScroll) {
          const scrollY = Number(savedNewsScroll);
          const targetY = Number.isFinite(scrollY) ? scrollY : 0;
          window.scrollTo({ top: targetY, behavior: 'auto' });
          setTimeout(() => {
            window.scrollTo({ top: targetY, behavior: 'auto' });
          }, 140);
        } else if (shouldReturnToNewsSection) {
          const newsSection = document.getElementById('news');
          newsSection?.scrollIntoView({ behavior: 'auto', block: 'start' });
        } else if (shouldReturnToChefsSection) {
          const chefsSection = document.getElementById('chefs');
          chefsSection?.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      });
    });

    sessionStorage.removeItem('newsScrollY');
    sessionStorage.removeItem('returnToNewsSection');
    sessionStorage.removeItem('returnToChefsSection');
  }, [isDataLoading, newsArticles.length]);

  useEffect(() => {
    setReactionUserId(getReactionUserId());
  }, []);

  useEffect(() => {
    if (!reactionUserId) return;

    const loadContent = async () => {
      try {
        const response = await fetch(apiUrl(`/api/content?userId=${encodeURIComponent(reactionUserId)}`));
        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.status}`);
        }
        const content = await response.json() as {
          chefs: Chef[];
          recipes: Recipe[];
          newsArticles: NewsArticle[];
          editorialArticles: EditorialArticle[];
        };

        setChefs(content.chefs ?? []);
        setRecipes(content.recipes ?? []);
        setNewsArticles(content.newsArticles ?? []);
        setEditorialArticles(content.editorialArticles ?? []);
      } catch (error) {
        setDataError(error instanceof Error ? error.message : 'Unknown API error');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadContent();
  }, [reactionUserId]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    
    const saved = localStorage.getItem('savedRecipes');
    if (saved) setSavedRecipes(JSON.parse(saved));
    
    const points = localStorage.getItem('userPoints');
    if (points) setUserPoints(parseInt(points));
    
    const userBadges = localStorage.getItem('earnedBadges');
    if (userBadges) setEarnedBadges(JSON.parse(userBadges));

    const favoriteChefs = localStorage.getItem('favoriteChefIds');
    if (favoriteChefs) setFavoriteChefIds(JSON.parse(favoriteChefs));

    const progressRaw = localStorage.getItem('recipeProcessProgress');
    const progress = progressRaw ? (JSON.parse(progressRaw) as Record<string, { completed: boolean }>) : {};
    const completed = Object.values(progress).filter((item) => item.completed).length;
    setCompletedRecipesCount(completed);
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const rotateTimer = window.setInterval(() => {
      setRecipeRotationTick((prev) => prev + 1);
    }, 6000);

    return () => window.clearInterval(rotateTimer);
  }, []);

  const toggleSaveRecipe = (recipeId: string) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const newSaved = savedRecipes.includes(recipeId)
      ? savedRecipes.filter(id => id !== recipeId)
      : [...savedRecipes, recipeId];
    setSavedRecipes(newSaved);
    localStorage.setItem('savedRecipes', JSON.stringify(newSaved));
    
    // Award points and check badges
    if (!savedRecipes.includes(recipeId)) {
      const newPoints = userPoints + 10;
      setUserPoints(newPoints);
      localStorage.setItem('userPoints', newPoints.toString());
      
      // Check for badges
      const frenchRecipes = recipes.filter(r => 
        newSaved.includes(r.id) && r.chefId === 'michel-troisgros'
      );
      if (frenchRecipes.length >= 5 && !earnedBadges.includes('sous-chef')) {
        const newBadges = [...earnedBadges, 'sous-chef'];
        setEarnedBadges(newBadges);
        localStorage.setItem('earnedBadges', JSON.stringify(newBadges));
      }
      
      if (newSaved.length === 1 && !earnedBadges.includes('first-save')) {
        const newBadges = [...earnedBadges, 'first-save'];
        setEarnedBadges(newBadges);
        localStorage.setItem('earnedBadges', JSON.stringify(newBadges));
      }
    }
  };

  const handleAIQuery = () => {
    if (!aiQuery.trim()) return;
    
    // Mock AI response
    const responses = [
      "Based on your ingredients, I recommend trying our Herb-Crusted Ribeye with mushrooms. It's a perfect match!",
      "For chicken and mushrooms, Chef Michel's Mediterranean Seafood style would work beautifully. Would you like the recipe?",
      "I found 3 recipes featuring those ingredients. The most popular is our Garden Vegetable Terrine with herb oil.",
    ];
    setAiResponse(responses[Math.floor(Math.random() * responses.length)]);
  };

  const handleThemeToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleAIAssistantToggle = () => {
    setShowAIAssistant((prev) => !prev);
  };

  const handleLogout = () => {
    const userStateKeys = [
      'clubAuthUser',
      'savedRecipes',
      'userPoints',
      'earnedBadges',
      'favoriteChefIds',
      'inProgressRecipeIds',
      'recentRecipeIds',
      'recipeProcessProgress',
      'newsReactionUserId',
    ];
    userStateKeys.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem('returnToRecipePath');
    sessionStorage.removeItem('returnToChefsSection');
    sessionStorage.removeItem('returnToNewsSection');
    sessionStorage.removeItem('newsScrollY');
    sessionStorage.setItem('logoutSuccess', 'true');

    setIsLoggedIn(false);
    setLoggedInUserName('');
    setSavedRecipes([]);
    setFavoriteChefIds([]);
    setUserPoints(0);
    setEarnedBadges([]);
    setCompletedRecipesCount(0);
    setIsMenuOpen(false);
    window.location.replace('/login');
  };

  const toggleFavoriteChef = (chefId: string) => {
    if (!isLoggedIn) {
      sessionStorage.setItem('returnToChefsSection', 'true');
      navigate('/login');
      return;
    }

    const updatedFavorites = favoriteChefIds.includes(chefId)
      ? favoriteChefIds.filter((id) => id !== chefId)
      : [...favoriteChefIds, chefId];
    setFavoriteChefIds(updatedFavorites);
    localStorage.setItem('favoriteChefIds', JSON.stringify(updatedFavorites));
  };

  const handleProfileQuickAction = (targetId: string) => {
    if (targetId === 'recipes') {
      navigate('/recipes?mode=recent');
      return;
    }
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const reactToArticle = async (articleId: string, clickedReaction: 'like' | 'dislike') => {
    if (!reactionUserId) return;

    const currentReaction = newsArticles.find((item) => item.id === articleId)?.userReaction ?? null;
    const nextReaction = currentReaction === clickedReaction ? 'none' : clickedReaction;

    try {
      const response = await fetch(apiUrl(`/api/news/${articleId}/react`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: nextReaction, userId: reactionUserId }),
      });
      if (!response.ok) return;

      const counts = await response.json() as {
        likes: number;
        dislikes: number;
        userReaction: 'like' | 'dislike' | null;
      };
      setNewsArticles((prev) =>
        prev.map((article) =>
          article.id === articleId
            ? {
                ...article,
                likes: counts.likes,
                dislikes: counts.dislikes,
                userReaction: counts.userReaction,
              }
            : article
        )
      );
    } catch {
      // Silent fail to keep interaction lightweight.
    }
  };

  const selectCookingLevel = (level: string) => {
    localStorage.setItem('cookingLevel', level);
    setShowPersonalization(false);
    
    if (!earnedBadges.includes('early-bird')) {
      const newBadges = [...earnedBadges, 'early-bird'];
      setEarnedBadges(newBadges);
      localStorage.setItem('earnedBadges', JSON.stringify(newBadges));
    }
  };

  const filteredRecipes = recipes.filter((recipe) => recipe.category === 'Chef\'s Recipes');
  const rotatingRecipeCount = 8;
  const rotatingRecipes = useMemo(() => {
    if (filteredRecipes.length <= rotatingRecipeCount) return filteredRecipes;
    const start = recipeRotationTick % filteredRecipes.length;
    return Array.from({ length: rotatingRecipeCount }, (_, index) => filteredRecipes[(start + index) % filteredRecipes.length]);
  }, [filteredRecipes, recipeRotationTick]);
  const rotatingFavoriteRecipes = useMemo(() => {
    const favoriteRecipes = recipes.filter((recipe) => recipe.category === 'Chef\'s Favorite Samsung');
    if (favoriteRecipes.length <= 4) return favoriteRecipes;
    const start = recipeRotationTick % favoriteRecipes.length;
    return Array.from({ length: 4 }, (_, index) => favoriteRecipes[(start + index) % favoriteRecipes.length]);
  }, [recipes, recipeRotationTick]);

  const navLinks = ['Club', 'Chefs', 'Favorites', 'Recipes', 'News', 'Contact'];

  const cookingLevels = [
    { id: 'beginner', name: 'Beginner', description: 'Just starting my culinary journey', icon: 'ChefHat' as const },
    { id: 'home', name: 'Home Cook', description: 'Comfortable in the kitchen', icon: 'Flame' as const },
    { id: 'advanced', name: 'Advanced', description: 'Ready for complex techniques', icon: 'Award' as const },
  ];

  const footerGallery = [
    '/recipe-1.jpg',
    '/recipe-2.jpg',
    '/recipe-3.jpg',
    '/recipe-4.jpg',
    '/recipe-5.jpg',
    '/recipe-6.jpg',
    '/recipe-7.jpg',
    '/recipe-8.jpg',
  ];

  const brandSectionImages = [
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1498579809087-ef1e558fd1da?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1400&q=80',
  ];

  const popularLimit = 6;
  const latestLimit = 12;

  const popularNews = useMemo(() => {
    const withScore = [...newsArticles].map((article) => ({
      ...article,
      score: article.likes + article.actionCount * 2 - article.dislikes,
    }));
    return withScore
      .sort((a, b) => b.score - a.score)
      .slice(0, popularLimit);
  }, [newsArticles]);

  const popularMainArticles = useMemo(() => popularNews.slice(0, 5), [popularNews]);
  const popularViewMoreArticle = useMemo(() => popularNews[5] ?? null, [popularNews]);

  const latestNews = useMemo(() => {
    return [...newsArticles].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, latestLimit);
  }, [newsArticles]);

  const latestDisplayCards = useMemo(() => {
    const cards: Array<
      | { type: 'article'; article: NewsArticle }
      | { type: 'view-more'; overflowArticles: NewsArticle[] }
    > = latestNews.slice(0, 11).map((article) => ({ type: 'article', article }));

    const overflowArticles = latestNews.slice(11, 12);
    if (overflowArticles.length > 0) {
      cards.push({ type: 'view-more', overflowArticles });
    }

    return cards;
  }, [latestNews]);

  const latestGridPages = useMemo(() => {
    const pages: Array<typeof latestDisplayCards> = [];
    for (let i = 0; i < latestDisplayCards.length; i += 4) {
      pages.push(latestDisplayCards.slice(i, i + 4));
    }
    return pages;
  }, [latestDisplayCards]);

  const homeEditorialArticles = useMemo(() => {
    return [...editorialArticles]
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, 5);
  }, [editorialArticles]);

  const scrollNewsRail = (
    ref: RefObject<HTMLDivElement | null>,
    direction: 1 | -1,
    animationRef: RefObject<number | null>,
    stepRatio = 0.3
  ) => {
    const rail = ref.current;
    if (!rail) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const start = rail.scrollLeft;
    const distance = direction * rail.clientWidth * stepRatio;
    const duration = 900;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      rail.scrollLeft = start + distance * eased;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    let timeoutId: number;

    const scheduleImageChange = () => {
      const delay = 10000 + Math.floor(Math.random() * 5000); // 10-15 seconds
      timeoutId = window.setTimeout(() => {
        setBrandImageIndex((prev) => (prev + 1) % brandSectionImages.length);
        scheduleImageChange();
      }, delay);
    };

    scheduleImageChange();
    return () => window.clearTimeout(timeoutId);
  }, [brandSectionImages.length]);

  useEffect(() => {
    let timeoutId: number;

    const scheduleNextUpdate = () => {
      const delay = 10000 + Math.floor(Math.random() * 5000); // 10-15 seconds

      timeoutId = window.setTimeout(() => {
        const recipeDelta = Math.floor(Math.random() * 41) - 20;
        const memberDelta = Math.floor(Math.random() * 2001) - 1000;

        setRecipesCount((prev) => Math.max(100, prev + recipeDelta));
        setMembersCount((prev) => Math.max(10000, prev + memberDelta));

        scheduleNextUpdate();
      }, delay);
    };

    scheduleNextUpdate();
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const start = displayRecipesCount;
    const end = recipesCount;
    const duration = 900;
    let rafId = 0;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayRecipesCount(Math.round(start + (end - start) * eased));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [recipesCount]);

  useEffect(() => {
    const start = displayMembersCount;
    const end = membersCount;
    const duration = 1100;
    let rafId = 0;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayMembersCount(Math.round(start + (end - start) * eased));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [membersCount]);

  useEffect(() => {
    const syncAuthState = () => {
      const rawUser = localStorage.getItem('clubAuthUser');
      setIsLoggedIn(Boolean(rawUser));
      if (!rawUser) {
        setLoggedInUserName('');
        return;
      }

      try {
        const parsed = JSON.parse(rawUser) as { name?: string; username?: string };
        setLoggedInUserName(parsed.name || parsed.username || '');
      } catch {
        setLoggedInUserName('');
      }
    };

    syncAuthState();
    window.addEventListener('focus', syncAuthState);
    window.addEventListener('storage', syncAuthState);
    return () => {
      window.removeEventListener('focus', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  const appThemeClass = isDarkMode
    ? 'theme-night dark bg-dark text-white'
    : 'theme-day bg-stone-50 text-slate-900';
  const navContainerClass = isDarkMode
    ? 'bg-black/35 border-b border-white/10 backdrop-blur-md'
    : 'bg-white/90 border-b border-black/10 backdrop-blur-md shadow-sm';
  const navTextClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const navIconClass = isDarkMode
    ? 'text-white hover:text-gold'
    : 'text-slate-900 hover:text-gold';
  const responseCount = useMemo(
    () =>
      newsArticles.reduce((acc, article) => {
        const hasReaction = article.userReaction ? 1 : 0;
        const hasAction = article.userAction ? 1 : 0;
        return acc + hasReaction + hasAction;
      }, 0),
    [newsArticles],
  );
  const footerInstructionText = isLoggedIn
    ? `Hi ${loggedInUserName || 'Chef'}, your preferences and activity are shaping smarter recommendations in real time.`
    : 'Join our community of food lovers and discover a world of culinary inspiration. From beginner tips to masterclass techniques, we are here to make every meal memorable.';
  const topChefsByFollowers = useMemo(
    () => [...chefs].sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0)).slice(0, 3),
    [chefs],
  );
  const homeChefs = topChefsByFollowers.length > 0 ? topChefsByFollowers : chefs;

  useEffect(() => {
    if (homeChefs.length === 0) return;
    setActiveChef((prev) => (prev >= homeChefs.length ? 0 : prev));
  }, [homeChefs.length]);

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        Loading content from database...
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center text-center px-4">
        Failed to load content from API: {dataError}
      </div>
    );
  }

  if (homeChefs.length === 0) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        No chefs found in database.
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${appThemeClass}`}>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 h-0.5 bg-gold z-[100] transition-all duration-100" style={{ width: `${scrollProgress}%` }} />
      
      {/* Personalization Modal */}
      <AnimatePresence>
        {showPersonalization && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-lighter max-w-2xl w-full p-8 md:p-12"
            >
              <h2 className="heading-lg text-center mb-4">Welcome to Samsung Club of Chefs</h2>
              <p className="text-center text-muted-foreground mb-8">What&apos;s your cooking level? We&apos;ll personalize your experience.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cookingLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => selectCookingLevel(level.id)}
                    className="p-6 border border-border hover:border-gold hover:bg-gold/5 transition-all duration-300 text-center group"
                  >
                    <div className="flex justify-center mb-4">
                      {level.icon === 'ChefHat' && <ChefHat className="w-8 h-8 text-gold" />}
                      {level.icon === 'Flame' && <Flame className="w-8 h-8 text-gold" />}
                      {level.icon === 'Award' && <Award className="w-8 h-8 text-gold" />}
                    </div>
                    <h3 className="font-serif font-semibold mb-2">{level.name}</h3>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant */}
      <AnimatePresence>
        {showAIAssistant && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 bottom-4 w-96 bg-white dark:bg-dark-lighter shadow-2xl z-[80] border border-border"
          >
            <div className="p-4 bg-dark text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="font-serif">AI Cooking Assistant</span>
              </div>
              <button onClick={() => setShowAIAssistant(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 h-80 overflow-y-auto">
              <div className="bg-muted p-3 rounded-lg mb-4">
                <p className="text-sm">Hello! I&apos;m your AI cooking assistant. Tell me what ingredients you have, and I&apos;ll suggest recipes!</p>
              </div>
              {aiResponse && (
                <div className="bg-gold/10 p-3 rounded-lg mb-4">
                  <p className="text-sm">{aiResponse}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
                placeholder="e.g., chicken + mushrooms"
                className="flex-1 px-4 py-2 border border-border bg-transparent text-sm"
              />
              <button onClick={handleAIQuery} className="btn-primary py-2">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chef Timeline Modal */}
      <AnimatePresence>
        {showChefTimeline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[85] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-lighter max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="heading-md">{homeChefs[activeChef].name} - Career Timeline</h2>
                <button onClick={() => setShowChefTimeline(false)}><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gold/30" />
                  {homeChefs[activeChef].timeline.map((event, index) => (
                    <motion.div
                      key={event.year}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-12 pb-8"
                    >
                      <div className="absolute left-2 w-4 h-4 bg-gold rounded-full -translate-x-1/2" />
                      <span className="text-gold font-serif text-xl">{event.year}</span>
                      <h3 className="font-serif font-semibold text-lg mt-1">{event.title}</h3>
                      <p className="text-muted-foreground mt-1">{event.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${navContainerClass}`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between py-6">
            <a href="#" className={`font-serif text-xl font-bold tracking-wider transition-colors duration-300 ${navTextClass}`}>
              SAMSUNG<span className="text-gold">.</span>
            </a>
            
            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className={`nav-link transition-colors duration-300 ${navTextClass}`}
                >
                  {link}
                </a>
              ))}
            </div>
            
            <div className="hidden lg:flex items-center gap-4">
              <button
                type="button"
                onClick={handleThemeToggle}
                className={`transition-colors ${navIconClass}`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={handleAIAssistantToggle}
                className={`transition-colors ${navIconClass}`}
                aria-label="Toggle AI assistant"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              {isLoggedIn ? (
                <div className="relative group">
                  <button className={`transition-colors relative ${navIconClass}`} type="button" aria-label="Profile menu">
                    <User className="w-5 h-5" />
                    {userPoints > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-gold text-dark text-xs rounded-full flex items-center justify-center font-bold">
                        {userPoints}
                      </span>
                    )}
                  </button>
                  <div
                    className={`absolute right-0 mt-3 w-56 rounded-xl border shadow-xl transition-all duration-200 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 ${
                      isDarkMode ? 'bg-neutral-900 border-white/15' : 'bg-white border-black/10'
                    }`}
                  >
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/10 text-white' : 'border-black/10 text-slate-900'}`}>
                      <p className="text-sm font-medium">Hi {loggedInUserName || 'Chef'} 👋</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleProfileQuickAction('recipes')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-black/5'}`}
                    >
                      Recent Recipes
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/recipes?mode=liked')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-black/5'}`}
                    >
                      Liked Recipes
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/chefs?mode=favorites')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-black/5'}`}
                    >
                      Favorite Chefs
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-black/5'}`}
                    >
                      Profile Section
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors border-t flex items-center gap-2 ${
                        isDarkMode
                          ? 'text-red-300 border-white/10 hover:bg-white/10'
                          : 'text-red-600 border-black/10 hover:bg-black/5'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 border border-current text-xs uppercase tracking-wide hover:text-gold transition-colors"
                >
                  Login
                </button>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden transition-colors ${navTextClass}`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`fixed inset-0 z-40 lg:hidden ${
                isDarkMode ? 'bg-dark' : 'bg-white'
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full gap-8">
                {navLinks.map((link) => (
                  <a
                    key={link}
                    href={`#${link.toLowerCase()}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-2xl font-serif hover:text-gold transition-colors ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {link}
                  </a>
                ))}
                {isLoggedIn ? (
                  <div className={`flex flex-col items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <span className="text-sm uppercase tracking-wider">Profile</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleProfileQuickAction('recipes')}
                      className="px-4 py-2 border border-current text-sm uppercase tracking-wide hover:text-gold transition-colors"
                    >
                      Recent Recipes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/recipes?mode=liked');
                      }}
                      className="px-4 py-2 border border-current text-sm uppercase tracking-wide hover:text-gold transition-colors"
                    >
                      Liked Recipes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/chefs?mode=favorites');
                      }}
                      className="px-4 py-2 border border-current text-sm uppercase tracking-wide hover:text-gold transition-colors"
                    >
                      Favorite Chefs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="px-4 py-2 border border-current text-sm uppercase tracking-wide hover:text-gold transition-colors"
                    >
                      Profile Section
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2 border border-current text-sm uppercase tracking-wide hover:text-red-400 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/login');
                    }}
                    className="px-4 py-2 border border-current text-sm uppercase tracking-wide hover:text-gold transition-colors"
                  >
                    Login
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Section 1: Hero */}
      <section id="club" className="relative h-screen overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-cover bg-center animate-slow-zoom" style={{ backgroundImage: 'url(/hero-chefs.jpg)' }} />
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
        
        <div className="relative h-full flex items-center justify-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center text-white px-4"
          >
            <motion.p variants={fadeUp} className="tagline text-white/80 mb-4">
              Where culinary excellence meets innovation
            </motion.p>
            <motion.h1 variants={fadeUp} className="heading-xl mb-6 text-white">
              SAMSUNG CLUB OF CHEFS
            </motion.h1>
            <motion.div variants={fadeUp} className="flex justify-center gap-4">
              <a href="#chefs" className="btn-primary">Explore Chefs</a>
              <a href="#recipes" className="btn-secondary text-white border-white">View Recipes</a>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Section 2: Brand Message */}
      <section className="section-padding bg-white dark:bg-dark">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="tagline text-gold mb-6">
                &quot;MAKE EVERY COOKING TIME A SPECIAL MOMENT&quot;
              </p>
              <p className="body-lg text-muted-foreground">
                At Samsung Club of Chefs, we believe that cooking is more than just preparing meals—it&apos;s about creating memories, exploring cultures, and expressing creativity. Our world-renowned chefs share their passion, techniques, and secret recipes to inspire your culinary journey.
              </p>
              <div className="mt-8 flex gap-4">
                <div className="text-center">
                  <span className="heading-lg text-gold block">12+</span>
                  <span className="text-sm text-muted-foreground">World Chefs</span>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <span className="heading-lg text-gold block">{displayRecipesCount}+</span>
                  <span className="text-sm text-muted-foreground">Recipes</span>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <span className="heading-lg text-gold block">{Math.round(displayMembersCount / 1000)}K+</span>
                  <span className="text-sm text-muted-foreground">Members</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-full h-[500px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={brandSectionImages[brandImageIndex]}
                    src={brandSectionImages[brandImageIndex]}
                    alt="Chef kitchen moment"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 3: Meet Our Chefs */}
      <section id="chefs" className="relative py-32 lg:py-40 bg-dark overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/10 to-transparent" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative text-center text-white"
        >
          <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4">World-renowned culinary masters</p>
          <h2 className="heading-xl">
            <span className="block text-5xl md:text-7xl lg:text-8xl opacity-30">MEET</span>
            <span className="block text-6xl md:text-8xl lg:text-9xl -mt-4 md:-mt-8">OUR CHEFS</span>
          </h2>
        </motion.div>
      </section>

      {/* Section 4: Chef Profile */}
      <section className="section-padding bg-white dark:bg-dark">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`chef-image-${homeChefs[activeChef].id}`}
                initial={{ opacity: 0, x: -24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.98 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="relative group overflow-hidden"
              >
                <img
                  src={homeChefs[activeChef].image}
                  alt={homeChefs[activeChef].name}
                  className="w-full h-[600px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => toggleFavoriteChef(homeChefs[activeChef].id)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-gold transition-colors"
                  aria-label={favoriteChefIds.includes(homeChefs[activeChef].id) ? 'Remove from favorite chefs' : 'Add to favorite chefs'}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favoriteChefIds.includes(homeChefs[activeChef].id) ? 'fill-gold text-gold' : 'text-white'
                    }`}
                  />
                </button>
                <button
                  onClick={() => setShowChefTimeline(true)}
                  className="absolute bottom-4 left-4 bg-white/90 dark:bg-dark/90 px-4 py-2 text-sm font-medium hover:bg-gold hover:text-white transition-colors"
                >
                  View Timeline
                </button>
              </motion.div>
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={`chef-content-${homeChefs[activeChef].id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(homeChefs[activeChef].michelinStars)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">Michelin Stars</span>
                </div>
                <h3 className="heading-lg mb-2">{homeChefs[activeChef].name}</h3>
                <p className="text-gold font-medium mb-6">{homeChefs[activeChef].title}</p>
                <p className="body-lg text-muted-foreground mb-8">{homeChefs[activeChef].bio}</p>
                
                <div className="flex items-center gap-4 mb-8">
                  <button
                    onClick={() => setActiveChef((prev) => (prev === 0 ? homeChefs.length - 1 : prev - 1))}
                    className="w-12 h-12 border border-border flex items-center justify-center hover:bg-dark hover:text-white hover:border-dark transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {activeChef + 1} / {homeChefs.length}
                  </span>
                  <button
                    onClick={() => setActiveChef((prev) => (prev === homeChefs.length - 1 ? 0 : prev + 1))}
                    className="w-12 h-12 border border-border flex items-center justify-center hover:bg-dark hover:text-white hover:border-dark transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Restaurant</span>
                    <p className="font-serif font-medium">{homeChefs[activeChef].restaurant}</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <span className="text-sm text-muted-foreground">Location</span>
                    <p className="font-serif font-medium">{homeChefs[activeChef].location}</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <span className="text-sm text-muted-foreground">Cuisine</span>
                    <p className="font-serif font-medium">{homeChefs[activeChef].cuisine}</p>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <span className="text-sm text-muted-foreground">Famous Dish</span>
                    <p className="font-serif font-medium">{homeChefs[activeChef].famousDish}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/chefs"
              onClick={() => sessionStorage.setItem('returnToChefsSection', 'true')}
              className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:border-gold hover:text-gold transition-colors"
            >
              View All Chefs
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: Chef's Favorites */}
      <section id="favorites" className="relative py-32 lg:py-48 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(/chef-favorites-bg.jpg)' }} />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative text-center text-white"
        >
          <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4">Curated Selection</p>
          <h2 className="heading-xl mb-4 text-white">CHEF&apos;S FAVORITES</h2>
          <p className="text-white/70 max-w-xl mx-auto">Signature dishes from our culinary masters, crafted with passion and precision</p>
        </motion.div>
        <div className="relative container-custom mt-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rotatingFavoriteRecipes.map((recipe) => (
              <Link key={`favorite-${recipe.id}`} to={`/recipes/${recipe.id}`} className="group rounded-md border border-white/20 bg-black/35 backdrop-blur-sm p-4 transition-all duration-500 hover:-translate-y-1">
                <div className="relative overflow-hidden rounded mb-4">
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-44 object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-base text-white group-hover:text-gold transition-colors">{recipe.title}</h3>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      toggleSaveRecipe(recipe.id);
                    }}
                    className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-gold hover:border-gold transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${savedRecipes.includes(recipe.id) ? 'fill-gold text-gold' : 'text-white'}`} />
                  </button>
                </div>
                <p className="text-white/70 text-sm mt-2">{recipe.specialty ?? 'Unique Samsung-curated chef favorite dish.'}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Tabbed Recipe Gallery */}
      <section id="recipes" className="section-padding bg-white dark:bg-dark">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-lg mb-4">Chef&apos;s Recipes</h2>
            <p className="text-muted-foreground">Discover signature dishes from our world-class chefs</p>
          </motion.div>
          
          {/* Recipe Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {rotatingRecipes.map((recipe, index) => (
                <motion.article
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`group relative overflow-hidden rounded-md border border-border bg-card ${
                    index % 5 === 0 ? 'sm:col-span-2 lg:col-span-2' : ''
                  }`}
                >
                  <Link to={`/recipes/${recipe.id}`} className="block">
                  <div className={`relative overflow-hidden ${index % 5 === 0 ? 'aspect-[2/1]' : 'aspect-square'}`}>
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

                    {/* Difficulty badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 text-xs uppercase tracking-wider ${
                        recipe.difficulty === 'Easy' ? 'bg-green-500' :
                        recipe.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                      } text-white`}>
                        {recipe.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/50">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-serif font-medium group-hover:text-gold transition-colors">{recipe.title}</h3>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          toggleSaveRecipe(recipe.id);
                        }}
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-gold hover:border-gold transition-colors"
                        aria-label={savedRecipes.includes(recipe.id) ? 'Unlike recipe' : 'Like recipe'}
                      >
                        <Heart className={`w-4 h-4 ${savedRecipes.includes(recipe.id) ? 'fill-gold text-gold' : ''}`} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{recipe.specialty ?? `${recipe.cuisine ?? 'Chef-curated'} specialty`}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {recipe.time} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {recipe.servings}
                      </span>
                    </div>
                    {recipe.appliance && (
                      <p className="text-xs text-gold mt-2">{recipe.appliance}</p>
                    )}
                  </div>
                  </Link>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
          <div className="mt-10 flex justify-end">
            <Link
              to="/recipes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-dark text-white text-base uppercase tracking-wider shadow-lg hover:bg-gold transition-colors"
            >
              View All Recipes <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Section 7: Club News */}
      <section id="news" className="relative py-32 lg:py-48 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(/club-news-bg.jpg)' }} />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative text-center text-white"
        >
          <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4">Stay Updated</p>
          <h2 className="heading-xl text-white">CLUB NEWS</h2>
        </motion.div>
      </section>

      {/* Section 8: News Cards */}
      <section className="section-padding bg-white dark:bg-dark">
        <div className="container-custom space-y-14">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="heading-md">Popular</h3>
              <p className="text-sm text-muted-foreground">Top 5 + 1 View More card</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => scrollNewsRail(popularCarouselRef, -1, popularAnimationRef, 0.42)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => scrollNewsRail(popularCarouselRef, 1, popularAnimationRef, 0.42)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-5 h-5 mx-auto" />
              </button>
              <div
                ref={popularCarouselRef}
                className="flex gap-5 overflow-x-auto snap-x snap-proximity pb-2 pr-24 hide-scrollbar"
              >
                {popularMainArticles.map((article, index) => (
                  <article
                    key={article.id}
                    className="snap-start shrink-0 w-[82%] md:w-[46%] lg:w-[44%] group relative rounded-md border border-border p-4 bg-card transition-all duration-500 hover:-translate-y-1"
                  >
                    <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-xs font-semibold rounded bg-black/70 text-white">
                      #{index + 1}
                    </span>
                    <Link
                      to={`/news/${article.id}`}
                      onClick={() => {
                        sessionStorage.setItem('newsScrollY', String(window.scrollY));
                      }}
                    >
                      <div className="relative overflow-hidden mb-4 rounded">
                        <img
                          src={article.image}
                          alt={article.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h4 className="font-serif text-lg mb-2 group-hover:text-gold transition-colors">{article.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                    </Link>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>👍 {article.likes}</span>
                      <span>👎 {article.dislikes}</span>
                      <span>⚡ {article.actionCount}</span>
                    </div>
                  </article>
                ))}
                <article className="snap-start shrink-0 w-[82%] md:w-[46%] lg:w-[44%] rounded-md border border-gold/40 p-5 bg-gradient-to-br from-card via-card to-gold/10 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold mb-2">More Popular Stories</p>
                    <h4 className="font-serif text-2xl mb-2">View More</h4>
                    <p className="text-sm text-muted-foreground">
                      {popularViewMoreArticle
                        ? `Next top article: ${popularViewMoreArticle.title}`
                        : 'Explore the full popular feed.'}
                    </p>
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/news/popular"
                      onClick={() => {
                        sessionStorage.setItem('newsScrollY', String(window.scrollY));
                      }}
                      className="inline-flex px-4 py-2 bg-gold text-white text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
                    >
                      View more
                    </Link>
                  </div>
                </article>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="heading-md">Latest News</h3>
              <p className="text-sm text-muted-foreground">Latest 11 + 1 View More card</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => scrollNewsRail(latestCarouselRef, -1, latestAnimationRef, 0.92)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => scrollNewsRail(latestCarouselRef, 1, latestAnimationRef, 0.92)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 transition-colors"
              >
                <ChevronRight className="w-5 h-5 mx-auto" />
              </button>
              <div
                ref={latestCarouselRef}
                className="flex gap-6 overflow-x-auto snap-x snap-proximity pb-2 pr-24 hide-scrollbar"
              >
                {latestGridPages.map((page, pageIndex) => (
                  <div
                    key={`latest-page-${pageIndex}`}
                    className="snap-start shrink-0 w-[92%] md:w-[90%] lg:w-[88%] rounded-md border border-border p-5 bg-card"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {page.map((card, cardIndex) =>
                        card.type === 'article' ? (
                          <article
                            key={card.article.id}
                            className="group cursor-pointer rounded-md border border-border p-4 bg-background transition-all duration-500 hover:-translate-y-1"
                          >
                            <Link
                              to={`/news/${card.article.id}`}
                              onClick={() => {
                                sessionStorage.setItem('newsScrollY', String(window.scrollY));
                              }}
                            >
                              <div className="relative overflow-hidden mb-4 rounded">
                                <img
                                  src={card.article.image}
                                  alt={card.article.title}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-44 object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute top-3 left-3">
                                  <span className="px-3 py-1 bg-gold text-white text-[11px] uppercase tracking-wider">
                                    {card.article.category}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{card.article.date}</p>
                              <h4 className="font-serif text-lg mb-2 group-hover:text-gold transition-colors">{card.article.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">{card.article.excerpt}</p>
                            </Link>
                            <div className="mt-3 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  reactToArticle(card.article.id, 'like');
                                }}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition-all duration-200 ${
                                  card.article.userReaction === 'like'
                                    ? 'border-green-500 text-green-600 bg-green-50 scale-110'
                                    : 'border-border hover:bg-muted'
                                }`}
                              >
                                <ThumbsUp className={`transition-all ${card.article.userReaction === 'like' ? 'w-5 h-5' : 'w-4 h-4'}`} /> {card.article.likes}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  reactToArticle(card.article.id, 'dislike');
                                }}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm transition-all duration-200 ${
                                  card.article.userReaction === 'dislike'
                                    ? 'border-red-500 text-red-600 bg-red-50 scale-110'
                                    : 'border-border hover:bg-muted'
                                }`}
                              >
                                <ThumbsDown className={`transition-all ${card.article.userReaction === 'dislike' ? 'w-5 h-5' : 'w-4 h-4'}`} /> {card.article.dislikes}
                              </button>
                            </div>
                          </article>
                        ) : (
                          <article
                            key={`latest-view-more-${pageIndex}-${cardIndex}`}
                            className="rounded-md border border-gold/40 p-5 bg-gradient-to-br from-background via-card to-gold/10 shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gold mb-2">Latest Extensions</p>
                              <h4 className="font-serif text-2xl mb-2">View More</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Continue to the complete listing page for all articles.
                              </p>
                              {card.overflowArticles[0] && (
                                <p className="text-sm text-muted-foreground">
                                  Next article: {card.overflowArticles[0].title}
                                </p>
                              )}
                            </div>
                            <div className="mt-6">
                              <Link
                                to="/news/latest"
                                onClick={() => {
                                  sessionStorage.setItem('newsScrollY', String(window.scrollY));
                                }}
                                className="inline-flex px-4 py-2 bg-gold text-white text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
                              >
                                View more
                              </Link>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Editor's Notes */}
      <section className="relative py-32 lg:py-48 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url(/editors-notes-bg.jpg)' }} />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative text-center text-white"
        >
          <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4">Curated Stories</p>
          <h2 className="heading-xl text-white">EDITOR&apos;S NOTES</h2>
        </motion.div>
      </section>

      {/* Section 10: Editorial Grid */}
      <section className="section-padding bg-white dark:bg-dark">
        <div className="container-custom">
          <div className="relative">
            <button
              type="button"
              onClick={() => scrollNewsRail(editorialCarouselRef, -1, editorialAnimationRef, 0.5)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mx-auto" />
            </button>
            <button
              type="button"
              onClick={() => scrollNewsRail(editorialCarouselRef, 1, editorialAnimationRef, 0.5)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 transition-colors"
            >
              <ChevronRight className="w-5 h-5 mx-auto" />
            </button>

            <div
              ref={editorialCarouselRef}
              className="flex gap-6 overflow-x-auto snap-x snap-proximity pb-2 pr-24 hide-scrollbar"
            >
              {homeEditorialArticles.map((article) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55 }}
                  className="snap-start shrink-0 w-[84%] md:w-[48%] lg:w-[48%] group cursor-pointer"
                >
                  <Link
                    to={`/editorials/${article.id}`}
                    onClick={() => {
                      sessionStorage.setItem('newsScrollY', String(window.scrollY));
                    }}
                  >
                    <div className="relative overflow-hidden mb-6 rounded">
                      <img
                        src={article.image}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="heading-md mb-2 group-hover:text-gold transition-colors">{article.title}</h3>
                    <p className="text-muted-foreground">{article.subtitle}</p>
                  </Link>
                </motion.div>
              ))}

              <div className="snap-start shrink-0 w-[84%] md:w-[48%] lg:w-[48%] rounded-md border border-gold/40 p-6 bg-gradient-to-br from-background via-card to-gold/10 flex flex-col justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gold mb-2">Editorial Archive</p>
                  <h3 className="font-serif text-2xl mb-2">View More</h3>
                  <p className="text-sm text-muted-foreground">
                    Open the complete editorial notes page with all dynamic records.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    to="/editorials"
                    onClick={() => {
                      sessionStorage.setItem('newsScrollY', String(window.scrollY));
                    }}
                    className="inline-flex px-4 py-2 bg-gold text-white text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
                  >
                    View more
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 11: Footer Hero */}
      <section id="contact" className="section-padding bg-dark text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4">Join Our Community</p>
            <h2 className="heading-lg mb-6">WELCOME TO SAMSUNG&apos;S HOME COOKING STORIES</h2>
            <p className="text-white/70 mb-8">
              {footerInstructionText}
            </p>
            <div className="flex justify-center gap-4">
              <a href="#recipes" className="btn-primary bg-gold text-dark hover:bg-gold-light">Explore Recipes</a>
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn-secondary text-white border-white"
                >
                  Subscribe
                </button>
              )}
            </div>
            
            {/* User Activity Stats */}
            <div className="mt-12 pt-12 border-t border-white/10">
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <Users className="w-8 h-8 text-gold mx-auto mb-2" />
                  <span className="text-2xl font-serif font-bold">{favoriteChefIds.length}</span>
                  <p className="text-sm text-white/50">Chefs Followed</p>
                </div>
                <div className="text-center">
                  <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
                  <span className="text-2xl font-serif font-bold">{completedRecipesCount}</span>
                  <p className="text-sm text-white/50">Recipes Completed</p>
                </div>
                <div className="text-center">
                  <Bookmark className="w-8 h-8 text-gold mx-auto mb-2" />
                  <span className="text-2xl font-serif font-bold">{savedRecipes.length}</span>
                  <p className="text-sm text-white/50">Saved Recipes</p>
                </div>
                <div className="text-center">
                  <Sparkles className="w-8 h-8 text-gold mx-auto mb-2" />
                  <span className="text-2xl font-serif font-bold">{responseCount}</span>
                  <p className="text-sm text-white/50">Responses</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 12: Footer Gallery */}
      <footer className="bg-dark text-white py-12">
        <div className="container-custom">
          {/* Horizontal Scroll Gallery */}
          <div className="mb-12 overflow-x-auto pb-4">
            <div className="flex gap-4" style={{ width: 'max-content' }}>
              {footerGallery.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="w-32 h-32 flex-shrink-0 overflow-hidden"
                >
                  <img
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-8 border-t border-white/10">
            <div className="text-center md:text-left">
              <a href="#" className="font-serif text-2xl font-bold tracking-wider">
                SAMSUNG<span className="text-gold">.</span>
              </a>
              <p className="text-white/50 text-sm mt-2">Club of Chefs</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-sm text-white/70 hover:text-gold transition-colors">Privacy</a>
              <a href="#" className="text-sm text-white/70 hover:text-gold transition-colors">Terms</a>
              <a href="#" className="text-sm text-white/70 hover:text-gold transition-colors">Contact</a>
              <a href="#" className="text-sm text-white/70 hover:text-gold transition-colors">Careers</a>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleAIAssistantToggle}
                className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center hover:bg-gold transition-colors"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleThemeToggle}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="text-center mt-8 pt-8 border-t border-white/10">
            <p className="text-white/30 text-sm">© 2024 Samsung Club of Chefs. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating AI Button */}
      {!showAIAssistant && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gold text-dark rounded-full shadow-lg flex items-center justify-center z-50 hover:shadow-glow transition-shadow"
        >
          <Sparkles className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}

export default App;
