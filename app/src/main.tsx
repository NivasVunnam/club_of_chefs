import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import NewsArticlePage from './pages/NewsArticlePage.tsx'
import AllNewsPage from './pages/AllNewsPage.tsx'
import PopularArticlesPage from './pages/PopularArticlesPage.tsx'
import LatestArticlesPage from './pages/LatestArticlesPage.tsx'
import EditorialsPage from './pages/EditorialsPage.tsx'
import EditorialDetailPage from './pages/EditorialDetailPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import AllChefsPage from './pages/AllChefsPage.tsx'
import AllRecipesPage from './pages/AllRecipesPage.tsx'
import RecipeDetailPage from './pages/RecipeDetailPage.tsx'
import RecipeProcessPage from './pages/RecipeProcessPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/news" element={<AllNewsPage />} />
        <Route path="/news/popular" element={<PopularArticlesPage />} />
        <Route path="/news/latest" element={<LatestArticlesPage />} />
        <Route path="/news/:articleId" element={<NewsArticlePage />} />
        <Route path="/editorials" element={<EditorialsPage />} />
        <Route path="/editorials/:editorialId" element={<EditorialDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chefs" element={<AllChefsPage />} />
        <Route path="/recipes" element={<AllRecipesPage />} />
        <Route path="/recipes/:recipeId" element={<RecipeDetailPage />} />
        <Route path="/recipes/:recipeId/process" element={<RecipeProcessPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
