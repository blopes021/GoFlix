/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieRow } from './components/MovieRow';
import { MovieDetails } from './components/MovieDetails';
import { Player } from './components/Player';
import { Plans } from './components/Plans';
import { UserProfile } from './components/UserProfile';
import { LiveTV } from './components/LiveTV';
import { GamesCalendar } from './components/GamesCalendar';
import { CommunityFeed } from './components/CommunityFeed';
import { Rewards } from './components/Rewards';
import { RewardPlayerModal } from './components/RewardPlayerModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileSelector } from './components/ProfileSelector';
import { HeroSkeleton, MovieCardSkeleton, Skeleton } from './components/Skeleton';
import { Filters } from './components/Filters';
import { Settings, Plus, Play, Loader2 } from 'lucide-react';
import { Movie, View } from './types';
import { tmdbService } from './services/tmdbService';
import { monetagService } from './services/monetagService';
import { Helmet } from 'react-helmet-async';
import { auth, syncUserProfile, db, addToFavorites, removeFromFavorites, updateRecentlyWatched, handleFirestoreError, OperationType, getCustomHighlights, grantBadge, Profile, getProfiles } from './firebase';
import { collection, query, onSnapshot, orderBy, limit, where, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [myList, setMyList] = useState<Movie[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<Movie[]>([]);
  const [customHighlights, setCustomHighlights] = useState<Movie[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<Movie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [filteredContent, setFilteredContent] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedYear, setSelectedYear] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [movieToUnlock, setMovieToUnlock] = useState<Movie | null>(null);

  useEffect(() => {
    monetagService.initSmartTag();
    const fetchCustomHighlights = async () => {
      const highlights = await getCustomHighlights();
      if (highlights) setCustomHighlights(highlights);
    };
    fetchCustomHighlights();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        syncUserProfile(user);
        
        // Fetch profiles
        getProfiles(user.uid).then(setProfiles);

        // Listen to user profile for points/role
        const userUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (user.email === "fabricio.lopes.a@gmail.com") {
              data.role = 'admin';
            }
            setUserProfile(data);
          }
        });

        // Listen to profiles collection
        const profilesUnsub = onSnapshot(collection(db, 'users', user.uid, 'profiles'), (snapshot) => {
          const profilesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
          setProfiles(profilesData);
          
          // If active profile was deleted, reset it
          if (activeProfile && !profilesData.find(p => p.id === activeProfile.id)) {
            setActiveProfile(null);
          }
        });

        return () => {
          userUnsub();
          profilesUnsub();
        };
      } else {
        setUserProfile(null);
        setProfiles([]);
        setActiveProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Sync for Favorites
  useEffect(() => {
    if (!user || !activeProfile) {
      if (!user) {
        // Fallback to localStorage if not logged in
        const savedMyList = localStorage.getItem('myList');
        if (savedMyList) {
          try {
            setMyList(JSON.parse(savedMyList));
          } catch (e) {
            console.error('Failed to parse my list:', e);
          }
        } else {
          setMyList([]);
        }
      } else {
        setMyList([]);
      }
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'favorites'),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movies = snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as unknown as Movie[];
      setMyList(movies);
      localStorage.setItem('myList', JSON.stringify(movies));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/profiles/${activeProfile.id}/favorites`);
    });

    return () => unsubscribe();
  }, [user, activeProfile]);

  // Real-time Sync for Recently Watched
  useEffect(() => {
    if (!user || !activeProfile) {
      if (!user) {
        // Fallback to localStorage if not logged in
        const savedRecentlyWatched = localStorage.getItem('recentlyWatched');
        if (savedRecentlyWatched) {
          try {
            setRecentlyWatched(JSON.parse(savedRecentlyWatched));
          } catch (e) {
            console.error('Failed to parse recently watched:', e);
          }
        } else {
          setRecentlyWatched([]);
        }
      } else {
        setRecentlyWatched([]);
      }
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'recentlyWatched'),
      orderBy('lastWatched', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movies = snapshot.docs.map(doc => ({
        id: parseInt(doc.id),
        ...doc.data()
      })) as unknown as Movie[];
      setRecentlyWatched(movies);
      localStorage.setItem('recentlyWatched', JSON.stringify(movies));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/profiles/${activeProfile.id}/recentlyWatched`);
    });

    return () => unsubscribe();
  }, [user, activeProfile]);

  // Personalized Recommendations
  useEffect(() => {
    if (!user) {
      setRecommendedMovies([]);
      return;
    }

    const q = query(
      collection(db, 'ratings'),
      where('userId', '==', user.uid),
      where('rating', '>=', 4)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const preferredGenreIds = new Set<number>();
      
      // Get genres from high ratings
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.genreIds) {
          data.genreIds.forEach((id: number) => preferredGenreIds.add(id));
        }
      });

      // Also get genres from favorites
      myList.forEach(movie => {
        if (movie.genreIds) {
          movie.genreIds.forEach(id => preferredGenreIds.add(id));
        }
      });

      // Also get genres from recently watched
      recentlyWatched.forEach(movie => {
        if (movie.genreIds) {
          movie.genreIds.forEach(id => preferredGenreIds.add(id));
        }
      });

      if (preferredGenreIds.size > 0) {
        // Take top 3 genres to avoid too broad search
        const topGenres = Array.from(preferredGenreIds).slice(0, 3).join(',');
        try {
          // TMDB discover with multiple genres (comma separated is OR, pipe is AND)
          // We'll use the first one for now or a combined string if the API supports it
          const recommendations = await tmdbService.discoverByGenre('movie', parseInt(topGenres.split(',')[0]), 1, 'popularity.desc');
          setRecommendedMovies(recommendations.filter(m => !myList.some(fav => fav.id === m.id)));
        } catch (error) {
          console.error('Failed to fetch recommendations:', error);
        }
      } else {
        // Fallback to trending if no preferences
        setRecommendedMovies(trendingMovies.slice(5, 15));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'ratings');
    });

    return () => unsubscribe();
  }, [user, myList, recentlyWatched, trendingMovies]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [trending, popular, tv, movieGenres, tvGenres] = await Promise.all([
          tmdbService.getTrending(),
          tmdbService.getPopular(),
          tmdbService.getPopularTV(),
          tmdbService.getGenres('movie'),
          tmdbService.getGenres('tv')
        ]);
        
        if (trending.length === 0 && popular.length === 0 && tv.length === 0) {
          setError('TMDB_API_KEY_MISSING');
        }
        
        setTrendingMovies(trending);
        setPopularMovies(popular);
        setPopularTV(tv);

        // Combine genres and remove duplicates
        const allGenres = [...movieGenres, ...tvGenres];
        const uniqueGenres = Array.from(new Map(allGenres.map(item => [item.id, item])).values());
        setGenres(uniqueGenres);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        setError('FETCH_ERROR');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length > 2) {
        try {
          let results = await tmdbService.searchMovies(searchQuery);
          if (activeProfile?.isKids) {
            results = filterKidsContent(results);
          }
          setSearchResults(results);
        } catch (error) {
          console.error('Search failed:', error);
        }
      } else {
        setSearchResults([]);
      }
    };
    const timer = setTimeout(search, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (currentView === 'movies' || currentView === 'series') {
      setSelectedGenre(null);
      setSelectedYear('');
      setSortBy('popularity.desc');
      setFilteredContent([]);
      setPage(1);
      setHasMore(true);
    }
  }, [currentView]);

  useEffect(() => {
    const fetchContent = async () => {
      if (currentView !== 'movies' && currentView !== 'series') return;
      
      try {
        setIsLoadingMore(true);
        const type = currentView === 'movies' ? 'movie' : 'tv';
        let results = await tmdbService.discoverByGenre(type, selectedGenre, page, sortBy, selectedYear);

        if (activeProfile?.isKids) {
          results = filterKidsContent(results);
        }

        if (results.length < 20) setHasMore(false);
        
        if (page === 1) {
          setFilteredContent(results);
        } else {
          setFilteredContent(prev => [...prev, ...results]);
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setIsLoadingMore(false);
      }
    };
    fetchContent();
  }, [selectedGenre, selectedYear, currentView, page, sortBy]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
    setHasMore(true);
  };

  const handleGenreChange = (genreId: number | null) => {
    setSelectedGenre(genreId);
    setPage(1);
    setHasMore(true);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setPage(1);
    setHasMore(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const myListMovies = myList;

  const handleMovieClick = async (movie: Movie) => {
    setSelectedMovie(movie); // Show modal immediately with basic info
    try {
      // Fetch full details including cast
      const fullMovie = await tmdbService.getMovieDetails(movie.id, movie.mediaType);
      setSelectedMovie(fullMovie);
    } catch (error) {
      console.error('Failed to fetch movie details:', error);
      // We already set the basic info, so no need to do anything else
    }
  };

  const handlePlay = async (movie: Movie, season?: number, episode?: number) => {
    // Check if movie is already unlocked or if user is VIP
    const isUnlocked = recentlyWatched.some(m => m.id === movie.id);
    const isVip = userProfile?.vipUntil?.toDate() > new Date();

    const movieWithSelection = {
      ...movie,
      selectedSeason: season || 1,
      selectedEpisode: episode || 1
    };

    if (userProfile?.role === 'admin' || isVip || isUnlocked) {
      setPlayingMovie(movieWithSelection);
      setSelectedMovie(null);
      if (user && activeProfile) {
        updateRecentlyWatched(user.uid, activeProfile.id, movieWithSelection);
        
        // Grant "Primeiro Play" badge if it's the first movie
        if (recentlyWatched.length === 0) {
          await grantBadge(
            user.uid,
            'first-play',
            'Iniciante',
            '🎬',
            'Assistiu ao seu primeiro filme no GoFlix!'
          );
        }

        // Grant "Maratonista" badge if recentlyWatched has more than 10 items
        if (recentlyWatched.length >= 10) {
          await grantBadge(
            user.uid,
            'marathoner',
            'Maratonista',
            '🏃‍♂️',
            'Assistiu a mais de 10 títulos diferentes!'
          );
        }
      }
    } else {
      setMovieToUnlock(movieWithSelection);
      setIsRewardModalOpen(true);
    }
  };

  const handleUnlock = () => {
    console.log('Unlocking movie:', movieToUnlock?.title);
    if (movieToUnlock) {
      setPlayingMovie(movieToUnlock);
      
      if (user && activeProfile) {
        updateRecentlyWatched(user.uid, activeProfile.id, movieToUnlock);
      } else if (!user) {
        // Update recently watched in localStorage for guests
        setRecentlyWatched(prev => {
          const filtered = prev.filter(m => m.id !== movieToUnlock.id);
          const updated = [movieToUnlock, ...filtered].slice(0, 20);
          localStorage.setItem('recentlyWatched', JSON.stringify(updated));
          return updated;
        });
      }

      setMovieToUnlock(null);
      setIsRewardModalOpen(false);
      setSelectedMovie(null);
    }
  };

  const handleProgressUpdate = (progress: number) => {
    if (user && activeProfile && playingMovie) {
      updateRecentlyWatched(user.uid, activeProfile.id, playingMovie, progress);
    }
  };

  const handleNextEpisode = () => {
    if (playingMovie && playingMovie.mediaType === 'tv') {
      const currentEpisode = playingMovie.selectedEpisode || 1;
      handlePlay(playingMovie, playingMovie.selectedSeason, currentEpisode + 1);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setCurrentView('search');
    }
  };

  const toggleFavorite = (movie: Movie) => {
    if (user && activeProfile) {
      const isFavorite = myList.some(m => m.id === movie.id);
      if (isFavorite) {
        removeFromFavorites(user.uid, activeProfile.id, movie.id.toString());
      } else {
        addToFavorites(user.uid, activeProfile.id, movie);
      }
    } else if (!user) {
      // Guest mode: localStorage only
      setMyList(prev => {
        const isFavorite = prev.some(m => m.id === movie.id);
        const updated = isFavorite
          ? prev.filter(m => m.id !== movie.id)
          : [movie, ...prev];
        localStorage.setItem('myList', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const filterKidsContent = (movies: Movie[]) => {
    if (!activeProfile?.isKids) return movies;
    // Animation: 16, Family: 10751, Kids: 10762
    return movies.filter(m => 
      m.genreIds?.some(id => [16, 10751, 10762].includes(id)) ||
      m.genres?.some(g => ['Animation', 'Family', 'Kids', 'Animação', 'Família', 'Infantil'].includes(g))
    );
  };

  const kidsTrending = useMemo(() => filterKidsContent(trendingMovies), [trendingMovies, activeProfile]);
  const kidsPopular = useMemo(() => filterKidsContent(popularMovies), [popularMovies, activeProfile]);
  const kidsTV = useMemo(() => filterKidsContent(popularTV), [popularTV, activeProfile]);
  const kidsHighlights = useMemo(() => filterKidsContent(customHighlights), [customHighlights, activeProfile]);
  const kidsMyList = useMemo(() => filterKidsContent(myList), [myList, activeProfile]);
  const kidsRecent = useMemo(() => filterKidsContent(recentlyWatched), [recentlyWatched, activeProfile]);
  const kidsRecommended = useMemo(() => filterKidsContent(recommendedMovies), [recommendedMovies, activeProfile]);

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-brand selection:text-white transition-colors duration-300">
      <Navbar 
        currentView={currentView} 
        setView={setCurrentView} 
        onSearch={handleSearch}
        onMovieClick={handleMovieClick}
        theme={theme}
        toggleTheme={toggleTheme}
        activeProfile={activeProfile}
        onSwitchProfile={() => setActiveProfile(null)}
      />

      <main>
        {error === 'TMDB_API_KEY_MISSING' ? (
          <div className="h-screen flex flex-col items-center justify-center px-4 text-center">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-8 border border-border">
              <Settings className="w-10 h-10 text-brand" />
            </div>
            <h1 className="text-3xl font-black mb-4 text-text">Configuração Necessária</h1>
            <p className="text-text-muted max-w-md mb-8">
              Para carregar filmes reais, você precisa configurar sua chave da API do TMDB nos <strong>Secrets</strong> do AI Studio com o nome <code>TMDB_API_KEY</code>.
            </p>
            <a 
              href="https://www.themoviedb.org/settings/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-3 bg-brand text-white rounded-full font-bold hover:bg-brand/80 transition-all"
            >
              Obter Chave API
            </a>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentView === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isLoading ? (
                  <HeroSkeleton />
                ) : (
                  (kidsHighlights.length > 0 || kidsTrending.length > 0) && (
                    <Hero 
                      movies={kidsHighlights.length > 0 ? kidsHighlights : kidsTrending.slice(0, 5)} 
                      onPlay={handlePlay} 
                      onInfo={handleMovieClick} 
                    />
                  )
                )}
                
                <div className="relative z-10 -mt-24 pb-20">
                  {kidsHighlights.length > 0 && (
                    <MovieRow 
                      title="Destaques da Staff" 
                      movies={kidsHighlights} 
                      onMovieClick={handleMovieClick}
                      onPlay={handlePlay}
                    />
                  )}
                  {user && kidsRecommended.length > 0 && (
                    <MovieRow 
                      title="Recomendados para Você" 
                      movies={kidsRecommended} 
                      onMovieClick={handleMovieClick}
                      onPlay={handlePlay}
                      isLoading={isLoading}
                    />
                  )}
                  <MovieRow 
                    title="Continuar Assistindo" 
                    movies={kidsRecent} 
                    onMovieClick={handleMovieClick}
                    onPlay={handlePlay}
                    isLoading={isLoading}
                  />
                  <MovieRow 
                    title="Bombando Agora" 
                    movies={kidsTrending} 
                    onMovieClick={handleMovieClick}
                    onPlay={handlePlay}
                    isLoading={isLoading}
                  />
                  <MovieRow 
                    title="Populares no GoFlix" 
                    movies={kidsPopular} 
                    onMovieClick={handleMovieClick}
                    onPlay={handlePlay}
                    isLoading={isLoading}
                  />
                  <MovieRow 
                    title="Séries em Destaque" 
                    movies={kidsTV} 
                    onMovieClick={handleMovieClick}
                    onPlay={handlePlay}
                    isLoading={isLoading}
                  />
                </div>
              </motion.div>
            )}

            {currentView === 'profile' && (
              <UserProfile 
                onClose={() => setCurrentView('home')} 
                activeProfile={activeProfile}
                onSwitchProfile={() => {
                  setActiveProfile(null);
                  setCurrentView('home');
                }}
              />
            )}

            {(currentView === 'movies' || currentView === 'series') && (
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen pb-20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <h1 className="text-4xl font-black text-text">
                    {currentView === 'movies' ? 'Filmes' : 'Séries'}
                  </h1>
                </div>

                <Filters 
                  genres={genres}
                  selectedGenre={selectedGenre}
                  onGenreChange={handleGenreChange}
                  selectedYear={selectedYear}
                  onYearChange={handleYearChange}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                />
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {isLoadingMore && page === 1 ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="aspect-[2/3] space-y-3">
                        <div className="w-full h-full bg-surface-light animate-pulse rounded-xl" />
                      </div>
                    ))
                  ) : (
                    filteredContent.map(movie => (
                      <div 
                        key={`${currentView}-${movie.id}`} 
                        onClick={() => handleMovieClick(movie)}
                        className="aspect-[2/3] bg-surface rounded-xl overflow-hidden border border-border cursor-pointer group relative"
                      >
                        <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-lg">
                            <Plus className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {hasMore && (
                  <div className="mt-12 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-12 py-4 bg-surface border border-border text-text font-bold rounded-2xl hover:bg-bg transition-all disabled:opacity-50 flex items-center justify-center min-w-[200px]"
                    >
                      {isLoadingMore ? (
                        <Loader2 className="w-6 h-6 animate-spin text-brand" />
                      ) : (
                        'Carregar Mais'
                      )}
                    </button>
                  </div>
                )}

                {selectedGenre && filteredContent.length === 0 && !isLoadingMore && (
                  <div className="flex flex-col items-center justify-center py-40 text-center">
                    <p className="text-text-muted text-lg">Nenhum título encontrado para este gênero.</p>
                  </div>
                )}
              </motion.div>
            )}

            {currentView === 'my-list' && (
              <motion.div
                key="my-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen"
              >
                <h1 className="text-4xl font-black mb-12 text-text">Minha Lista</h1>
                
                {recentlyWatched.length > 0 && (
                  <div className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 text-text">Assistidos Recentemente</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {recentlyWatched.map(movie => (
                        <div 
                          key={`recent-${movie.id}`} 
                          onClick={() => handleMovieClick(movie)}
                          className="aspect-[2/3] bg-surface rounded-xl overflow-hidden border border-border cursor-pointer group"
                        >
                          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="text-2xl font-bold mb-6 text-text">Salvos para Depois</h2>
                {myListMovies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {myListMovies.map(movie => (
                      <div 
                        key={movie.id} 
                        onClick={() => handleMovieClick(movie)}
                        className="aspect-[2/3] bg-surface rounded-xl overflow-hidden border border-border cursor-pointer group"
                      >
                        <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 text-center">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6 border border-border">
                      <Plus className="w-10 h-10 text-text-muted" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-text">Sua lista está vazia</h2>
                    <p className="text-text-muted">Adicione filmes e séries para assistir mais tarde.</p>
                    <button 
                      onClick={() => setCurrentView('home')}
                      className="mt-8 px-8 py-3 bg-brand text-white rounded-full font-bold hover:bg-brand/80 transition-all"
                    >
                      Explorar Catálogo
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {currentView === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pt-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen"
              >
                <h1 className="text-2xl font-bold mb-8 text-text-muted">
                  Resultados para: <span className="text-text">"{searchQuery}"</span>
                </h1>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {searchQuery.length > 2 && searchResults.length === 0 ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="aspect-[2/3] space-y-3">
                        <Skeleton className="w-full h-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    ))
                  ) : searchResults.length > 0 ? (
                    searchResults.map(movie => (
                      <div 
                        key={movie.id} 
                        onClick={() => handleMovieClick(movie)}
                        className="cursor-pointer group"
                      >
                        <div className="aspect-[2/3] bg-surface rounded-xl overflow-hidden mb-3 border border-border group-hover:border-brand transition-colors">
                          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        </div>
                        <h3 className="font-bold text-sm line-clamp-1 text-text">{movie.title}</h3>
                        <p className="text-xs text-text-muted">{movie.year}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-40 text-center">
                      <p className="text-xl text-text-muted">Nenhum resultado encontrado para sua busca.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'live-tv' && (
              <motion.div
                key="live-tv"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <LiveTV />
              </motion.div>
            )}

            {currentView === 'games' && (
              <motion.div
                key="games"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <GamesCalendar />
              </motion.div>
            )}

            {currentView === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <CommunityFeed onMovieClick={(movieId) => {
                  tmdbService.getMovieDetails(movieId, 'movie').then(m => {
                    handleMovieClick(m);
                  });
                }} />
              </motion.div>
            )}

            {currentView === 'rewards' && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Rewards />
              </motion.div>
            )}

            {currentView === 'admin' && userProfile?.role === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <AdminDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Overlays */}
      <RewardPlayerModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        onUnlock={handleUnlock}
        movieTitle={movieToUnlock?.title || ''}
      />

      <MovieDetails 
        movie={selectedMovie} 
        onClose={() => setSelectedMovie(null)} 
        onPlay={handlePlay}
        isFavorite={selectedMovie ? myList.some(m => m.id === selectedMovie.id) : false}
        onToggleFavorite={toggleFavorite}
        onMovieClick={handleMovieClick}
      />

      {playingMovie && (
        <Player 
          movie={playingMovie} 
          onClose={() => setPlayingMovie(null)} 
          onProgress={handleProgressUpdate}
          onNextEpisode={handleNextEpisode}
        />
      )}

      {/* Footer */}
      <footer className="bg-bg border-t border-border py-20 px-4 md:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-xl font-black tracking-tighter text-text">
                GO<span className="text-brand">FLIX</span>
              </span>
            </div>
            <p className="text-text-muted text-sm leading-relaxed">
              A melhor experiência cinematográfica digital. Assista em qualquer lugar, a qualquer hora.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-text">Navegação</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><button onClick={() => setCurrentView('home')} className="hover:text-brand transition-colors">Início</button></li>
              <li><button onClick={() => setCurrentView('live-tv')} className="hover:text-brand transition-colors">TV ao Vivo</button></li>
              <li><button onClick={() => setCurrentView('games')} className="hover:text-brand transition-colors">Calendário de Jogos</button></li>
              <li><button onClick={() => setCurrentView('my-list')} className="hover:text-brand transition-colors">Minha Lista</button></li>
              <li><button onClick={() => setCurrentView('rewards')} className="hover:text-brand transition-colors">Recompensas</button></li>
              {userProfile?.role === 'admin' && (
                <li><button onClick={() => setCurrentView('admin')} className="text-brand font-bold hover:underline">Painel Admin</button></li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-text">Suporte</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><a href="#" className="hover:text-brand transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Privacidade</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-text">Redes Sociais</h4>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-brand hover:text-white transition-colors cursor-pointer text-text-muted hover:text-white">
                <span className="font-bold">In</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-brand hover:text-white transition-colors cursor-pointer text-text-muted hover:text-white">
                <span className="font-bold">Tw</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-brand hover:text-white transition-colors cursor-pointer text-text-muted hover:text-white">
                <span className="font-bold">Ig</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border text-center text-text-muted text-xs">
          © 2026 GoFlix.Space. Todos os direitos reservados.
        </div>
      </footer>

      {user && !activeProfile && (
        <ProfileSelector 
          userId={user.uid} 
          profiles={profiles} 
          onSelect={setActiveProfile} 
        />
      )}
    </div>
  );
}

