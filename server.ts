import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_MEDIA_ITEMS, DEFAULT_EPISODES, DEFAULT_COMMENTS } from './src/initialData';
import { MediaItem, Episode, Comment, UserProfile, SystemNotification } from './src/types';

// Load environmental variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'data-store.json');

// Ensure database file exists
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      mediaItems: DEFAULT_MEDIA_ITEMS.map((item: any) => ({ ...item, cast: [] })),
      episodes: DEFAULT_EPISODES,
      comments: DEFAULT_COMMENTS,
      profiles: [] as UserProfile[],
      notifications: [
        {
          id: 'notif-1',
          title: 'Welcome to Anime & Donghua Stream',
          message: 'Explore our curated lists, sync your watch history, and talk to our AI Search Assistant!',
          type: 'system',
          createdAt: new Date().toISOString(),
          read: false
        }
      ] as SystemNotification[]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('Database initialized with default records (cast lists purged).');
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      let modified = false;

      // Always purge all existing voice actor rosters from all saved series
      if (data.mediaItems && data.mediaItems.length > 0) {
        data.mediaItems.forEach((item: any) => {
          if (item.cast && item.cast.length > 0) {
            item.cast = [];
            modified = true;
          }
        });
      }

      if (!data.mediaItems.some((m: any) => m.id === 'adult-the-boys')) {
        const boysItems = DEFAULT_MEDIA_ITEMS.filter((m: any) => m.isAdult).map((item: any) => ({ ...item, cast: [] }));
        data.mediaItems = [...data.mediaItems, ...boysItems];
        modified = true;
      }
      if (!data.episodes.some((e: any) => e.mediaId === 'adult-the-boys')) {
        data.episodes = [...data.episodes, ...DEFAULT_EPISODES.filter((e: any) => e.mediaId?.startsWith('adult-'))];
        modified = true;
      }
      if (modified) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Database upgraded (cast lists purged and synced).');
      }
    } catch (e) {
      console.error('Upgrade failure:', e);
    }
  }
}

initDB();

function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading DB, resetting...', error);
    return {
      mediaItems: DEFAULT_MEDIA_ITEMS,
      episodes: DEFAULT_EPISODES,
      comments: DEFAULT_COMMENTS,
      profiles: [] as UserProfile[],
      notifications: [] as SystemNotification[]
    };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

// Global middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini SDK with defensive checks
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;
if (API_KEY && API_KEY !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('Gemini AI SDK successfully initialized.');
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
} else {
  console.log('Gemini API key is missing or is using placeholder; falling back to automated rule-based responders.');
}

// ==================== API ENDPOINTS ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', datetime: new Date().toISOString() });
});

// GET all media items
app.get('/api/media', (req, res) => {
  const db = readDB();
  res.json(db.mediaItems);
});

// POST new media item (Admin)
app.post('/api/media', (req, res) => {
  const db = readDB();
  const newItem: MediaItem = {
    id: `media-${Date.now()}`,
    type: req.body.type || 'anime',
    title: req.body.title,
    alternativeTitle: req.body.alternativeTitle || '',
    description: req.body.description || '',
    genres: req.body.genres || [],
    studio: req.body.studio || 'Unknown',
    author: req.body.author || 'Unknown',
    status: req.body.status || 'Ongoing',
    releaseDate: req.body.releaseDate || new Date().toISOString().split('T')[0],
    episodesCount: Number(req.body.episodesCount) || 12,
    duration: req.body.duration || '24m',
    rating: Number(req.body.rating) || 8.0,
    views: 0,
    popularityRank: db.mediaItems.length + 1,
    trailerUrl: req.body.trailerUrl || '',
    posterUrl: req.body.posterUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600',
    bannerUrl: req.body.bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200',
    isAdult: !!req.body.isAdult,
    isPremium: !!req.body.isPremium,
    cast: req.body.cast || []
  };

  db.mediaItems.push(newItem);

  // Send system push notification for new media
  const mediaLabel = newItem.type === 'anime' ? 'Anime' : 'Donghua';
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: `New ${mediaLabel} Added!`,
    message: `"${newItem.title}" is now streaming. Check it out now!`,
    type: 'system',
    mediaId: newItem.id,
    createdAt: new Date().toISOString(),
    read: false
  });

  writeDB(db);
  res.status(201).json(newItem);
});

