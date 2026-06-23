export type ContentType = 'anime' | 'donghua' | 'movie';

export interface CastMember {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
}

export interface SubtitleTrack {
  label: string;
  lang: string;
  src: string;
}

export interface Episode {
  id: string;
  mediaId: string; // references Anime/Donghua ID
  episodeNumber: number;
  title: string;
  thumbnail: string;
  videoUrl: string; // Dailymotion embed code or link or standard HLS/MP4
  duration: string;
  subtitles?: SubtitleTrack[];
  isPremium?: boolean; // True if premium exclusive
}

export interface MediaItem {
  id: string;
  type: ContentType;
  title: string;
  alternativeTitle?: string;
  description: string;
  genres: string[];
  studio: string;
  author?: string;
  status: 'Ongoing' | 'Completed' | 'Upcoming';
  releaseDate: string;
  episodesCount: number;
  duration: string;
  rating: number;
  views: number;
  popularityRank: number;
  trailerUrl?: string;
  posterUrl: string;
  bannerUrl: string;
  cast?: CastMember[];
  featured?: boolean;
  isTrending?: boolean;
  isAdult?: boolean;
  isPremium?: boolean; // True if premium exclusive
}

export interface Comment {
  id: string;
  mediaId: string;
  episodeId?: string;
  userName: string;
  userAvatar: string;
  userBadge?: string;
  text: string;
  rating?: number;
  likes: number;
  likedBy: string[]; // usernames or current emails
  createdAt: string;
}

export interface WatchProgress {
  mediaId: string;
  episodeId: string;
  episodeNumber: number;
  progress: number; // in seconds
  duration: number; // in seconds
  updatedAt: string;
}

export interface UserProfile {
  email: string;
  displayName: string;
  avatarUrl: string;
  joinDate: string;
  watchlist: string[]; // mediaIds
  likes: string[]; // mediaIds
  ratings: Record<string, number>; // mediaId -> score (1-5)
  badges: string[];
  achievements: {
    id: string;
    title: string;
    description: string;
    unlockedAt: string;
  }[];
  isBanned?: boolean;
  isPremium?: boolean; // subscription active
  subscriptionPlan?: 'monthly' | 'yearly';
  subscriptionExpiresAt?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'episode' | 'announcement' | 'system';
  mediaId?: string;
  createdAt: string;
  read?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalAnime: number;
  totalDonghua: number;
  totalEpisodes: number;
  totalViews: number;
  revenueEst: number;
}
