import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NewsArticle } from '@/types';
import { apiUrl } from '@/lib/api';

const PAGE_SIZE = 15; // 3 x 5

function LatestArticlesPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(apiUrl('/api/news'));
        if (!response.ok) throw new Error(`Failed to load latest articles: ${response.status}`);
        const data = (await response.json()) as NewsArticle[];
        setArticles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const sortedByLatest = useMemo(() => {
    return [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [articles]);

  const totalPages = Math.max(1, Math.ceil(sortedByLatest.length / PAGE_SIZE));
  const pagedArticles = sortedByLatest.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    sessionStorage.setItem('returnToNewsSection', 'true');
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading latest articles...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container-custom py-12">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <section className="mt-8 mb-8">
          <h1 className="heading-lg mb-2">Latest Articles</h1>
          <p className="text-muted-foreground">Newest updates across products, features, editorials, and events.</p>
        </section>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedArticles.map((article) => (
              <Link
                key={article.id}
                to={`/news/${article.id}`}
                className="group rounded-md border border-border p-4 bg-card transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={article.image}
                  alt={article.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-48 object-cover rounded mb-3 transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <p className="text-xs text-muted-foreground mb-1">{article.date}</p>
                <h3 className="font-serif text-lg group-hover:text-gold transition-colors">{article.title}</h3>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>👍 {article.likes}</span>
                  <span>👎 {article.dislikes}</span>
                  <span>⚡ {article.actionCount}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </div>
    </main>
  );
}

export default LatestArticlesPage;
