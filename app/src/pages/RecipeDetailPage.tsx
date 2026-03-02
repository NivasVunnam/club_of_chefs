import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Heart, Users } from 'lucide-react';
import type { Recipe } from '@/types';
import { apiUrl } from '@/lib/api';

type AppContentResponse = {
  recipes: Recipe[];
};

function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    const syncAuth = () => setIsLoggedIn(Boolean(localStorage.getItem('clubAuthUser')));
    const saved = localStorage.getItem('savedRecipes');
    if (saved) setSavedRecipes(JSON.parse(saved));
    const started = localStorage.getItem('inProgressRecipeIds');
    if (started) setInProgressRecipeIds(JSON.parse(started));
    window.addEventListener('focus', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('focus', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const recipe = useMemo(() => recipes.find((item) => item.id === recipeId) ?? null, [recipes, recipeId]);

  const toggleLikeRecipe = () => {
    if (!recipe) return;
    if (!isLoggedIn) {
      sessionStorage.setItem('returnToRecipePath', `/recipes/${recipe.id}`);
      navigate('/login');
      return;
    }
    const updated = savedRecipes.includes(recipe.id)
      ? savedRecipes.filter((id) => id !== recipe.id)
      : [...savedRecipes, recipe.id];
    setSavedRecipes(updated);
    localStorage.setItem('savedRecipes', JSON.stringify(updated));
  };

  const startMakingProcess = (mode: 'start' | 'continue' | 'restart') => {
    if (!recipe) return;
    const fromPath = `${window.location.pathname}${window.location.search}`;
    if (!isLoggedIn) {
      sessionStorage.setItem('returnToRecipePath', `/recipes/${recipe.id}/process?mode=${mode}&from=${encodeURIComponent(fromPath)}`);
      navigate('/login');
      return;
    }
    const existing = localStorage.getItem('recentRecipeIds');
    const list = existing ? (JSON.parse(existing) as string[]) : [];
    const updated = [recipe.id, ...list.filter((id) => id !== recipe.id)].slice(0, 20);
    localStorage.setItem('recentRecipeIds', JSON.stringify(updated));
    const inProgress = inProgressRecipeIds.includes(recipe.id)
      ? [...inProgressRecipeIds]
      : [recipe.id, ...inProgressRecipeIds];
    setInProgressRecipeIds(inProgress);
    localStorage.setItem('inProgressRecipeIds', JSON.stringify(inProgress));
    navigate(`/recipes/${recipe.id}/process?mode=${mode}&from=${encodeURIComponent(fromPath)}`);
  };

  useEffect(() => {
    const returnPath = sessionStorage.getItem('returnToRecipePath');
    if (returnPath && returnPath.startsWith(`/recipes/${recipeId}`) && isLoggedIn) {
      sessionStorage.removeItem('returnToRecipePath');
    }
  }, [recipeId, isLoggedIn]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading dish...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>;
  if (!recipe) return <div className="min-h-screen flex items-center justify-center">Dish not found.</div>;
  const hasStarted = inProgressRecipeIds.includes(recipe.id);

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

        <section className="mt-8 grid lg:grid-cols-2 gap-8">
          <div className="relative overflow-hidden rounded-md border border-border">
            <img src={recipe.image} alt={recipe.title} className="w-full h-[420px] object-cover" />
          </div>
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="heading-lg">{recipe.title}</h1>
              <button
                type="button"
                onClick={toggleLikeRecipe}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-gold hover:border-gold transition-colors"
              >
                <Heart className={`w-5 h-5 ${savedRecipes.includes(recipe.id) ? 'fill-gold text-gold' : ''}`} />
              </button>
            </div>
            <p className="text-muted-foreground mt-2">{recipe.specialty ?? 'Chef-curated signature dish.'}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <p><span className="text-muted-foreground">Cuisine:</span> {recipe.cuisine ?? 'Global'}</p>
              <p><span className="text-muted-foreground">Course:</span> {recipe.course ?? 'Main Course'}</p>
              <p><span className="text-muted-foreground">Difficulty:</span> {recipe.difficulty}</p>
              <p className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.time} mins</p>
              <p className="inline-flex items-center gap-1"><Users className="w-4 h-4" /> Serves {recipe.servings}</p>
              <p><span className="text-muted-foreground">Category:</span> {recipe.category}</p>
            </div>

            <div className="mt-6">
              <h2 className="font-serif text-2xl mb-3">Ingredients</h2>
              <ul className="space-y-2 text-sm">
                {recipe.ingredients.map((ingredient) => (
                  <li key={`${ingredient.name}-${ingredient.amount}-${ingredient.unit}`}>
                    {ingredient.name} - {ingredient.amount} {ingredient.unit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              {hasStarted ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startMakingProcess('continue')}
                    className="px-5 py-2 bg-gold text-dark font-medium hover:bg-gold-light transition-colors"
                  >
                    Continue Process
                  </button>
                  <button
                    type="button"
                    onClick={() => startMakingProcess('restart')}
                    className="px-5 py-2 border border-border font-medium hover:border-gold hover:text-gold transition-colors"
                  >
                    Restart Process
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startMakingProcess('start')}
                  className="px-5 py-2 bg-gold text-dark font-medium hover:bg-gold-light transition-colors"
                >
                  Start Making Process
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-md border border-border p-6 bg-card">
          <h2 className="font-serif text-2xl mb-4">Steps</h2>
          {!isLoggedIn ? (
            <div>
              <p className="text-muted-foreground mb-4">Login required to view full making steps and like this recipe.</p>
              <Link to="/login" className="inline-flex px-4 py-2 border border-border hover:border-gold hover:text-gold transition-colors">
                Login to unlock steps
              </Link>
            </div>
          ) : (
            <ol className="space-y-3 list-decimal list-inside">
              {recipe.steps.map((step) => (
                <li key={step} className="text-sm">{step}</li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

export default RecipeDetailPage;
