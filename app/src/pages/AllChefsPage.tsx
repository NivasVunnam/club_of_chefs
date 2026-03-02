import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, Star } from 'lucide-react';
import type { Chef } from '@/types';
import { apiUrl } from '@/lib/api';

type AppContentResponse = {
  chefs: Chef[];
};

const PAGE_SIZE = 6;

function AllChefsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('clubAuthUser')));
  const [favoriteChefIds, setFavoriteChefIds] = useState<string[]>([]);
  const [expandedTimelineChefId, setExpandedTimelineChefId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const favoritesMode = searchParams.get('mode') === 'favorites';

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(apiUrl('/api/content'));
        if (!response.ok) throw new Error(`Failed to load chefs: ${response.status}`);
        const data = (await response.json()) as AppContentResponse;
        setChefs(data.chefs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteChefIds');
    if (savedFavorites) {
      setFavoriteChefIds(JSON.parse(savedFavorites));
    }

    const syncAuthState = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('clubAuthUser')));
    };
    window.addEventListener('focus', syncAuthState);
    window.addEventListener('storage', syncAuthState);
    return () => {
      window.removeEventListener('focus', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  const sourceChefs = useMemo(() => {
    if (!favoritesMode) return chefs;
    return chefs.filter((chef) => favoriteChefIds.includes(chef.id));
  }, [chefs, favoriteChefIds, favoritesMode]);

  const cuisines = useMemo(() => {
    return [...new Set(sourceChefs.map((chef) => chef.cuisine))].sort((a, b) => a.localeCompare(b));
  }, [sourceChefs]);

  const locations = useMemo(() => {
    return [...new Set(sourceChefs.map((chef) => chef.location))].sort((a, b) => a.localeCompare(b));
  }, [sourceChefs]);

  const filteredChefs = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return sourceChefs
      .filter((chef) => {
        const matchesSearch =
          !normalizedSearch ||
          chef.name.toLowerCase().includes(normalizedSearch) ||
          chef.restaurant.toLowerCase().includes(normalizedSearch);
        const matchesCuisine = selectedCuisine === 'all' || chef.cuisine === selectedCuisine;
        const matchesLocation = selectedLocation === 'all' || chef.location === selectedLocation;
        return matchesSearch && matchesCuisine && matchesLocation;
      })
      .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
  }, [sourceChefs, searchQuery, selectedCuisine, selectedLocation]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedCuisine, selectedLocation]);

  const totalPages = Math.max(1, Math.ceil(filteredChefs.length / PAGE_SIZE));
  const pagedChefs = filteredChefs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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

  const handleBack = () => {
    sessionStorage.setItem('returnToChefsSection', 'true');
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading chefs...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container-custom py-12">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <section className="mt-8 mb-8">
          <h1 className="heading-lg mb-2">{favoritesMode ? 'Favorite Chefs' : 'All Chefs'}</h1>
          <p className="text-muted-foreground">
            {favoritesMode
              ? 'Chefs you have saved to your favorites list.'
              : 'Explore all world-renowned chefs from Samsung Club Of Chefs.'}
          </p>
        </section>

        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by chef name or restaurant"
            className="rounded-md border border-border bg-card px-3 py-2"
          />
          <select
            value={selectedCuisine}
            onChange={(event) => setSelectedCuisine(event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2"
          >
            <option value="all">All Cuisines</option>
            {cuisines.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
          <select
            value={selectedLocation}
            onChange={(event) => setSelectedLocation(event.target.value)}
            className="rounded-md border border-border bg-card px-3 py-2"
          >
            <option value="all">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </section>

        {filteredChefs.length === 0 ? (
          <section className="rounded-md border border-border bg-card p-8 text-center">
            <h2 className="font-serif text-2xl mb-2">No chefs found</h2>
            <p className="text-muted-foreground">No chefs are found with that particular description.</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedChefs.map((chef) => {
              const isFavorite = favoriteChefIds.includes(chef.id);
              const isExpanded = expandedTimelineChefId === chef.id;
              return (
                <article key={chef.id} className="rounded-md border border-border bg-card p-4">
                  <div className="relative mb-4 overflow-hidden rounded">
                    <img
                      src={chef.image}
                      alt={chef.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-56 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => toggleFavoriteChef(chef.id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-gold transition-colors"
                      aria-label={isFavorite ? 'Remove from favorite chefs' : 'Add to favorite chefs'}
                    >
                      <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-gold text-gold' : 'text-white'}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedTimelineChefId(isExpanded ? null : chef.id)}
                      className="absolute bottom-4 left-4 bg-white/90 dark:bg-dark/90 px-4 py-2 text-sm font-medium hover:bg-gold hover:text-white transition-colors"
                    >
                      View Timeline
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(chef.michelinStars)].map((_, index) => (
                      <Star key={index} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <h3 className="font-serif text-xl">{chef.name}</h3>
                  <p className="text-gold text-sm mb-3">{chef.title}</p>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{chef.bio}</p>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Cuisine:</span> {chef.cuisine}</p>
                    <p><span className="text-muted-foreground">Restaurant:</span> {chef.restaurant}</p>
                    <p><span className="text-muted-foreground">Location:</span> {chef.location}</p>
                    <p><span className="text-muted-foreground">Famous Dish:</span> {chef.famousDish}</p>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="font-serif text-base mb-2">Timeline</h4>
                      <div className="space-y-2">
                        {chef.timeline.map((item) => (
                          <div key={`${chef.id}-${item.year}-${item.title}`} className="text-sm">
                            <p className="font-medium">{item.year} - {item.title}</p>
                            <p className="text-muted-foreground">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
        {filteredChefs.length > 0 && (
          <section className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} / {totalPages}
            </span>
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

export default AllChefsPage;
