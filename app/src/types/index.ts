export interface Chef {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  famousDish: string;
  followers: number;
  michelinStars: number;
  cuisine: string;
  restaurant: string;
  location: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  year: number;
  title: string;
  description: string;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  chefId: string;
  category: string;
  specialty?: string;
  course?: 'Starter' | 'Main Course' | 'Dessert' | 'Snack' | 'Beverage';
  cuisine?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time: number;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  appliance?: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  fullDescription: string;
  image: string;
  date: string;
  category: string;
  scenario: 'preorder' | 'order' | 'vote' | 'register' | 'notify' | 'guide';
  primaryActionLabel: string;
  likes: number;
  dislikes: number;
  actionCount: number;
  userReaction?: 'like' | 'dislike' | null;
  userAction?: 'preorder' | 'order' | 'register' | 'notify' | 'guide' | null;
  price?: string;
  productLabel?: string;
}

export interface EditorialArticle {
  id: string;
  title: string;
  subtitle: string;
  fullDescription: string;
  publishDate: string;
  author: string;
  category: string;
  image: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  cookingLevel: 'Beginner' | 'Home Cook' | 'Advanced';
  savedRecipes: string[];
  points: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  kitchenTheme: 'morning' | 'night';
}
