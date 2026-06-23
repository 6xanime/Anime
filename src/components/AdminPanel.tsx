import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Upload, Eye, Users, Film, Award, DollarSign, ShieldAlert, Check, Smartphone, Trash2, Send, Megaphone, Edit2, ArrowLeft, Plus, Lock, Unlock, Settings, Video, Sparkles } from 'lucide-react';
import { MediaItem, AdminStats } from '../types';
import { GENRES } from '../initialData';

interface AdminPanelProps {
  allMedia: MediaItem[];
  onRefreshAll: () => void;
  onClose: () => void;
}

export default function AdminPanel({ allMedia, onRefreshAll, onClose }: AdminPanelProps) {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1422,
    activeUsers: 843,
    newUsersToday: 42,
    totalAnime: 3,
    totalDonghua: 3,
    totalEpisodes: 8,
    totalViews: 812903,
    revenueEst: 1480.50
  });

  const [activeTab, setActiveTab] = useState<'stats' | 'add-media' | 'add-episode' | 'manage' | 'notifications' | 'users'>('stats');
  
  // Registered user detail controls
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [usersSearchQuery, setUsersSearchQuery] = useState('');
  const [userEditChanges, setUserEditChanges] = useState<{
    displayName: string;
    avatarUrl: string;
    isPremium: boolean;
    subscriptionPlan: 'monthly' | 'yearly';
    badges: string;
  } | null>(null);

  // Series and Episode editing states
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editingEpisodes, setEditingEpisodes] = useState<any[]>([]);
  const [isFetchingEpisodes, setIsFetchingEpisodes] = useState(false);
  const [editingEpisodeForm, setEditingEpisodeForm] = useState<any | null>(null); // Active sub-episode being edited

  // Local state for editing form inputs
  const [editTitle, setEditTitle] = useState('');
  const [editAltTitle, setEditAltTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMediaType, setEditMediaType] = useState<'anime' | 'donghua' | 'movie'>('anime');
  const [editIsAdult, setEditIsAdult] = useState(false);
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [editStudio, setEditStudio] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editStatus, setEditStatus] = useState<'Ongoing' | 'Completed' | 'Upcoming'>('Ongoing');
  const [editReleaseDate, setEditReleaseDate] = useState('');
  const [editEpisodeCount, setEditEpisodeCount] = useState(12);
  const [editDuration, setEditDuration] = useState('24m');
  const [editRating, setEditRating] = useState(8.5);
  const [editSelectedGenres, setEditSelectedGenres] = useState<string[]>([]);
  const [editPosterUrl, setEditPosterUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editTrailerUrl, setEditTrailerUrl] = useState('');

  // Local state to add a new episode within editing view
  const [newEpNumber, setNewEpNumber] = useState(1);
  const [newEpTitle, setNewEpTitle] = useState('');
  const [newEpVideoUrl, setNewEpVideoUrl] = useState('');
  const [newEpThumbnail, setNewEpThumbnail] = useState('');
  const [newEpDuration, setNewEpDuration] = useState('24m');
  const [newEpIsPremium, setNewEpIsPremium] = useState(false);

  // Media Upload Form
  const [mediaType, setMediaType] = useState<'anime' | 'donghua' | 'movie'>('anime');
  const [isAdult, setIsAdult] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [title, setTitle] = useState('');
  const [altTitle, setAltTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studio, setStudio] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<'Ongoing' | 'Completed' | 'Upcoming'>('Ongoing');
  const [releaseDate, setReleaseDate] = useState('');
  const [episodeCount, setEpisodeCount] = useState(12);
  const [duration, setDuration] = useState('24m');
  const [rating, setRating] = useState(8.5);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Optimizations for search, filtering, and instant optimistic delete states
  const [manageSearch, setManageSearch] = useState('');
  const [manageCategory, setManageCategory] = useState<'all' | 'anime' | 'donghua' | 'movie'>('all');
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);

  // Episode Form state
  const [targetMediaId, setTargetMediaId] = useState('');
  const [epNumber, setEpNumber] = useState(1);
  const [epTitle, setEpTitle] = useState('');
  const [epThumbnail, setEpThumbnail] = useState('');
  const [epVideoUrl, setEpVideoUrl] = useState('');
  const [epDuration, setEpDuration] = useState('24m');
  const [epIsPremium, setEpIsPremium] = useState(false);

  // Bulk Upload State
  const [bulkInputs, setBulkInputs] = useState<string>('1||Cruelty||https://www.dailymotion.com/embed/video/x8nc8t7\n2||Trainer Sakonji||https://www.dailymotion.com/embed/video/x8nclp3'); 
  const [isBulk, setIsBulk] = useState(false);

  // Banned State (Obsolete, now managed dynamically)
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Custom Notifications state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('system');
  const [notifMediaId, setNotifMediaId] = useState('');

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          type: notifType,
          mediaId: notifMediaId || null
        })
      });

      if (res.ok) {
        setUploadSuccess(`Platform Broadcast Dispatched: "${notifTitle}"`);
        setNotifTitle('');
        setNotifMessage('');
        setNotifMediaId('');
        onRefreshAll();
        setTimeout(() => setUploadSuccess(null), 4000);
      }
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRegisteredUsers();
    fetchActivities();
    
    // Polling live streams watch activity every 5 seconds for visual premium responsiveness
    const livePoll = setInterval(() => {
      fetchActivities();
      fetchStats();
    }, 5000);

    if (allMedia.length > 0 && !targetMediaId) {
      setTargetMediaId(allMedia[0].id);
    }

    // Reset localized delete state upon successful parent synchronization
    setDeletedIds([]);

    return () => clearInterval(livePoll);
  }, [allMedia]);

  const fetchRegisteredUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setRegisteredUsers(data);
      }
    } catch (e) {
      console.warn('Failed loading registered user indexes', e);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/admin/activity');
      if (res.ok) {
        const data = await res.json();
        setRecentActivities(data);
      }
    } catch (e) {
      console.warn('Failed loading real activity trackers', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // safe fallback
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(prev => prev.filter(g => g !== genre));
    } else {
      setSelectedGenres(prev => [...prev, genre]);
    }
  };

  const startEditingMedia = async (item: MediaItem) => {
    setEditingMedia(item);
    setEditTitle(item.title || '');
    setEditAltTitle(item.alternativeTitle || '');
    setEditDescription(item.description || '');
    setEditMediaType(item.type || 'anime');
    setEditIsAdult(!!item.isAdult);
    setEditIsPremium(!!item.isPremium);
    setEditStudio(item.studio || '');
    setEditAuthor(item.author || '');
    setEditStatus(item.status || 'Ongoing');
    setEditReleaseDate(item.releaseDate || '');
    setEditEpisodeCount(item.episodesCount || 12);
    setEditDuration(item.duration || '24m');
    setEditRating(item.rating || 8.5);
    setEditSelectedGenres(item.genres || []);
    setEditPosterUrl(item.posterUrl || '');
    setEditBannerUrl(item.bannerUrl || '');
    setEditTrailerUrl(item.trailerUrl || '');

    setIsFetchingEpisodes(true);
    setEditingEpisodeForm(null);
    try {
      const res = await fetch(`/api/episodes?mediaId=${item.id}`);
      if (res.ok) {
        const data = await res.json();
        setEditingEpisodes(data);
        const maxEpNum = data.reduce((max: number, ep: any) => ep.episodeNumber > max ? ep.episodeNumber : max, 0);
        setNewEpNumber(maxEpNum + 1);
        setNewEpTitle(`Episode ${maxEpNum + 1}`);
        setNewEpVideoUrl('');
        setNewEpThumbnail('');
        setNewEpIsPremium(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingEpisodes(false);
    }
  };

  const handleUpdateMediaDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;

    const updatedPayload = {
      type: editMediaType,
      isAdult: editIsAdult,
      isPremium: editIsPremium,
      title: editTitle,
      alternativeTitle: editAltTitle,
      description: editDescription,
      genres: editSelectedGenres,
      studio: editStudio,
      author: editAuthor,
      status: editStatus,
      releaseDate: editReleaseDate,
      episodesCount: Number(editEpisodeCount),
      duration: editDuration,
      rating: Number(editRating),
      trailerUrl: editTrailerUrl,
      posterUrl: editPosterUrl,
      bannerUrl: editBannerUrl,
      cast: []
    };

    try {
      const res = await fetch(`/api/media/${editingMedia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });

      if (res.ok) {
        setUploadSuccess(`Successfully updated series "${editTitle}"!`);
        onRefreshAll();
        // Update editingMedia so the form updates its current cached state
        const updatedItem = await res.json();
        setEditingMedia(updatedItem);
        setTimeout(() => setUploadSuccess(null), 3500);
      } else {
        setUploadSuccess(`Error updating series "${editTitle}".`);
        setTimeout(() => setUploadSuccess(null), 3500);
      }
    } catch (err) {
      console.error(err);
      setUploadSuccess(`Failed to contact server.`);
      setTimeout(() => setUploadSuccess(null), 3500);
    }
  };

  const handleAddNewEpisodeInEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;

    const payload = {
      mediaId: editingMedia.id,
      episodeNumber: Number(newEpNumber) || 1,
      title: newEpTitle || `Episode ${newEpNumber}`,
      thumbnail: newEpThumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
      videoUrl: newEpVideoUrl || 'https://www.dailymotion.com/embed/video/x8mveho',
      duration: newEpDuration || '24m',
      isPremium: !!newEpIsPremium
    };

    try {
      const res = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const addedEp = await res.json();
        setEditingEpisodes(prev => [...prev, addedEp].sort((a, b) => a.episodeNumber - b.episodeNumber));
        setUploadSuccess(`Successfully added ${payload.title}!`);
        onRefreshAll();
        setTimeout(() => setUploadSuccess(null), 3500);
        
        const nextEpNum = (Number(newEpNumber) || 1) + 1;
        setNewEpNumber(nextEpNum);
        setNewEpTitle(`Episode ${nextEpNum}`);
        setNewEpVideoUrl('');
        setNewEpThumbnail('');
        setNewEpIsPremium(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateEpisode = async (epId: string, updatedFields: any) => {
    try {
      const res = await fetch(`/api/episodes/${epId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });

      if (res.ok) {
        const updatedEp = await res.json();
        setEditingEpisodes(prev => prev.map(ep => ep.id === epId ? updatedEp : ep).sort((a, b) => a.episodeNumber - b.episodeNumber));
        setUploadSuccess(`Successfully updated Episode ${updatedEp.episodeNumber}!`);
        onRefreshAll();
        setTimeout(() => setUploadSuccess(null), 3500);
        setEditingEpisodeForm(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEpisode = async (epId: string, epName: string) => {
    if (!confirm(`Are you sure you want to delete "${epName}"?`)) return;

    try {
      const res = await fetch(`/api/episodes/${epId}`, { method: 'DELETE' });
      if (res.ok) {
        setEditingEpisodes(prev => prev.filter(ep => ep.id !== epId));
        setUploadSuccess(`Deleted "${epName}" successfully.`);
        onRefreshAll();
        setTimeout(() => setUploadSuccess(null), 3500);
        if (editingEpisodeForm?.id === epId) {
          setEditingEpisodeForm(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPosterUrl(reader.result);
            setUploadSuccess(`Preloaded title metadata and uploaded poster image from: "${file.name}"!`);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setUploadSuccess(`Preloaded title metadata from dropped asset: "${file.name}"`);
      }
      setTimeout(() => setUploadSuccess(null), 4000);
    }
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMedia = {
      type: mediaType,
      isAdult,
      isPremium,
      title,
      alternativeTitle: altTitle,
      description,
      genres: selectedGenres,
      studio: studio || 'ufotable',
      author,
      status,
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      episodesCount: Number(episodeCount),
      duration,
      rating: Number(rating),
      trailerUrl,
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600',
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200',
      cast: []
    };

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedia)
      });
      if (res.ok) {
        setUploadSuccess(`"${title}" published to database.`);
        setTitle('');
        setAltTitle('');
        setIsAdult(false);
        setIsPremium(false);
        setDescription('');
        setSelectedGenres([]);
        onRefreshAll();
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    } catch {
      // safe bypass
    }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMediaId) return;

    if (isBulk) {
      const lines = bulkInputs.split('\n');
      const episodesList = lines.map(line => {
        const parts = line.split('||');
        return {
          episodeNumber: Number(parts[0]?.trim()) || 1,
          title: parts[1]?.trim() || 'Episode Chapter',
          videoUrl: parts[2]?.trim() || 'https://www.dailymotion.com/embed/video/x8nc8t7',
          thumbnail: epThumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
          duration: epDuration
        };
      });

      try {
        const res = await fetch('/api/episodes/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaId: targetMediaId, episodesList })
        });
        if (res.ok) {
          setUploadSuccess(`Indexed ${episodesList.length} chapters successfully.`);
          setBulkInputs('');
          setTimeout(() => setUploadSuccess(null), 3000);
        }
      } catch {
        // safe bypass
      }
    } else {
      const payload = {
        mediaId: targetMediaId,
        episodeNumber: epNumber,
        title: epTitle || `Chapter ${epNumber}`,
        thumbnail: epThumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
        videoUrl: epVideoUrl || 'https://www.dailymotion.com/embed/video/x8nc8t7',
        duration: epDuration,
        isPremium: epIsPremium
      };

      try {
        const res = await fetch('/api/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setUploadSuccess(`Episode ${epNumber} ("${epTitle}") active.`);
          setEpTitle('');
          setEpIsPremium(false);
          setEpNumber(prev => prev + 1);
          setTimeout(() => setUploadSuccess(null), 3000);
        }
      } catch {
        // safe bypass
      }
    }
  };

  const handleDeleteMedia = async (id: string, name: string) => {
    // 1-CLICK DELETION OPTIMIZATION: Hide instantly in UI and notify with a sleek toast alert. No modal interruption!
    setDeletedIds(prev => [...prev, id]);
    setUploadSuccess(`"${name}" deleted successfully.`);
    setTimeout(() => setUploadSuccess(null), 3500);

    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshAll();
      } else {
        // Revert in case of API request failures
        setDeletedIds(prev => prev.filter(x => x !== id));
        setUploadSuccess(`Error deleting "${name}". Try again.`);
      }
    } catch {
      setDeletedIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleToggleFeature = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !current })
      });
      if (res.ok) {
        onRefreshAll();
      }
    } catch {
      // safe bypass
    }
  };

  const handleTogglePremium = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !current })
      });
      if (res.ok) {
        onRefreshAll();
      }
    } catch {
      // safe bypass
    }
  };

  const handleBanUserToggle = async (email: string, currentIsBanned: boolean) => {
    try {
      const res = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isBanned: !currentIsBanned })
      });
      if (res.ok) {
        setUploadSuccess(`Account ban toggled for: "${email}"`);
        fetchRegisteredUsers();
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisableUserToggle = async (email: string, currentIsDisabled: boolean) => {
    try {
      const res = await fetch('/api/admin/users/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isDisabled: !currentIsDisabled })
      });
      if (res.ok) {
        setUploadSuccess(`Account disabled credentials toggle for: "${email}"`);
        fetchRegisteredUsers();
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveUserProfileChanges = async (email: string) => {
    if (!userEditChanges) return;
    try {
      const parsedBadges = userEditChanges.badges
        .split(',')
        .map(b => b.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          displayName: userEditChanges.displayName,
          avatarUrl: userEditChanges.avatarUrl,
          isPremium: userEditChanges.isPremium,
          subscriptionPlan: userEditChanges.subscriptionPlan,
          badges: parsedBadges
        })
      });
      if (res.ok) {
        const result = await res.json();
        setUploadSuccess(`User profile for "${email}" updated successfully.`);
        fetchRegisteredUsers();
        // Update selected item details too
        if (selectedUserDetail && selectedUserDetail.email === email) {
          setSelectedUserDetail(result.profile);
        }
        setUserEditChanges(null);
        setTimeout(() => setUploadSuccess(null), 3500);
      }
    } catch (e) {
      console.error('Failed to update user profile', e);
    }
  };

  const trafficData = [
    { name: 'Mon', Views: 94000, Users: 1200 },
    { name: 'Tue', Views: 102000, Users: 1540 },
    { name: 'Wed', Views: 115000, Users: 1890 },
    { name: 'Thu', Views: 125000, Users: 2012 },
    { name: 'Fri', Views: 148000, Users: 2340 },
    { name: 'Sat', Views: 185000, Users: 2980 },
    { name: 'Sun', Views: stats.totalViews - 769000, Users: stats.activeUsers }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-[#050708] text-white flex flex-col p-4 md:p-10 select-none">
      {/* Admin header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/[0.04] pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-stone-400 text-[9px] uppercase font-mono tracking-widest flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Creator Desk
            </span>
          </div>
          <h1 className="text-xl md:text-3xl font-serif text-white mt-1.5 font-normal">
            ANIME STREAM Studio
          </h1>
          <p className="text-[11px] text-stone-500 font-sans mt-0.5">Content, Indexing & Platform Telemetry Settings</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto overflow-hidden">
          {/* Quick Tabs - scrollable horizontally on mobile with hidden scrollbar */}
          <div className="bg-white/[0.02] border border-white/10 rounded-full p-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap max-w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition ${activeTab === 'stats' ? 'bg-white text-[#050708] font-bold' : 'text-stone-400 hover:text-white'}`}
            >
              Stats
            </button>
            <button
              onClick={() => setActiveTab('add-media')}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition ${activeTab === 'add-media' ? 'bg-white text-[#050708] font-bold' : 'text-stone-400 hover:text-white'}`}
            >
              + Series
            </button>
            <button
              onClick={() => setActiveTab('add-episode')}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition ${activeTab === 'add-episode' ? 'bg-white text-[#050708] font-bold' : 'text-stone-400 hover:text-white'}`}
            >
              + Episode
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition ${activeTab === 'manage' ? 'bg-white text-[#050708] font-bold' : 'text-stone-400 hover:text-white'}`}
            >
              Index & Delete
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 tracking-wide transition-all ${
                activeTab === 'notifications' ? 'bg-amber-500 text-[#050708] font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              Broadcast
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 md:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 tracking-wide transition-all ${
                activeTab === 'users' ? 'bg-amber-500 text-[#050708] font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              👥 Users Control
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/[0.02] border border-white/10 hover:border-white/20 text-xs font-medium rounded-full transition text-stone-300 whitespace-nowrap shrink-0 sm:ml-auto text-center"
          >
            Exit Studio
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium rounded-2xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          {uploadSuccess}
        </div>
      )}

      {/* Overview Stat tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6 flex-1">
          {/* Bento boxes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b0e10]/60 border border-white/[0.03] rounded-3xl p-5 relative overflow-hidden">
              <div className="text-stone-550 text-[10px] uppercase font-semibold tracking-wider flex items-center justify-between mb-2">
                Views Analytics
                <Eye className="h-4 w-4 text-stone-500" />
              </div>
              <p className="text-xl md:text-2xl font-normal font-mono text-white">
                {stats.totalViews.toLocaleString()}
              </p>
              <span className="text-[9px] text-stone-500 block mt-1.5">
                Surging from previous cycle
              </span>
            </div>

            <div className="bg-[#0b0e10]/60 border border-white/[0.03] rounded-3xl p-5 relative overflow-hidden">
              <div className="text-stone-550 text-[10px] uppercase font-semibold tracking-wider flex items-center justify-between mb-2">
                Active Fans
                <Users className="h-4 w-4 text-stone-500" />
              </div>
              <p className="text-xl md:text-2xl font-normal font-mono text-white">
                {stats.activeUsers.toLocaleString()}
              </p>
              <span className="text-[9px] text-emerald-400 block mt-1.5">
                ● 142 Active streams now
              </span>
            </div>

            <div className="bg-[#0b0e10]/60 border border-white/[0.03] rounded-3xl p-5 relative overflow-hidden">
              <div className="text-stone-550 text-[10px] uppercase font-semibold tracking-wider flex items-center justify-between mb-2">
                Total Titles
                <Film className="h-4 w-4 text-stone-500" />
              </div>
              <p className="text-xl md:text-2xl font-normal font-mono text-white">
                {stats.totalAnime + stats.totalDonghua}
              </p>
              <span className="text-stone-500 text-[9px] block mt-1.5">
                {stats.totalAnime} Anime / {stats.totalDonghua} Donghua
              </span>
            </div>

            <div className="bg-[#0b0e10]/60 border border-white/[0.03] rounded-3xl p-5 relative overflow-hidden">
              <div className="text-stone-550 text-[10px] uppercase font-semibold tracking-wider flex items-center justify-between mb-2">
                Monthly Est
                <DollarSign className="h-4 w-4 text-stone-500" />
              </div>
              <p className="text-xl md:text-2xl font-normal font-mono text-white">
                ${stats.revenueEst.toFixed(2)}
              </p>
              <span className="text-[9px] text-stone-550 block mt-1.5">
                Estimated CPM metrics
              </span>
            </div>
          </div>

          {/* Recharts Traffic Plot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-[#0b0e10]/60 border border-white/[0.03] rounded-[2rem] p-6">
              <h3 className="font-serif text-sm text-stone-200 mb-4 font-normal">Streaming Load Activities</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#050708', border: '1px solid rgba(255,255,255,0.05)' }} />
                    <Area type="monotone" dataKey="Views" stroke="#a1a1aa" strokeWidth={1.5} fillOpacity={1} fill="url(#colorViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Platform limits */}
            <div className="lg:col-span-4 bg-[#0b0e10]/60 border border-white/[0.03] rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between">
              <div>
                <h4 className="font-sans text-xs font-semibold text-stone-400 mb-4 uppercase tracking-wider">Streaming Storage</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>Live CDN Space</span>
                      <span>18.4 GB / 100 GB</span>
                    </div>
                    <div className="w-full bg-[#050708] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-white h-full rounded-full" style={{ width: '18.4%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>Indexed API Queries</span>
                      <span>85,290 / 1M limit</span>
                    </div>
                    <div className="w-full bg-[#050708] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-stone-500 h-full rounded-full" style={{ width: '8.5%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#050708]/60 p-4 rounded-2xl mt-6 border border-white/[0.02] text-xs text-stone-500 leading-relaxed font-light">
                <span className="font-semibold text-stone-300 block mb-1">Video Stream Core</span>
                Our media playlists are fed via lightning fast Dailymotion embed wrappers, keeping response load lightweight.
              </div>
            </div>
          </div>

          {/* Realtime User Activity Logs */}
          <div className="bg-[#0b0e10]/60 border border-white/[0.03] p-6 rounded-[2rem]">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
              <div>
                <h3 className="font-serif text-sm text-stone-200">Real-Time Fan Streams & Activity Feed</h3>
                <p className="text-[10px] text-stone-500 font-sans">Active stream clicks, browse interactions and progress synchronizations</p>
              </div>
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                ● LIVE RADAR ACTIVE
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {recentActivities.length === 0 ? (
                <p className="text-center text-xs text-stone-500 py-6">Waiting for active clicks/plays...</p>
              ) : (
                recentActivities.map((act: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white/[0.01] border border-white/[0.02] p-3 rounded-2xl text-[11px] hover:bg-white/[0.02] transition">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-stone-850 border border-white/5 text-stone-400 font-mono text-[9px] flex items-center justify-center font-bold">
                        {act.email?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-200 leading-none">{act.email}</p>
                        <p className="text-[9px] text-stone-500 mt-1">
                          Interacted: <span className="text-amber-400 font-medium font-mono">{act.action}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-stone-300">
                        {act.mediaTitle} {act.episodeNumber && `• Episode ${act.episodeNumber}`}
                      </p>
                      <p className="text-[9px] text-stone-600 font-mono mt-0.5">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MEDIA TAB */}
      {activeTab === 'add-media' && (
        <form onSubmit={handleCreateMedia} className="space-y-6 flex-1 max-w-4xl select-none text-left">
          {/* Header Description */}
          <div className="bg-[#0b0e10]/60 p-5 rounded-3xl border border-white/[0.03] flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base text-[#fafafa] font-normal tracking-tight">Series Editor & Publisher</h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">Publish new streams, set classifications, and index covers with live previews.</p>
            </div>
            <Sparkles className="h-5 w-5 text-amber-500 hidden sm:block animate-pulse" />
          </div>

          {/* Compartment 1: Drag & Drop File Container / Instant Preload */}
          <div className="bg-[#0b0e10]/40 p-6 rounded-3xl border border-white/[0.03] space-y-4">
            <h4 className="text-[11px] font-bold font-mono tracking-wider text-amber-500 uppercase">Step 1: Banner & Title Quick-Parser</h4>
            <div
              className={`p-8 border border-dashed rounded-2xl text-center cursor-pointer transition relative ${
                dragActive ? 'border-amber-400 bg-amber-500/5' : 'border-white/10 hover:border-amber-500/20 hover:bg-white/[0.01]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                const el = document.getElementById('drag-drop-file-picker');
                el?.click();
              }}
            >
              <input 
                id="drag-drop-file-picker" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setPosterUrl(reader.result);
                          setUploadSuccess(`Preloaded title metadata and uploaded poster image from: "${file.name}"!`);
                          setTimeout(() => setUploadSuccess(null), 3500);
                        }
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setUploadSuccess(`Preloaded title metadata from: "${file.name}"`);
                      setTimeout(() => setUploadSuccess(null), 3500);
                    }
                  }
                }} 
              />
              <Upload className="h-6 w-6 text-stone-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-stone-200">Drag & drop or Click to choose asset poster file</p>
              <p className="text-[10px] text-stone-500 mt-1 font-mono">JPG, PNG, or stream files are pre-loaded instantly with automatic label parsing.</p>
            </div>
          </div>

          {/* Compartment 2: Core Title Metadata */}
          <div className="bg-[#0b0e10]/40 p-6 rounded-3xl border border-white/[0.03] space-y-5">
            <h4 className="text-[11px] font-bold font-mono tracking-wider text-amber-500 uppercase">Step 2: Core Series Metadata</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Series Title (Primary)</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bleach: Thousand-Year Blood War"
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200 transition focus:bg-[#07090b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Alternative Title (Sub-hed)</label>
                <input
                  type="text"
                  value={altTitle}
                  onChange={(e) => setAltTitle(e.target.value)}
                  placeholder="e.g. Sennen Kessen-hen"
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200 transition focus:bg-[#07090b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Animation Studio</label>
                <input
                  type="text"
                  value={studio}
                  onChange={(e) => setStudio(e.target.value)}
                  placeholder="e.g. MAPPA / ufotable / Studio Pierrot"
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200 transition focus:bg-[#07090b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Author / Creator</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Tite Kubo"
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200 transition focus:bg-[#07090b]"
                />
              </div>
            </div>
          </div>

          {/* Compartment 3: Classification, Tiers & Schedule */}
          <div className="bg-[#0b0e10]/40 p-6 rounded-3xl border border-white/[0.03] space-y-5">
            <h4 className="text-[11px] font-bold font-mono tracking-wider text-amber-500 uppercase">Step 3: Access control, Status & Chapters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Origin Classify</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as any)}
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500/30 text-[#e0e0e0] font-sans"
                >
                  <option value="anime">Anime (Japanese Origin)</option>
                  <option value="donghua">Donghua (Chinese Cultivation)</option>
                  <option value="movie">Movie (Cinematic Feature)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Audience Classification</label>
                <select
                  value={isAdult ? 'adult' : 'normal'}
                  onChange={(e) => setIsAdult(e.target.value === 'adult')}
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500/30 text-[#e0e0e0] font-sans font-medium"
                >
                  <option value="normal">🟢 General Audience (All Ages)</option>
                  <option value="adult">🔴 Restricted 18+ Only (Violent / Mature)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pricing Access Tier</label>
                <select
                  value={isPremium ? 'premium' : 'free'}
                  onChange={(e) => setIsPremium(e.target.value === 'premium')}
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500/30 text-[#e0e0e0] font-sans font-medium"
                >
                  <option value="free">🟢 Free Content (Public)</option>
                  <option value="premium">👑 Premium Subscriber Exclusive</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Publish Release Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500/30 text-[#e0e0e0] font-sans"
                >
                  <option value="Ongoing">Ongoing Series</option>
                  <option value="Completed">Completed Releases</option>
                  <option value="Upcoming">Upcoming Calendar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Launch Date</label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Chapters</label>
                <input
                  type="number"
                  value={episodeCount}
                  onChange={(e) => setEpisodeCount(Number(e.target.value))}
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Episode Average Duration</label>
                <input
                  type="text"
                  value={duration}
                  placeholder="e.g. 24m or 1h 45m"
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Initial Rating score (1.0 - 10.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="10.0"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  placeholder="8.5"
                  className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* Compartment 4: Assets & Live Thumbnail Previews */}
          <div className="bg-[#0b0e10]/40 p-6 rounded-3xl border border-white/[0.03] space-y-5">
            <h4 className="text-[11px] font-bold font-mono tracking-wider text-amber-500 uppercase">Step 4: Image assets & Video Trailer</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left inputs */}
              <div className="lg:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Poster Cover Art URL</label>
                  <input
                    type="text"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#050708] border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none text-[#cccccc] focus:border-amber-500/30 transition mb-1"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-stone-500 font-mono">Alternative:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setPosterUrl(reader.result);
                              setUploadSuccess(`Uploaded poster image asset: ${file.name}`);
                              setTimeout(() => setUploadSuccess(null), 3550);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[9px] text-stone-400 file:bg-white/5 file:text-stone-300 file:border-white/10 file:rounded-md file:px-2 file:py-0.5 file:text-[8px] cursor-pointer hover:file:bg-white/15"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Landscape Banner backdrop URL</label>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#050708] border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none text-[#cccccc] focus:border-amber-500/30 transition mb-1"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-stone-500 font-mono">Alternative:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setBannerUrl(reader.result);
                              setUploadSuccess(`Uploaded landscape banner backdrop: ${file.name}`);
                              setTimeout(() => setUploadSuccess(null), 3550);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-[9px] text-stone-400 file:bg-white/5 file:text-stone-300 file:border-white/10 file:rounded-md file:px-2 file:py-0.5 file:text-[8px] cursor-pointer hover:file:bg-white/15"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Trailer YouTube / Vimeo Embed embed URL</label>
                  <input
                    type="text"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full bg-[#050708] border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500/30 text-stone-200"
                  />
                  <span className="text-[9px] text-stone-500 font-mono block mt-1">Accepts standard watch links or direct iframe code.</span>
                </div>
              </div>

              {/* Real-time Previews Sidebar Panel */}
              <div className="lg:col-span-4 p-4 rounded-2xl bg-black/60 border border-white/5 space-y-4 text-center">
                <span className="text-[9px] font-mono tracking-widest text-[#888888] uppercase block font-bold border-b border-white/5 pb-1.5">LIVE CARD PREVIEW</span>
                
                {/* Simulated Poster Card design */}
                <div className="aspect-[2/2.95] max-w-[140px] mx-auto rounded-xl border border-white/5 overflow-hidden shadow-2xl relative bg-[#090b0c] flex flex-col justify-end text-left select-none font-sans font-sans">
                  {posterUrl ? (
                    <img src={posterUrl} className="absolute inset-0 h-full w-full object-cover transition duration-300 animate-fade-in" alt="" />
                  ) : (
                    <div className="absolute inset-x-0 top-1/3 flex flex-col items-center text-stone-700">
                      <Film className="h-6 w-6 mb-1" />
                      <span className="text-[8px] font-mono uppercase">Poster Blank</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10 animate-fade-in" />
                  <div className="p-2.5 z-20 space-y-0.5">
                    <h5 className="text-[10px] font-bold text-white truncate max-w-[120px]">{title || 'Untitled Stream'}</h5>
                    <div className="flex justify-between items-center text-[7.5px] text-amber-400 font-mono">
                      <span>★ {rating ? rating.toFixed(1) : '8.5'}</span>
                      <span className="text-stone-500 truncate max-w-[60px]">{studio || 'Unknown studio'}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated landscape backdrop banner preview representation if exists */}
                {bannerUrl && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono text-stone-600 uppercase block">Backdrop Preview</span>
                    <div className="aspect-[21/9] w-full rounded-lg overflow-hidden border border-white/5 bg-zinc-950 relative">
                      <img src={bannerUrl} className="absolute inset-0 w-full h-full object-cover animate-fade-in" alt="" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compartment 5: Storyline Synopsis Description */}
          <div className="bg-[#0b0e10]/40 p-6 rounded-3xl border border-white/[0.03] space-y-4">
            <h4 className="text-[11px] font-bold font-mono tracking-wider text-amber-500 uppercase">Step 5: Storyline Description</h4>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Synopsis Story overview details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Write a captivating story hook about high cultivators, quiet shinobi blades, or unforgettable slice of life details..."
                className="w-full bg-[#050708] border border-white/10 focus:border-amber-500/30 rounded-2xl px-4 py-3 text-xs outline-none text-stone-250 leading-relaxed resize-none transition"
              />
            </div>
          </div>

          {/* Compartment 6: Catalog Genres Selector */}
          <div className="bg-[#0b0e10]/40 p-6 rounded-3xl border border-white/[0.03] space-y-5">
            <h4 className="text-[11px] font-bold font-mono tracking-wider text-amber-500 uppercase">Step 6: Genre Classification Category Tags</h4>
            
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Genres Selected ({selectedGenres.length})</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {GENRES.map(genre => (
                  <button
                    type="button"
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      selectedGenres.includes(genre)
                        ? 'bg-amber-500 border-transparent text-[#050708] font-bold'
                        : 'bg-white/[0.01] border-white/10 text-stone-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  id="custom-genre-input-field"
                  type="text"
                  placeholder="Type fully custom genre name... (e.g. Cultivation)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val && !selectedGenres.includes(val)) {
                        setSelectedGenres(prev => [...prev, val]);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  className="flex-1 bg-[#050708] border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-500/30 text-stone-250"
                />
                <button
                  type="button"
                  onClick={() => {
                    const inputEl = document.getElementById('custom-genre-input-field') as HTMLInputElement;
                    if (inputEl) {
                      const val = inputEl.value.trim();
                      if (val && !selectedGenres.includes(val)) {
                        setSelectedGenres(prev => [...prev, val]);
                        inputEl.value = '';
                      }
                    }
                  }}
                  className="px-4 py-2 bg-white/[0.05] border border-white/10 hover:bg-[#fafafa] hover:text-stone-900 transition text-stone-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Add Custom Tag
                </button>
              </div>

              {selectedGenres.some(g => !GENRES.includes(g)) && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider font-mono mr-1">Custom Tags Added:</span>
                  {selectedGenres.filter(g => !GENRES.includes(g)).map(g => (
                    <span key={g} className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-sans animate-fade-in">
                      {g}
                      <button 
                        type="button" 
                        onClick={() => setSelectedGenres(prev => prev.filter(item => item !== g))}
                        className="text-amber-555 hover:text-white font-extrabold text-sm ml-0.5 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="lg:px-8 px-6 py-3 bg-white text-stone-950 hover:bg-amber-400 hover:text-stone-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer flex items-center gap-2 uppercase tracking-wide animate-pulse"
            >
              <Check className="h-4 w-4" />
              Publish New Series Title
            </button>
          </div>
        </form>
      )}
      {/* ADD EPISODES TAB */}
      {activeTab === 'add-episode' && (
        <form onSubmit={handleAddEpisode} className="space-y-6 flex-1 max-w-4xl select-none">
          <div className="bg-[#0b0e10]/80 p-5 rounded-3xl border border-white/[0.03]">
            <h3 className="font-serif text-sm text-stone-100 font-normal">Episode Loader Module</h3>
            <p className="text-[10px] text-stone-500 font-sans mt-0.5">Toggle between unique episode logs and rapid batch lists.</p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsBulk(false)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${!isBulk ? 'bg-white border-white text-black' : 'bg-white/[0.01] border-white/15'}`}
              >
                Singular Release
              </button>
              <button
                type="button"
                onClick={() => setIsBulk(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${isBulk ? 'bg-white border-white text-black' : 'bg-white/[0.01] border-white/15'}`}
              >
                Bulk Queue Parser
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5 uppercase">Index Target Series</label>
            <select
              value={targetMediaId}
              onChange={(e) => setTargetMediaId(e.target.value)}
              className="w-full bg-[#0a0d0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-stone-300"
            >
              {allMedia.map(m => (
                <option key={m.id} value={m.id}>{m.title} ({m.type})</option>
              ))}
            </select>
          </div>

          {isBulk ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                  Episode Queues (Format: <code className="bg-[#050708] px-1.5 py-0.5 rounded text-stone-300 text-[10px]">EpisodeNumber || Title || EmbedURL</code>)
                </label>
                <textarea
                  value={bulkInputs}
                  onChange={(e) => setBulkInputs(e.target.value)}
                  rows={6}
                  placeholder="1 || Cruelty || https://www.dailymotion.com/embed/video/x8nc8t7&#10;2 || Training || https://www.dailymotion.com/embed/video/x8nclp3"
                  className="w-full bg-[#0a0d0e] border border-white/10 rounded-2xl p-4 text-xs font-mono outline-none focus:border-white/20 text-stone-300 leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5 uppercase">Chapter Number</label>
                <input
                  type="number"
                  value={epNumber}
                  onChange={(e) => setEpNumber(Number(e.target.value))}
                  className="w-full bg-[#0a0d0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5 uppercase">Episode Title</label>
                <input
                  type="text"
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  placeholder="e.g. Blade of Destruction"
                  className="w-full bg-[#0a0d0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5 uppercase">Embed stream URL</label>
                <input
                  type="text"
                  value={epVideoUrl}
                  onChange={(e) => setEpVideoUrl(e.target.value)}
                  placeholder="https://www.dailymotion.com/embed/video/..."
                  className="w-full bg-[#0a0d0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5 uppercase">Thumbnail cover url</label>
                <input
                  type="text"
                  value={epThumbnail}
                  onChange={(e) => setEpThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#0a0d0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5 uppercase">Episode Access Pricing</label>
                <select
                  value={epIsPremium ? 'paid' : 'free'}
                  onChange={(e) => setEpIsPremium(e.target.value === 'paid')}
                  className="w-full bg-[#0a0d0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-white/20 text-stone-300 font-medium"
                >
                  <option value="free">🟢 Free Episode (All viewers can watch)</option>
                  <option value="paid">👑 Premium Episode (Requires Active Subscription)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-3 bg-white text-black hover:bg-stone-200 text-xs font-semibold rounded-full transition"
          >
            {isBulk ? 'Launch Bulk Releases' : 'Register Singular Episode'}
          </button>
        </form>
      )}

      {/* MANAGEMENT INDEX TAB */}
      {activeTab === 'manage' && (() => {
        const filteredManageMedia = allMedia
          .filter(item => !deletedIds.includes(item.id))
          .filter(item => {
            const matchesSearch = !manageSearch.trim() || 
              item.title.toLowerCase().includes(manageSearch.toLowerCase()) || 
              (item.alternativeTitle && item.alternativeTitle.toLowerCase().includes(manageSearch.toLowerCase())) ||
              item.studio.toLowerCase().includes(manageSearch.toLowerCase());
            const matchesCategory = manageCategory === 'all' || item.type === manageCategory;
            return matchesSearch && matchesCategory;
          });

        return (
          <div className="space-y-6 flex-1 select-none animate-fade-in">
            <div className="bg-[#0b0e10]/60 p-6 rounded-3xl border border-white/[0.03] space-y-6">
              
              {/* Header and Filter Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
                <div>
                  <h3 className="font-serif text-sm text-stone-100 font-normal">Master Media Library</h3>
                  <p className="text-[10px] text-stone-500 mt-1 font-sans">
                    Showing {filteredManageMedia.length} of {allMedia.length} total available titles.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Real-time Dynamic Title Search Input */}
                  <div className="relative font-sans">
                    <input
                      type="text"
                      value={manageSearch}
                      onChange={(e) => setManageSearch(e.target.value)}
                      placeholder="Search series title, alt, or studio..."
                      className="w-full sm:w-64 bg-[#050708] border border-white/10 rounded-xl pl-3.5 pr-8 py-2 text-xs text-stone-300 outline-none focus:border-white/20 placeholder-stone-605 transition font-sans"
                    />
                    {manageSearch && (
                      <button 
                        type="button"
                        onClick={() => setManageSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-500 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Horizontal Segment Filter Buttons */}
                  <div className="flex items-center gap-1 bg-[#050708] p-1 border border-white/10 rounded-xl font-sans">
                    {(['all', 'anime', 'donghua', 'movie'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setManageCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition cursor-pointer ${
                          manageCategory === cat 
                            ? 'bg-white text-[#050708]' 
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredManageMedia.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 bg-white/[0.01] rounded-2xl font-sans">
                  <p className="text-xs text-stone-400">No available titles match your current criteria.</p>
                  <p className="text-[10px] text-stone-500 mt-1">Try resetting search filters or publishing a new series entry.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300 font-sans">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-[9px] font-semibold uppercase tracking-wider text-stone-500">
                        <th className="py-3 px-4">Poster</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Views</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {filteredManageMedia.map(item => (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition">
                          <td className="py-3 px-4">
                            <img src={item.posterUrl} className="h-10 w-8.5 rounded object-cover pointer-events-none" alt="" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-stone-200">{item.title}</span>
                              {item.isPremium ? (
                                <span className="text-[8px] bg-amber-500/10 border border-amber-500/25 text-amber-500 px-1.5 py-0.2 rounded font-sans font-extrabold uppercase [text-shadow:0_0_8px_rgba(245,158,11,0.2)]">Premium</span>
                              ) : (
                                <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.2 rounded font-sans font-bold uppercase">Free</span>
                              )}
                              {item.isAdult && (
                                <span className="text-[8px] bg-red-650 text-white px-1.5 py-0.2 rounded font-sans font-extrabold">18+</span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-500">{item.studio}</div>
                          </td>
                          <td className="py-3 px-4 uppercase text-[10px] tracking-wider text-stone-400">
                            {item.type}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-amber-400">
                            ★ {item.rating}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium font-mono ${item.status === 'Ongoing' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-500/10 text-stone-400'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-400">
                            {item.views.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 space-x-1.5 space-y-1.5">
                            <button
                              onClick={() => handleToggleFeature(item.id, !!item.featured)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-semibold border transition inline-block cursor-pointer ${item.featured ? 'bg-white text-black border-white' : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-stone-400'}`}
                            >
                              {item.featured ? 'Billboard Featured' : 'Billboard Regular'}
                            </button>
                            <button
                              onClick={() => handleTogglePremium(item.id, !!item.isPremium)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-semibold border transition inline-block cursor-pointer ${item.isPremium ? 'bg-amber-400 text-black border-amber-400 hover:bg-amber-300 font-extrabold' : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-stone-400'}`}
                            >
                              {item.isPremium ? '👑 Premium' : '🟢 Free'}
                            </button>
                            <button
                              onClick={() => startEditingMedia(item)}
                              className="px-2.5 py-1 rounded-full text-[9px] bg-amber-500/15 border border-amber-500/25 hover:bg-amber-500 hover:text-black text-amber-400 font-bold transition inline-block cursor-pointer"
                            >
                              ✏️ Edit Show & EP
                            </button>
                            <button
                              onClick={() => handleDeleteMedia(item.id, item.title)}
                              className="px-2.5 py-1 rounded-full text-[9px] bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-350 hover:border-rose-500 font-semibold transition inline-block cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* User Moderations */}
            <div className="bg-[#0b0e10]/60 p-6 rounded-3xl border border-white/[0.03] space-y-4">
              <div>
                <h3 className="font-serif text-sm text-stone-100 font-normal mb-1">Fan Account Control Desk</h3>
                <p className="text-[10px] text-stone-500">View logged-in profiles, configure ban status restrictions, or completely disable accounts to enforce access safety.</p>
              </div>

              {registeredUsers.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-white/5 bg-white/[0.01] rounded-2xl">
                  <p className="text-xs text-stone-400">No external profiles registered in database yet.</p>
                  <p className="text-[10px] text-stone-500 mt-1">Registers automatically when a client creates an account or completes a Google sign-in.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-[9px] font-semibold uppercase tracking-wider text-stone-500">
                        <th className="py-2.5 px-4">Profile Name</th>
                        <th className="py-2.5 px-4">Email Address</th>
                        <th className="py-2.5 px-4">Joined At</th>
                        <th className="py-2.5 px-4 text-center">Watchlist</th>
                        <th className="py-2.5 px-4 text-right">Moderations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {registeredUsers.map(usr => (
                        <tr key={usr.email} className="hover:bg-white/[0.01] transition">
                          <td className="py-3 px-4 flex items-center gap-2">
                            <img src={usr.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="h-6 w-6 rounded-full object-cover border border-white/10 shrink-0" alt="" />
                            <span className="font-semibold text-stone-200">{usr.displayName}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-stone-400">
                            {usr.email}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                            {usr.joinDate}
                          </td>
                          <td className="py-3 px-4 font-mono text-center text-stone-450">
                            {usr.watchlist?.length || 0} items
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleBanUserToggle(usr.email, !!usr.isBanned)}
                              type="button"
                              className={`px-3 py-1 rounded-full text-[9px] font-bold transition whitespace-nowrap cursor-pointer ${usr.isBanned ? 'bg-rose-500 text-white' : 'bg-[#050708] text-amber-400 border border-amber-500/10 hover:border-amber-500/30'}`}
                            >
                              {usr.isBanned ? 'Banned' : 'Ban User'}
                            </button>
                            <button
                              onClick={() => handleDisableUserToggle(usr.email, !!usr.isDisabled)}
                              type="button"
                              className={`px-3 py-1 rounded-full text-[9px] font-bold transition whitespace-nowrap cursor-pointer ${usr.isDisabled ? 'bg-orange-500 text-white animate-pulse' : 'bg-white/[0.02] text-stone-300 border border-white/10 hover:bg-white/[0.05]'}`}
                            >
                              {usr.isDisabled ? 'Disabled' : 'Disable Account'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* BROADCAST CUSTOM NOTIFICATION TAB */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 select-none">
          {/* Left Panel: Compose form */}
          <div className="lg:col-span-7 bg-[#0c0f11]/60 p-6 rounded-3xl border border-white/[0.04] space-y-6">
            <div>
              <h3 className="font-serif text-lg text-white font-normal mb-1 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-400" />
                Dispatch System Broadcast
              </h3>
              <p className="text-[11px] text-stone-400 tracking-wide font-sans">
                Issue system-wide notifications that immediately display in users' System Bulletins bell dropdown.
              </p>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              {/* Notif Title */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-bold block">
                  Bulletin Title
                </label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-stone-200 outline-none transition"
                  placeholder="e.g. Episode Released! or Server Maintenance Alert"
                />
              </div>

              {/* Notif Message */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-bold block">
                  Detailed Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-stone-250 outline-none transition resize-none leading-relaxed"
                  placeholder="Provide precise details for this bulletin message..."
                />
              </div>

              {/* Grid: Type & Linked Series */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Notification Type selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-bold block">
                    Alert Level
                  </label>
                  <select
                    value={notifType}
                    onChange={(e) => setNotifType(e.target.value)}
                    className="w-full bg-[#050708] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs text-stone-300 outline-none transition cursor-pointer"
                  >
                    <option value="system">⚠️ Standard System Release</option>
                    <option value="alert">🚨 Critical Warning Alert</option>
                    <option value="promo">🎁 Event Announcement</option>
                    <option value="news">📰 Otaku Community News</option>
                  </select>
                </div>

                {/* Linked Media selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-mono tracking-widest text-stone-400 uppercase font-bold block">
                    Associate with Series
                  </label>
                  <select
                    value={notifMediaId}
                    onChange={(e) => setNotifMediaId(e.target.value)}
                    className="w-full bg-[#050708] border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2.5 text-xs text-stone-300 outline-none transition cursor-pointer"
                  >
                    <option value="">Global (No direct series association)</option>
                    {allMedia.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit trigger button */}
              <div className="pt-2 border-t border-white/[0.03] flex items-center justify-between">
                <span className="text-[10px] text-stone-550 font-sans tracking-tight">
                  Dispatched items instantly update in live users' feeds.
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl transition duration-300 flex items-center gap-2 shadow cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  Broadcast Bulletin
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Interactive Smartphone Device Mockup and live rendering */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="text-center mb-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">Live Device Inspector</h4>
              <p className="text-[10px] text-stone-500 mt-1">Real-time mobile presentation rendering</p>
            </div>

            {/* Smartphone Case */}
            <div className="w-[300px] h-[520px] rounded-[48px] border-[6px] border-white/10 bg-[#07090b] shadow-2xl relative overflow-hidden flex flex-col p-4">
              {/* Dynamic Island Notch top bar */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-40 flex items-center justify-end pr-3">
                {/* Micro camera flash dot indicator */}
                <span className="h-1.5 w-1.5 rounded-full bg-blue-900/50" />
              </div>

              {/* Phone Status bar */}
              <div className="flex justify-between items-center text-[8px] font-mono text-stone-500 px-3 pt-1 pb-2.5 border-b border-white/[0.03] select-none">
                <span>06:02</span>
                <div className="flex items-center gap-1">
                  <Smartphone className="h-2.5 w-2.5 text-stone-500" />
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Interactive preview lockscreen wallpaper content */}
              <div className="flex-1 relative flex flex-col justify-start pt-12 p-1.5 items-center text-center">
                
                {/* Big Aesthetic clock display */}
                <div className="space-y-0.5 opacity-50 mb-8 self-center">
                  <h2 className="text-3xl font-serif text-white tracking-widest font-extralight select-none">06:02</h2>
                  <p className="text-[8px] font-mono uppercase tracking-widest text-stone-400">Thursday, June 11</p>
                </div>

                {/* Animated Liquid Custom Notification card render */}
                <div className="w-full space-y-2 text-left z-30 transition-all duration-350 transform scale-100">
                  {/* Dynamic Alert badge */}
                  <div className="bg-[#0e1215]/95 border border-white/10 p-3.5 rounded-2xl shadow-xl space-y-2 relative backdrop-blur-md">
                    {/* Glowing highlight indicator depending on Type */}
                    <div className={`absolute top-3.5 right-3.5 h-2 w-2 rounded-full ${
                      notifType === 'alert' ? 'bg-red-500 animate-ping' :
                      notifType === 'promo' ? 'bg-amber-400 animate-pulse' :
                      notifType === 'news' ? 'bg-blue-450 animate-pulse' :
                      'bg-emerald-500 animate-pulse'
                    }`} />

                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-center">
                        <span className="text-[9px] font-sans text-amber-500 font-extrabold">A</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono text-stone-500 tracking-wider block leading-none">ANIME STREAM</span>
                        <span className="text-[7px] text-stone-605 block mt-0.5 leading-none">Just Now</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-white/[0.04]">
                      <h4 className="text-[11px] font-bold text-stone-100 leading-snug truncate">
                        {notifTitle.trim() || "Release Bulletin Update"}
                      </h4>
                      <p className="text-[10px] text-stone-400 leading-relaxed font-sans line-clamp-3">
                        {notifMessage.trim() || "Type context in the compose form on the left side to observe lockscreen render live on this smartphone simulator."}
                      </p>
                    </div>

                    {/* Associated Media tag visual indicator */}
                    {notifMediaId && (
                      <div className="pt-1.5">
                        <span className="text-[7.5px] font-mono uppercase bg-white/5 border border-white/10 text-amber-400 px-1.5 py-0.5 rounded leading-none inline-block">
                          🔗 {allMedia.find(m => m.id === notifMediaId)?.title || "Associated Series"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Background shadow glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-[32px] pointer-events-none z-10" />
              </div>

              {/* Bottom Home indicator white bar */}
              <div className="absolute bottom-1.5 right-0 left-0 w-24 h-1 bg-white/30 rounded-full z-40 mx-auto" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 flex-1 text-left animate-fade-in font-sans">
          <div>
            <h2 className="text-xl font-serif text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              Comprehensive User Directory & Control Center
            </h2>
            <p className="text-stone-400 text-xs mt-1">
              Inspect registered viewer profiles, configure subscription plans, curate VIP badges, and set moderator roles.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Box: Active User List Search & selection */}
            <div className="lg:col-span-5 bg-[#0b0e10]/80 p-5 rounded-3xl border border-white/[0.03] space-y-4">
              <div className="flex items-center gap-2 bg-[#050708] border border-white/10 rounded-xl px-3 py-2">
                <span className="text-stone-500 text-xs">🔍</span>
                <input
                  type="text"
                  placeholder="Filter users by email or display name..."
                  value={usersSearchQuery}
                  onChange={(e) => setUsersSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-stone-200 placeholder-stone-600 w-full"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {(() => {
                  const filtered = registeredUsers.filter(usr => {
                    const q = usersSearchQuery.toLowerCase();
                    return (
                      (usr.email || '').toLowerCase().includes(q) ||
                      (usr.displayName || '').toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-10">
                        <p className="text-xs text-stone-500">No users match your filter criteria.</p>
                      </div>
                    );
                  }

                  return filtered.map((usr) => {
                    const isSelected = selectedUserDetail?.email === usr.email;
                    return (
                      <div
                        key={usr.email}
                        onClick={() => {
                          setSelectedUserDetail(usr);
                          setUserEditChanges({
                            displayName: usr.displayName || '',
                            avatarUrl: usr.avatarUrl || '',
                            isPremium: !!usr.isPremium,
                            subscriptionPlan: usr.subscriptionPlan || 'monthly',
                            badges: (usr.badges || []).join(', ')
                          });
                        }}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                            : 'bg-[#050708]/60 border-white/5 hover:border-white/10 hover:bg-[#050708]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 text-left">
                          <img
                            src={usr.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
                            alt=""
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-200 truncate">{usr.displayName || 'Anonymous'}</p>
                            <p className="text-[10px] text-stone-500 font-mono truncate">{usr.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                          {usr.isPremium ? (
                            <span className="text-[8px] bg-amber-500/10 border border-amber-500/35 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                              👑 Premium
                            </span>
                          ) : (
                            <span className="text-[8px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded font-normal uppercase">
                              Free User
                            </span>
                          )}
                          {usr.isBanned && (
                            <span className="text-[7.5px] bg-rose-500/20 border border-rose-500/40 text-rose-400 px-1 py-0.5 rounded font-semibold uppercase">
                              🚫 Banned
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Right Box: Selected User Full Details & Edit form */}
            <div className="lg:col-span-7 bg-[#0b0e10]/80 p-6 rounded-3xl border border-white/[0.03] min-h-[480px] flex flex-col justify-between">
              {selectedUserDetail ? (
                <div className="space-y-6">
                  {/* Selected User Header Card */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-4 text-left">
                      <img
                        src={selectedUserDetail.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        className="h-14 w-14 rounded-full object-cover border-2 border-amber-500/30 shrink-0"
                        alt=""
                      />
                      <div>
                        <h3 className="font-serif text-base text-stone-100">{selectedUserDetail.displayName}</h3>
                        <p className="text-[11px] text-stone-500 font-mono">{selectedUserDetail.email}</p>
                        <p className="text-[9px] text-stone-400 font-sans mt-0.5">Joined on {selectedUserDetail.joinDate || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                      {(selectedUserDetail.badges || []).map((badge: string, idx: number) => (
                        <span key={idx} className="text-[8.5px] bg-[#050708] text-stone-250 border border-white/10 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider font-mono">
                          🎖️ {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Watchlist & Favorites Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="bg-[#050708]/50 p-4 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-mono text-stone-400 block uppercase tracking-wider">User Watchlist Items ({selectedUserDetail.watchlist?.length || 0})</span>
                      <div className="mt-2 space-y-1 text-xs text-stone-300 max-h-24 overflow-y-auto">
                        {selectedUserDetail.watchlist && selectedUserDetail.watchlist.length > 0 ? (
                          selectedUserDetail.watchlist.map((mediaId: string) => {
                            const show = allMedia.find(m => m.id === mediaId);
                            return (
                              <div key={mediaId} className="truncate text-stone-300 font-medium">
                                • {show ? show.title : mediaId}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-stone-500 italic">No bookmarks configured.</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#050708]/50 p-4 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-mono text-stone-400 block uppercase tracking-wider">Starred Favorites ({selectedUserDetail.likes?.length || 0})</span>
                      <div className="mt-2 space-y-1 text-xs text-stone-300 max-h-24 overflow-y-auto">
                        {selectedUserDetail.likes && selectedUserDetail.likes.length > 0 ? (
                          selectedUserDetail.likes.map((mediaId: string) => {
                            const show = allMedia.find(m => m.id === mediaId);
                            return (
                              <div key={mediaId} className="truncate text-stone-350">
                                ❤️ {show ? show.title : mediaId}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-stone-500 italic">No ratings or likes recorded yet.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  {userEditChanges && (
                    <div className="space-y-4 bg-[#050708]/40 p-5 rounded-2xl border border-white/5 text-left">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500">Edit Profile & Subscription Parameters</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-1">Display Profile Name</label>
                          <input
                            type="text"
                            value={userEditChanges.displayName}
                            onChange={(e) => setUserEditChanges({ ...userEditChanges, displayName: e.target.value })}
                            className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none focus:border-white/20"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-1">Avatar Image URL</label>
                          <input
                            type="text"
                            value={userEditChanges.avatarUrl}
                            onChange={(e) => setUserEditChanges({ ...userEditChanges, avatarUrl: e.target.value })}
                            className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none focus:border-white/20"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-1">Subscription Class</label>
                          <select
                            value={userEditChanges.isPremium ? 'premium' : 'free'}
                            onChange={(e) => setUserEditChanges({ ...userEditChanges, isPremium: e.target.value === 'premium' })}
                            className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none focus:border-white/20 cursor-pointer"
                          >
                            <option value="free">Standard Account (Free)</option>
                            <option value="premium">👑 VIP Subscriber (Premium Active)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-1">Subscription Term Tier</label>
                          <select
                            value={userEditChanges.isPremium ? userEditChanges.subscriptionPlan : 'monthly'}
                            disabled={!userEditChanges.isPremium}
                            onChange={(e) => setUserEditChanges({ ...userEditChanges, subscriptionPlan: e.target.value as any })}
                            className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none focus:border-white/20 cursor-pointer disabled:opacity-40"
                          >
                            <option value="monthly">🌙 Monthly Subscription Term</option>
                            <option value="yearly">☀️ Annual Subscription Tier</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[9px] font-bold text-stone-400 uppercase mb-1">Curated Badges / Roles (Separate with commas)</label>
                          <input
                            type="text"
                            placeholder="e.g. VIP, Moderator, Contributor"
                            value={userEditChanges.badges}
                            onChange={(e) => setUserEditChanges({ ...userEditChanges, badges: e.target.value })}
                            className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none focus:border-white/20"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 gap-3 border-t border-white/[0.04]">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleBanUserToggle(selectedUserDetail.email, !!selectedUserDetail.isBanned)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition cursor-pointer ${
                              selectedUserDetail.isBanned
                                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                                : 'bg-red-950/45 border border-rose-550/20 text-rose-400 hover:bg-rose-900/30'
                            }`}
                          >
                            {selectedUserDetail.isBanned ? '🚫 Unban Member' : '🚫 Ban User'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDisableUserToggle(selectedUserDetail.email, !!selectedUserDetail.isDisabled)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition cursor-pointer ${
                              selectedUserDetail.isDisabled
                                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                : 'bg-orange-950/30 border border-orange-500/20 text-orange-450 hover:bg-orange-900/20'
                            }`}
                          >
                            {selectedUserDetail.isDisabled ? '🔓 Activate Account' : '🔒 Disable Account'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveUserProfileChanges(selectedUserDetail.email)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold rounded-xl text-[10px] flex items-center gap-1.5 shadow transition cursor-pointer ml-auto"
                        >
                          <Check className="h-3 w-3" />
                          Apply Account Edits
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                  <Users className="h-8 w-8 text-stone-500 mb-2.5 opacity-40 animate-pulse" />
                  <p className="text-xs text-stone-400 font-serif">No Selected Account Node</p>
                  <p className="text-[10px] text-stone-500 mt-1 max-w-sm leading-relaxed">
                    Select any signed-up customer from the directory list on the left to inspect, adjust subscription locks, customize loyalty badges, or ban accounts.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SERIES & EPISODES GENERAL EDIT DIALOG MODAL LAYOUT */}
      {editingMedia && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans text-stone-300">
          <div className="bg-[#0b0e10] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Header Sticky Container */}
            <div className="p-4 sm:p-6 border-b border-white/[0.06] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 bg-[#0b0e10]/95 backdrop-blur-md z-20">
              <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMedia(null);
                    onRefreshAll();
                  }}
                  className="p-2 hover:bg-white/5 border border-white/10 rounded-xl transition cursor-pointer text-stone-400 hover:text-white shrink-0"
                  title="Close and Cancel"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="text-left min-w-0">
                  <h3 className="font-sans text-sm sm:text-base font-extrabold text-white tracking-wide truncate">Edit: {editingMedia.title}</h3>
                  <p className="text-[9px] sm:text-[10px] text-amber-500 font-mono uppercase tracking-widest mt-0.5 truncate">Series & Episode Master Control Desk</p>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMedia(null);
                    onRefreshAll();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-300 rounded-xl text-xs font-semibold select-none cursor-pointer border border-white/10 transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateMediaDetails}
                  className="flex-1 sm:flex-none px-5 py-2 bg-amber-500 hover:bg-amber-400 text-[#050708] font-bold rounded-xl text-xs select-none cursor-pointer flex items-center justify-center gap-1.5 shadow shadow-amber-500/20 transition text-center"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Modal Body Scroll Container */}
            <div className="p-5 sm:p-6 space-y-8 overflow-y-visible">
              
              {/* SECTION A: SERIES METADATA FORMS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.04]">
                  <Settings className="h-4 w-4 text-amber-500" />
                  <h4 className="text-xs font-bold font-mono tracking-widest uppercase text-stone-300">Section 1: Series Metadata Settings</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Series Title</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Alternative Title</label>
                    <input
                      type="text"
                      value={editAltTitle}
                      onChange={(e) => setEditAltTitle(e.target.value)}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Origin Classify</label>
                    <select
                      value={editMediaType}
                      onChange={(e) => setEditMediaType(e.target.value as any)}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200 cursor-pointer"
                    >
                      <option value="anime">Anime (Japanese Origin)</option>
                      <option value="donghua">Donghua (Chinese Cultivation)</option>
                      <option value="movie">Movie (Cinematic Feature)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Audience Classification</label>
                    <select
                      value={editIsAdult ? 'adult' : 'normal'}
                      onChange={(e) => setEditIsAdult(e.target.value === 'adult')}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200 cursor-pointer"
                    >
                      <option value="normal">🟢 Normal Show (General Audience)</option>
                      <option value="adult">🔴 Adults Only Show (Restricted 18+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Pricing Category</label>
                    <select
                      value={editIsPremium ? 'premium' : 'free'}
                      onChange={(e) => setEditIsPremium(e.target.value === 'premium')}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200 cursor-pointer"
                    >
                      <option value="free">🟢 Free Content (Available to all users)</option>
                      <option value="premium">👑 Paid Exclusive (Available only to Premium Subscribers)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Animation Studio</label>
                    <input
                      type="text"
                      value={editStudio}
                      onChange={(e) => setEditStudio(e.target.value)}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Author</label>
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Release Schedule</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200 cursor-pointer"
                    >
                      <option value="Ongoing">Ongoing Casts</option>
                      <option value="Completed">Completed Releases</option>
                      <option value="Upcoming">Upcoming Calendar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Launch Date</label>
                    <input
                      type="date"
                      value={editReleaseDate}
                      onChange={(e) => setEditReleaseDate(e.target.value)}
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-left">
                    <div>
                      <label className="block text-[9px] font-bold text-stone-400 mb-1.5 uppercase tracking-tight">EP Count</label>
                      <input
                        type="number"
                        value={editEpisodeCount}
                        onChange={(e) => setEditEpisodeCount(Number(e.target.value))}
                        className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-stone-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-stone-400 mb-1.5 uppercase tracking-tight">EP Duration</label>
                      <input
                        type="text"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-stone-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-stone-400 mb-1.5 uppercase tracking-tight">Rating (1-10)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="10"
                        value={editRating}
                        onChange={(e) => setEditRating(Number(e.target.value))}
                        className="w-full bg-[#050708] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-stone-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Poster Image Link (URL)</label>
                    <input
                      type="text"
                      value={editPosterUrl}
                      onChange={(e) => setEditPosterUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">Landscape Banner Cover URL</label>
                    <input
                      type="text"
                      value={editBannerUrl}
                      onChange={(e) => setEditBannerUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider text-left">YouTube / Trailer Video URL Link</label>
                    <input
                      type="text"
                      value={editTrailerUrl}
                      onChange={(e) => setEditTrailerUrl(e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                      className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-200"
                    />
                  </div>


                </div>

                <div className="pt-2 text-left">
                  <label className="block text-[10px] font-bold text-stone-400 mb-2 uppercase tracking-wider">Series Classification Genres (Checkboxes)</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(genre => {
                      const isSel = editSelectedGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => {
                            if (isSel) {
                              setEditSelectedGenres(prev => prev.filter(g => g !== genre));
                            } else {
                              setEditSelectedGenres(prev => [...prev, genre]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer border ${
                            isSel
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                              : 'bg-white/[0.01] border-white/5 hover:border-white/15 text-stone-400'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider">Series Description Synopsis Overview</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-[#050708] border border-white/10 focus:border-white/20 rounded-xl px-4 py-2.5 text-xs outline-none text-stone-250 leading-relaxed resize-none"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUpdateMediaDetails}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    Save Series Metadata Setting changes
                  </button>
                </div>
              </div>


              {/* SECTION B: SERIES EPISODES INDEX & MANAGER */}
              <div className="space-y-4 pt-4 border-t border-white/[0.04] text-left">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-amber-500" />
                    <h4 className="text-xs font-bold font-mono tracking-widest uppercase text-stone-300">Section 2: Manage Series Episodes ({editingEpisodes.length})</h4>
                  </div>
                </div>

                {isFetchingEpisodes ? (
                  <div className="text-center py-6">
                    <span className="text-xs text-stone-500 font-mono">Fetching linked video nodes from database...</span>
                  </div>
                ) : editingEpisodes.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <p className="text-xs text-stone-400">No episodes uploaded for this series yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Active inline editor popup if clicked edit-mode */}
                    {editingEpisodeForm && (
                      <div className="bg-[#050708] border border-amber-500/30 p-4 rounded-2xl space-y-3.5 shadow-lg relative animate-fade-in text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                          <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">🛠️ Editing Episode: Ep. {editingEpisodeForm.episodeNumber}</span>
                          <button
                            type="button"
                            onClick={() => setEditingEpisodeForm(null)}
                            className="text-[10px] text-stone-500 hover:text-white"
                          >
                            Cancel ×
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider mb-1">Episode Number</label>
                            <input
                              type="number"
                              value={editingEpisodeForm.episodeNumber}
                              onChange={(e) => setEditingEpisodeForm({ ...editingEpisodeForm, episodeNumber: Number(e.target.value) })}
                              className="w-full bg-[#0c1012] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider mb-1">Episode Title</label>
                            <input
                              type="text"
                              value={editingEpisodeForm.title}
                              onChange={(e) => setEditingEpisodeForm({ ...editingEpisodeForm, title: e.target.value })}
                              className="w-full bg-[#0c1012] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider mb-1">Duration</label>
                            <input
                              type="text"
                              value={editingEpisodeForm.duration}
                              onChange={(e) => setEditingEpisodeForm({ ...editingEpisodeForm, duration: e.target.value })}
                              className="w-full bg-[#0c1012] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2 md:col-span-3">
                            <label className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider mb-1">Video Stream Link (URL or Embed Code)</label>
                            <input
                              type="text"
                              value={editingEpisodeForm.videoUrl}
                              onChange={(e) => setEditingEpisodeForm({ ...editingEpisodeForm, videoUrl: e.target.value })}
                              className="w-full bg-[#0c1012] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 outline-none font-mono text-[11px]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider mb-1">Thumbnail Preview URL</label>
                            <input
                              type="text"
                              value={editingEpisodeForm.thumbnail}
                              onChange={(e) => setEditingEpisodeForm({ ...editingEpisodeForm, thumbnail: e.target.value })}
                              className="w-full bg-[#0c1012] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-stone-205 outline-none font-sans"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider mb-1">Episode Lock Tier</label>
                            <select
                              value={editingEpisodeForm.isPremium ? 'premium' : 'free'}
                              onChange={(e) => setEditingEpisodeForm({ ...editingEpisodeForm, isPremium: e.target.value === 'premium' })}
                              className="w-full bg-[#0c1012] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 outline-none"
                            >
                              <option value="free">🟢 Free Episode</option>
                              <option value="premium">👑 Premium Exclusive</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
                          <button
                            type="button"
                            onClick={() => setEditingEpisodeForm(null)}
                            className="px-3.5 py-1.5 hover:bg-white/5 rounded-xl text-[10px] text-stone-400 hover:text-white transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEpisode(editingEpisodeForm.id, editingEpisodeForm)}
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-[#050708] font-bold rounded-xl text-[10px] transition cursor-pointer"
                          >
                            Save Episode Node changes
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {editingEpisodes.map((ep: any) => (
                        <div 
                          key={ep.id} 
                          className="bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-white/10 p-3 rounded-2xl flex gap-3.5 items-center transition select-none text-left"
                        >
                          <img 
                            src={ep.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'} 
                            className="h-14 w-24 rounded-lg object-cover pointer-events-none border border-white/10 shrink-0" 
                            alt="" 
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] text-amber-500 font-bold">EP {ep.episodeNumber}</span>
                              {ep.isPremium ? (
                                <span className="text-[7.5px] bg-amber-500/10 border border-amber-500/25 text-amber-500 px-1 py-0.1 rounded font-extrabold uppercase animate-pulse">Premium</span>
                              ) : (
                                <span className="text-[7.5px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1 py-0.1 rounded font-bold uppercase">Free</span>
                              )}
                            </div>
                            <h5 className="text-xs font-semibold text-stone-200 truncate mt-0.5">{ep.title}</h5>
                            <p className="text-[9px] font-mono text-stone-500 truncate mt-0.5">{ep.videoUrl || "No Link Configured"}</p>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingEpisodeForm(ep)}
                              className="p-1 px-2.5 bg-white/5 border border-white/10 hover:border-amber-500/30 hover:text-amber-500 text-[10px] font-bold rounded-lg transition text-stone-400 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                              className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-[10px] font-bold rounded-lg transition text-rose-450 cursor-pointer"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>


              {/* SECTION C: ADD DYNAMIC NEW EPISODE INLINE */}
              <div className="space-y-4 pt-4 border-t border-white/[0.04] text-left">
                <form onSubmit={handleAddNewEpisodeInEdit} className="space-y-4 bg-[#050708] border border-white/5 p-5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-emerald-405" />
                    <h5 className="text-[11px] font-mono font-bold tracking-wider uppercase text-emerald-400">+ Upload & Link New Episode Node</h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Episode Number</label>
                      <input
                        type="number"
                        required
                        value={newEpNumber}
                        onChange={(e) => {
                          setNewEpNumber(Number(e.target.value));
                          setNewEpTitle(`Episode ${e.target.value}`);
                        }}
                        className="w-full bg-[#0c1012] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Episode Title</label>
                      <input
                        type="text"
                        required
                        value={newEpTitle}
                        onChange={(e) => setNewEpTitle(e.target.value)}
                        className="w-full bg-[#0c1012] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none"
                        placeholder="Episode name..."
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Video link URL / embed link</label>
                      <input
                        type="text"
                        required
                        value={newEpVideoUrl}
                        onChange={(e) => setNewEpVideoUrl(e.target.value)}
                        className="w-full bg-[#0c1012] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none font-mono text-[11px]"
                        placeholder="https://www.dailymotion.com/embed/video/x8mveho"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Thumbnail Cover Preview Image URL</label>
                      <input
                        type="text"
                        value={newEpThumbnail}
                        onChange={(e) => setNewEpThumbnail(e.target.value)}
                        className="w-full bg-[#0c1012] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-205 outline-none"
                        placeholder="Paste image link URL or leave blank..."
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Lock/Premium Restriction Settings</label>
                      <select
                        value={newEpIsPremium ? 'premium' : 'free'}
                        onChange={(e) => setNewEpIsPremium(e.target.value === 'premium')}
                        className="w-full bg-[#0c1012] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none cursor-pointer"
                      >
                        <option value="free">🟢 Free Content</option>
                        <option value="premium">👑 Premium Exclusive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Add Episode Node to Series
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Bottom Footer block */}
            <div className="bg-[#0c0f11] px-5 py-4 border-t border-white/[0.06] flex justify-end gap-2 rounded-b-3xl">
              <button
                type="button"
                onClick={() => {
                  setEditingMedia(null);
                  onRefreshAll();
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-300 rounded-xl text-xs font-semibold select-none cursor-pointer border border-white/10 transition"
              >
                Close & Return
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