// PUT update media item (Admin)
app.put('/api/media/:id', (req, res) => {
  const db = readDB();
  const index = db.mediaItems.findIndex((item: any) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Media item not found' });
  }

  db.mediaItems[index] = {
    ...db.mediaItems[index],
    ...req.body,
    id: db.mediaItems[index].id, // protect id
  };

  writeDB(db);
  res.json(db.mediaItems[index]);
});

// DELETE media item (Admin)
app.delete('/api/media/:id', (req, res) => {
  const db = readDB();
  const filtered = db.mediaItems.filter((item: any) => item.id !== req.params.id);
  if (filtered.length === db.mediaItems.length) {
    return res.status(404).json({ error: 'Media item not found' });
  }
  db.mediaItems = filtered;
  db.episodes = db.episodes.filter((ep: any) => ep.mediaId !== req.params.id);
  db.comments = db.comments.filter((com: any) => com.mediaId !== req.params.id);
  writeDB(db);
  res.json({ success: true, message: 'Media item deleted' });
});

// GET episodes by mediaId
app.get('/api/episodes', (req, res) => {
  const db = readDB();
  const userEmail = req.headers['x-user-email'] || req.query.email;

  // Cross reference ban lists if user is logged in
  if (userEmail) {
    const p = db.profiles.find((x: any) => x.email === userEmail);
    if (p && p.isBanned) {
      return res.status(403).json({ error: 'AccountBanned: Your account is suspended.' });
    }
  }

  const { mediaId } = req.query;
  if (!mediaId) {
    return res.json(db.episodes);
  }
  const filtered = db.episodes.filter((ep: any) => ep.mediaId === mediaId);
  res.json(filtered.sort((a: any, b: any) => a.episodeNumber - b.episodeNumber));
});

