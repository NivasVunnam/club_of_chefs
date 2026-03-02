import cors from 'cors';
import express from 'express';
import {
  getAppContent,
  getEditorialArticleById,
  getEditorialArticles,
  getNewsArticleById,
  getNewsArticles,
  initDb,
  reactToNewsArticle,
  recordNewsAction,
} from './db.ts';

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/content', async (_req, res) => {
  try {
    const userId = typeof _req.query.userId === 'string' ? _req.query.userId : undefined;
    const content = await getAppContent(userId);
    res.json(content);
  } catch (error) {
    console.error('Failed to read content from database:', error);
    res.status(500).json({ message: 'Failed to load content from database' });
  }
});

app.get('/api/news', async (_req, res) => {
  try {
    const userId = typeof _req.query.userId === 'string' ? _req.query.userId : undefined;
    const articles = await getNewsArticles(userId);
    res.json(articles);
  } catch (error) {
    console.error('Failed to load news articles:', error);
    res.status(500).json({ message: 'Failed to load news articles' });
  }
});

app.get('/api/news/:articleId', async (req, res) => {
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const article = await getNewsArticleById(req.params.articleId, userId);
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    res.json(article);
  } catch (error) {
    console.error('Failed to load article details:', error);
    res.status(500).json({ message: 'Failed to load article details' });
  }
});

app.get('/api/editorials', async (_req, res) => {
  try {
    const editorials = await getEditorialArticles();
    res.json(editorials);
  } catch (error) {
    console.error('Failed to load editorial notes:', error);
    res.status(500).json({ message: 'Failed to load editorials' });
  }
});

app.get('/api/editorials/:editorialId', async (req, res) => {
  try {
    const editorial = await getEditorialArticleById(req.params.editorialId);
    if (!editorial) {
      res.status(404).json({ message: 'Editorial note not found' });
      return;
    }
    res.json(editorial);
  } catch (error) {
    console.error('Failed to load editorial note details:', error);
    res.status(500).json({ message: 'Failed to load editorial details' });
  }
});

app.post('/api/news/:articleId/react', async (req, res) => {
  try {
    const userId = req.body?.userId as string | undefined;
    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const article = await getNewsArticleById(req.params.articleId, userId);
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    const reaction = req.body?.reaction;
    if (reaction !== 'like' && reaction !== 'dislike' && reaction !== 'none') {
      res.status(400).json({ message: "Reaction must be 'like', 'dislike', or 'none'" });
      return;
    }

    const counts = await reactToNewsArticle(req.params.articleId, userId, reaction);
    res.json(counts);
  } catch (error) {
    console.error('Failed to update article reaction:', error);
    res.status(500).json({ message: 'Failed to update reaction' });
  }
});

app.post('/api/news/:articleId/action', async (req, res) => {
  try {
    const userId = req.body?.userId as string | undefined;
    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    const article = await getNewsArticleById(req.params.articleId, userId);
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    const action = req.body?.action as 'preorder' | 'order' | 'register' | 'notify' | 'guide' | undefined;
    if (!action) {
      res.status(400).json({ message: 'Action is required' });
      return;
    }

    const result = await recordNewsAction(req.params.articleId, userId, action);
    res.json({ ...result, action });
  } catch (error) {
    console.error('Failed to execute article action:', error);
    res.status(500).json({ message: 'Failed to execute action' });
  }
});

async function startServer() {
  await initDb();

  app.listen(port, () => {
    console.log(`API server is running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
