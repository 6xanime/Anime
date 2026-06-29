import React, { useState, useEffect } from 'react';
import { 
  Bot, Film, Sparkles, Tv, List, Clock, Heart, Search, Bell, Sparkle,
  User, Shield, Calendar, Award, Share2, HelpCircle, Flame, Check, 
  BookOpen, Star, MessageSquare, Play, Plus, X, ChevronRight, ChevronLeft, LogIn, LogOut, ArrowRight, Video, QrCode, Smartphone, SlidersHorizontal, Download,
  Compass, ChevronDown, Menu, Zap, Smile, Ghost, Rocket, Swords, Crown, CreditCard, Lock, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { MediaItem, Episode, Comment, UserProfile, SystemNotification, WatchProgress } from './types';
import { GENRES } from './initialData';
import { getDaily10 } from './trendingPool';
import GlassPlayer from './components/GlassPlayer';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import SubscriptionModal from './components/SubscriptionModal';

export default function App() {
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [trendingMedia, setTrendingMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Daily trending cover flow slider states
  const [dailyTrending, setDailyTrending] = useState<MediaItem[]>([]);
  const [dailyTrendingIndex, setDailyTrendingIndex] = useState(2); // start nicely with index 2 centered
  
  // Custom design states for floating header & categories
  const [activeCategory, setActiveCategory] = useState<'all' | 'trending' | 'action' | 'slice-of-life'>('all');
  const [showInlineSearch, setShowInlineSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Current Active Video Player States
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [mediaEpisodes, setMediaEpisodes] = useState<Episode[]>([]);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'anime' | 'donghua' | 'movie'>('all');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [studioQuery, setStudioQuery] = useState('');
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);

  // Active User Profile with Fallback to Requested Default
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userEmail, setUserEmail] = useState('tanvirgod6@gmail.com'); 
  const [profile, setProfile] = useState<UserProfile>({
    email: 'tanvirgod6@gmail.com',
    displayName: 'Tanvir',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    joinDate: '2026-06-11',
    watchlist: [],
    likes: [],
    ratings: {},
    badges: ['Stream Explorer'],
    achievements: []
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [pendingAction, setPendingAction] = useState('watch content');

  const ensureAuthenticated = (actionName: string): boolean => {
    return true;
  };

  // Persistent Watch Progress (Continue Watching)
  const [continueWatching, setContinueWatching] = useState<WatchProgress[]>(() => {
    try {
      const saved = localStorage.getItem('continue_watching_v2');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Storage reading error, using default seeds", e);
    }
    // High premium placeholder content so the container displays interactive statistics immediately
    return [
      {
        mediaId: 'anime-kage',
        episodeId: 'ep-anime-kage-1',
        episodeNumber: 1,
        progress: 648, // ~10.8 minutes
        duration: 1440, // 24 minutes
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        mediaId: 'anime-pale-spring',
        episodeId: 'ep-anime-pale-spring-1',
        episodeNumber: 1,
        progress: 322, // ~5.3 minutes
        duration: 1380, // 23 minutes
        updatedAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  });

  // Auto save continue watching list to local storage
  useEffect(() => {
    try {
      localStorage.setItem('continue_watching_v2', JSON.stringify(continueWatching));
    } catch (e) {
      //
    }
  }, [continueWatching]);

  // Track episode change to automatically update progress list
  useEffect(() => {
    if (activeEpisode && selectedMedia) {
      setContinueWatching(prev => {
        // Remove currently active item (to boost to top without duplicates)
        const filtered = prev.filter(item => item.mediaId !== selectedMedia.id);
        
        // Use a persistent randomized progress value so that when they select it, it ranges between 30% and 80% dynamically
        const durationSeconds = 24 * 60; // 24m
        const progressSeconds = Math.floor((0.3 + Math.random() * 0.5) * durationSeconds);
        
        const newItem: WatchProgress = {
          mediaId: selectedMedia.id,
          episodeId: activeEpisode.id,
          episodeNumber: activeEpisode.episodeNumber,
          progress: progressSeconds,
          duration: durationSeconds,
          updatedAt: new Date().toISOString()
        };
        return [newItem, ...filtered].slice(0, 8);
      });
    }
  }, [activeEpisode, selectedMedia]);

  // Comments for selected item
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);

  // Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Drawers & Overlays
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [isAdultMode, setIsAdultMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showQrSim, setShowQrSim] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Flagship Premium Animation States
  const [isSplashing, setIsSplashing] = useState(true);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);

  // Trigger flagship premium toast
  const showToast = (message: string, type: 'success' | 'info' | 'watchlist' | 'like' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Active Promo Banner Slider index
  const [bannerIndex, setBannerIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  // Simulator for Calendar episodes release countdown
  const [countdownHrs, setCountdownHrs] = useState(14);
  const [countdownMins, setCountdownMins] = useState(32);

  // Profile Customization
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('Tanvir');
  const [editAvatar, setEditAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100');
  const [profileTab, setProfileTab] = useState<'watchlist' | 'history'>('watchlist');

  useEffect(() => {
    loadAllMedia();
    loadNotifications();
    
    // Countdown simulation ticking
    const timer = setInterval(() => {
      setCountdownMins(prev => {
        if (prev === 0) {
          setCountdownHrs(h => Math.max(0, h - 1));
          return 59;
        }
        return prev - 1;
      });
    }, 60000);

    // End splash animation beautifully after 2200ms
    const splashTimer = setTimeout(() => {
      setIsSplashing(false);
    }, 2200);

    return () => {
      clearInterval(timer);
      clearTimeout(splashTimer);
    };
  }, []);

  // Widescreen Billboards auto-slide interval ticking
  useEffect(() => {
    if (isSplashing || showAdminPanel || showProfileDrawer || activeEpisode || selectedMedia) return;
    const bannerTimer = setInterval(() => {
      if (trendingMedia.length > 0) {
        setSlideDirection(1);
        setBannerIndex(prev => (prev + 1) % trendingMedia.length);
      }
    }, 6500);
    return () => clearInterval(bannerTimer);
  }, [isSplashing, showAdminPanel, showProfileDrawer, activeEpisode, selectedMedia, trendingMedia]);

  // Live Firebase Auth Listener (Falls back to defaults if not logged in to lift restrictions)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadProfile(user.email);
      } else {
        setUserEmail('tanvirgod6@gmail.com');
        loadProfile('tanvirgod6@gmail.com');
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle queries search recommendations
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const query = searchQuery.toLowerCase();
      const suggestions = allMedia
        .filter(m => isAdultMode ? m.isAdult : !m.isAdult)
        .filter(m => m.title.toLowerCase().includes(query) || m.alternativeTitle?.toLowerCase().includes(query))
        .map(m => m.title)
        .slice(0, 5);
      setAutoSuggestions(suggestions);
    } else {
      setAutoSuggestions([]);
    }
    applyFilters();
  }, [searchQuery, selectedType, selectedGenre, selectedStatus, selectedRating, studioQuery, allMedia, activeCategory, isAdultMode]);

  const loadAllMedia = async () => {
    try {
      const res = await fetch('/api/media');
      let data = await res.json();
      
      if (!Array.isArray(data)) {
        console.warn('API /api/media response is not an array:', data);
        data = [];
      }
      
      const daily = getDaily10();
      // Filter the daily trending list so we ONLY include items that still exist in the database (i.e. not deleted)
      const activeDaily = daily.filter(item => Array.isArray(data) && data.some((m: MediaItem) => m.id === item.id));
      setDailyTrending(activeDaily);

      // Since all active daily items are already in 'data', we don't need to append them manually anymore,
      // which prevents deleted items from being resurrected dynamically.
      const merged = [...data];

      setAllMedia(merged);
      setFilteredMedia(merged.filter((m: MediaItem) => !m.isAdult));
      setTrendingMedia(merged.filter((m: MediaItem) => m.isTrending && !m.isAdult));
    } catch (err) {
      console.error('Error loading media library:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const loadProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data) {
        setProfile(data);
        setEditName(data.displayName || 'Tanvir');
        setEditAvatar(data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const saveProfileUpdate = async (updatedFields: Partial<UserProfile>) => {
    if (!userEmail || userEmail === 'anonymous@guest.com') {
      // Just update state locally for guest session
      setProfile(prev => ({
        ...prev,
        ...updatedFields
      }));
      return;
    }
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, ...updatedFields })
      });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEpisodes = async (mediaId: string) => {
    try {
      const res = await fetch(`/api/episodes?mediaId=${mediaId}`, {
        headers: { 'x-user-email': userEmail || '' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setMediaEpisodes(data);
      } else {
        // Fallback: Generate real physical episodes on-the-fly for dynamic masterworks
        const generatedEpisodes: Episode[] = [
          {
            id: `ep-${mediaId}-1`,
            mediaId: mediaId,
            episodeNumber: 1,
            title: 'Dawn of a New Era',
            thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300',
            videoUrl: 'https://www.dailymotion.com/embed/video/x8mveh1',
            duration: '24m'
          },
          {
            id: `ep-${mediaId}-2`,
            mediaId: mediaId,
            episodeNumber: 2,
            title: 'The Path of Selection',
            thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300',
            videoUrl: 'https://www.dailymotion.com/embed/video/x8mveh2',
            duration: '22m'
          },
          {
            id: `ep-${mediaId}-3`,
            mediaId: mediaId,
            episodeNumber: 3,
            title: 'Ascension Breakout',
            thumbnail: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=300',
            videoUrl: 'https://www.dailymotion.com/embed/video/x8mveh1',
            duration: '23m'
          }
        ];
        setMediaEpisodes(generatedEpisodes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = async (mediaId: string, episodeId?: string) => {
    try {
      const url = episodeId 
        ? `/api/comments?mediaId=${mediaId}&episodeId=${episodeId}`
        : `/api/comments?mediaId=${mediaId}`;
      const res = await fetch(url);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureAuthenticated('post reviews & rate content')) return;
    if (!selectedMedia || !newCommentText.trim()) return;

    const payload = {
      mediaId: selectedMedia.id,
      episodeId: activeEpisode?.id || undefined,
      userName: profile.displayName,
      userAvatar: profile.avatarUrl,
      text: newCommentText,
      rating: commentRating
    };

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewCommentText('');
        loadComments(selectedMedia.id, activeEpisode?.id);
        // Force refresh rating average in UI
        loadAllMedia();
        showToast("Fan Review Published Successfully!", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!ensureAuthenticated('like reviews')) return;
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: profile.displayName })
      });
      if (res.ok && selectedMedia) {
        loadComments(selectedMedia.id, activeEpisode?.id);
        showToast("Review Liked! Added support point.", "like");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilters = () => {
    let result = [...allMedia];

    // Filter adult shows based on viewing mode
    if (isAdultMode) {
      result = result.filter(m => m.isAdult === true);
    } else {
      result = result.filter(m => !m.isAdult);
    }

    // Map Kage brand category pills to filters
    if (activeCategory === 'trending') {
      result = result.filter(m => m.isTrending);
    } else if (activeCategory === 'action') {
      result = result.filter(m => m.genres.some(g => g.toLowerCase() === 'action'));
    } else if (activeCategory === 'slice-of-life') {
      result = result.filter(m => m.genres.some(g => g.toLowerCase() === 'slice of life'));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(query) || 
        m.alternativeTitle?.toLowerCase().includes(query) ||
        m.genres.some(g => g.toLowerCase().includes(query))
      );
    }

    if (selectedType !== 'all') {
      result = result.filter(m => m.type === selectedType);
    }

    if (selectedGenre) {
      result = result.filter(m => m.genres.includes(selectedGenre));
    }

    if (selectedStatus) {
      result = result.filter(m => m.status === selectedStatus);
    }

    if (selectedRating) {
      result = result.filter(m => m.rating >= selectedRating);
    }

    if (studioQuery) {
      result = result.filter(m => m.studio.toLowerCase().includes(studioQuery.toLowerCase()));
    }

    setFilteredMedia(result);
  };

  const handleToggleWatchlist = async (mediaId: string) => {
    if (!ensureAuthenticated('add items to watchlist')) return;
    const isWatchlisted = profile.watchlist.includes(mediaId);
    const freshWatchlist = isWatchlisted
      ? profile.watchlist.filter(id => id !== mediaId)
      : [...profile.watchlist, mediaId];

    await saveProfileUpdate({ watchlist: freshWatchlist });

    const mediaItem = allMedia.find(m => m.id === mediaId);
    if (mediaItem) {
      if (isWatchlisted) {
        showToast(`"${mediaItem.title}" removed from Watchlist`, 'info');
      } else {
        showToast(`"${mediaItem.title}" saved to Watchlist`, 'watchlist');
      }
    }
  };

  const handleToggleLikeStream = async (mediaId: string) => {
    const isLiked = profile.likes.includes(mediaId);
    const freshLikes = isLiked
      ? profile.likes.filter(id => id !== mediaId)
      : [...profile.likes, mediaId];

    await saveProfileUpdate({ likes: freshLikes });

    const mediaItem = allMedia.find(m => m.id === mediaId);
    if (mediaItem) {
      if (isLiked) {
        showToast(`"${mediaItem.title}" removed from Likes`, 'info');
      } else {
        showToast(`"${mediaItem.title}" saved to Likes! ❤`, 'like');
      }
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read', { method: 'POST' });
      loadNotifications();
    } catch {
      //
    }
  };

  const handleInitWatchNow = (media: MediaItem) => {
    if (!ensureAuthenticated(`stream "${media.title}"`)) return;
    setSelectedMedia(media);
    loadEpisodes(media.id);
    loadComments(media.id);

    // Increase view count in background
    fetch(`/api/media/${media.id}/view`, { method: 'POST' }).then(() => {
      loadAllMedia();
    });

    // Auto load first episode if loaded
    fetch(`/api/episodes?mediaId=${media.id}`, {
      headers: { 'x-user-email': userEmail || '' }
    })
      .then(res => res.json())
      .then(eps => {
        if (eps && eps.length > 0) {
          setActiveEpisode(eps[0]);
        }
      });
  };

  const handleShowDetails = (media: MediaItem) => {
    setSelectedMedia(media);
    loadEpisodes(media.id);
    loadComments(media.id);
  };

  const handleShareMedia = (title: string) => {
    setCopiedLink(true);
    navigator.clipboard.writeText(`${window.location.origin}/stream/${encodeURIComponent(title)}`);
    showToast(`Streaming Link Copied: ${title}`, 'info');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownloadEpisode = (ep: Episode, mediaTitle: string) => {
    if (!ensureAuthenticated(`download "${mediaTitle}" Episode ${ep.episodeNumber}`)) return;
    showToast(`Allocating premium download nodes for ${mediaTitle} EP ${ep.episodeNumber}...`, 'info');
    setTimeout(() => {
      showToast(`Packet allocation complete! EP ${ep.episodeNumber} download initiated.`, 'success');
    }, 2000);
  };

  // Switch Banner Slider
  const nextBanner = () => {
    if (trendingMedia.length > 0) {
      setBannerIndex(prev => (prev + 1) % trendingMedia.length);
    }
  };

  if (isSplashing) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050708] overflow-hidden"
        >
          {/* Liquid Glass morphing glow spots in background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 0.9, 1.1, 1],
                rotate: [0, 90, 180, 270, 360],
                x: [0, 40, -30, 20, 0],
                y: [0, -40, 50, -30, 0]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-amber-500/10 blur-[130px] opacity-70"
            />
            <motion.div 
              animate={{ 
                scale: [1.1, 0.9, 1.2, 1, 1.1],
                rotate: [360, 270, 180, 90, 0],
                x: [0, -50, 30, -40, 0],
                y: [0, 30, -40, 20, 0]
              }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px] opacity-60"
            />
          </div>          <div className="relative flex flex-col items-center select-none text-center">
            {/* Professional Cinematic streaming logo mark */}
            <motion.div 
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className="relative w-40 h-40 rounded-full flex items-center justify-center border border-amber-500/10 bg-[#07090b]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden group"
            >
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/20 via-transparent to-transparent opacity-80" />
              <div className="absolute inset-[-10%] bg-gradient-to-tr from-amber-500/10 via-transparent to-orange-600/15 animate-spin duration-15000 opacity-50" />
              
              <motion.div 
                initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center justify-center p-2"
              >
                {/* Customized modern professional brand logo mark */}
                <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  <defs>
                    <linearGradient id="logoGrad1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                    <linearGradient id="logoGrad2" x1="90" y1="10" x2="10" y2="90" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                    <linearGradient id="logoGrad3" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                  
                  {/* Left wing triangle */}
                  <path 
                    d="M 30 20 L 50 50 L 15 80 Z" 
                    fill="url(#logoGrad1)" 
                    opacity="0.9"
                    stroke="#ffffff"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                  
                  {/* Right wing triangle */}
                  <path 
                    d="M 70 20 L 85 80 L 50 50 Z" 
                    fill="url(#logoGrad2)" 
                    opacity="0.85"
                    stroke="#ffffff"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                  
                  {/* Core central play wedge forming the Letter A cross bar */}
                  <path 
                    d="M 50 15 L 72 65 L 28 65 Z" 
                    fill="url(#logoGrad3)" 
                    opacity="0.95"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />

                  {/* High tech stream lines */}
                  <line x1="28" y1="65" x2="72" y2="65" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="3" fill="#ffffff" />
                </svg>

                <span className="text-[10px] text-amber-500 font-sans tracking-[0.35em] font-black -mt-1 uppercase select-none leading-none">
                  STREAM
                </span>
              </motion.div>
              
              {/* Ultra-thin professional border accents */}
              <div className="absolute inset-1 rounded-full border border-white/5" />
              <div className="absolute inset-0 rounded-full border border-amber-500/20 scale-[0.98]" />
            </motion.div>
 
            {/* Title & subtitle staggered reveal */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="mt-8 space-y-2.5"
            >
              <h1 className="text-3xl font-sans font-black text-white tracking-[0.2em] uppercase">ANIME STREAM</h1>
              <div className="h-[1.5px] w-16 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 mx-auto rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <p className="text-[11px] font-mono text-stone-400 uppercase tracking-[0.3em] font-medium opacity-80">
                Premium Anime & Donghua Cinema
              </p>
            </motion.div>

            {/* Glowing indicator particle loader */}
            <div className="mt-12 flex items-center gap-1.5">
              <motion.div 
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              />
              <motion.div 
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="h-2 w-2 rounded-full bg-amber-400/70"
              />
              <motion.div 
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="h-2 w-2 rounded-full bg-amber-400/40"
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (showAdminPanel) {
    return (
      <div className="min-h-screen bg-[#050708] text-stone-200 font-sans selection:bg-white/10 selection:text-white relative">
        <AdminPanel
          allMedia={allMedia}
          onRefreshAll={() => {
            loadAllMedia();
            loadNotifications();
          }}
          onClose={() => setShowAdminPanel(false)}
        />
      </div>
    );
  }

  if (showProfileDrawer) {
    return (
      <div className="min-h-screen bg-[#050708] text-stone-200 font-sans selection:bg-white/10 selection:text-white relative p-4 sm:p-8 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Back navigation and header */}
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-4 sm:pb-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-stone-900 border border-amber-500/20 flex flex-col items-center justify-center shrink-0 shadow-inner">
                <span className="text-amber-400 text-xs font-black tracking-tighter leading-none font-sans">A</span>
                <span className="text-[6px] text-stone-400 font-mono scale-90 tracking-tighter leading-none -mt-0.5">STRM</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-2xl font-serif text-white tracking-tight leading-tight font-bold select-none truncate">
                  Otaku Profile Workspace
                </h2>
                <p className="text-[10px] sm:text-[11px] text-stone-500 font-sans tracking-wide truncate">
                  Manage your list, history, and achievements
                </p>
              </div>
            </div>
            
            <button
              id="btn-exit-profile"
              onClick={() => setShowProfileDrawer(false)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-white/10 hover:border-amber-500/30 bg-white/[0.02] hover:bg-amber-500/10 text-stone-300 hover:text-amber-400 text-[10px] sm:text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180 text-stone-450" />
              <span className="hidden sm:inline">Exit Profile</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Stats & Profile, QR, Admin */}
            <div className="lg:col-span-5 space-y-6">
              {/* Profile Card */}
              <div className="bg-[#0c0f11] border border-white/[0.05] p-6 rounded-3xl relative space-y-4 shadow-xl text-center">
                {isEditingProfile ? (
                  <div className="text-left space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 mb-2">Edit Display Profile</h4>
                    
                    {/* Display Name Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Display Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 focus:border-amber-500/50 outline-none transition"
                        placeholder="e.g. Master Otaku"
                      />
                    </div>

                    {/* Email Input (Visible but disabled for identifying key) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-3 py-2 text-xs text-stone-500 outline-none select-none"
                        title="Your account identifier cannot be altered"
                      />
                    </div>

                    {/* Avatar URL Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block font-bold">Profile Avatar</label>
                      <div className="flex items-center gap-3">
                        <img 
                          src={editAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
                          }} 
                          className="h-12 w-12 rounded-full object-cover border border-white/10 shrink-0" 
                          alt="" 
                        />
                        <input
                          type="text"
                          value={editAvatar}
                          onChange={(e) => setEditAvatar(e.target.value)}
                          className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-stone-300 focus:border-amber-500/50 outline-none transition min-w-0"
                          placeholder="Image URL"
                        />
                      </div>
                      
                      {/* Avatar Presets Selection */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-stone-500 block mt-1">Or select a preset avatar:</span>
                        <div className="flex gap-2 overflow-x-auto py-1 pr-1 scrollbar-thin">
                          {[
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
                            'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
                            'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
                            'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
                          ].map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setEditAvatar(url)}
                              className={`h-8 w-8 rounded-full overflow-hidden border-2 transition shrink-0 ${
                                editAvatar === url ? 'border-amber-500' : 'border-transparent hover:border-white/20'
                              }`}
                            >
                              <img src={url} className="w-full h-full object-cover" alt="" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editName.trim()) return;
                          await saveProfileUpdate({
                            displayName: editName.trim(),
                            avatarUrl: editAvatar.trim()
                          });
                          setIsEditingProfile(false);
                        }}
                        className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditName(profile.displayName);
                          setEditAvatar(profile.avatarUrl);
                          setIsEditingProfile(false);
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs rounded-xl transition font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <img src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} className="h-24 w-24 rounded-full mx-auto object-cover border-2 border-amber-500/35 shadow-md" alt="" />
                    <div>
                      <h4 className="text-lg font-bold text-white tracking-wide">{profile.displayName}</h4>
                      <p className="text-xs text-stone-400 font-mono mt-0.5">{profile.email}</p>
                    </div>
                    
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      {profile.badges.map(b => (
                        <span key={b} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-bold">
                          🎖️ {b}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setEditName(profile.displayName);
                          setEditAvatar(profile.avatarUrl);
                          setIsEditingProfile(true);
                        }}
                        className="w-full py-2 bg-white/[0.03] hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-stone-200 hover:text-amber-300 text-xs font-bold rounded-2xl transition duration-300 cursor-pointer"
                      >
                        Edit Profile Info
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Achievements Block */}
              <div className="bg-[#0c0f11]/60 border border-white/[0.05] p-6 rounded-3xl space-y-4">
                <h4 className="font-bold text-xs text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  Unlocked Achievements ({profile.achievements.length})
                </h4>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {profile.achievements.length === 0 ? (
                    <div className="text-xs text-stone-550 py-6 text-center border border-dashed border-white/10 rounded-2xl bg-[#07090b]/40">
                      Keep streaming to unlock collector achievement medals!
                    </div>
                  ) : (
                    profile.achievements.map(ach => (
                      <div key={ach.id} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-3 hover:bg-white/[0.04] transition">
                        <span className="text-lg">🌟</span>
                        <div>
                          <h5 className="text-xs font-bold text-white">{ach.title}</h5>
                          <p className="text-[10px] text-stone-400 mt-0.5">{ach.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* QR Code login simulation option */}
              <div className="bg-[#0c0f11]/60 p-5 border border-white/[0.05] rounded-3xl flex items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs font-bold flex items-center gap-1.5 text-white">
                    <QrCode className="h-4 w-4 text-amber-400" />
                    Fast QR Link Device
                  </h5>
                  <p className="text-[10px] text-stone-400 mt-1">Sync watch history with mobile Android/iOS players instantly</p>
                </div>
                <button 
                  onClick={() => setShowQrSim(true)}
                  className="px-3.5 py-1.5 border border-white/10 hover:border-amber-500/35 rounded-xl text-[10px] font-bold text-stone-200 hover:text-white transition-all whitespace-nowrap shrink-0"
                >
                  Generate
                </button>
              </div>

              {/* Creator Core Studio admin option */}
              <div className="bg-amber-500/5 p-5 border border-amber-500/10 rounded-3xl flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold flex items-center gap-1.5 text-amber-300">
                    <Shield className="h-4 w-4" />
                    Creator Core Studio
                  </h5>
                  <p className="text-[10px] text-stone-450">Access statistics, edit media and publish episodes.</p>
                </div>
                <button 
                  onClick={() => {
                    setShowAdminPanel(true);
                    setShowProfileDrawer(false);
                  }}
                  className="py-1.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap shrink-0"
                >
                  Open Panel
                </button>
              </div>

              {/* Control Actions / Deletes */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    saveProfileUpdate({ watchlist: [], likes: [] });
                  }}
                  className="flex-1 py-3 bg-red-950/10 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 text-xs font-bold rounded-2xl transition text-center"
                >
                  Clear history
                </button>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="flex-1 py-3 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white text-xs font-bold rounded-2xl transition text-center"
                >
                  Disconnect Profile
                </button>
              </div>
            </div>

            {/* Right Column: Dynamic Tabs Container (Watchlist & Watch History) */}
            <div className="lg:col-span-7 bg-[#0c0f11] border border-white/[0.05] p-6 rounded-3xl space-y-6 shadow-xl min-h-[500px] flex flex-col justify-start">
              
              {/* Premium Tabs Swiper */}
              <div className="border-b border-white/[0.04] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] border border-white/[0.04] rounded-full self-start">
                  <button
                    onClick={() => setProfileTab('watchlist')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      profileTab === 'watchlist'
                        ? 'bg-amber-500 text-stone-950 shadow-lg font-bold'
                        : 'text-stone-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Heart className="h-3.5 w-3.5" />
                    My Watchlist
                  </button>
                  <button
                    onClick={() => setProfileTab('history')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      profileTab === 'history'
                        ? 'bg-amber-500 text-stone-950 shadow-lg font-bold'
                        : 'text-stone-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Watch History
                  </button>
                </div>

                <div className="text-[10px] font-mono text-stone-400 flex items-center gap-2">
                  {profileTab === 'watchlist' ? (
                    <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-stone-300">
                      {profile.watchlist.length} Saved Titles
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-sans font-medium">
                        {continueWatching.length} active sessions
                      </span>
                      {continueWatching.length > 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm("Clear all items from your watch history?")) {
                              setContinueWatching([]);
                            }
                          }}
                          className="hover:text-rose-400 text-stone-500 tracking-tight underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Content Body based on selected tab */}
              {profileTab === 'watchlist' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1 flex-1">
                  {profile.watchlist.length === 0 ? (
                    <div className="col-span-1 sm:col-span-2 text-center py-20 text-stone-400 space-y-3">
                      <Heart className="h-8 w-8 text-stone-500 mx-auto opacity-40" />
                      <p className="text-xs max-w-xs mx-auto text-stone-500">Your watchlist is completely vacant. Browse streams and tap the 'Watchlist' button on a card to load titles here.</p>
                    </div>
                  ) : (
                    allMedia
                      .filter(m => profile.watchlist.includes(m.id))
                      .map(m => (
                        <div 
                          key={m.id} 
                          onClick={() => { setSelectedMedia(m); setShowProfileDrawer(false); }}
                          className="group bg-slate-950/60 border border-white/5 p-3 rounded-2xl flex gap-3 cursor-pointer hover:border-amber-500/35 hover:bg-[#07090b]/80 transition duration-350 shadow"
                        >
                          <div className="h-16 w-12 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-zinc-900">
                            <img src={m.posterUrl} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" alt="" />
                          </div>
                          <div className="flex flex-col justify-between min-w-0 flex-1">
                            <div>
                              <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-1">{m.title}</h5>
                              <p className="text-[10px] font-mono text-stone-500 mt-0.5 uppercase tracking-wider">{m.type}</p>
                            </div>
                            <span className="text-[10px] text-amber-450 font-bold flex items-center gap-1">
                              Stream Now <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              ) : (
                /* Watch History Tab / Continue Watching */
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 flex-1">
                  {continueWatching.length === 0 ? (
                    <div className="text-center py-20 text-stone-400 space-y-3">
                      <Clock className="h-8 w-8 text-stone-500 mx-auto opacity-40" />
                      <p className="text-xs max-w-xs mx-auto text-stone-500">You have no partially viewed streams. Continue watching active titles instantly here when you play any streaming episode!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {continueWatching.map(progressItem => {
                        const mediaItem = allMedia.find(m => m.id === progressItem.mediaId);
                        if (!mediaItem) return null;

                        const pct = Math.min(100, Math.max(0, Math.round((progressItem.progress / progressItem.duration) * 100)));

                        return (
                          <div
                            key={progressItem.mediaId}
                            onClick={() => {
                              setSelectedMedia(mediaItem);
                              loadEpisodes(mediaItem.id);
                              loadComments(mediaItem.id);
                              // Auto play corresponding episode
                              fetch(`/api/episodes?mediaId=${mediaItem.id}`)
                                .then(res => res.json())
                                .then(eps => {
                                  const targetEp = eps.find((e: any) => e.episodeNumber === progressItem.episodeNumber) || eps[0];
                                  if (targetEp) setActiveEpisode(targetEp);
                                });
                              setShowProfileDrawer(false);
                            }}
                            className="group/cw relative cursor-pointer overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-amber-500/20 hover:bg-[#07090b]/80 transition duration-300 flex flex-col hover:scale-[1.01] shadow-md"
                          >
                            <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-950">
                              <img
                                src={mediaItem.bannerUrl || mediaItem.posterUrl || null}
                                className="w-full h-full object-cover transition duration-350 group-hover/cw:scale-105 filter brightness-90 group-hover/cw:brightness-100 animate-fade-in"
                                alt={mediaItem.title}
                              />
                              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/cw:opacity-100 transition duration-300 flex items-center justify-center animate-fade-in">
                                <div className="h-8 w-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow">
                                  <Play className="h-3 w-3 fill-black text-black ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute top-2 left-2 text-[8px] font-mono font-bold bg-black/80 px-1.5 py-0.5 rounded border border-white/10 uppercase text-stone-300">
                                {mediaItem.type}
                              </span>
                            </div>

                            {/* Progress bar info line */}
                            <div className="h-1 w-full bg-white/10 relative overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <div>
                                <h5 className="text-[11px] font-bold text-stone-200 truncate group-hover/cw:text-amber-300 transition line-clamp-1">
                                  {mediaItem.title}
                                </h5>
                                <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1.5 leading-none">
                                  <span className="font-bold text-emerald-400 font-mono">
                                    EP {progressItem.episodeNumber}
                                  </span>
                                  <span>•</span>
                                  <span>{pct}% watched</span>
                                </p>
                              </div>

                              <div className="mt-2 text-[9px] text-stone-500 flex items-center justify-between pointer-events-auto">
                                <span className="text-[8px] text-stone-600">
                                  {new Date(progressItem.updatedAt).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setContinueWatching(prev => prev.filter(item => item.mediaId !== progressItem.mediaId));
                                  }}
                                  className="text-[9px] text-stone-550 hover:text-rose-400 transition px-1.5 py-0.5 hover:bg-rose-500/10 rounded z-30 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderMediaSection = (items: MediaItem[], title: string, subtitle: string) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-5 pt-4 select-none">
        <div className="flex items-end justify-between border-b border-white/[0.04] pb-3">
          <div>
            <h3 className="text-xs font-mono text-stone-50 tracking-[0.25em] uppercase">{title}</h3>
            <p className="text-[11px] text-stone-500 font-sans mt-1">{subtitle}</p>
          </div>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.04
              }
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-7"
        >
          {items.map(item => {
            const isWatchlisted = profile.watchlist.includes(item.id);
            const epLabel = item.id === 'anime-kage' ? 'S2 • 12 Episodes' : item.id === 'anime-pale-spring' ? 'S2 • 12 Episodes' : item.id === 'anime-iron-halo' ? 'S1 • 10 Episodes' : item.type === 'movie' ? 'Cinematic Film' : `Season 1 • ${item.episodesCount} Episodes`;
            const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2026;
            
            const ratingValue = item.rating || 7.0;
            const ratingColor = ratingValue >= 7.0 ? '#10b981' : ratingValue >= 4.0 ? '#f5a623' : '#ef4444';

            return (
              <motion.div 
                key={item.id}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { 
                    y: 0, 
                    opacity: 1, 
                    transition: { type: "spring", stiffness: 120, damping: 16 } 
                  }
                }}
                whileHover={{ y: -8, scale: 1.025, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleShowDetails(item)}
                className="group flex flex-col cursor-pointer transition-all duration-300 rounded-[1.25rem] bg-[#0c0f12]/60 border border-white/[0.04] hover:border-amber-500/35 overflow-hidden shadow-lg hover:shadow-[0_20px_45px_rgba(0,0,0,0.7)] hover:bg-[#121619] relative"
              >
                {/* Immersive Film Poster Cover container */}
                <div className="relative aspect-[2/2.95] w-full overflow-hidden bg-stone-900">
                  <img 
                    src={item.posterUrl || null} 
                    className="w-full h-full object-cover transition duration-500 filter group-hover:brightness-95 group-hover:scale-[1.08] pointer-events-none" 
                    referrerPolicy="no-referrer"
                    alt={item.title} 
                  />
                  
                  {/* Premium Shine Sweep Effect */}
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                  {/* Inner dark vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-65 group-hover:opacity-80 transition duration-350" />

                  {/* 1. Circular progress rating overlay (Top-Left) */}
                  <div className="absolute top-2.5 left-2.5 bg-[#050708]/85 backdrop-blur-md h-8.5 w-8.5 rounded-full flex items-center justify-center shadow-lg border border-white/10 z-10">
                    <svg className="w-7.5 h-7.5 -rotate-90">
                      <circle
                        cx="15px"
                        cy="15px"
                        r="12px"
                        fill="transparent"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="15px"
                        cy="15px"
                        r="12px"
                        fill="transparent"
                        stroke={ratingColor}
                        strokeWidth="2.5"
                        strokeDasharray={75.4}
                        strokeDashoffset={75.4 - (75.4 * ratingValue) / 10}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-sans font-bold text-white tracking-tighter">
                      {ratingValue.toFixed(1)}
                    </span>
                  </div>

                  {/* 2. Release Year badge (Top-Right) */}
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-[2px] text-white text-[10px] font-semibold px-2 py-0.5 rounded-md font-sans border border-white/5 z-10 font-bold">
                    {releaseYear}
                  </div>

                  {/* 3. Audio / Language code tag (Bottom-Left) */}
                  <div className="absolute bottom-2.5 left-2.5 bg-indigo-500/80 backdrop-blur-[2.5px] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider z-10 shadow">
                    {item.type === 'donghua' ? 'ZH-SUB' : item.type === 'movie' ? 'ENG' : 'JP-SUB'}
                  </div>

                  {/* 4. Stream Quality label badge (Bottom-Right) */}
                  <div className="absolute bottom-2.5 right-2.5 bg-amber-500/80 backdrop-blur-[2.5px] text-stone-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider z-10 shadow">
                    {item.type === 'movie' ? '4K ULTRA' : '1080P HD'}
                  </div>

                  {/* Quick Toggle Watchlist with Pop Spring Scale Animation */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleToggleWatchlist(item.id); 
                    }}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full border flex items-center justify-center transition-all shadow-xl backdrop-blur-md z-20 ${
                      isWatchlisted 
                        ? 'bg-rose-500 border-transparent text-white opacity-100 shadow-rose-550/20' 
                        : 'bg-black/80 border-white/10 text-stone-300 hover:text-white opacity-0 group-hover:opacity-100'
                    }`}
                    title="Add to Watchlist"
                  >
                    <Heart className={`h-4 w-4 ${isWatchlisted ? 'fill-white text-white' : ''}`} />
                  </motion.button>
                </div>

                {/* Title detail region outside/below the photo but inside the full card */}
                <div className="p-3 sm:p-4 space-y-1 relative z-10">
                  <h4 className="font-sans font-bold text-[13px] sm:text-[14.5px] text-stone-200 group-hover:text-amber-400 transition-colors duration-300 leading-normal truncate">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-stone-500 font-sans tracking-wide block truncate">
                    {item.studio} • {epLabel.includes('Episodes') ? (epLabel.split(' • ')[1] || epLabel) : epLabel}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050708] text-stone-200 font-sans selection:bg-white/10 selection:text-white relative overflow-x-hidden">
      {/* EXQUISITE sliding Left Drawer Main Menu */}
      <AnimatePresence>
        {showMainMenu && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMainMenu(false)}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Cabinet body */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className="fixed top-0 bottom-0 left-0 w-[300px] sm:w-[350px] bg-[#080b0c] border-r border-white/[0.06] z-[101] flex flex-col justify-between p-6 shadow-[10px_0_40px_rgba(0,0,0,0.9)] overflow-y-auto"
            >
              <div className="space-y-8">
                {/* Brand Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500/10 to-stone-900 border border-amber-500/20 flex flex-col items-center justify-center shrink-0 shadow-inner">
                      <span className="text-amber-405 text-xs font-black tracking-tighter leading-none font-sans">A</span>
                      <span className="text-[6px] text-stone-400 font-mono scale-90 tracking-tighter leading-none -mt-0.5">STRM</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-serif font-extrabold text-white tracking-widest uppercase">OTAKU DESK</h3>
                      <p className="text-[9px] text-stone-500 font-sans tracking-wide">PREMIUM STREAM PLATFORM</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowMainMenu(false)}
                    className="h-8 w-8 rounded-full bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center text-stone-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Profile Widget */}
                <div className="bg-[#0e1215] border border-white/[0.04] p-4 rounded-2xl space-y-3 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/[0.03] to-transparent rounded-full pointer-events-none" />
                  <div className="flex items-center gap-3">
                    <img 
                      src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                      className="h-10 w-10 rounded-full border border-white/10 object-cover" 
                      alt="Avatar"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate font-sans">{profile.displayName || 'Guest Fan'}</h4>
                      <p className="text-[9px] text-stone-500 font-mono truncate">{profile.email || 'tanvirgod6@gmail.com'}</p>
                    </div>
                  </div>
                  {profile.badges && profile.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {profile.badges.map(b => (
                        <span key={b} className="text-[8px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/15 rounded-full">
                          ★ {b}
                        </span>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => { setShowProfileDrawer(true); setShowMainMenu(false); }}
                    className="w-full py-1.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 rounded-xl text-center text-[10px] text-stone-300 hover:text-white font-medium transition cursor-pointer"
                  >
                    Manage Profile & History
                  </button>
                </div>

                {/* Navigation Selections */}
                <div className="space-y-4">
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block pl-1">Media Catalog</span>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => { setSelectedMedia(null); setActiveEpisode(null); setActiveCategory('all'); setIsAdultMode(false); setSelectedGenre(''); setSelectedType('all'); applyFilters(); setShowMainMenu(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all cursor-pointer ${activeCategory === 'all' && !selectedMedia && !activeEpisode && !isAdultMode && !selectedGenre && selectedType === 'all' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold' : 'text-stone-400 hover:text-white hover:bg-white/[0.03] border border-transparent'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Compass className="h-4 w-4" />
                        <span className="text-xs font-semibold">Discover All</span>
                      </div>
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    </button>

                    {/* Restricted Adults selection */}
                    <button
                      onClick={() => {
                        setSelectedMedia(null);
                        setActiveEpisode(null);
                        setIsAdultMode(true);
                        setActiveCategory('all');
                        setSelectedGenre('');
                        setSelectedType('all');
                        applyFilters();
                        setShowMainMenu(false);
                        showToast("Entering Restricted 18+ Lounge. Safe-search disabled.", "info");
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                        isAdultMode 
                          ? 'bg-red-500/10 border-red-500/35 text-red-400 font-bold shadow-[0_0_12px_rgba(220,38,38,0.15)] animate-pulse' 
                          : 'bg-red-950/[0.12] border-red-900/20 text-stone-300 hover:text-white hover:border-red-500/25'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-xs font-bold">Adult Selection (18+)</span>
                      </div>
                      <span className="text-[8px] bg-red-600 text-white font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider scale-90">18+</span>
                    </button>
                  </div>
                </div>

                {/* CATEGORIES GRID exact styled like screenshot */}
                <div className="space-y-2.5 pt-1.5">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.16em] block pl-1">Categories</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-stone-300">
                    {[
                      { title: 'Action', icon: Zap, genre: 'Action', color: 'text-amber-500' },
                      { title: 'Adventure', icon: Compass, genre: 'Adventure', color: 'text-emerald-500' },
                      { title: 'Anime', icon: Film, type: 'anime', color: 'text-blue-500' },
                      { title: 'Animation', icon: Tv, type: 'donghua', color: 'text-purple-500' },
                      { title: 'Comedy', icon: Smile, genre: 'Comedy', color: 'text-yellow-500' },
                      { title: 'Drama', icon: BookOpen, genre: 'Drama', color: 'text-orange-500' },
                      { title: 'Horror', icon: Ghost, genre: 'Fantasy', color: 'text-stone-400' }, // maps to fantasy/dark
                      { title: 'Romance', icon: Heart, genre: 'Slice of Life', color: 'text-red-500' }, // maps to Slice of Life
                      { title: 'Sci Fi', icon: Rocket, genre: 'Sci-Fi', color: 'text-cyan-500' },
                      { title: 'Thriller', icon: Swords, genre: 'Supernatural', color: 'text-rose-500' } // maps to Supernatural
                    ].map((cat, idx) => {
                      const isActiveGenre = cat.genre && selectedGenre === cat.genre && !isAdultMode;
                      const isActiveType = cat.type && selectedType === cat.type && !isAdultMode;
                      const isSel = isActiveGenre || isActiveType;
                      const IconComponent = cat.icon;

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedMedia(null);
                            setActiveEpisode(null);
                            setIsAdultMode(false);
                            if (cat.genre) {
                              setSelectedGenre(cat.genre);
                              setSelectedType('all');
                            } else if (cat.type) {
                              setSelectedType(cat.type as any);
                              setSelectedGenre('');
                            }
                            setActiveCategory('all');
                            applyFilters();
                            setShowMainMenu(false);
                          }}
                          className={`flex items-center gap-2.5 justify-start px-3 py-2.5 rounded-xl border text-xs font-semibold select-none transition-all duration-200 cursor-pointer ${
                            isSel
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold shadow-md'
                              : 'bg-[#121618]/90 border-white/[0.04] hover:bg-white/[0.04] hover:border-white/10 text-stone-300 hover:text-white'
                          }`}
                        >
                          <IconComponent className={`h-3.5 w-3.5 shrink-0 ${isSel ? 'text-amber-400' : cat.color}`} />
                          <span className="truncate">{cat.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PREMIUM CHANNELS BANNER CARD AND TRIGGER */}
                <div className="space-y-3 pt-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.16em] block pl-1">Ad-Free Stream</span>
                  <div className="bg-[#121618]/95 border border-white/[0.04] p-4 rounded-3xl relative overflow-hidden group shadow-lg">
                    {/* Ambient Gold glow */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 blur-xl rounded-full" />
                    
                    {profile.isPremium ? (
                      <div className="space-y-3 text-center">
                        <div className="flex justify-center">
                          <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                            <Crown className="h-5 w-5 fill-amber-500" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-serif font-bold text-stone-100 uppercase tracking-wider">Premium Active</h4>
                          <p className="text-[10px] text-stone-500 font-sans font-light">
                            Enjoy unlimited access, high-speed fiber nodes & no ads.
                          </p>
                          {profile.subscriptionExpiresAt && (
                            <span className="text-[8.5px] text-amber-500/60 font-mono block pt-0.5">
                              Expires: {new Date(profile.subscriptionExpiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => { setShowPremiumModal(true); setShowMainMenu(false); }}
                          className="w-full py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 font-extrabold text-[10.5px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                        >
                          Show Settings
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3.5 text-center">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-center gap-1.5 text-amber-400">
                            <Crown className="h-4 w-4 fill-amber-400 animate-pulse" />
                            <span className="text-[10.5px] font-bold font-mono tracking-wider uppercase">VIP Upgrade</span>
                          </div>
                          <h4 className="text-xs font-semibold text-white">Stream 100% Ad-Free</h4>
                          <div className="flex justify-center">
                            <ul className="text-[9.5px] text-stone-400 font-sans font-light space-y-1.5 text-left list-none">
                              <li className="flex items-center gap-1.5"><span className="text-amber-500 font-bold">✦</span> 100% Locked Ad-Free</li>
                              <li className="flex items-center gap-1.5"><span className="text-amber-500 font-bold">✦</span> Exclusive Premium Lounge</li>
                              <li className="flex items-center gap-1.5"><span className="text-amber-500 font-bold">✦</span> Force 4K & Max Fiber Nodes</li>
                            </ul>
                          </div>
                          <div className="pt-1 text-center font-mono">
                            <span className="text-xs font-extrabold text-white">$1/mo</span>
                            <span className="text-stone-550 text-[10px] mx-1.5">•</span>
                            <span className="text-xs font-extrabold text-amber-400">$8/year</span>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => { setShowPremiumModal(true); setShowMainMenu(false); }}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Zap className="h-3 w-3 fill-current animate-bounce" />
                          <span>Get Premium Ad-Free</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="space-y-2 pt-1">
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block pl-2">Personal Desk</span>
                  <button 
                    onClick={() => { setShowProfileDrawer(true); setProfileTab('watchlist'); setShowMainMenu(false); }} 
                    className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/[0.03] text-xs font-medium text-left transition cursor-pointer"
                  >
                    <Heart className="h-4 w-4 text-rose-500" />
                    My Watchlist & Likes
                  </button>
                  <button 
                    onClick={() => { setShowProfileDrawer(true); setProfileTab('history'); setShowMainMenu(false); }} 
                    className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/[0.03] text-xs font-medium text-left transition cursor-pointer"
                  >
                    <Clock className="h-4 w-4 text-emerald-400" />
                    Streaming History
                  </button>
                </div>
              </div>

              {/* Drawer Footer and Admin */}
              <div className="pt-6 border-t border-white/[0.04] space-y-3 col-span-1">
                <button
                  onClick={() => { setShowAdminPanel(true); setShowMainMenu(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg active:scale-95 cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin Desk
                </button>
                <div className="text-center">
                  <span className="text-[8px] text-stone-600 font-mono block">v2.1 Premium Active • {userEmail ? 'Verified Account' : 'Guest Mode'}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Immersive background artwork in featured background section */}
      {!activeEpisode && !selectedMedia && (
        <div className="absolute top-0 left-0 right-0 h-[700px] w-full z-0 overflow-hidden pointer-events-none">
          {/* Main aesthetic samurai background image */}
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1400" 
            className="w-full h-full object-cover opacity-15 filter brightness-75 grayscale contrast-125 saturate-50 scale-105" 
            alt="Cinematic Background"
          />
          {/* Direct gradients to fade background into the dark container */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050708]/50 to-[#050708]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-transparent to-transparent" />
        </div>
      )}

      {/* STUNNING WIDE GLASS STREAMING HEADER */}
      <header className="sticky top-0 z-50 w-full bg-[#050708]/90 backdrop-blur-xl border-b border-white/[0.04] px-3 sm:px-8 py-2 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4 transition-all select-none">
        
        {/* Left Side: Brand Logo and Navigation Bar */}
        <div className="flex items-center gap-2 sm:gap-6 md:gap-8 shrink-0">
          {/* Logo brand with menu button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button 
              type="button"
              onClick={() => setShowMainMenu(true)}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#0c0f12]/90 border border-white/[0.08] hover:border-amber-500/25 flex items-center justify-center transition-all shadow-inner shrink-0 cursor-pointer text-stone-200 hover:text-amber-400 font-bold active:scale-95"
              title="Open Navigation Menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div 
              className="cursor-pointer select-none hidden sm:block"
              onClick={() => { setSelectedMedia(null); setActiveEpisode(null); setActiveCategory('all'); }}
            >
              <span className="text-white text-sm sm:text-base font-semibold tracking-widest uppercase font-serif">Anime</span>
            </div>
          </div>

          {/* Navigation Links in Netflix style */}
          <nav className="hidden lg:flex items-center gap-2 text-[12px] font-medium tracking-wide text-stone-400">
            <button 
              onClick={() => { setSelectedMedia(null); setActiveEpisode(null); setActiveCategory('all'); }}
              className={`transition-all transform duration-300 hover:scale-105 hover:bg-white/[0.04] px-3 py-1 rounded-full hover:shadow-2xl ${activeCategory === 'all' && !selectedMedia && !activeEpisode ? 'text-amber-400 bg-amber-500/[0.06] shadow-[0_0_12px_rgba(245,158,11,0.15)] border border-amber-500/25 font-semibold' : 'border border-transparent'}`}
            >
              Discover All
            </button>
            <button 
              onClick={() => { setSelectedMedia(null); setActiveEpisode(null); setActiveCategory('trending'); }}
              className={`transition-all transform duration-300 hover:scale-105 hover:bg-white/[0.04] px-3 py-1 rounded-full hover:shadow-2xl ${activeCategory === 'trending' && !selectedMedia && !activeEpisode ? 'text-amber-400 bg-amber-500/[0.06] shadow-[0_0_12px_rgba(245,158,11,0.15)] border border-amber-500/25 font-semibold' : 'border border-transparent'}`}
            >
              Trending Streams
            </button>
            <button 
              onClick={() => { setSelectedMedia(null); setActiveEpisode(null); setSelectedType('anime'); applyFilters(); }}
              className={`transition-all transform duration-300 hover:scale-105 hover:bg-white/[0.04] px-3 py-1 rounded-full hover:shadow-2xl ${selectedType === 'anime' && !selectedMedia && !activeEpisode ? 'text-amber-400 bg-amber-500/[0.06] shadow-[0_0_12px_rgba(245,158,11,0.15)] border border-amber-500/25 font-semibold' : 'border border-transparent'}`}
            >
              Anime
            </button>
            <button 
              onClick={() => { setSelectedMedia(null); setActiveEpisode(null); setSelectedType('donghua'); applyFilters(); }}
              className={`transition-all transform duration-300 hover:scale-105 hover:bg-white/[0.04] px-3 py-1 rounded-full hover:shadow-2xl ${selectedType === 'donghua' && !selectedMedia && !activeEpisode ? 'text-amber-400 bg-amber-500/[0.06] shadow-[0_0_12px_rgba(245,158,11,0.15)] border border-amber-500/25 font-semibold' : 'border border-transparent'}`}
            >
              Donghua
            </button>
            <button 
              onClick={() => { setSelectedMedia(null); setActiveEpisode(null); setSelectedType('movie'); applyFilters(); }}
              className={`transition-all transform duration-300 hover:scale-105 hover:bg-white/[0.04] px-3 py-1 rounded-full hover:shadow-2xl ${selectedType === 'movie' && !selectedMedia && !activeEpisode ? 'text-amber-400 bg-amber-500/[0.06] shadow-[0_0_12px_rgba(245,158,11,0.15)] border border-amber-500/25 font-semibold' : 'border border-transparent'}`}
            >
              Movie
            </button>
            {profile.watchlist.length > 0 && (
              <button 
                onClick={() => setShowProfileDrawer(true)}
                className="transition-all transform duration-300 hover:scale-105 hover:bg-amber-500/10 px-3 py-1 rounded-full hover:shadow-2xl text-amber-300 flex items-center gap-1.5"
              >
                My Watchlist ({profile.watchlist.length})
              </button>
            )}
          </nav>
        </div>

        {/* Center-Left: Optimised Large search box */}
        <div className="flex-1 min-w-[70px] sm:max-w-xs md:max-w-sm lg:max-w-md ml-1 sm:ml-4 md:ml-6">
          <div className="relative flex items-center bg-white/[0.03] border border-white/10 focus-within:border-white/25 focus-within:bg-[#0c0f11]/90 rounded-full px-2.5 py-1 transition-all w-full">
            <Search className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog..."
              className="bg-transparent text-xs text-stone-200 placeholder-stone-500 outline-none w-full font-sans ml-1.5 min-w-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-0.5 hover:text-white text-stone-500 ml-1 shrink-0">
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Suggestions list popup */}
            {autoSuggestions.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-[#090d0e]/95 border border-white/10 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl">
                {autoSuggestions.map((title, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(title);
                      setAutoSuggestions([]);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-white/[0.04] rounded-xl text-xs text-stone-300 hover:text-white transition font-sans truncate"
                  >
                    🔍 {title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tickers & Notification Bells */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto select-none">
          {/* Quick Counter release timer ticker */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-stone-500 bg-white/[0.02] border border-white/5 py-1.5 px-3 rounded-full shrink-0">
            <Clock className="h-3 w-3 text-stone-400" />
            Next EP: {countdownHrs}h {countdownMins}m
          </div>

          {/* Notification bell triggers */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) handleMarkNotificationsRead();
              }}
              className="text-stone-400 hover:text-white transition p-1.5 sm:p-2 relative rounded-full hover:bg-white/[0.03] shrink-0"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-rose-500 rounded-full shadow" />
              )}
            </button>

            {/* Wide Liquid Notification Glass Popover */}
            {showNotifications && (
              <div 
                id="notifications-popover"
                className="fixed md:absolute left-4 md:left-auto right-4 md:right-0 top-16 md:top-12 bg-[#090d0e]/95 border border-white/10 rounded-2xl w-auto md:w-80 p-4 shadow-2xl z-50 backdrop-blur-xl space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="font-serif text-xs text-stone-200 tracking-wider">System Bulletins</h4>
                  <button onClick={() => setShowNotifications(false)} className="text-[10px] text-stone-500 hover:text-stone-300 transition">Close</button>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-[10px] text-stone-500 py-4">No recent releases.</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-xl text-left text-[11px] hover:bg-white/[0.04] transition">
                        <p className="font-semibold text-stone-205 leading-tight">{notif.title}</p>
                        <p className="text-stone-400 text-[10px] mt-0.5 leading-relaxed">{notif.message}</p>
                        <span className="text-[8px] text-stone-600 block mt-1 font-mono">{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>



          {/* ANIME STREAM Studio Admin control panel trigger */}
          <button
            onClick={() => setShowAdminPanel(true)}
            className="text-stone-400 hover:text-amber-300 transition p-1.5 sm:p-2 rounded-full hover:bg-white/[0.03] shrink-0"
            title="ANIME STREAM Studio Admin"
          >
            <Shield className="h-4 w-4" />
          </button>

          {/* User Account avatar widget and name trigger */}
          <button
            onClick={() => setShowProfileDrawer(true)}
            className="flex items-center gap-1.5 border border-white/10 hover:border-white/20 bg-white/[0.02] p-1 sm:px-2.5 sm:py-1 rounded-full transition hover:bg-white/[0.04] shrink-0"
          >
            <img src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="h-6 w-6 rounded-full border border-white/10 object-cover shrink-0" alt={profile.displayName} />
            <span className="hidden sm:inline text-xs font-normal text-stone-300 tracking-wide font-sans truncate max-w-[80px]">
              {profile.displayName}
            </span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="px-6 py-6 space-y-10 relative z-10">
        <AnimatePresence mode="wait">

        {/* ACTIVE STREAMS PLAYER (If checking episode) */}
        {activeEpisode && selectedMedia && (
          <motion.div
            key="active-player"
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 select-none"
          >
            {/* Top path indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
              <button 
                onClick={() => { setActiveEpisode(null); }}
                className="flex items-center gap-2 w-fit px-4 py-2 rounded-full bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition text-xs font-medium text-stone-300 hover:text-white"
              >
                ← Return to Discover Catalog
              </button>
              <div className="text-left sm:text-right">
                <div className="flex items-center sm:justify-end gap-2 text-xs font-medium tracking-wider text-stone-500 uppercase font-sans">
                  <span>{selectedMedia.type}</span>
                  <span>•</span>
                  <span className="text-stone-400">{selectedMedia.studio}</span>
                </div>
                <h2 className="text-lg md:text-xl font-medium tracking-tight text-white mt-0.5">
                  {selectedMedia.title} <span className="text-stone-400 font-light text-sm md:text-base ml-2">Episode {activeEpisode.episodeNumber}: {activeEpisode.title}</span>
                </h2>
              </div>
            </div>

            {/* Immersive Dual Grid System - PC Optimized */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Player & Active Details */}
              <div className="lg:col-span-8 space-y-8">
                {/* Responsive Glass Player Wrap */}
                <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#090b0c] shadow-2xl">
                  {((selectedMedia.isPremium || activeEpisode.isPremium) && !profile.isPremium) ? (
                    <div className="w-full aspect-video flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-gradient-to-b from-[#0e1114] via-[#080a0c] to-[#040506] relative group text-left select-none">
                      {/* Ambient Glowing Background Orb */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
                      
                      <div className="relative z-10 space-y-4 max-w-md flex flex-col items-center">
                        {/* Lock and premium gold emblem */}
                        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-450 shadow-[0_0_30px_rgba(245,158,11,0.06)] animate-pulse">
                          <Lock className="h-6 w-6 text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                        </div>
                        
                        <div className="space-y-1 text-center">
                          <h3 className="text-[10px] font-mono font-extrabold tracking-widest text-amber-400 uppercase">
                            👑 Premium Vault Selection
                          </h3>
                          <h2 className="text-base sm:text-lg font-serif text-white font-medium tracking-tight">
                            Unlock Ad-Free Unlimited Stream
                          </h2>
                          <p className="text-[11px] text-stone-400 leading-relaxed font-light max-w-sm">
                            {selectedMedia.isPremium 
                              ? `"${selectedMedia.title}" is flagged as a Premium Series.` 
                              : `Chapter ${activeEpisode.episodeNumber} is classified as safe-deposit exclusive.`}
                            {" "}_Unlock all premium catalog entries with crypto. Plan starts at only $1/month!_
                          </p>
                        </div>

                        {/* Upgrade Crypto CTA Button */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center">
                          <button
                            type="button"
                            onClick={() => setShowPremiumModal(true)}
                            className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-500 text-black text-xs font-bold uppercase tracking-wider rounded-full transition shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 cursor-pointer font-sans"
                          >
                            Stream Premium ($1/mo)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveEpisode(null);
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] text-xs font-semibold rounded-full transition text-stone-300"
                          >
                            Explore Free Shows
                          </button>
                        </div>
                        
                        {/* Plan microtext */}
                        <p className="text-[9px] text-stone-500 font-sans text-center">
                          Ad-free • High speed index nodes • $1/month or $8/year paid via Crypto
                        </p>
                      </div>
                    </div>
                  ) : (
                    <GlassPlayer
                      episode={activeEpisode}
                      seriesTitle={selectedMedia.title}
                      hasNext={mediaEpisodes.some(ep => ep.episodeNumber === activeEpisode.episodeNumber + 1)}
                      hasPrev={mediaEpisodes.some(ep => ep.episodeNumber === activeEpisode.episodeNumber - 1)}
                      onNext={() => {
                        const nextEp = mediaEpisodes.find(ep => ep.episodeNumber === activeEpisode.episodeNumber + 1);
                        if (nextEp) setActiveEpisode(nextEp);
                      }}
                      onPrev={() => {
                        const prevEp = mediaEpisodes.find(ep => ep.episodeNumber === activeEpisode.episodeNumber - 1);
                        if (prevEp) setActiveEpisode(prevEp);
                      }}
                    />
                  )}
                </div>

                {/* Series metadata and details below player */}
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        ★ {selectedMedia.rating} Premium Rating
                      </span>
                      {selectedMedia.genres.map(g => (
                        <span key={g} className="text-[10px] bg-white/[0.03] text-stone-400 border border-white/5 px-2.5 py-0.5 rounded-full font-sans">
                          {g}
                        </span>
                      ))}
                      <span className="text-[10px] text-stone-500 font-mono">
                        {selectedMedia.views.toLocaleString()} Streams
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleWatchlist(selectedMedia.id)}
                      className={`text-xs px-4 py-1.5 rounded-full border transition font-medium ${
                        profile.watchlist.includes(selectedMedia.id)
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                          : 'bg-white/[0.02] border-white/10 text-stone-300 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {profile.watchlist.includes(selectedMedia.id) ? '✓ Saved in Watchlist' : '+ Watchlist'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold tracking-wide text-white uppercase font-sans">Story Synopsis</h3>
                    <p className="text-stone-400 text-sm leading-relaxed font-light">{selectedMedia.description}</p>
                  </div>



                  {/* Active Integrated Reviews Inside Left Layout */}
                  <div className="border-t border-white/[0.04] pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold tracking-wider text-stone-300 uppercase font-sans">
                        Community Fan Reviews ({comments.length})
                      </h3>
                    </div>

                    {/* Simple minimalist comment form with no flashy colors */}
                    <form onSubmit={handlePostComment} className="flex flex-col gap-3 bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-400 font-medium">My Score:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(val => (
                            <button
                              type="button"
                              key={val}
                              onClick={() => setCommentRating(val)}
                              className={`text-xs transition ${commentRating >= val ? 'text-amber-400 scale-110' : 'text-stone-600 hover:text-stone-400'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Express your thoughts about this episode..."
                          className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-stone-200 placeholder-stone-600 outline-none focus:border-white/15"
                        />
                        <button
                          type="submit"
                          className="px-5 py-2 bg-white text-black hover:bg-stone-200 transition text-xs font-semibold rounded-xl"
                        >
                          Submit
                        </button>
                      </div>
                    </form>

                    {/* Integrated review threads list */}
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                      {comments.length === 0 ? (
                        <p className="text-xs text-stone-600 text-center py-4 font-light">No reviews posted yet. Be the first to share your thoughts!</p>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className="p-3.5 bg-[#0a0c0e] border border-white/[0.03] rounded-2xl flex gap-3 relative hover:border-white/[0.07] transition">
                            <img src={c.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="h-8 w-8 rounded-full border border-white/15 object-cover" alt="" />
                            <div className="space-y-1 flex-1 pr-12">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-stone-200">{c.userName}</span>
                                {c.userBadge && (
                                  <span className="text-[8px] bg-white/5 text-stone-400 border border-white/10 px-1.5 py-0.2 rounded font-mono">
                                    {c.userBadge}
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-400 text-xs leading-relaxed font-light">{c.text}</p>
                              <span className="text-[9px] text-stone-600 block pt-1 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={() => handleLikeComment(c.id)}
                              className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] text-stone-500 hover:text-stone-300 transition"
                            >
                              <span>❤</span>
                              <span>{c.likes}</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High-End Amazon Prime-style Widescreen Episode Playlist */}
              <div className="lg:col-span-4 bg-[#0a0d0e]/60 border border-white/[0.04] rounded-3xl p-4 backdrop-blur-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider text-white uppercase font-sans">Episode Playlist</h3>
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">Stream queue ({mediaEpisodes.length} episodes)</p>
                  </div>
                  <span className="text-[9px] bg-stone-850 text-stone-400 border border-white/10 px-2 py-0.5 rounded font-mono">
                    HLS AUTO
                  </span>
                </div>

                {/* Micro episode cards stack */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {mediaEpisodes.map(ep => {
                    const isActive = activeEpisode.id === ep.id;
                    const progItem = continueWatching.find(p => p.episodeId === ep.id);
                    const progressPercent = progItem ? Math.round((progItem.progress / progItem.duration) * 100) : 0;
                    return (
                      <div
                        key={ep.id}
                        onClick={() => setActiveEpisode(ep)}
                        className={`group/ep relative cursor-pointer p-2.5 rounded-2xl border text-left flex gap-3 transition ${
                          isActive 
                            ? 'bg-white/[0.03] border-white/15' 
                            : 'bg-transparent border-transparent hover:bg-white/[0.01]'
                        }`}
                      >
                        {/* Widescreen Thumbnail resembling Prime Video playlist items */}
                        <div className="relative aspect-[16/10] w-24 rounded-lg overflow-hidden shrink-0 bg-stone-900 border border-white/5">
                          <img 
                            src={ep.thumbnail || selectedMedia.posterUrl || null} 
                            className="w-full h-full object-cover opacity-80 group-hover/ep:scale-105 transition duration-300" 
                            alt="" 
                          />
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition ${isActive ? 'opacity-100' : 'opacity-0 group-hover/ep:opacity-100'}`}>
                            <div className="h-6 w-6 rounded-full bg-white text-black flex items-center justify-center shadow">
                              <span className="text-[9px] font-bold">▶</span>
                            </div>
                          </div>
                          {/* Duration badge */}
                          <span className="absolute bottom-1 right-1 bg-black/80 px-1 border border-white/5 rounded text-[8px] font-mono text-stone-400">
                            {ep.duration || '24m'}
                          </span>
                        </div>

                        {/* Title and stats layout */}
                        <div className="flex flex-col justify-center flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`text-[10.5px] font-mono font-bold tracking-wider ${isActive ? 'text-amber-400' : 'text-stone-500'}`}>
                              EPISODE {ep.episodeNumber}
                            </span>
                            {ep.isPremium && (
                              <span className="text-[7.5px] bg-amber-550 text-black px-1 rounded-sm font-sans font-extrabold uppercase shrink-0">
                                PREMIUM
                              </span>
                            )}
                          </div>
                          <h4 className={`text-xs font-normal truncate mt-0.5 transition ${isActive ? 'text-white font-medium' : 'text-stone-400 group-hover/ep:text-stone-200'}`}>
                            {ep.title}
                          </h4>
                          {/* Real progress indicators from our WatchProgress state */}
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isActive ? 'bg-amber-400' : progressPercent > 0 ? 'bg-emerald-500' : 'bg-stone-600'}`}
                                style={{ width: `${isActive ? 45 : progressPercent || 0}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-stone-600 font-mono">
                              {isActive ? 'Watching' : progressPercent > 0 ? `${progressPercent}% played` : 'Unwatched'}
                            </span>
                          </div>
                        </div>

                        {/* Premium Download Action */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadEpisode(ep, selectedMedia?.title || '');
                          }}
                          type="button"
                          className="self-center p-2 rounded-xl text-stone-500 hover:text-white hover:bg-white/5 transition shrink-0 cursor-pointer"
                          title="Download Episode"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* GENERAL PAGES CONTENT */}
        {!activeEpisode && !selectedMedia && (
          <motion.div
            key={isAdultMode ? "catalog-adult" : "catalog-main"}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            {isAdultMode ? (
              /* DEDICATED PRESTIGE ADULTS 18+ ARENA */
              <div className="space-y-8 select-none text-left animate-fade-in pb-16">
                {/* Immersive Red Header Banner */}
                <div className="relative w-full rounded-[2rem] overflow-hidden border border-red-500/20 bg-gradient-to-br from-[#1e0a0a] via-stone-950 to-stone-950 p-6 sm:p-10 shadow-[0_0_40px_rgba(220,38,38,0.15)]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-650/[0.08] to-transparent rounded-full pointer-events-none" />
                  
                  <div className="relative z-10 max-w-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tracking-widest leading-none bg-red-600 text-white font-bold px-2.5 py-1 rounded-sm uppercase">
                        18+ Adults Lounge
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 bg-white/[0.04] border border-white/5 px-2.5 py-0.5 rounded-full">
                        Mature Streams Unlocked
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-serif text-white font-extrabold leading-tight tracking-tight">
                      Something New: <span className="text-red-500 block sm:inline">The Adults Lounge</span>
                    </h1>

                    <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-xl opacity-90">
                      Explicit satire, mature actions, and anime stream collections. Deep-dive into legendary, critically-acclaimed global shows like <span className="text-red-400 font-bold font-sans">The Boys</span>, <span className="text-red-400 font-bold font-sans">Invincible</span>, and <span className="text-red-400 font-bold font-sans font-medium">Cyberpunk: Edgerunners</span> completely unshielded.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <button 
                        onClick={() => {
                          setIsAdultMode(false);
                          setActiveCategory('all');
                          setSelectedGenre('');
                          setSelectedType('all');
                          applyFilters();
                          showToast("Safe mode restored. Filtered standard streams.", "success");
                        }} 
                        className="px-4 py-2 bg-white hover:bg-stone-150 text-stone-950 font-bold text-xs rounded-xl transition duration-200 shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        ← Exit Adults Arena
                      </button>
                      <span className="text-[10px] font-mono text-red-500 animate-pulse font-bold">● RESTRICTED 18+ PRIVACY ACTIVE</span>
                    </div>
                  </div>
                </div>

                {/* Grid Header */}
                <div className="border-b border-white/[0.05] pb-3 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-red-400 tracking-[0.2em] uppercase block">Adult Exclusives</span>
                    <h2 className="text-lg font-serif font-bold text-white mt-1">Prime Mature Stream Deck</h2>
                  </div>
                  <div className="text-xs font-mono text-red-500 font-bold">
                    Showing {filteredMedia.length} premium restricted streams
                  </div>
                </div>

                {/* List of Adult Shows */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {filteredMedia.map(item => {
                    const isWatchlisted = profile.watchlist.includes(item.id);
                    const epLabel = `Season 1 • ${item.episodesCount} Episodes`;
                    const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2026;
                    
                    const ratingValue = item.rating || 9.0;
                    const ratingColor = '#ef4444'; // Red rating for restricted lounge

                    return (
                      <motion.div 
                        key={item.id}
                        whileHover={{ y: -8, scale: 1.025, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleShowDetails(item)}
                        className="group flex flex-col cursor-pointer transition-all duration-300 rounded-[1.25rem] bg-[#0c0f12]/60 border border-red-500/15 hover:border-red-500/35 overflow-hidden shadow-lg hover:shadow-[0_20px_45px_rgba(220,38,38,0.1)] hover:bg-[#121619] relative text-left"
                      >
                        {/* Immersive Film Poster Cover container */}
                        <div className="relative aspect-[2/2.95] w-full overflow-hidden bg-stone-900">
                          <img 
                            src={item.posterUrl || null} 
                            className="w-full h-full object-cover transition duration-500 filter group-hover:brightness-95 group-hover:scale-[1.08] pointer-events-none" 
                            alt={item.title} 
                          />
                          
                          {/* Premium Shine Sweep Effect */}
                          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                          {/* Inner dark vignette */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-65 group-hover:opacity-80 transition duration-350" />

                          {/* Circular rating overlay */}
                          <div className="absolute top-2.5 left-2.5 bg-[#050708]/85 backdrop-blur-md h-8.5 w-8.5 rounded-full flex items-center justify-center shadow-lg border border-red-500/20 z-10">
                            <svg className="w-7.5 h-7.5 -rotate-90">
                              <circle
                                cx="15px"
                                cy="15px"
                                r="12px"
                                fill="transparent"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="2.5"
                              />
                              <circle
                                cx="15px"
                                cy="15px"
                                r="12px"
                                fill="transparent"
                                stroke={ratingColor}
                                strokeWidth="2.5"
                                strokeDasharray={75.4}
                                strokeDashoffset={75.4 - (75.4 * ratingValue) / 10}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-[10px] font-sans font-bold text-white tracking-tighter">
                              {ratingValue.toFixed(1)}
                            </span>
                          </div>

                          {/* Restricted 18+ Label (Top-Right) */}
                          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
                            <span className="bg-red-650 hover:bg-red-700 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md font-sans border border-red-500/25 shadow tracking-wide uppercase">
                              18+
                            </span>
                            {item.isPremium ? (
                              <span className="bg-amber-500/95 text-black text-[8px] px-2 py-0.5 rounded-md font-sans font-black tracking-wider uppercase shadow-[0_4px_12px_rgba(245,158,11,0.25)]">
                                👑 Premium
                              </span>
                            ) : (
                              <span className="bg-emerald-500/90 text-black text-[8px] px-2 py-0.5 rounded-md font-sans font-extrabold tracking-wider uppercase">
                                Free
                              </span>
                            )}
                          </div>

                          {/* Audio / Language code tag (Bottom-Left) */}
                          <div className="absolute bottom-2.5 left-2.5 bg-red-900/60 backdrop-blur-[2.5px] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-wider z-10 shadow">
                            MATURE
                          </div>

                          {/* Stream Quality label badge (Bottom-Right) */}
                          <div className="absolute bottom-2.5 right-2.5 bg-stone-900/85 backdrop-blur-[2.5px] text-red-500 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-red-500/10 uppercase tracking-wider z-10 shadow">
                            1080P HD
                          </div>

                          {/* Play / Quick Start overlay trigger */}
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleInitWatchNow(item); 
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 lg:h-11 lg:w-11 rounded-full border border-red-500/25 bg-black/80 text-red-500 hover:text-red-400 flex items-center justify-center transition-all shadow-xl backdrop-blur-md z-20 opacity-0 group-hover:opacity-100"
                            title="Play Premiere"
                          >
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          </motion.button>
                        </div>

                        {/* Title details region below poster */}
                        <div className="p-3 sm:p-4.5 flex-1 flex flex-col justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-mono font-bold tracking-wider text-red-400/90 uppercase block">
                              {item.studio}
                            </span>
                            <h3 className="font-sans font-bold text-stone-150 group-hover:text-amber-400 transition duration-200 text-xs sm:text-xs leading-snug line-clamp-1">
                              {item.title}
                            </h3>
                            <p className="text-[10px] text-stone-500 font-medium font-sans">
                              {epLabel} • {releaseYear}
                            </p>
                          </div>

                          {/* Genres mini badge pile */}
                          <div className="flex items-center gap-1 flex-wrap pt-2 mt-auto">
                            {item.genres.slice(0, 2).map(g => (
                              <span key={g} className="text-[8px] bg-red-950/20 border border-red-950 text-red-400 px-1.5 py-0.2 rounded-sm font-sans tracking-wide">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* EPIC CINEMATIC HERO SLIDER BANNER WITH DYNAMIC SPRING SWAPS */}
                {trendingMedia.length > 0 && (() => {
                  const currentMedia = trendingMedia[bannerIndex] || trendingMedia[0];
                  if (!currentMedia) return null;
                  return (
                    <div className="relative w-full aspect-[16/11] sm:aspect-[21/9] md:aspect-[24/9] lg:aspect-[28/9] min-h-[220px] sm:min-h-0 rounded-[2rem] overflow-hidden border border-white/[0.04] bg-[#0c0f12] group/banner transition shadow-2xl mb-8">
                      {/* Backdrop Background with Motion crossfade */}
                      <div className="absolute inset-0">
                        <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                          <motion.img 
                            key={currentMedia.id}
                            src={currentMedia.bannerUrl || currentMedia.posterUrl || null} 
                            custom={slideDirection}
                            variants={{
                              enter: (dir: number) => ({
                                x: dir > 0 ? '100%' : '-100%',
                                opacity: 0,
                                scale: 1.05
                              }),
                              center: {
                                x: 0,
                                opacity: 0.5,
                                scale: 1,
                                transition: {
                                  x: { type: "spring", stiffness: 300, damping: 30 },
                                  opacity: { duration: 0.6 },
                                  scale: { duration: 0.6 }
                                }
                              },
                              exit: (dir: number) => ({
                                x: dir < 0 ? '100%' : '-100%',
                                opacity: 0,
                                scale: 0.95,
                                transition: {
                                  x: { type: "spring", stiffness: 300, damping: 30 },
                                  opacity: { duration: 0.6 },
                                  scale: { duration: 0.6 }
                                }
                              })
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.7] saturate-[0.8] contrast-[1.1] pointer-events-none" 
                            alt="" 
                          />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-[#050708]/30 to-[#050708]/10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#050708] via-transparent to-transparent opacity-90" />
                      </div>

                      {/* Swipable transparent gesture layer */}
                      <motion.div 
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.4}
                        onDragEnd={(e, info) => {
                          const swipeThreshold = 55;
                          if (info.offset.x < -swipeThreshold) {
                            setSlideDirection(1);
                            setBannerIndex(prev => (prev + 1) % trendingMedia.length);
                          } else if (info.offset.x > swipeThreshold) {
                            setSlideDirection(-1);
                            setBannerIndex(prev => (prev - 1 + trendingMedia.length) % trendingMedia.length);
                          }
                        }}
                        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
                      />

                      {/* Floating particle background effects */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 mix-blend-screen">
                        <div className="absolute h-1.5 w-1.5 bg-amber-400 rounded-full animate-ping top-1/4 left-1/3" />
                        <div className="absolute h-1 w-1 bg-amber-300 rounded-full animate-bounce top-2/3 left-1/2" />
                        <div className="absolute h-2 w-2 bg-purple-500 rounded-full animate-pulse top-1/3 left-2/3" />
                      </div>

                      {/* Tactile manual arrows for desktop layouts */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlideDirection(-1);
                          setBannerIndex(prev => (prev - 1 + trendingMedia.length) % trendingMedia.length);
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full items-center justify-center bg-black/50 hover:bg-amber-500 border border-white/10 hover:border-transparent text-stone-200 hover:text-stone-950 transition-all duration-300 shadow-xl backdrop-blur-md opacity-0 group-hover/banner:opacity-100 cursor-pointer hidden sm:flex shrink-0 select-none"
                        title="Prior Stream"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlideDirection(1);
                          setBannerIndex(prev => (prev + 1) % trendingMedia.length);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full items-center justify-center bg-black/50 hover:bg-amber-500 border border-white/10 hover:border-transparent text-stone-200 hover:text-stone-950 transition-all duration-300 shadow-xl backdrop-blur-md opacity-0 group-hover/banner:opacity-100 cursor-pointer hidden sm:flex shrink-0 select-none"
                        title="Next Stream"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>

                      {/* Banner Content Layout */}
                      <div className="absolute inset-0 p-4 sm:p-8 lg:p-10 flex flex-col justify-end z-10 pointer-events-none">
                        <div className="max-w-2xl space-y-2 sm:space-y-3.5 select-none text-left pointer-events-auto">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono tracking-widest leading-none bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase font-bold animate-pulse">
                              ★ Weekly Top Stream
                            </span>
                            <span className="text-[10px] font-mono uppercase text-stone-300 bg-white/[0.04] border border-white/5 px-2.5 py-0.5 rounded-full font-medium">
                              {currentMedia.type}
                            </span>
                          </div>

                          {/* Staggered Heading */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentMedia.id}
                              initial={{ y: 15, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -15, opacity: 0 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className="space-y-0.5 sm:space-y-1"
                            >
                              <h2 className="text-xl sm:text-3xl md:text-4xl font-serif text-white font-bold leading-tight tracking-tight">
                                {currentMedia.title}
                              </h2>
                              <p className="text-[11px] text-amber-400/80 font-medium font-sans">
                                {currentMedia.alternativeTitle || currentMedia.studio}
                              </p>
                            </motion.div>
                          </AnimatePresence>

                          <p className="text-xs text-stone-300 font-light leading-relaxed max-w-lg hidden sm:line-clamp-2 opacity-80">
                            {currentMedia.description}
                          </p>

                          {/* Interactive Buttons */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleInitWatchNow(currentMedia)}
                              className="flex h-8 sm:h-9 px-3.5 sm:px-5 items-center justify-center gap-1 sm:gap-1.5 bg-white text-[#050708] hover:bg-stone-100 text-[10px] sm:text-xs font-semibold rounded-full shadow-lg transition duration-200 cursor-pointer animate-fade-in"
                            >
                              <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#050708] fill-[#050708]" />
                              Play Premiere
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleToggleWatchlist(currentMedia.id)}
                              className={`flex h-8 sm:h-9 px-3.5 sm:px-4 items-center justify-center gap-1 sm:gap-1.5 rounded-full border text-[10px] sm:text-xs font-semibold backdrop-blur-md transition cursor-pointer ${
                                profile.watchlist.includes(currentMedia.id)
                                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                  : 'bg-white/[0.04] border-white/10 text-stone-200 hover:bg-white/[0.08]'
                              }`}
                            >
                              <Heart className={`h-3 w-3 ${profile.watchlist.includes(currentMedia.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                              {profile.watchlist.includes(currentMedia.id) ? 'Saved' : 'Watchlist'}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleShowDetails(currentMedia)}
                              className="text-[10px] sm:text-xs font-medium text-stone-400 hover:text-white underline cursor-pointer px-1 py-1 whitespace-nowrap shrink-0"
                            >
                              More details
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Elegant Index dots panel overlay right side */}
                      <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/5 z-20">
                        {trendingMedia.map((media, index) => (
                          <button
                            key={media.id}
                            onClick={() => {
                              setSlideDirection(index > bannerIndex ? 1 : -1);
                              setBannerIndex(index);
                            }}
                            className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                              bannerIndex === index ? 'w-4 sm:w-5 bg-amber-400' : 'w-1 sm:w-1.5 bg-white/20'
                            }`}
                            title={media.title}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

            {/* Premium Category Filter Glass Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 select-none">
              <div>
                <span className="text-[10px] font-mono text-stone-500 tracking-[0.2em] uppercase block">Discover Categories</span>
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[
                    { id: 'all', title: 'All Streams' },
                    { id: 'trending', title: 'Top Global Trending' },
                    { id: 'action', title: 'High Cultivation' },
                    { id: 'slice-of-life', title: 'Slice of Life' }
                  ].map(cat => {
                    const isSel = activeCategory === cat.id;
                    return (
                      <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`text-xs px-4 py-1.5 rounded-full transition duration-300 font-sans whitespace-nowrap ${
                          isSel 
                            ? 'bg-white text-stone-900 font-medium' 
                            : 'bg-white/[0.02] text-stone-400 border border-white/5 hover:text-stone-100 hover:bg-white/[0.05]'
                        }`}
                      >
                        {cat.title}
                      </button>
                    );
                  })}

                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`text-xs px-3.5 py-1.5 rounded-full transition duration-300 font-sans whitespace-nowrap flex items-center gap-1.5 border ${
                      showFilters 
                        ? 'bg-zinc-100 text-black border-transparent font-medium' 
                        : 'bg-white/[0.02] text-stone-400 border-white/5 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Filters {showFilters ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Status statistics tag info */}
              <div className="hidden lg:block text-right">
                <span className="text-[10px] font-mono text-stone-500 tracking-[0.1em] uppercase block">Global Catalog Size</span>
                <span className="text-xs text-stone-300 mt-1 block font-medium">{filteredMedia.length} Active Streams Online</span>
              </div>
            </div>

            {/* INTEGRATED LIQUID-GLASS SLATE SEARCH & ADVANCED FILTERS */}
            {showFilters && (
              <div className="bg-zinc-950/95 p-6 rounded-3xl border border-zinc-800/80 backdrop-blur-3xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold uppercase text-zinc-200 tracking-wider">
                      Advanced Stream Filters
                    </span>
                  </div>
                  {(selectedGenre || selectedStatus || selectedRating || studioQuery || selectedType !== 'all') && (
                    <button
                      onClick={() => {
                        setSelectedGenre('');
                        setSelectedStatus('');
                        setSelectedRating(null);
                        setStudioQuery('');
                        setSelectedType('all');
                      }}
                      className="text-[11px] text-zinc-400 hover:text-white transition"
                    >
                      Reset Active Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Origins search type */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Stream Type</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs outline-none text-zinc-300 focus:border-zinc-700"
                    >
                      <option value="all">Any Mode (All Streams)</option>
                      <option value="anime">Anime (Japanese Origin)</option>
                      <option value="donghua">Donghua (Cultivation Xianxia)</option>
                      <option value="movie">Movie (Cinematic Feature)</option>
                    </select>
                  </div>

                  {/* Genre Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Generals Genre</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs outline-none text-zinc-300 focus:border-zinc-700"
                    >
                      <option value="">Any Genre Category</option>
                      {GENRES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Release Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs outline-none text-zinc-300 focus:border-zinc-700"
                    >
                      <option value="">Any Status</option>
                      <option value="Ongoing">Ongoing Casts</option>
                      <option value="Completed">Completed Masters</option>
                      <option value="Upcoming">Upcoming Release</option>
                    </select>
                  </div>

                  {/* Studio Query input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Anime Studio</label>
                    <input
                      type="text"
                      value={studioQuery}
                      onChange={(e) => setStudioQuery(e.target.value)}
                      placeholder="e.g. ufotable, Tencent"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs outline-none text-zinc-350 placeholder-zinc-700 focus:border-zinc-750"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CATALOG FILMS SECTION & ROWS (Netflix / Prime Video Layout) */}
            <div className="space-y-5 pt-4 select-none">
              <div className="flex items-end justify-between border-b border-white/[0.04] pb-3">
                <div>
                  <h3 className="text-xs font-mono text-stone-50 tracking-[0.25em] uppercase">Weekly Top Picks</h3>
                  <p className="text-[11px] text-stone-500 font-sans mt-1">Cinematic stream lists on Anime.</p>
                </div>
                {activeCategory !== 'all' && (
                  <button 
                    onClick={() => {
                      setActiveCategory('all');
                      setSelectedGenre('');
                      setSelectedStatus('');
                      setSelectedRating(null);
                      setStudioQuery('');
                      setSelectedType('all');
                    }}
                    className="text-stone-500 hover:text-white transition text-xs font-medium flex items-center gap-1"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {filteredMedia.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.01] rounded-[2rem] border border-white/[0.04] shadow-inner">
                  <p className="text-stone-500 text-xs font-light">No streaming titles match your filters. Try adjusting your selections or using the search bar!</p>
                </div>
              ) : (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.04
                      }
                    }
                  }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-7"
                >
                  {filteredMedia.map(item => {
                    const isWatchlisted = profile.watchlist.includes(item.id);
                    const epLabel = item.id === 'anime-kage' ? 'S2 • 12 Episodes' : item.id === 'anime-pale-spring' ? 'S2 • 12 Episodes' : item.id === 'anime-iron-halo' ? 'S1 • 10 Episodes' : `Season 1 • ${item.episodesCount} Episodes`;
                    const releaseYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2026;
                    
                    // Style rating progress color
                    const ratingValue = item.rating || 7.0;
                    const ratingColor = ratingValue >= 7.0 ? '#10b981' : ratingValue >= 4.0 ? '#f5a623' : '#ef4444';

                    return (
                      <motion.div 
                        key={item.id}
                        variants={{
                          hidden: { y: 20, opacity: 0 },
                          visible: { 
                            y: 0, 
                            opacity: 1, 
                            transition: { type: "spring", stiffness: 120, damping: 16 } 
                          }
                        }}
                        whileHover={{ y: -8, scale: 1.025, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleShowDetails(item)}
                        className="group flex flex-col cursor-pointer transition-all duration-300 rounded-[1.25rem] bg-[#0c0f12]/60 border border-white/[0.04] hover:border-amber-500/35 overflow-hidden shadow-lg hover:shadow-[0_20px_45px_rgba(0,0,0,0.7)] hover:bg-[#121619] relative"
                      >
                        {/* Immersive Film Poster Cover container */}
                        <div className="relative aspect-[2/2.95] w-full overflow-hidden bg-stone-900">
                          <img 
                            src={item.posterUrl || null} 
                            className="w-full h-full object-cover transition duration-500 filter group-hover:brightness-95 group-hover:scale-[1.08] pointer-events-none" 
                            alt={item.title} 
                          />
                          
                          {/* Premium Shine Sweep Effect */}
                          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

                          {/* Inner dark vignette */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-65 group-hover:opacity-80 transition duration-350" />

                          {/* 1. Circular progress rating overlay (Top-Left) */}
                          <div className="absolute top-2.5 left-2.5 bg-[#050708]/85 backdrop-blur-md h-8.5 w-8.5 rounded-full flex items-center justify-center shadow-lg border border-white/10 z-10">
                            <svg className="w-7.5 h-7.5 -rotate-90">
                              <circle
                                cx="15px"
                                cy="15px"
                                r="12px"
                                fill="transparent"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="2.5"
                              />
                              <circle
                                cx="15px"
                                cy="15px"
                                r="12px"
                                fill="transparent"
                                stroke={ratingColor}
                                strokeWidth="2.5"
                                strokeDasharray={75.4}
                                strokeDashoffset={75.4 - (75.4 * ratingValue) / 10}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-[10px] font-sans font-bold text-white tracking-tighter">
                              {ratingValue.toFixed(1)}
                            </span>
                          </div>

                          {/* 2. Release Year badge (Top-Right) */}
                          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
                            <span className="bg-black/75 backdrop-blur-[2px] text-stone-200 text-[10px] px-2 py-0.5 rounded-sm font-sans border border-white/5 font-extrabold uppercase">
                              {releaseYear}
                            </span>
                            {item.isPremium ? (
                              <span className="bg-amber-500/95 text-black text-[8px] px-2 py-0.5 rounded-sm font-sans font-black tracking-wider uppercase shadow-[0_4px_12px_rgba(245,158,11,0.25)]">
                                👑 Premium
                              </span>
                            ) : (
                              <span className="bg-emerald-500/90 text-black text-[8px] px-2 py-0.5 rounded-sm font-sans font-extrabold tracking-wider uppercase">
                                Free
                              </span>
                            )}
                          </div>

                          {/* 3. Audio / Language code tag (Bottom-Left) */}
                          <div className="absolute bottom-2.5 left-2.5 bg-indigo-500/80 backdrop-blur-[2.5px] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider z-10 shadow">
                            {item.type === 'donghua' ? 'ZH-SUB' : item.type === 'movie' ? 'ENG' : 'JP-SUB'}
                          </div>

                          {/* 4. Stream Quality label badge (Bottom-Right) */}
                          <div className="absolute bottom-2.5 right-2.5 bg-amber-500/80 backdrop-blur-[2.5px] text-stone-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-wider z-10 shadow">
                            {item.type === 'movie' ? '4K ULTRA' : '1080P HD'}
                          </div>

                          {/* Quick Toggle Watchlist with Pop Spring Scale Animation */}
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleToggleWatchlist(item.id); 
                            }}
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full border flex items-center justify-center transition-all shadow-xl backdrop-blur-md z-20 ${
                              isWatchlisted 
                                ? 'bg-rose-500 border-transparent text-white opacity-100 shadow-rose-550/20' 
                                : 'bg-black/80 border-white/10 text-stone-300 hover:text-white opacity-0 group-hover:opacity-100'
                            }`}
                            title="Add to Watchlist"
                          >
                            <Heart className={`h-4 w-4 ${isWatchlisted ? 'fill-white text-white' : ''}`} />
                          </motion.button>
                        </div>

                        {/* Title detail region outside/below the photo but inside the full card */}
                        <div className="p-3 sm:p-4 space-y-1 relative z-10">
                          <h4 className="font-sans font-bold text-[13px] sm:text-[14.5px] text-stone-200 group-hover:text-amber-400 transition-colors duration-300 leading-normal truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-stone-500 font-sans tracking-wide block truncate">
                            {item.studio} • {epLabel.split(' • ')[1] || epLabel}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {(() => {
              const hasFiltersActive = !!(
                searchQuery || 
                selectedGenre || 
                selectedStatus || 
                selectedRating || 
                studioQuery || 
                (selectedType !== 'all') || 
                (activeCategory !== 'all')
              );
              if (hasFiltersActive) return null;
              return (
                <div className="space-y-12 pt-10 border-t border-white/[0.03] mt-8">
                  {/* 1. Recently Uploaded */}
                  {renderMediaSection(
                    [...allMedia]
                      .sort((a, b) => new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime())
                      .slice(0, 12),
                    "Recently Uploaded",
                    "Freshly added streams straight from our cultivation archives"
                  )}

                  {/* 2. Movies */}
                  {renderMediaSection(
                    allMedia.filter(m => m.type === 'movie'),
                    "Cinematic Movies",
                    "Premium full-length animated masterpieces"
                  )}

                  {/* 3. Donghua */}
                  {renderMediaSection(
                    allMedia.filter(m => m.type === 'donghua'),
                    "Donghua Cultivation",
                    "Premium Chinese Xianxia and legendary martial arts streams"
                  )}

                  {/* 4. Anime */}
                  {renderMediaSection(
                    allMedia.filter(m => m.type === 'anime'),
                    "Anime Series",
                    "Top global Japanese animations curated for premium viewing"
                  )}
                </div>
              );
            })()}

            {/* Stream site footer block spacer */}
            <div className="pb-8" />
              </>
            )}
          </motion.div>
        )}

        {/* DETAILED DRILL DOWN DRAWER PAGE OVERLAY */}
        {selectedMedia && !activeEpisode && (
          <motion.div
            key="detailed-card"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-6xl mx-auto w-full space-y-8 select-none"
          >
              
              {/* Back controls and main actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="px-5 py-2.5 bg-white/[0.02] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-xs font-semibold rounded-full transition text-stone-200"
                >
                  ← Return to Catalog Grid
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleShareMedia(selectedMedia.title)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 text-stone-200 transition relative"
                    title="Copy streaming link to clipboard"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {copiedLink && (
                      <span className="absolute -top-7 right-0 text-[10px] bg-stone-100 text-[#050708] px-2.5 py-0.5 rounded font-medium whitespace-nowrap">
                        Link copied
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleToggleWatchlist(selectedMedia.id)}
                    className={`flex h-9 px-4 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition ${
                      profile.watchlist.includes(selectedMedia.id)
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                        : 'bg-white/[0.02] border-white/10 text-stone-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Heart className={`h-3 w-3 ${profile.watchlist.includes(selectedMedia.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    {profile.watchlist.includes(selectedMedia.id) ? 'Saved' : 'Add Watchlist'}
                  </button>

                  <button
                    onClick={() => handleInitWatchNow(selectedMedia)}
                    className="flex h-9 px-5 items-center justify-center gap-1.5 bg-white text-[#050708] hover:bg-stone-200 active:scale-95 text-xs font-semibold rounded-full shadow-lg transition"
                  >
                    <Play className="h-3.5 w-3.5 text-[#050708] fill-[#050708]" />
                    Play Series
                  </button>
                </div>
              </div>

              {/* Banner Cover Cover Frame */}
              <div className="relative aspect-[21/9] w-full rounded-[2.5rem] overflow-hidden border border-white/[0.04] shadow-2xl">
                <img src={selectedMedia.bannerUrl || null} className="w-full h-full object-cover filter brightness-50 grayscale contrast-125 saturate-50 pointer-events-none" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-transparent to-transparent opacity-80" />
                
                {/* Details absolute layout */}
                <div className="absolute bottom-6 left-6 md:left-10 flex items-end gap-5">
                  <img src={selectedMedia.posterUrl || null} className="h-36 w-26 object-cover rounded-2xl border border-white/20 shadow-2xl hidden sm:block pointer-events-none" alt="" />
                  <div className="space-y-1.5">
                    <span className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                      ★ {selectedMedia.rating} Stream Quality
                    </span>
                    <h1 className="text-xl sm:text-3xl md:text-4xl font-serif text-white leading-tight font-medium">{selectedMedia.title}</h1>
                    <p className="text-[11px] text-stone-400 font-sans">{selectedMedia.alternativeTitle || selectedMedia.studio}</p>
                  </div>
                </div>
              </div>

              {/* Side grid details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left columns */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-serif text-sm text-stone-100 uppercase tracking-wide">Story Briefing</h3>
                    <p className="text-stone-400 text-sm leading-relaxed font-light">{selectedMedia.description}</p>
                  </div>



                  {/* Episodes List in Netflix queue look */}
                  <div className="space-y-4 bg-[#0a0d0e]/60 p-5 rounded-3xl border border-white/[0.04]">
                    <div>
                      <h3 className="font-serif text-sm text-white uppercase select-none">Episodes Collection</h3>
                      <p className="text-[10px] text-stone-500 font-sans mt-0.5">Select and stream any episode instantly</p>
                    </div>

                    <div className="divide-y divide-white/[0.03]">
                      {mediaEpisodes.length === 0 ? (
                        <p className="text-xs text-stone-500 py-4">No individual episodes loaded. Tap 'Play Series' to start, or add them via the admin desk.</p>
                      ) : (
                        mediaEpisodes.map(ep => (
                          <div key={ep.id} className="flex items-center justify-between py-3 group cursor-pointer animate-fade-in" onClick={() => {
                            handleInitWatchNow(selectedMedia);
                            setActiveEpisode(ep);
                          }}>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-amber-350 shrink-0">EP {ep.episodeNumber}</span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-normal text-stone-300 group-hover:text-white transition truncate">{ep.title}</h4>
                                <span className="text-[9px] text-stone-550 font-mono">Duration: {ep.duration || '24m'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadEpisode(ep, selectedMedia?.title || '');
                                }}
                                type="button"
                                className="p-2 rounded-full text-stone-500 hover:text-white hover:bg-white/5 transition cursor-pointer"
                                title="Download Episode"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-[10px] px-3 py-1 rounded-full bg-white/5 border border-white/10 group-hover:bg-white group-hover:text-[#050708] transition text-stone-300 font-medium">
                                Stream
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Columns details lists */}
                <div className="lg:col-span-4 bg-[#0b0e10]/80 border border-white/[0.04] p-5 rounded-3xl backdrop-blur-3xl space-y-5">
                  <div className="space-y-3.5">
                    <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400">Production Facts</h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-stone-500 text-[9px] uppercase">Studio</span>
                        <b className="text-stone-300 mt-0.5 block font-normal">{selectedMedia.studio}</b>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[9px] uppercase">Author</span>
                        <b className="text-stone-300 mt-0.5 block font-normal font-sans">{selectedMedia.author || 'Original Novel'}</b>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[9px] uppercase">Review Score</span>
                        <b className="text-amber-400 mt-0.5 block font-normal">★ {selectedMedia.rating}</b>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[9px] uppercase">Views Count</span>
                        <b className="text-stone-300 mt-0.5 block font-mono font-normal">{selectedMedia.views.toLocaleString()}</b>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[9px] uppercase">Episodes</span>
                        <b className="text-stone-300 mt-0.5 block font-normal">{selectedMedia.episodesCount} Chapters</b>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[9px] uppercase">Status</span>
                        <b className="text-stone-300 mt-0.5 block font-normal">{selectedMedia.status}</b>
                      </div>
                    </div>
                  </div>

                  {/* Core comments feedback box */}
                  <div className="border-t border-white/[0.04] pt-5 space-y-4">
                    <h3 className="font-serif text-xs text-stone-300 uppercase flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-stone-400" />
                      Fan Reviews ({comments.length})
                    </h3>

                    {/* New review fields */}
                    <form onSubmit={handlePostComment} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500 font-semibold uppercase">Rating:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(val => (
                            <button
                              type="button"
                              key={val}
                              onClick={() => setCommentRating(val)}
                              className={`text-[11px] transition ${commentRating >= val ? 'text-amber-400 font-bold scale-110' : 'text-stone-600'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder="Express thoughts..."
                          className="w-full bg-[#050708] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 outline-none focus:border-white/15"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-white text-black hover:bg-stone-200 text-xs font-semibold rounded-xl"
                        >
                          Send
                        </button>
                      </div>
                    </form>

                    {/* Comments thread List scroll */}
                    <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                      {comments.length === 0 ? (
                        <p className="text-[10px] text-stone-600 text-center py-4">No comments left yet. Write your thoughts!</p>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className="bg-[#050708]/60 p-3 rounded-2xl border border-white/[0.02] text-[11px] leading-relaxed relative hover:border-white/[0.04] transition">
                            <div className="flex gap-2 items-center">
                              <img src={c.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="h-6 w-6 rounded-full object-cover border border-white/10" alt="" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-stone-300 font-medium ">{c.userName}</span>
                                  {c.userBadge && (
                                    <span className="text-[7px] bg-white/5 text-stone-400 border border-white/10 px-1.5 py-0.2 rounded font-mono">
                                      {c.userBadge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[8px] text-stone-650 block">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-stone-400 mt-2 font-light leading-relaxed">{c.text}</p>

                            {/* Upvotes button toggles */}
                            <button
                              onClick={() => handleLikeComment(c.id)}
                              className="absolute top-3.5 right-3.5 flex items-center gap-1 text-[10px] text-stone-500 hover:text-stone-300 transition"
                            >
                              <span>❤</span>
                              <span>{c.likes}</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
        )}
        </AnimatePresence>



        {/* PREMIUM CRYPTO CHECKOUT SUBSCRIPTION MODAL */}
        <SubscriptionModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          profile={profile}
          onProfileUpdated={(updatedFields) => saveProfileUpdate(updatedFields)}
          showToast={(msg, type) => showToast(msg, type)}
        />

        {/* QR CODE SIMULATOR DIALOG POPUP */}
        {showQrSim && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-sm text-center relative space-y-4">
              <button onClick={() => setShowQrSim(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <Smartphone className="h-10 w-10 text-purple-400 mx-auto animate-bounce" />
              <h4 className="font-extrabold text-base text-white">Scan to Sync Play History</h4>
              <p className="text-xs text-slate-400">Sync stream histories, unlocked milestones and avatar settings.</p>
              
              <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
                {/* Visual rendering of a mock QR box */}
                <div className="w-40 h-40 border-8 border-slate-900 bg-slate-950 flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-blue-500" />
                    <div className="w-8 h-8 bg-blue-500" />
                  </div>
                  <div className="text-xs text-center font-bold text-white tracking-widest font-mono">XIANXIA</div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-blue-500" />
                    <div className="w-10 h-2 bg-purple-500 rounded" />
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-indigo-300 block font-mono bg-indigo-500/15 py-1 px-3 rounded-full">
                Device Signature: DM_CLIENT_MOBILE_HLS_WRAPPER
              </span>
            </div>
          </div>
        )}

      </main>


    </div>
  );
}