// PUT update single episode (Admin)
app.put('/api/episodes/:id', (req, res) => {
  const db = readDB();
  const index = db.episodes.findIndex((ep: any) => ep.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  db.episodes[index] = {
    ...db.episodes[index],
    ...req.body,
    id: db.episodes[index].id, // protect id
    episodeNumber: req.body.episodeNumber !== undefined ? Number(req.body.episodeNumber) : db.episodes[index].episodeNumber
  };

  writeDB(db);
  res.json(db.episodes[index]);
});

// DELETE single episode (Admin)
app.delete('/api/episodes/:id', (req, res) => {
  const db = readDB();
  const filtered = db.episodes.filter((ep: any) => ep.id !== req.params.id);
  if (filtered.length === db.episodes.length) {
    return res.status(404).json({ error: 'Episode not found' });
  }
  db.episodes = filtered;
  writeDB(db);
  res.json({ success: true, message: 'Episode deleted' });
});

// POST add single episode (Admin)
app.post('/api/episodes', (req, res) => {
  const db = readDB();
  const { mediaId, episodeNumber, title, thumbnail, videoUrl, duration, subtitles } = req.body;

  if (!mediaId) {
    return res.status(400).json({ error: 'mediaId is required' });
  }

  const newEpisode: Episode = {
    id: `ep-${Date.now()}`,
    mediaId,
    episodeNumber: Number(episodeNumber) || 1,
    title: title || `Episode ${episodeNumber}`,
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
    videoUrl: videoUrl || 'https://www.dailymotion.com/embed/video/x8mveho',
    duration: duration || '24m',
    subtitles: subtitles || [],
    isPremium: !!req.body.isPremium
  };

  db.episodes.push(newEpisode);

  // Update media view count/episodesCount if needed
  const mediaIdx = db.mediaItems.findIndex((m: any) => m.id === mediaId);
  if (mediaIdx !== -1) {
    // Notify about new episode
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `New Episode Released!`,
      message: `"${db.mediaItems[mediaIdx].title}" Episode ${newEpisode.episodeNumber} - "${newEpisode.title}" is now available.`,
      type: 'episode',
      mediaId,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  writeDB(db);
  res.status(201).json(newEpisode);
});

// POST bulk upload episodes (Admin)
app.post('/api/episodes/bulk', (req, res) => {
  const db = readDB();
  const { mediaId, episodesList } = req.body; // Array of episodes

  if (!mediaId || !Array.isArray(episodesList)) {
    return res.status(400).json({ error: 'mediaId and episodesList array are required' });
  }

  const added: Episode[] = [];
  episodesList.forEach((ep: any, index: number) => {
    added.push({
      id: `ep-bulk-${Date.now()}-${index}`,
      mediaId,
      episodeNumber: Number(ep.episodeNumber) || (index + 1),
      title: ep.title || `Episode ${ep.episodeNumber || (index + 1)}`,
      thumbnail: ep.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
      videoUrl: ep.videoUrl || 'https://www.dailymotion.com/embed/video/x8mveho',
      duration: ep.duration || '24m',
      subtitles: ep.subtitles || []
    });
  });

  db.episodes.push(...added);

  const mediaIdx = db.mediaItems.findIndex((m: any) => m.id === mediaId);
  if (mediaIdx !== -1) {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Bulk Episodes Uploaded',
      message: `Successfully loaded ${added.length} new episodes for "${db.mediaItems[mediaIdx].title}".`,
      type: 'episode',
      mediaId,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  writeDB(db);
  res.status(201).json({ success: true, count: added.length, episodes: added });
});

// GET comments for a media
app.get('/api/comments', (req, res) => {
  const db = readDB();
  const { mediaId, episodeId } = req.query;

  let comments = db.comments;
  if (mediaId) {
    comments = comments.filter((c: any) => c.mediaId === mediaId);
  }
  if (episodeId) {
    comments = comments.filter((c: any) => c.episodeId === episodeId);
  }

  res.json(comments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

// POST post a new comment
app.post('/api/comments', (req, res) => {
  const db = readDB();
  const { mediaId, episodeId, userName, userAvatar, text, rating } = req.body;

  if (!mediaId || !userName || !text) {
    return res.status(400).json({ error: 'mediaId, userName, and text are required fields' });
  }

  const newComment: Comment = {
    id: `com-${Date.now()}`,
    mediaId,
    episodeId: episodeId || undefined,
    userName,
    userAvatar: userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    userBadge: rating && rating >= 5 ? 'Elite Streamer' : undefined,
    text,
    rating: rating ? Number(rating) : undefined,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);

  // Update media item rating average if a rating is supplied
  if (rating) {
    const media = db.mediaItems.find((m: any) => m.id === mediaId);
    if (media) {
      const ratedComments = db.comments.filter((c: any) => c.mediaId === mediaId && c.rating !== undefined);
      const totalRating = ratedComments.reduce((acc: number, cur: any) => acc + cur.rating, 0);
      media.rating = Number((totalRating / ratedComments.length).toFixed(1));
    }
  }

  writeDB(db);
  res.status(201).json(newComment);
});

// POST toggle like on comment
app.post('/api/comments/:id/like', (req, res) => {
  const db = readDB();
  const { userName } = req.body;
  if (!userName) return res.status(400).json({ error: 'userName is required' });

  const idx = db.comments.findIndex((c: any) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Comment not found' });

  const comment = db.comments[idx];
  const likeIdx = comment.likedBy.indexOf(userName);

  if (likeIdx === -1) {
    comment.likedBy.push(userName);
    comment.likes += 1;
  } else {
    comment.likedBy.splice(likeIdx, 1);
    comment.likes = Math.max(0, comment.likes - 1);
  }

  writeDB(db);
  res.json({ success: true, likes: comment.likes, isLiked: likeIdx === -1 });
});

// GET users profiles
app.get('/api/profile', (req, res) => {
  const db = readDB();
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'User email is required' });

  let profile = db.profiles.find((p: any) => p.email === email);
  if (!profile) {
    // Auto-create profile if missing
    profile = {
      email,
      displayName: (email as string).split('@')[0],
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100`,
      joinDate: new Date().toISOString().split('T')[0],
      watchlist: [],
      likes: [],
      ratings: {},
      badges: ['New Joiner'],
      achievements: [
        { id: 'ach-1', title: 'Stream Explorer', description: 'Begin your beautiful journey into Anime and Donghua world.', unlockedAt: new Date().toISOString() }
      ]
    };
    db.profiles.push(profile);
    writeDB(db);
  }
  res.json(profile);
});

// POST update user profile attributes
app.post('/api/profile', (req, res) => {
  const db = readDB();
  const { email, displayName, avatarUrl, watchlist, likes, ratings, badgeToAdd, achievementToAdd } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  let index = db.profiles.findIndex((p: any) => p.email === email);
  if (index === -1) {
    // Create new profile
    const newProfile: UserProfile = {
      email,
      displayName: displayName || email.split('@')[0],
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      joinDate: new Date().toISOString().split('T')[0],
      watchlist: watchlist || [],
      likes: likes || [],
      ratings: ratings || {},
      badges: ['New Joiner'],
      achievements: []
    };
    db.profiles.push(newProfile);
    writeDB(db);
    return res.json(newProfile);
  }

  const p = db.profiles[index];
  if (displayName !== undefined) p.displayName = displayName;
  if (avatarUrl !== undefined) p.avatarUrl = avatarUrl;
  if (watchlist !== undefined) p.watchlist = watchlist;
  if (likes !== undefined) p.likes = likes;
  if (ratings !== undefined) p.ratings = ratings;
  
  if (req.body.isPremium !== undefined) p.isPremium = !!req.body.isPremium;
  if (req.body.subscriptionPlan !== undefined) p.subscriptionPlan = req.body.subscriptionPlan;
  if (req.body.subscriptionExpiresAt !== undefined) p.subscriptionExpiresAt = req.body.subscriptionExpiresAt;

  if (badgeToAdd && !p.badges.includes(badgeToAdd)) {
    p.badges.push(badgeToAdd);
  }

  if (achievementToAdd && !p.achievements.find((a: any) => a.id === achievementToAdd.id)) {
    p.achievements.push({
      ...achievementToAdd,
      unlockedAt: new Date().toISOString()
    });
  }

  // Check custom achievements for progression
  if (p.watchlist.length >= 3 && !p.achievements.find((a: any) => a.id === 'ach-collector')) {
    p.achievements.push({
      id: 'ach-collector',
      title: 'Hoarder',
      description: 'Collect 3+ items into your premium watchlist!',
      unlockedAt: new Date().toISOString()
    });
    if (!p.badges.includes('Content Collector')) p.badges.push('Content Collector');
  }

  writeDB(db);
  res.json(p);
});

// GET platform statistics (Admin)
let activeActivities: any[] = [
  { email: 'otaku_senpai@gmail.com', mediaTitle: 'Demon Slayer', episodeNumber: 3, action: 'watching', timestamp: new Date(Date.now() - 180000).toISOString() },
  { email: 'cultivator_xi@outlook.com', mediaTitle: 'Soul Land', episodeNumber: 15, action: 'completed', timestamp: new Date(Date.now() - 720000).toISOString() },
  { email: 'tanvirgod6@gmail.com', mediaTitle: 'Jujutsu Kaisen', episodeNumber: 1, action: 'watching', timestamp: new Date(Date.now() - 2700000).toISOString() }
];

app.get('/api/stats', (req, res) => {
  const db = readDB();
  const animeCount = db.mediaItems.filter((m: any) => m.type === 'anime').length;
  const donghuaCount = db.mediaItems.filter((m: any) => m.type === 'donghua').length;
  const totalViews = db.mediaItems.reduce((acc: number, m: any) => acc + (m.views || 0), 0) + 128912; // Base offset for rich ui

  res.json({
    totalUsers: db.profiles.length + 12, // Include seed users count
    activeUsers: Math.max(activeActivities.length, 3),
    newUsersToday: db.profiles.filter((p: any) => p.joinDate === new Date().toISOString().split('T')[0]).length + 2,
    totalAnime: animeCount,
    totalDonghua: donghuaCount,
    totalEpisodes: db.episodes.length,
    totalViews,
    revenueEst: 1480.50
  });
});

// Admin endpoint to view registered users
app.get('/api/admin/users', (req, res) => {
  const db = readDB();
  res.json(db.profiles);
});

// Admin endpoint to ban/unban user
app.post('/api/admin/users/ban', (req, res) => {
  const db = readDB();
  const { email, isBanned } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const p = db.profiles.find((x: any) => x.email === email);
  if (p) {
    p.isBanned = !!isBanned;
    writeDB(db);
    return res.json({ success: true, profile: p });
  }
  res.status(404).json({ error: 'User profile not found' });
});

// Admin endpoint to disable/enable user account
app.post('/api/admin/users/disable', (req, res) => {
  const db = readDB();
  const { email, isDisabled } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const p = db.profiles.find((x: any) => x.email === email);
  if (p) {
    p.isDisabled = !!isDisabled;
    if (!!isDisabled) {
      p.isBanned = true; // Banned is secondary flag for platform block list
    }
    writeDB(db);
    return res.json({ success: true, profile: p });
  }
  res.status(404).json({ error: 'User profile not found' });
});

// Admin endpoint to dynamically update user profile properties (Premium toggle, Plan, Badges, etc.)
app.post('/api/admin/users/update', (req, res) => {
  const db = readDB();
  const { email, displayName, isBanned, isPremium, subscriptionPlan, badges, avatarUrl } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const p = db.profiles.find((x: any) => x.email === email);
  if (p) {
    if (displayName !== undefined) p.displayName = displayName;
    if (avatarUrl !== undefined) p.avatarUrl = avatarUrl;
    if (isBanned !== undefined) p.isBanned = !!isBanned;
    if (isPremium !== undefined) p.isPremium = !!isPremium;
    if (subscriptionPlan !== undefined) p.subscriptionPlan = subscriptionPlan;
    if (badges !== undefined) p.badges = Array.isArray(badges) ? badges : p.badges;
    writeDB(db);
    return res.json({ success: true, profile: p });
  }
  res.status(404).json({ error: 'User profile not found' });
});

// Live activity pings from clients
app.post('/api/admin/activity', (req, res) => {
  const { email, mediaTitle, episodeNumber, action } = req.body;
  
  const newActivity = {
    email: email || 'anonymous@guest.com',
    mediaTitle: mediaTitle || 'Catalog',
    episodeNumber: episodeNumber || null,
    action: action || 'browsing',
    timestamp: new Date().toISOString()
  };

  // Push to rolling start
  activeActivities.unshift(newActivity);
  if (activeActivities.length > 50) {
    activeActivities.pop();
  }

  res.json({ success: true });
});

// GET rolling activity logs
app.get('/api/admin/activity', (req, res) => {
  res.json(activeActivities);
});

// POST - Increase Media view count
app.post('/api/media/:id/view', (req, res) => {
  const db = readDB();
  const idx = db.mediaItems.findIndex((m: any) => m.id === req.params.id);
  if (idx !== -1) {
    db.mediaItems[idx].views = (db.mediaItems[idx].views || 0) + 1;
    writeDB(db);
    return res.json({ success: true, views: db.mediaItems[idx].views });
  }
  res.status(404).json({ error: 'Media not found' });
});

// GET/POST Notifications
app.get('/api/notifications', (req, res) => {
  const db = readDB();
  res.json(db.notifications);
});

app.post('/api/notifications', (req, res) => {
  const db = readDB();
  const { title, message, type, mediaId } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const newNotif = {
    id: `notif-${Date.now()}`,
    title,
    message,
    type: type || 'custom',
    mediaId: mediaId || null,
    createdAt: new Date().toISOString(),
    read: false
  };

  db.notifications.unshift(newNotif);
  writeDB(db);
  res.status(201).json(newNotif);
});

app.post('/api/notifications/read', (req, res) => {
  const db = readDB();
  const { id } = req.body;
  
  if (id) {
    const idx = db.notifications.findIndex((n: any) => n.id === id);
    if (idx !== -1) {
      db.notifications[idx].read = true;
    }
  } else {
    // Mark all as read
    db.notifications.forEach((n: any) => n.read = true);
  }

  writeDB(db);
  res.json({ success: true });
});

// ==================== GEMINI AI AGENT ENDPOINT ====================
// AI Search & Smart Recommendations
app.post('/api/ai/assistant', async (req, res) => {
  const { prompt, userEmail, contextHistory } = req.body;
  const db = readDB();

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Fallback default rules-based search if AI API key is unconfigured
  const mediaNames = db.mediaItems.map((m: any) => `* [${m.type === 'anime' ? 'Anime' : 'Donghua'}] ${m.title} (Genres: ${m.genres.join(', ')}, Rating: ${m.rating}, Studio: ${m.studio})`).join('\n');

  if (!ai) {
    // Generate intelligent heuristic response
    const query = prompt.toLowerCase();
    const matches: MediaItem[] = db.mediaItems.filter((item: any) => 
      item.title.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query) ||
      item.genres.some((g: string) => g.toLowerCase().includes(query)) ||
      item.studio.toLowerCase().includes(query)
    );

    let replies = `I am currently operating in high-performance lookup mode (Gemini Key not configured yet!). Here is what I discovered for: "${prompt}":\n\n`;
    if (matches.length > 0) {
      replies += `I found **${matches.length} matches** in our Anime & Donghua library:\n\n`;
      matches.forEach(m => {
        replies += `📺 **${m.title}** (${m.type === 'anime' ? 'Anime' : 'Donghua'})\n`;
        replies += `⭐ Rating: **${m.rating}** | 🎬 Studio: **${m.studio}** | Status: **${m.status}**\n`;
        replies += `🎭 Genres: _${m.genres.join(', ')}_\n`;
        replies += `📝 _"${m.description.slice(0, 150)}..."_\n\n`;
      });
      replies += `Feel free to select one of these in the grid to start streaming immediately!`;
    } else {
      replies += `I couldn't find an exact match for "${prompt}" in our native database, but I recommend checking out top releases like **Demon Slayer: Kimetsu no Yaiba** or **Soul Land (Douluo Dalu)**!\n\nCould you try filtering by Genres such as _Xianxia_, _Action_, or _Sci-Fi_?`;
    }
    return res.json({ response: replies, isFallback: true });
  }

  try {
    const systemInstruction = `
You are the interactive AI Streaming Assistant for "ANIME STREAM", a premium liquid-glass mobile-web streaming application.
Your goal is to guide users to discover, filter, and enjoy the collection of Anime and Donghua series in the app database.
Use elegant, enthusiastic, and helpful tone (no clinical developer jargon). Use markdown formatting with relevant emojis for a beautiful rich-text layout.

Here is the current database list of available media in our streaming app for your exact reference:
${mediaNames}

Guidelines:
1. Always suggest exact matches if the user asks for things present in our catalog (e.g., Demon Slayer, Soul Land, Jujutsu Kaisen, Link Click, Battle Through the Heavens, Cyberpunk).
2. For recommendations, explain nicely *why* they match based on genres, rating, or themes.
3. If they ask general anime/donghua questions, answer nicely and tie them back to media items in our database!
4. Do not display internal IDs. Highlight titles in bold.
`;

    const chatSession = [
      { role: 'user', parts: [{ text: `Hi! Introduce yourself.` }] },
      { role: 'model', parts: [{ text: `Hello! I am your personal **AI Search Assistant**. I'm here to recommend the best **Anime** and **Donghua** from our streaming library, find titles that suit your mood, and help you unlock achievements. Let's find your next binge-watch! 🎬✨` }] }
    ];

    if (contextHistory && Array.isArray(contextHistory)) {
      contextHistory.forEach(ch => {
        chatSession.push({
          role: ch.role === 'user' ? 'user' : 'model',
          parts: [{ text: ch.text }]
        });
      });
    }

    chatSession.push({ role: 'user', parts: [{ text: prompt }] });

    const contents = chatSession.map(item => ({
      role: item.role,
      parts: item.parts
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const reply = response.text || "I was unable to formulate a response at this moment. Please try again.";
    res.json({ response: reply, isFallback: false });
  } catch (error: any) {
    console.error('Gemini API call failed, calling fallback:', error);
    res.json({
      response: `I'm having trouble connecting to the stars right now (Gemini offline), but I recommend checked out our trending action titles: **Demon Slayer** (Anime) and **Soul Land** (Donghua)! ✨`,
      error: error.message,
      isFallback: true
    });
  }
});


// ==================== VITE DEVELOPMENT MIDDLEWARE ====================
async function runServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite midleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static client files configured.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server currently running on port ${PORT}`);
  });
}

runServer();
