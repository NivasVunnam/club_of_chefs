import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { NewsArticle } from '@/types';
import { apiUrl } from '@/lib/api';

function AllNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(apiUrl('/api/news'));
        if (!response.ok) throw new Error(`Failed to load news: ${response.status}`);
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

  const popular = useMemo(() => {
    return [...articles]
      .sort((a, b) => b.likes + b.actionCount * 2 - b.dislikes - (a.likes + a.actionCount * 2 - a.dislikes))
      .slice(0, 6);
  }, [articles]);

  const latest = useMemo(() => {
    return [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [articles]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading all articles...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center">{error}</div>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container-custom py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <section className="mt-8">
          <h1 className="heading-lg mb-3">All News Articles</h1>
          <p className="text-muted-foreground">Browse complete latest and popular collections.</p>
        </section>

        <section className="mt-10">
          <h2 className="heading-md mb-5">Popular</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popular.map((article) => (
              <Link key={`popular-${article.id}`} to={`/news/${article.id}`} className="group rounded-md border border-border p-4 bg-card">
                <img src={article.image} alt={article.title} className="w-full h-44 object-cover rounded mb-3 transition-transform duration-500 group-hover:scale-[1.02]" />
                <h3 className="font-serif text-lg group-hover:text-gold transition-colors">{article.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="heading-md mb-5">Latest</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.map((article) => (
              <Link key={`latest-${article.id}`} to={`/news/${article.id}`} className="group rounded-md border border-border p-4 bg-card">
                <img src={article.image} alt={article.title} className="w-full h-44 object-cover rounded mb-3 transition-transform duration-500 group-hover:scale-[1.02]" />
                <p className="text-xs text-muted-foreground mb-2">{article.date}</p>
                <h3 className="font-serif text-lg group-hover:text-gold transition-colors">{article.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default AllNewsPage;
