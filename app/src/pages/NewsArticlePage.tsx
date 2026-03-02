import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { NewsArticle } from '@/types';
import { apiUrl } from '@/lib/api';

type ScenarioMessage = {
  actionLabel: string;
  description: string;
};

const scenarioMeta: Record<NewsArticle['scenario'], ScenarioMessage> = {
  preorder: {
    actionLabel: 'Pre-order now',
    description: 'Reserve this product before its official release.',
  },
  order: {
    actionLabel: 'Order now',
    description: 'This product is live and ready to purchase.',
  },
  vote: {
    actionLabel: 'Share your reaction',
    description: 'Vote with like or dislike and influence upcoming content.',
  },
  register: {
    actionLabel: 'Register now',
    description: 'Secure your spot for this event.',
  },
  notify: {
    actionLabel: 'Notify me',
    description: 'Get instant alerts when this item becomes available.',
  },
  guide: {
    actionLabel: 'Open guide',
    description: 'Read the full guide for this release.',
  },
};

function getReactionUserId() {
  const key = 'newsReactionUserId';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = `user-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, generated);
  return generated;
}

function NewsArticlePage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const [reactionUserId, setReactionUserId] = useState('');

  useEffect(() => {
    setReactionUserId(getReactionUserId());
  }, []);

  useEffect(() => {
    if (!reactionUserId) return;

    const loadArticle = async () => {
      try {
        const response = await fetch(apiUrl(`/api/news/${articleId}?userId=${encodeURIComponent(reactionUserId)}`));
        if (!response.ok) {
          throw new Error(`Failed to load article: ${response.status}`);
        }

        const payload = (await response.json()) as NewsArticle;
        setArticle(payload);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [articleId, reactionUserId]);

  const scenario = useMemo(() => {
    if (!article) return null;
    return scenarioMeta[article.scenario];
  }, [article]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    sessionStorage.setItem('returnToNewsSection', 'true');
    navigate('/');
  };

  const reactToArticle = async (reaction: 'like' | 'dislike') => {
    if (!article || !reactionUserId) return;
    const nextReaction = article.userReaction === reaction ? 'none' : reaction;

    const response = await fetch(apiUrl(`/api/news/${article.id}/react`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction: nextReaction, userId: reactionUserId }),
    });
    if (!response.ok) return;

    const counts = (await response.json()) as {
      likes: number;
      dislikes: number;
      userReaction: 'like' | 'dislike' | null;
    };
    setArticle((prev) =>
      prev
        ? { ...prev, likes: counts.likes, dislikes: counts.dislikes, userReaction: counts.userReaction }
        : prev
    );
  };

  const triggerArticleAction = async () => {
    if (!article || !reactionUserId || article.scenario === 'vote') return;

    const response = await fetch(apiUrl(`/api/news/${article.id}/action`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: article.scenario, userId: reactionUserId }),
    });
    if (!response.ok) return;

    const payload = (await response.json()) as {
      actionCount: number;
      userAction: NewsArticle['userAction'];
    };
    setArticle((prev) =>
      prev ? { ...prev, actionCount: payload.actionCount, userAction: payload.userAction } : prev
    );
    setActionFeedback(
      payload.userAction === 'preorder'
        ? `Pre-ordered. Total actions on this item: ${payload.actionCount}`
        : `Done. Total actions on this item: ${payload.actionCount}`
    );
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading article...</div>;
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        Failed to load article details.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <article className="mt-6">
          <img src={article.image} alt={article.title} className="w-full h-[420px] object-cover rounded-md" />

          <div className="mt-6 flex items-center gap-3">
            <span className="px-3 py-1 bg-gold text-white text-xs uppercase tracking-wider rounded">
              {article.category}
            </span>
            <span className="text-sm text-muted-foreground">{article.date}</span>
          </div>

          <h1 className="heading-lg mt-4">{article.title}</h1>
          <p className="text-muted-foreground mt-4 leading-relaxed">{article.fullDescription}</p>

          <div className="mt-6 p-4 border border-border rounded-md bg-muted/30">
            <p className="text-sm text-muted-foreground">{scenario?.description}</p>
            {article.productLabel && (
              <p className="text-sm mt-2">
                <span className="font-semibold">Product:</span> {article.productLabel}
                {article.price ? ` (${article.price})` : ''}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {article.scenario === 'vote' ? (
              <>
                <button
                  type="button"
                  onClick={() => reactToArticle('like')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded border transition-all duration-200 ${
                    article.userReaction === 'like'
                      ? 'border-green-500 text-green-600 bg-green-50 scale-110'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <ThumbsUp className={`transition-all ${article.userReaction === 'like' ? 'w-5 h-5' : 'w-4 h-4'}`} /> Like ({article.likes})
                </button>
                <button
                  type="button"
                  onClick={() => reactToArticle('dislike')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded border transition-all duration-200 ${
                    article.userReaction === 'dislike'
                      ? 'border-red-500 text-red-600 bg-red-50 scale-110'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <ThumbsDown className={`transition-all ${article.userReaction === 'dislike' ? 'w-5 h-5' : 'w-4 h-4'}`} /> Dislike ({article.dislikes})
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={triggerArticleAction}
                  className={`px-5 py-2 rounded text-white transition-all ${
                    article.userAction === article.scenario
                      ? 'bg-green-600 hover:bg-green-600'
                      : 'bg-gold hover:opacity-90'
                  }`}
                >
                  {article.userAction === article.scenario
                    ? article.scenario === 'preorder'
                      ? 'Pre-ordered'
                      : article.scenario === 'order'
                        ? 'Ordered'
                        : article.scenario === 'register'
                          ? 'Registered'
                          : article.scenario === 'notify'
                            ? 'Notification on'
                            : article.scenario === 'guide'
                              ? 'Guide opened'
                              : article.primaryActionLabel || scenario?.actionLabel
                    : article.primaryActionLabel || scenario?.actionLabel}
                </button>
                <span className="text-sm text-muted-foreground">Actions so far: {article.actionCount}</span>
              </>
            )}
          </div>

          {actionFeedback && <p className="mt-3 text-sm text-gold">{actionFeedback}</p>}
        </article>
      </div>
    </main>
  );
}

export default NewsArticlePage;
