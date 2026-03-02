import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Recipe } from '@/types';
import { apiUrl } from '@/lib/api';

type AppContentResponse = {
  recipes: Recipe[];
};

type ProgressMap = Record<string, { currentStep: number; completed: boolean; updatedAt: number }>;

function readProgressMap(): ProgressMap {
  const raw = localStorage.getItem('recipeProcessProgress');
  return raw ? (JSON.parse(raw) as ProgressMap) : {};
}

function RecipeProcessPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<ProgressMap>(() => readProgressMap());

  useEffect(() => {
    if (!localStorage.getItem('clubAuthUser')) {
      sessionStorage.setItem('returnToRecipePath', window.location.pathname + window.location.search);
      navigate('/login', { replace: true });
      return;
    }

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
  }, [navigate]);

  const recipe = useMemo(() => recipes.find((item) => item.id === recipeId) ?? null, [recipes, recipeId]);
  const mode = (searchParams.get('mode') ?? 'continue') as 'start' | 'continue' | 'restart';
  const fromPath = searchParams.get('from') || '/recipes';

  useEffect(() => {
    if (!recipe) return;
    const progress = readProgressMap();
    const existing = progress[recipe.id] ?? { currentStep: 0, completed: false, updatedAt: Date.now() };
    const next =
      mode === 'restart'
        ? { currentStep: 0, completed: false, updatedAt: Date.now() }
        : mode === 'start' && !progress[recipe.id]
          ? { currentStep: 0, completed: false, updatedAt: Date.now() }
          : existing;

    progress[recipe.id] = next;
    localStorage.setItem('recipeProcessProgress', JSON.stringify(progress));
    setProgressMap(progress);

    const inProgressRaw = localStorage.getItem('inProgressRecipeIds');
    const inProgress = inProgressRaw ? (JSON.parse(inProgressRaw) as string[]) : [];
    if (!inProgress.includes(recipe.id)) {
      localStorage.setItem('inProgressRecipeIds', JSON.stringify([recipe.id, ...inProgress]));
    }

    const recentRaw = localStorage.getItem('recentRecipeIds');
    const recent = recentRaw ? (JSON.parse(recentRaw) as string[]) : [];
    localStorage.setItem('recentRecipeIds', JSON.stringify([recipe.id, ...recent.filter((id) => id !== recipe.id)].slice(0, 20)));
  }, [recipe, mode]);

  const progress = recipe ? progressMap[recipe.id] : undefined;
  const currentStep = progress?.currentStep ?? 0;

  const updateRecipeProgress = (nextStep: number, completed: boolean) => {
    if (!recipe) return;
    const nextMap = {
      ...progressMap,
      [recipe.id]: { currentStep: nextStep, completed, updatedAt: Date.now() },
    };
    setProgressMap(nextMap);
    localStorage.setItem('recipeProcessProgress', JSON.stringify(nextMap));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading making process...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>;
  if (!recipe) return <div className="min-h-screen flex items-center justify-center">Recipe not found.</div>;

  const isCompleted = progress?.completed ?? false;
  const isLastStep = currentStep >= recipe.steps.length - 1;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container-custom py-12">
        <button
          type="button"
          onClick={() => navigate(fromPath, { replace: true })}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <section className="mt-8 rounded-md border border-border bg-card p-6">
          <h1 className="heading-lg mb-2">Making Process - {recipe.title}</h1>
          <p className="text-muted-foreground mb-6">Follow each item step-by-step and track your process.</p>

          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{Math.min(currentStep + 1, recipe.steps.length)} / {recipe.steps.length}</span>
            </div>
            <div className="h-2 bg-muted rounded">
              <div
                className="h-full bg-gold rounded transition-all duration-300"
                style={{ width: `${((Math.min(currentStep + 1, recipe.steps.length)) / recipe.steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {recipe.steps.map((step, index) => (
              <div
                key={step}
                className={`rounded border p-3 text-sm ${
                  index <= currentStep ? 'border-gold bg-gold/10' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  {index <= currentStep ? <CheckCircle2 className="w-4 h-4 text-gold" /> : <span className="w-4 h-4 rounded-full border border-border inline-block" />}
                  <span>{step}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!isLastStep ? (
              <button
                type="button"
                onClick={() => updateRecipeProgress(currentStep + 1, false)}
                className="px-4 py-2 bg-gold text-dark font-medium hover:bg-gold-light transition-colors"
              >
                Complete Current Step
              </button>
            ) : (
              <button
                type="button"
                onClick={() => updateRecipeProgress(currentStep, true)}
                className="px-4 py-2 bg-gold text-dark font-medium hover:bg-gold-light transition-colors"
              >
                Mark Recipe as Completed
              </button>
            )}

            <button
              type="button"
              onClick={() => updateRecipeProgress(0, false)}
              className="px-4 py-2 border border-border hover:border-gold hover:text-gold transition-colors"
            >
              Restart Process
            </button>

            {isCompleted && <span className="text-sm text-green-600">Completed ✅</span>}
          </div>
        </section>

        <div className="mt-6">
          <Link to="/recipes?mode=recent" className="text-sm text-muted-foreground hover:text-gold transition-colors">
            Open Recent Recipes
          </Link>
        </div>
      </div>
    </main>
  );
}

export default RecipeProcessPage;
