import { MediaItem, Episode, Comment } from './types';

export const GENRES = [
  'Action',
  'Adventure',
  'Fantasy',
  'Xianxia (Cultivation)',
  'Wuxia (Martial Arts)',
  'Sci-Fi',
  'Comedy',
  'Drama',
  'Mystery',
  'Supernatural',
  'Cyberpunk',
  'Psychological',
  'Mecha'
];

export const DEFAULT_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'anime-kage',
    type: 'anime',
    title: 'The Quiet Blade',
    alternativeTitle: '流 Stream',
    description: 'A wandering swordsman returns to a city that has forgotten his name. Twelve nights, twelve quiet reckonings.',
    genres: ['Action', 'Drama', 'Fantasy', 'Supernatural'],
    studio: 'Stream Studio',
    author: 'Stream',
    status: 'Ongoing',
    releaseDate: '2026-06-11',
    episodesCount: 12,
    duration: '24m',
    rating: 9.9,
    views: 1850300,
    popularityRank: 1,
    trailerUrl: 'https://www.youtube.com/watch?v=VQGCKyvzIM4',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200',
    cast: [
      { id: 'c-1', name: 'Shinji Kage', role: 'The Swordsman' },
      { id: 'c-2', name: 'Ayame', role: 'The Silent Rogue' }
    ],
    featured: true,
    isTrending: true
  },
  {
    id: 'anime-pale-spring',
    type: 'anime',
    title: 'Pale Spring',
    alternativeTitle: 'Seishun',
    description: 'A pale girl under cherry blossoms. Memories float like petals under the gentle early spring sun, weaving a fragile, unforgettable story.',
    genres: ['Slice of Life', 'Drama', 'Comedy'],
    studio: 'Kyoto Films',
    author: 'Sakura Haru',
    status: 'Ongoing',
    releaseDate: '2026-04-06',
    episodesCount: 12,
    duration: '23m',
    rating: 9.6,
    views: 1245300,
    popularityRank: 2,
    trailerUrl: 'https://www.youtube.com/watch?v=O6ct08VzFmE',
    posterUrl: 'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200',
    cast: [
      { id: 'c-3', name: 'Mao', role: 'Haruka' },
      { id: 'c-4', name: 'Ren', role: 'Sora' }
    ],
    featured: false,
    isTrending: true
  },
  {
    id: 'anime-iron-halo',
    type: 'anime',
    title: 'Iron Halo',
    alternativeTitle: 'Hagane',
    description: 'Armored sentinels stand watch at the edge of the galaxy. A pilot finds hope in the cold steel of a mysterious prototype mecha designated Halo.',
    genres: ['Sci-Fi', 'Mecha', 'Action'],
    studio: 'Sunrise Co.',
    author: 'Gundam Devs',
    status: 'Completed',
    releaseDate: '2025-09-13',
    episodesCount: 10,
    duration: '25m',
    rating: 9.4,
    views: 890500,
    popularityRank: 3,
    trailerUrl: 'https://www.youtube.com/watch?v=JtqIas3bYhg',
    posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=1200',
    cast: [
      { id: 'c-5', name: 'Ken', role: 'Pilot Leo' },
      { id: 'c-6', name: 'Sari', role: 'AI Operator' }
    ],
    featured: false,
    isTrending: true
  },
  {
    id: 'donghua-1',
    type: 'donghua',
    title: 'Soul Land',
    alternativeTitle: 'Douluo Dalu',
    description: 'Tang San, one of the Tang Sect martial art clan\'s most prestigious disciples, commits an unforgivable crime by stealing secret teachings. Throwing himself off a mountain, he is reincarnated into the world of Douluo Dalu, a land where every individual possesses an innate spirit, some of which can be cultivated for power.',
    genres: ['Action', 'Fantasy', 'Xianxia (Cultivation)', 'Wuxia (Martial Arts)'],
    studio: 'Sparkly Key Animation',
    author: 'Tang Jia San Shao',
    status: 'Completed',
    releaseDate: '2018-01-20',
    episodesCount: 263,
    duration: '20m',
    rating: 9.4,
    views: 2450300,
    popularityRank: 4,
    trailerUrl: 'https://www.youtube.com/watch?v=XhbyY703Lms',
    posterUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=1200',
    cast: [
      { id: 'c-13', name: 'Zhong Yi', role: 'Tang San' },
      { id: 'c-14', name: 'Zhang Qi', role: 'Xiao Wu' }
    ],
    featured: false,
    isTrending: false
  },
  {
    id: 'donghua-2',
    type: 'donghua',
    title: 'Link Click',
    alternativeTitle: 'Shiguang Dailiren',
    description: 'Cheng Xiaoshi and Lu Guang run small photo shop called Time Photo Studio. Together, they use supernatural abilities to enter photos to deliver secret messages on behalf of their clients.',
    genres: ['Mystery', 'Drama', 'Supernatural', 'Psychological'],
    studio: 'Studio LAN',
    author: 'Li Haoling',
    status: 'Completed',
    releaseDate: '2021-04-30',
    episodesCount: 11,
    duration: '24m',
    rating: 9.7,
    views: 742000,
    popularityRank: 5,
    trailerUrl: 'https://www.youtube.com/watch?v=1F_U1_j0nsc',
    posterUrl: 'https://images.unsplash.com/photo-1547983371-243468410493?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1547983371-243468410493?q=80&w=1200',
    cast: [
      { id: 'c-17', name: 'Su Shangqing', role: 'Cheng Xiaoshi' }
    ],
    featured: false,
    isTrending: false
  },
  {
    id: 'donghua-3',
    type: 'donghua',
    title: 'Battle Through the Heavens',
    alternativeTitle: 'Doupo Cangqiong',
    description: 'In a land where power rules and the weak must obey, Xiao Yan, a child prodigy who suddenly lost his miraculous cultivation capabilities three years ago, must find the courage and strength to restore his family\'s honor and fulfill a promise to a powerful sect.',
    genres: ['Action', 'Fantasy', 'Xianxia (Cultivation)', 'Wuxia (Martial Arts)'],
    studio: 'Shanghai Foch Film',
    author: 'Tian Can Tu Dou',
    status: 'Ongoing',
    releaseDate: '2017-01-07',
    episodesCount: 120,
    duration: '22m',
    rating: 9.5,
    views: 1850200,
    popularityRank: 6,
    trailerUrl: 'https://www.youtube.com/watch?v=F_fD3lT7vJ0',
    posterUrl: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200',
    cast: [
      { id: 'c-20', name: 'Liu Sanmu', role: 'Xiao Yan' },
      { id: 'c-21', name: 'Cu Cu', role: 'Xun Er' },
      { id: 'c-22', name: 'Chen Yeting', role: 'Yao Lao' }
    ],
    featured: false,
    isTrending: true
  },
  {
    id: 'adult-the-boys',
    type: 'movie',
    title: 'The Boys',
    alternativeTitle: 'The Vought Heresy (18+)',
    description: 'An irreverent, blood-soaked take on what happens when superheroes—who are as popular as celebrities—abuse their superpowers. It is the Boys against the Seven, the corrupt Vought-sponsored super-group.',
    genres: ['Action', 'Drama', 'Sci-Fi', 'Thriller'],
    studio: 'Amazon Studios',
    author: 'Garth Ennis',
    status: 'Ongoing',
    releaseDate: '2019-07-26',
    episodesCount: 8,
    duration: '60m',
    rating: 9.8,
    views: 12500000,
    popularityRank: 10,
    trailerUrl: 'https://www.youtube.com/watch?v=M1bhOaLvC8Y',
    posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=1200',
    cast: [
      { id: 'ac-1', name: 'Billy Butcher', role: 'Leader' },
      { id: 'ac-2', name: 'Homelander', role: 'The Antagonist' }
    ],
    featured: false,
    isTrending: false,
    isAdult: true
  },
  {
    id: 'adult-invincible',
    type: 'anime',
    title: 'Invincible',
    alternativeTitle: 'Omni-Man Legacy (18+)',
    description: 'An adult animated superhero saga. When Mark Grayson inherits superpowers from his legendary father, he enters a world of brutal truths, planetary conspiracies, and life-altering family battles.',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    studio: 'Skybound Energy',
    author: 'Robert Kirkman',
    status: 'Completed',
    releaseDate: '2021-03-25',
    episodesCount: 8,
    duration: '45m',
    rating: 9.7,
    views: 9500000,
    popularityRank: 11,
    trailerUrl: 'https://www.youtube.com/watch?v=-bfAVpuko5E',
    posterUrl: 'https://images.unsplash.com/photo-1608889174637-3c44f6326f20?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1608889174637-3c44f6326f20?q=80&w=1200',
    cast: [
      { id: 'ac-3', name: 'Mark Grayson', role: 'Invincible' },
      { id: 'ac-4', name: 'Nolan Grayson', role: 'Omni-Man' }
    ],
    featured: false,
    isTrending: false,
    isAdult: true
  },
  {
    id: 'adult-cyberpunk',
    type: 'anime',
    title: 'Cyberpunk: Edgerunners',
    alternativeTitle: 'Edgerunners (18+)',
    description: 'A brilliant, hyper-stylized street kid attempts to survive in Night City—a body modification-obsessed metropolis. Having lost everything, he lives on the edge as an edgerunner mercenary.',
    genres: ['Action', 'Sci-Fi', 'Cyberpunk', 'Drama'],
    studio: 'Studio Trigger',
    author: 'CD Projekt Red',
    status: 'Completed',
    releaseDate: '2022-09-13',
    episodesCount: 10,
    duration: '24m',
    rating: 9.9,
    views: 19800000,
    popularityRank: 12,
    trailerUrl: 'https://www.youtube.com/watch?v=JtqIas3bYhg',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200',
    cast: [
      { id: 'ac-5', name: 'David Martinez', role: 'Edgerunner' },
      { id: 'ac-6', name: 'Lucy', role: 'Netrunner' }
    ],
    featured: false,
    isTrending: false,
    isAdult: true
  }
];

