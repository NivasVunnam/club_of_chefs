import { PGlite } from '@electric-sql/pglite';
import { badges, chefs, editorialArticles, newsArticles, recipes } from '../src/data/index.ts';
import type { EditorialArticle, NewsArticle } from '../src/types/index.ts';

export type AppContent = {
  chefs: typeof chefs;
  recipes: typeof recipes;
  newsArticles: typeof newsArticles;
  editorialArticles: typeof editorialArticles;
  badges: typeof badges;
};

const db = new PGlite('./.pglite-data');

type ReactionType = 'like' | 'dislike' | 'none';
type ArticleActionType = 'preorder' | 'order' | 'register' | 'notify' | 'guide';

async function ensureSchema() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS app_content (
      key TEXT PRIMARY KEY,
      payload JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news_feedback (
      article_id TEXT PRIMARY KEY,
      likes INTEGER NOT NULL DEFAULT 0,
      dislikes INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS news_actions (
      article_id TEXT PRIMARY KEY,
      action_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS news_user_reactions (
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
      PRIMARY KEY (article_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS news_user_actions (
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('preorder', 'order', 'register', 'notify', 'guide')),
      PRIMARY KEY (article_id, user_id)
    );
  `);
}

async function syncSeedData() {
  const contentEntries: Array<[keyof AppContent, unknown]> = [
    ['chefs', chefs],
    ['recipes', recipes],
    ['newsArticles', newsArticles],
    ['editorialArticles', editorialArticles],
    ['badges', badges],
  ];

  for (const [key, payload] of contentEntries) {
    await db.query(
      `INSERT INTO app_content (key, payload)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (key)
       DO UPDATE SET payload = EXCLUDED.payload;`,
      [key, JSON.stringify(payload)]
    );
  }
}

async function getBaseNewsArticles(): Promise<NewsArticle[]> {
  const result = await db.query<{ payload: NewsArticle[] }>(
    'SELECT payload FROM app_content WHERE key = $1;',
    ['newsArticles']
  );
  return result.rows[0]?.payload ?? [];
}

async function getBaseEditorialArticles(): Promise<EditorialArticle[]> {
  const result = await db.query<{ payload: EditorialArticle[] }>(
    'SELECT payload FROM app_content WHERE key = $1;',
    ['editorialArticles']
  );
  return result.rows[0]?.payload ?? [];
}

async function ensureNewsMetaRows() {
  const baseArticles = await getBaseNewsArticles();

  for (const article of baseArticles) {
    await db.query(
      `INSERT INTO news_feedback (article_id, likes, dislikes)
       VALUES ($1, $2, $3)
       ON CONFLICT (article_id) DO NOTHING;`,
      [article.id, article.likes ?? 0, article.dislikes ?? 0]
    );

    await db.query(
      `INSERT INTO news_actions (article_id, action_count)
       VALUES ($1, $2)
       ON CONFLICT (article_id) DO NOTHING;`,
      [article.id, article.actionCount ?? 0]
    );
  }
}

export async function initDb() {
  await ensureSchema();
  await syncSeedData();
  await ensureNewsMetaRows();
}

export async function getAppContent(userId?: string): Promise<AppContent> {
  const result = await db.query<{ key: string; payload: unknown }>(
    'SELECT key, payload FROM app_content;'
  );

  const byKey = new Map(result.rows.map((row) => [row.key, row.payload]));

  return {
    chefs: (byKey.get('chefs') as AppContent['chefs']) ?? [],
    recipes: (byKey.get('recipes') as AppContent['recipes']) ?? [],
    newsArticles: await getNewsArticles(userId),
    editorialArticles: await getEditorialArticles(),
    badges: (byKey.get('badges') as AppContent['badges']) ?? [],
  };
}

export async function getEditorialArticles(): Promise<EditorialArticle[]> {
  return getBaseEditorialArticles();
}

export async function getEditorialArticleById(editorialId: string): Promise<EditorialArticle | null> {
  const articles = await getEditorialArticles();
  return articles.find((article) => article.id === editorialId) ?? null;
}

export async function getNewsArticles(userId?: string): Promise<NewsArticle[]> {
  const baseArticles = await getBaseNewsArticles();
  const feedbackResult = await db.query<{ article_id: string; likes: number; dislikes: number }>(
    'SELECT article_id, likes, dislikes FROM news_feedback;'
  );
  const actionResult = await db.query<{ article_id: string; action_count: number }>(
    'SELECT article_id, action_count FROM news_actions;'
  );

  const feedbackMap = new Map(feedbackResult.rows.map((row) => [row.article_id, row]));
  const actionMap = new Map(actionResult.rows.map((row) => [row.article_id, row.action_count]));

  let userReactionMap = new Map<string, 'like' | 'dislike'>();
  if (userId) {
    const userReactions = await db.query<{ article_id: string; reaction: 'like' | 'dislike' }>(
      'SELECT article_id, reaction FROM news_user_reactions WHERE user_id = $1;',
      [userId]
    );
    userReactionMap = new Map(userReactions.rows.map((row) => [row.article_id, row.reaction]));
  }

  let userActionMap = new Map<string, ArticleActionType>();
  if (userId) {
    const userActions = await db.query<{ article_id: string; action: ArticleActionType }>(
      'SELECT article_id, action FROM news_user_actions WHERE user_id = $1;',
      [userId]
    );
    userActionMap = new Map(userActions.rows.map((row) => [row.article_id, row.action]));
  }

  return baseArticles.map((article) => ({
    ...article,
    likes: feedbackMap.get(article.id)?.likes ?? article.likes ?? 0,
    dislikes: feedbackMap.get(article.id)?.dislikes ?? article.dislikes ?? 0,
    actionCount: actionMap.get(article.id) ?? article.actionCount ?? 0,
    userReaction: userReactionMap.get(article.id) ?? null,
    userAction: userActionMap.get(article.id) ?? null,
  }));
}

export async function getNewsArticleById(articleId: string, userId?: string): Promise<NewsArticle | null> {
  const articles = await getNewsArticles(userId);
  return articles.find((article) => article.id === articleId) ?? null;
}

export async function reactToNewsArticle(articleId: string, userId: string, reaction: ReactionType) {
  const existingReactionResult = await db.query<{ reaction: 'like' | 'dislike' }>(
    'SELECT reaction FROM news_user_reactions WHERE article_id = $1 AND user_id = $2;',
    [articleId, userId]
  );
  const previousReaction = existingReactionResult.rows[0]?.reaction;

  if (previousReaction && previousReaction !== reaction) {
    const decrementColumn = previousReaction === 'like' ? 'likes' : 'dislikes';
    await db.query(
      `UPDATE news_feedback
       SET ${decrementColumn} = GREATEST(${decrementColumn} - 1, 0)
       WHERE article_id = $1;`,
      [articleId]
    );
  }

  if (reaction === 'none') {
    await db.query(
      'DELETE FROM news_user_reactions WHERE article_id = $1 AND user_id = $2;',
      [articleId, userId]
    );
  } else if (!previousReaction) {
    await db.query(
      'INSERT INTO news_user_reactions (article_id, user_id, reaction) VALUES ($1, $2, $3);',
      [articleId, userId, reaction]
    );
    const incrementColumn = reaction === 'like' ? 'likes' : 'dislikes';
    await db.query(
      `UPDATE news_feedback
       SET ${incrementColumn} = ${incrementColumn} + 1
       WHERE article_id = $1;`,
      [articleId]
    );
  } else if (previousReaction !== reaction) {
    await db.query(
      'UPDATE news_user_reactions SET reaction = $3 WHERE article_id = $1 AND user_id = $2;',
      [articleId, userId, reaction]
    );
    const incrementColumn = reaction === 'like' ? 'likes' : 'dislikes';
    await db.query(
      `UPDATE news_feedback
       SET ${incrementColumn} = ${incrementColumn} + 1
       WHERE article_id = $1;`,
      [articleId]
    );
  }

  const counts = await db.query<{ likes: number; dislikes: number }>(
    'SELECT likes, dislikes FROM news_feedback WHERE article_id = $1;',
    [articleId]
  );

  const userReactionResult = await db.query<{ reaction: 'like' | 'dislike' }>(
    'SELECT reaction FROM news_user_reactions WHERE article_id = $1 AND user_id = $2;',
    [articleId, userId]
  );

  return {
    likes: counts.rows[0]?.likes ?? 0,
    dislikes: counts.rows[0]?.dislikes ?? 0,
    userReaction: userReactionResult.rows[0]?.reaction ?? null,
  };
}

export async function recordNewsAction(articleId: string, userId: string, action: ArticleActionType) {
  const existingActionResult = await db.query<{ action: ArticleActionType }>(
    'SELECT action FROM news_user_actions WHERE article_id = $1 AND user_id = $2;',
    [articleId, userId]
  );

  if (existingActionResult.rows[0]) {
    const countResult = await db.query<{ action_count: number }>(
      'SELECT action_count FROM news_actions WHERE article_id = $1;',
      [articleId]
    );
    return {
      actionCount: countResult.rows[0]?.action_count ?? 0,
      userAction: existingActionResult.rows[0].action,
    };
  }

  await db.query(
    'INSERT INTO news_user_actions (article_id, user_id, action) VALUES ($1, $2, $3);',
    [articleId, userId, action]
  );

  const result = await db.query<{ action_count: number }>(
    `UPDATE news_actions
     SET action_count = action_count + 1
     WHERE article_id = $1
     RETURNING action_count;`,
    [articleId]
  );

  return {
    actionCount: result.rows[0]?.action_count ?? 0,
    userAction: action,
  };
}
