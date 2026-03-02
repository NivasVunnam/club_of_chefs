import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, Heart } from 'lucide-react';
import type { Recipe } from '@/types';
import { apiUrl } from '@/lib/api';

type AppContentResponse = {
  recipes: Recipe[];
};

const PAGE_SIZE = 15;

function normalizeCourse(recipe: Recipe) {
  return recipe.course ?? 'Main Course';
}

function normalizeCuisine(recipe: Recipe) {
  return recipe.cuisine ?? 'Global';
}

function AllRecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('clubAuthUser')));
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);
  const [inProgressRecipeIds, setInProgressRecipeIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(apiUrl('/api/content'));
        if (!response.ok) throw new Error(`Failed to load recipes: ${response.status}`);
        const data = (await response.json()) as AppContentResponse;
        setRecipes(data.recipes ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('savedRecipes');
    if (saved) setSavedRecipes(JSON.parse(saved));
    const started = localStorage.getItem('inProgressRecipeIds');
    if (started) setInProgressRecipeIds(JSON.parse(started));
    const syncAuth = () => setIsLoggedIn(Boolean(localStorage.getItem('clubAuthUser')));
    window.addEventListener('focus', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('focus', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const recentMode = searchParams.get('mode') === 'recent';
  const likedMode = searchParams.get('mode') === 'liked';
  const recentRecipeIds = useMemo(() => {
    const raw = localStorage.getItem('recentRecipeIds');
    return raw ? (JSON.parse(raw) as string[]) : [];
  }, []);
  const likedRecipeIds = useMemo(() => {
    const raw = localStorage.getItem('savedRecipes');
    return raw ? (JSON.parse(raw) as string[]) : [];
  }, []);

  const recentRecipes = useMemo(() => {
    const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    return recentRecipeIds.map((id) => byId.get(id)).filter((recipe): recipe is Recipe => Boolean(recipe));
  }, [recipes, recentRecipeIds]);
  const likedRecipes = useMemo(() => {
    const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    return likedRecipeIds.map((id) => byId.get(id)).filter((recipe): recipe is Recipe => Boolean(recipe));
  }, [recipes, likedRecipeIds]);

  const sourceRecipes = recentMode ? recentRecipes : likedMode ? likedRecipes : recipes;

  const cuisines = useMemo(() => [...new Set(sourceRecipes.map((recipe) => normalizeCuisine(recipe)))].sort((a, b) => a.localeCompare(b)), [sourceRecipes]);
  const courses = useMemo(() => [...new Set(sourceRecipes.map((recipe) => normalizeCourse(recipe)))].sort((a, b) => a.localeCompare(b)), [sourceRecipes]);

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sourceRecipes.filter((recipe) => {
      const matchesSearch =
        !q ||
        recipe.title.toLowerCase().includes(q) ||
        (recipe.specialty ?? '').toLowerCase().includes(q);
      const matchesDifficulty = difficultyFilter === 'all' || recipe.difficulty === difficultyFilter;
      const matchesCourse = courseFilter === 'all' || normalizeCourse(recipe) === courseFilter;
      const matchesCuisine = cuisineFilter === 'all' || normalizeCuisine(recipe) === cuisineFilter;
      const matchesTime =
        timeFilter === 'all' ||
        (timeFilter === 'under30' && recipe.time <= 30) ||
        (timeFilter === '30to60' && recipe.time > 30 && recipe.time <= 60) ||
        (timeFilter === 'above60' && recipe.time > 60);
      return matchesSearch && matchesDifficulty && matchesCourse && matchesCuisine && matchesTime;
    });
  }, [sourceRecipes, searchQuery, difficultyFilter, courseFilter, cuisineFilter, timeFilter]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, difficultyFilter, courseFilter, cuisineFilter, timeFilter, recentMode, likedMode]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / PAGE_SIZE));
  const pagedRecipes = filteredRecipes.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const toggleLike = (recipeId: string) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const updated = savedRecipes.includes(recipeId)
      ? savedRecipes.filter((id) => id !== recipeId)
      : [...savedRecipes, recipeId];
    setSavedRecipes(updated);
    localStorage.setItem('savedRecipes', JSON.stringify(updated));
  };

  const updateRecentRecipes = (recipeId: string) => {
    const existingRecent = localStorage.getItem('recentRecipeIds');
    const list = existingRecent ? (JSON.parse(existingRecent) as string[]) : [];
    const updatedRecent = [recipeId, ...list.filter((id) => id !== recipeId)].slice(0, 20);
    localStorage.setItem('recentRecipeIds', JSON.stringify(updatedRecent));
  };

  const startRecipe = (recipeId: string) => {
    const fromPath = `${window.location.pathname}${window.location.search}`;
    if (!isLoggedIn) {
      sessionStorage.setItem('returnToRecipePath', `/recipes/${recipeId}/process?mode=start&from=${encodeURIComponent(fromPath)}`);
      navigate('/login');
      return;
    }

    updateRecentRecipes(recipeId);
    const updatedInProgress = inProgressRecipeIds.includes(recipeId)
      ? [...inProgressRecipeIds]
      : [recipeId, ...inProgressRecipeIds];
    setInProgressRecipeIds(updatedInProgress);
    localStorage.setItem('inProgressRecipeIds', JSON.stringify(updatedInProgress));
    navigate(`/recipes/${recipeId}/process?mode=start&from=${encodeURIComponent(fromPath)}`);
  };

  const restartRecipe = (recipeId: string) => {
    const fromPath = `${window.location.pathname}${window.location.search}`;
    if (!isLoggedIn) {
      sessionStorage.setItem('returnToRecipePath', `/recipes/${recipeId}/process?mode=restart&from=${encodeURIComponent(fromPath)}`);
      navigate('/login');
      return;
    }

    updateRecentRecipes(recipeId);
    const updatedInProgress = inProgressRecipeIds.includes(recipeId)
      ? [...inProgressRecipeIds]
      : [recipeId, ...inProgressRecipeIds];
    setInProgressRecipeIds(updatedInProgress);
    localStorage.setItem('inProgressRecipeIds', JSON.stringify(updatedInProgress));
    navigate(`/recipes/${recipeId}/process?mode=restart&from=${encodeURIComponent(fromPath)}`);
  };

  const continueRecipe = (recipeId: string) => {
    const fromPath = `${window.location.pathname}${window.location.search}`;
    if (!isLoggedIn) {
      sessionStorage.setItem('returnToRecipePath', `/recipes/${recipeId}/process?mode=continue&from=${encodeURIComponent(fromPath)}`);
      navigate('/login');
      return;
    }
    updateRecentRecipes(recipeId);
    navigate(`/recipes/${recipeId}/process?mode=continue&from=${encodeURIComponent(fromPath)}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading recipes...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container-custom py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <section className="mt-8 mb-8">
          <h1 className="heading-lg mb-2">{recentMode ? 'Recent Recipes' : likedMode ? 'Liked Recipes' : 'All Recipes'}</h1>
          <p className="text-muted-foreground">
            {recentMode
              ? 'Recipes you recently started from the dish pages.'
              : likedMode
                ? 'Recipes you have liked and saved.'
              : 'Explore all dishes with search, filters, and detailed pages.'}
          </p>
        </section>

        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by dish or specialty"
            className="rounded-md border border-border bg-card px-3 py-2"
          />
          <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)} className="rounded-md border border-border bg-card px-3 py-2">
            <option value="all">All Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="rounded-md border border-border bg-card px-3 py-2">
            <option value="all">All Courses</option>
            {courses.map((course) => <option key={course} value={course}>{course}</option>)}
          </select>
          <select value={cuisineFilter} onChange={(event) => setCuisineFilter(event.target.value)} className="rounded-md border border-border bg-card px-3 py-2">
            <option value="all">All Cuisines</option>
            {cuisines.map((cuisine) => <option key={cuisine} value={cuisine}>{cuisine}</option>)}
          </select>
          <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} className="rounded-md border border-border bg-card px-3 py-2">
            <option value="all">All Time</option>
            <option value="under30">Under 30 min</option>
            <option value="30to60">31 - 60 min</option>
            <option value="above60">Above 60 min</option>
          </select>
        </section>

        {filteredRecipes.length === 0 ? (
          <section className="rounded-md border border-border bg-card p-8 text-center">
            <h2 className="font-serif text-2xl mb-2">No recipes found</h2>
            <p className="text-muted-foreground">No dishes match this search/filter combination.</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedRecipes.map((recipe) => {
              const hasStarted = inProgressRecipeIds.includes(recipe.id);
              return (
              <article key={recipe.id} className="rounded-md border border-border bg-card p-4">
                <Link to={`/recipes/${recipe.id}`} className="block">
                  <img src={recipe.image} alt={recipe.title} loading="lazy" decoding="async" className="w-full h-52 object-cover rounded mb-3" />
                </Link>
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/recipes/${recipe.id}`} className="font-serif text-lg hover:text-gold transition-colors">{recipe.title}</Link>
                  <button
                    type="button"
                    onClick={() => toggleLike(recipe.id)}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-gold hover:border-gold transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${savedRecipes.includes(recipe.id) ? 'fill-gold text-gold' : ''}`} />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{recipe.specialty ?? 'Chef-curated specialty dish'}</p>
                <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.time} min</span>
                  <span>{recipe.difficulty}</span>
                  <span>{normalizeCourse(recipe)}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {hasStarted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => continueRecipe(recipe.id)}
                        className="px-3 py-1.5 text-sm bg-gold text-dark rounded hover:bg-gold-light transition-colors"
                      >
                        Continue
                      </button>
                      <button
                        type="button"
                        onClick={() => restartRecipe(recipe.id)}
                        className="px-3 py-1.5 text-sm border border-border rounded hover:border-gold hover:text-gold transition-colors"
                      >
                        Restart Process
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startRecipe(recipe.id)}
                      className="px-3 py-1.5 text-sm bg-gold text-dark rounded hover:bg-gold-light transition-colors"
                    >
                      Start Making Process
                    </button>
                  )}
                </div>
              </article>
            )})}
          </section>
        )}

        {filteredRecipes.length > 0 && (
          <section className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {page + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

export default AllRecipesPage;