export const DEFAULT_EPISODES: Episode[] = [
  // The Quiet Blade Episodes
  {
    id: 'ep-ds-1',
    mediaId: 'anime-kage',
    episodeNumber: 1,
    title: 'Twelve Nights of Silence',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8nc8t7', // Dynamic dailymotion embed
    duration: '24m',
    subtitles: [
      { label: 'English', lang: 'en', src: '#' },
      { label: 'Español', lang: 'es', src: '#' },
      { label: 'Français', lang: 'fr', src: '#' }
    ]
  },
  {
    id: 'ep-ds-2',
    mediaId: 'anime-kage',
    episodeNumber: 2,
    title: 'The Wandering Swordsman',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8nclp3',
    duration: '23m',
    subtitles: [
      { label: 'English', lang: 'en', src: '#' },
      { label: 'Bahasa Indonesia', lang: 'id', src: '#' }
    ]
  },
  {
    id: 'ep-ds-3',
    mediaId: 'anime-kage',
    episodeNumber: 3,
    title: 'Reckonings Begin',
    thumbnail: 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8n797c',
    duration: '24m'
  },
  // Pale Spring Episodes
  {
    id: 'ep-jk-1',
    mediaId: 'anime-pale-spring',
    episodeNumber: 1,
    title: 'Cherry Blossom Shadows',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8mvehy',
    duration: '23m',
    subtitles: [{ label: 'English', lang: 'en', src: '#' }]
  },
  {
    id: 'ep-jk-2',
    mediaId: 'anime-pale-spring',
    episodeNumber: 2,
    title: 'A Fragile Secret',
    thumbnail: 'https://images.unsplash.com/photo-1547983371-243468410493?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8mvehz',
    duration: '23m'
  },
  // Soul Land Episodes
  {
    id: 'ep-sl-1',
    mediaId: 'donghua-1',
    episodeNumber: 1,
    title: 'Rebirth of Tang San',
    thumbnail: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8mveho',
    duration: '20m',
    subtitles: [
      { label: 'English', lang: 'en', src: '#' },
      { label: 'Chinese (Simplified)', lang: 'zh', src: '#' }
    ]
  },
  {
    id: 'ep-sl-2',
    mediaId: 'donghua-1',
    episodeNumber: 2,
    title: 'Twin Martial Spirits',
    thumbnail: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8mveh1',
    duration: '20m',
    subtitles: [
      { label: 'English', lang: 'en', src: '#' },
      { label: 'Chinese (Simplified)', lang: 'zh', src: '#' }
    ]
  },
  // Link Click Episodes
  {
    id: 'ep-lc-1',
    mediaId: 'donghua-2',
    episodeNumber: 1,
    title: 'Emiko\'s Secret recipe',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8mveh2',
    duration: '25m'
  },
  {
    id: 'ep-tb-1',
    mediaId: 'adult-the-boys',
    episodeNumber: 1,
    title: 'The Name of the Game',
    thumbnail: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8nc8t7',
    duration: '60m',
    subtitles: [{ label: 'English', lang: 'en', src: '#' }]
  },
  {
    id: 'ep-tb-2',
    mediaId: 'adult-the-boys',
    episodeNumber: 2,
    title: 'Cherry',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8nclp3',
    duration: '58m',
    subtitles: [{ label: 'English', lang: 'en', src: '#' }]
  },
  {
    id: 'ep-inv-1',
    mediaId: 'adult-invincible',
    episodeNumber: 1,
    title: 'Its About Time',
    thumbnail: 'https://images.unsplash.com/photo-1608889174637-3c44f6326f20?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8nclp3',
    duration: '45m',
    subtitles: [{ label: 'English', lang: 'en', src: '#' }]
  },
  {
    id: 'ep-inv-2',
    mediaId: 'adult-invincible',
    episodeNumber: 2,
    title: 'Here Goes Nothing',
    thumbnail: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8n797c',
    duration: '47m',
    subtitles: [{ label: 'English', lang: 'en', src: '#' }]
  },
  {
    id: 'ep-cp-1',
    mediaId: 'adult-cyberpunk',
    episodeNumber: 1,
    title: 'Let You Down',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8n797c',
    duration: '24m',
    subtitles: [{ label: 'English', lang: 'en', src: '#' }]
  },
  {
    id: 'ep-cp-2',
    mediaId: 'adult-cyberpunk',
    episodeNumber: 2,
    title: 'Like a Boy',
    thumbnail: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200',
    videoUrl: 'https://www.dailymotion.com/embed/video/x8mvehz',
    duration: '25m',
    subtitles: [{ label: 'English', lang: 'en', src: '#' }]
  }
];

