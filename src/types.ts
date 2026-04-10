export interface Movie {
  id: string;
  title: string;
  description: string;
  rating: number;
  year: number;
  duration: string;
  genres: string[];
  genreIds?: number[];
  posterUrl: string;
  backdropUrl: string;
  cast: CastMember[];
  isTrending?: boolean;
  isNew?: boolean;
  mediaType?: 'movie' | 'tv';
  trailerUrl?: string;
  imdbId?: string;
  seasons?: any[];
  selectedSeason?: number;
  selectedEpisode?: number;
  progress?: number;
}

export interface CastMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export interface Game {
  id: string;
  title: string;
  image: string;
  league: string;
  startTime: number;
  endTime: number;
  homeTeam: { name: string; image: string };
  awayTeam: { name: string; image: string };
  players: string[];
}

export interface TVChannel {
  id: string;
  name: string;
  category: string;
  url: string;
  logo?: string;
  epg?: {
    title: string;
    desc: string;
    start_date: string;
  };
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt: any;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  points: number;
  badges?: Badge[];
}

export type View = 'home' | 'my-list' | 'search' | 'player' | 'movies' | 'series' | 'profile' | 'live-tv' | 'games' | 'community' | 'rewards' | 'admin';
