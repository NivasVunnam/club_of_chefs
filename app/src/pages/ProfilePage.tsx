import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { NewsArticle } from '@/types';
import { apiUrl } from '@/lib/api';

type ClubAuthUser = {
  name?: string;
  username?: string;
  provider?: 'local' | 'gmail';
};

type StoredUser = {
  username: string;
  password?: string;
  email?: string;
  provider: 'local' | 'gmail';
  createdAt: number;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<ClubAuthUser | null>(null);
  const [email, setEmail] = useState('');
  const [savedRecipesCount, setSavedRecipesCount] = useState(0);
  const [likedRecipesCount, setLikedRecipesCount] = useState(0);
  const [completedRecipesCount, setCompletedRecipesCount] = useState(0);
  const [responsesCount, setResponsesCount] = useState(0);
  const [favoriteChefsCount, setFavoriteChefsCount] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  useEffect(() => {
    const rawAuth = localStorage.getItem('clubAuthUser');
    if (!rawAuth) {
      navigate('/login', { replace: true });
      return;
    }

    const parsedAuth = JSON.parse(rawAuth) as ClubAuthUser;
    setAuthUser(parsedAuth);

    const rawUsers = localStorage.getItem('clubUsers');
    const users = rawUsers ? (JSON.parse(rawUsers) as StoredUser[]) : [];
    const matchedUser = users.find((item) => item.username.toLowerCase() === (parsedAuth.username ?? '').toLowerCase());
    setEmail(matchedUser?.email ?? '');

    const savedRecipes = localStorage.getItem('savedRecipes');
    const saved = savedRecipes ? (JSON.parse(savedRecipes) as string[]) : [];
    setSavedRecipesCount(saved.length);
    setLikedRecipesCount(saved.length);

    const favoriteChefs = localStorage.getItem('favoriteChefIds');
    const favorite = favoriteChefs ? (JSON.parse(favoriteChefs) as string[]) : [];
    setFavoriteChefsCount(favorite.length);

    const progressRaw = localStorage.getItem('recipeProcessProgress');
    const progress = progressRaw ? (JSON.parse(progressRaw) as Record<string, { completed: boolean }>) : {};
    const completed = Object.values(progress).filter((item) => item.completed).length;
    setCompletedRecipesCount(completed);

    const userId = localStorage.getItem('newsReactionUserId');
    if (!userId) return;
    fetch(apiUrl(`/api/news?userId=${encodeURIComponent(userId)}`))
      .then((response) => response.json() as Promise<NewsArticle[]>)
      .then((articles) => {
        const count = articles.reduce((acc, article) => {
          const reacted = article.userReaction ? 1 : 0;
          const acted = article.userAction ? 1 : 0;
          return acc + reacted + acted;
        }, 0);
        setResponsesCount(count);
      })
      .catch(() => setResponsesCount(0));
  }, [navigate]);

  const canChangePassword = useMemo(() => authUser?.provider === 'local', [authUser?.provider]);

  const handleChangePassword = () => {
    if (!canChangePassword || !authUser?.username) return;
    const usersRaw = localStorage.getItem('clubUsers');
    const users = usersRaw ? (JSON.parse(usersRaw) as StoredUser[]) : [];
    const userIndex = users.findIndex((item) => item.username.toLowerCase() === authUser.username?.toLowerCase());

    if (userIndex < 0) {
      setPasswordStatus('User account not found.');
      return;
    }

    if ((users[userIndex].password ?? '') !== currentPassword) {
      setPasswordStatus('Current password is incorrect.');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordStatus('Please enter a new password.');
      return;
    }

    users[userIndex] = {
      ...users[userIndex],
      password: newPassword,
    };
    localStorage.setItem('clubUsers', JSON.stringify(users));
    setCurrentPassword('');
    setNewPassword('');
    setPasswordStatus('Password updated successfully ✅');
  };

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

        <section className="mt-8">
          <h1 className="heading-lg mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account and view your activity summary.</p>
        </section>

        <section className="mt-8 grid lg:grid-cols-2 gap-6">
          <article className="rounded-md border border-border bg-card p-6">
            <h2 className="font-serif text-2xl mb-4">Account Details</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {authUser?.name ?? '-'}</p>
              <p><span className="text-muted-foreground">Username:</span> {authUser?.username ?? '-'}</p>
              <p><span className="text-muted-foreground">Email:</span> {email || '-'}</p>
              <p><span className="text-muted-foreground">Login Type:</span> {authUser?.provider ?? '-'}</p>
            </div>
          </article>

          <article className="rounded-md border border-border bg-card p-6">
            <h2 className="font-serif text-2xl mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><span className="text-muted-foreground">Liked Recipes:</span> {likedRecipesCount}</p>
              <p><span className="text-muted-foreground">Saved Recipes:</span> {savedRecipesCount}</p>
              <p><span className="text-muted-foreground">Recipes Completed:</span> {completedRecipesCount}</p>
              <p><span className="text-muted-foreground">Responses:</span> {responsesCount}</p>
              <p><span className="text-muted-foreground">Chefs Followed:</span> {favoriteChefsCount}</p>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-md border border-border bg-card p-6">
          <h2 className="font-serif text-2xl mb-4">Change Password</h2>
          {!canChangePassword ? (
            <p className="text-muted-foreground text-sm">Password management is available only for local username accounts.</p>
          ) : (
            <div className="max-w-md space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleChangePassword}
                className="px-4 py-2 bg-gold text-dark text-sm font-medium hover:bg-gold-light transition-colors"
              >
                Update Password
              </button>
              {passwordStatus && <p className="text-sm text-muted-foreground">{passwordStatus}</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