export const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'com-1',
    mediaId: 'anime-kage',
    episodeId: 'ep-ds-1',
    userName: 'KageAppreciator',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    userBadge: 'Silent Watcher',
    text: 'Oh my god, the atmospheric shadow work for Kage under the city skyline is phenomenal. It captures the true meaning of wandering solitude.',
    rating: 5,
    likes: 42,
    likedBy: [],
    createdAt: '2026-06-10T12:00:00Z'
  },
  {
    id: 'com-2',
    mediaId: 'donghua-1',
    episodeId: 'ep-sl-1',
    userName: 'DaluCultivator',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    userBadge: 'Spiritual Elder',
    text: 'Soul Land donghua got me hooked on the cultivation genre. The progression of Tang San from a weak child to a god is the best thing ever!',
    rating: 5,
    likes: 28,
    likedBy: [],
    createdAt: '2026-06-09T08:30:00Z'
  },
  {
    id: 'com-3',
    mediaId: 'anime-pale-spring',
    episodeId: 'ep-jk-1',
    userName: 'SakuraVibe',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    userBadge: 'Cherry Blossom Patron',
    text: 'This visual aesthetic is pure high-art. The cherry blossoms and the soft twilight glow makes each slide look like a museum print. Instant 10/10.',
    rating: 5,
    likes: 19,
    likedBy: [],
    createdAt: '2026-06-11T01:00:00Z'
  }
];
