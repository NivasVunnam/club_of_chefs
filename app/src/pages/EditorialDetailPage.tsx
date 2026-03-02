import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { EditorialArticle } from '@/types';
import { apiUrl } from '@/lib/api';

function EditorialDetailPage() {
  const navigate = useNavigate();
  const { editorialId } = useParams();
  const [article, setArticle] = useState<EditorialArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(apiUrl(`/api/editorials/${editorialId}`));
        if (!response.ok) throw new Error(`Failed to load editorial: ${response.status}`);
        const data = (await response.json()) as EditorialArticle;
        setArticle(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editorialId]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/editorials');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading editorial...</div>;
  if (error || !article) return <div className="min-h-screen flex items-center justify-center">{error ?? 'Not found'}</div>;

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

        <article className="mt-8 max-w-4xl">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-[420px] object-cover rounded"
          />
          <p className="text-sm text-muted-foreground mt-4">
            {article.publishDate} • {article.author} • {article.category}
          </p>
          <h1 className="heading-lg mt-3">{article.title}</h1>
          <p className="text-muted-foreground mt-3">{article.subtitle}</p>
          <p className="mt-6 leading-relaxed text-foreground/90">{article.fullDescription}</p>
        </article>

        <Link to="/editorials" className="inline-flex mt-8 px-4 py-2 bg-gold text-white text-sm hover:opacity-90 transition-opacity">
          View all editorials
        </Link>
      </div>
    </main>
  );
}

export default EditorialDetailPage;
