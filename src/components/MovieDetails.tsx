import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Check, Star, Clock, Calendar, Share2, Youtube, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie } from '../types';
import { reportIssue } from '../firebase';
import { PersonDetails } from './PersonDetails';
import { tmdbService } from '../services/tmdbService';
import { Skeleton } from './Skeleton';
import { Rating } from './Rating';
import { Reviews } from './Reviews';

interface MovieDetailsProps {
  movie: Movie | null;
  onClose: () => void;
  onPlay: (movie: Movie, season?: number, episode?: number) => void;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
  onMovieClick?: (movie: Movie) => void;
}

export const MovieDetails: React.FC<MovieDetailsProps> = ({ 
  movie, 
  onClose, 
  onPlay,
  isFavorite,
  onToggleFavorite,
  onMovieClick
}) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [similarContent, setSimilarContent] = useState<Movie[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (movie) {
      const fetchSimilar = async () => {
        setIsLoadingSimilar(true);
        const results = await tmdbService.getSimilarContent(movie.id, movie.mediaType);
        setSimilarContent(results);
        setIsLoadingSimilar(false);
      };
      fetchSimilar();
      
      if (movie.mediaType === 'tv') {
        fetchEpisodes(1);
      }

      // Reset states when movie changes
      setShowTrailer(false);
      setReported(false);
      setSelectedSeason(1);
    }
  }, [movie]);

  const fetchEpisodes = async (seasonNumber: number) => {
    if (!movie) return;
    setIsLoadingEpisodes(true);
    const data = await tmdbService.getTVSeasonDetails(movie.id, seasonNumber);
    if (data && data.episodes) {
      setEpisodes(data.episodes);
    }
    setIsLoadingEpisodes(false);
  };

  const handleSeasonChange = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    fetchEpisodes(seasonNumber);
  };

  const handleReport = async () => {
    if (!movie || reported) return;
    try {
      await reportIssue(movie.id, movie.title, movie.mediaType || 'movie');
      setReported(true);
      setTimeout(() => setReported(false), 3000);
    } catch (error) {
      console.error('Failed to report issue:', error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Assista ${movie.title} no GoFlix.Space`,
      text: movie.description,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback to clipboard if share fails or is cancelled
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (clipErr) {
        console.error('Clipboard error:', clipErr);
      }
    }
  };

  return (
    <AnimatePresence>
      {movie && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
        >
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-5xl bg-surface rounded-3xl overflow-hidden shadow-2xl border border-border"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-bg/50 backdrop-blur-md text-text hover:bg-brand hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
            {/* Left: Visuals */}
            <div className="md:w-1/2 relative min-h-[300px] md:min-h-full bg-black">
              {showTrailer && movie.trailerUrl ? (
                <div className="absolute inset-0 z-20">
                  <iframe
                    src={movie.trailerUrl}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={`${movie.title} Trailer`}
                  />
                  <button 
                    onClick={() => setShowTrailer(false)}
                    className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white hover:bg-brand transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <img
                    src={movie.backdropUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface/20 via-transparent to-transparent hidden md:block" />
                  
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-1 bg-brand text-white text-[10px] font-bold uppercase rounded tracking-wider">
                        HD / 4K
                      </span>
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        {movie.rating}
                      </div>
                    </div>
                    <h2 className="text-4xl font-black mb-6 text-text">{movie.title}</h2>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => onPlay(movie, movie.mediaType === 'tv' ? 1 : undefined, movie.mediaType === 'tv' ? 1 : undefined)}
                        className="flex items-center justify-center gap-2 bg-brand text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-brand/80 transition-all shadow-lg shadow-brand/20"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        Assistir Agora
                      </button>

                      {movie.trailerUrl && (
                        <button 
                          onClick={() => setShowTrailer(true)}
                          className="flex items-center gap-2 text-white bg-black/40 hover:bg-brand/80 backdrop-blur-md px-6 py-3.5 rounded-2xl text-sm font-bold transition-all border border-white/10"
                        >
                          <Youtube className="w-5 h-5" />
                          Trailer
                        </button>
                      )}

                      <button 
                        onClick={() => onToggleFavorite(movie)}
                        className={`p-3.5 rounded-2xl border transition-all backdrop-blur-md ${
                          isFavorite 
                            ? 'bg-brand border-brand text-white' 
                            : 'bg-black/40 border-white/10 text-white hover:bg-white/20'
                        }`}
                        title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                      >
                        {isFavorite ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </button>

                      <button 
                        onClick={async () => {
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: movie.title,
                                text: `Assista ${movie.title} no GoFlix!`,
                                url: window.location.href,
                              });
                            } catch (err) {
                              console.log('Error sharing:', err);
                            }
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copiado para a área de transferência!');
                          }
                        }}
                        className="p-3.5 rounded-2xl border border-white/10 bg-black/40 text-white hover:bg-white/20 transition-all backdrop-blur-md"
                        title="Compartilhar"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right: Info */}
            <div className="md:w-1/2 p-8 md:p-12">
              <div className="flex flex-wrap items-center gap-6 mb-8 text-text-muted text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {movie.year}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {movie.duration}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 border border-border rounded text-[10px] font-bold">16+</span>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-3">Sinopse</h3>
                <p className="text-text leading-relaxed text-lg">
                  {movie.description}
                </p>
              </div>

              <div className="mb-8">
                <Rating movieId={movie.id} movieTitle={movie.title} genreIds={movie.genreIds} />
              </div>

              <div className="mb-12">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-3">Gêneros</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(genre => (
                    <span key={genre} className="px-3 py-1 bg-surface border border-border rounded-full text-sm text-text">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {movie.mediaType === 'tv' && movie.seasons && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Episódios</h3>
                    <select 
                      value={selectedSeason}
                      onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                      className="bg-bg border border-border rounded-xl px-4 py-2 text-sm font-bold text-text outline-none focus:ring-2 focus:ring-brand/50"
                    >
                      {movie.seasons.map((s: any) => (
                        <option key={s.id} value={s.season_number}>
                          Temporada {s.season_number}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    {isLoadingEpisodes ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                      ))
                    ) : (
                      episodes.map((ep: any) => (
                        <div 
                          key={ep.id}
                          onClick={() => onPlay(movie, selectedSeason, ep.episode_number)}
                          className="flex items-center gap-4 p-3 bg-bg border border-border rounded-2xl hover:border-brand/50 transition-all group cursor-pointer"
                        >
                          <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 relative">
                            <img 
                              src={ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : movie.backdropUrl} 
                              alt={ep.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-black text-brand uppercase tracking-widest">E{ep.episode_number}</span>
                              <h4 className="font-bold text-text text-sm truncate">{ep.name}</h4>
                            </div>
                            <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed">
                              {ep.overview || 'Sem descrição disponível.'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-12">
                <Reviews movieId={movie.id} movieTitle={movie.title} />
              </div>

              {movie.cast.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-4">Elenco Principal</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {movie.cast.map(person => (
                      <div 
                        key={person.id} 
                        onClick={() => setSelectedPersonId(person.id)}
                        className="flex-none text-center cursor-pointer group"
                      >
                        <div className="relative w-16 h-16 mb-2">
                          <img 
                            src={person.imageUrl} 
                            alt={person.name} 
                            className="w-full h-full rounded-full object-cover border-2 border-border group-hover:border-brand transition-colors"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-brand/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs font-bold text-text line-clamp-1 w-16 group-hover:text-brand transition-colors">{person.name}</p>
                        <p className="text-[10px] text-text-muted line-clamp-1 w-16">{person.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(isLoadingSimilar || similarContent.length > 0) && (
                <div className="mb-8">
                  <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-4">Títulos Semelhantes</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {isLoadingSimilar ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[2/3]" />
                      ))
                    ) : (
                      similarContent.slice(0, 6).map(m => (
                        <div 
                          key={m.id} 
                          onClick={() => onMovieClick?.(m)}
                          className="aspect-[2/3] bg-surface-light rounded-xl overflow-hidden border border-border cursor-pointer group relative"
                        >
                          <img 
                            src={m.posterUrl} 
                            alt={m.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <p className="text-[10px] font-bold text-white text-center px-2">{m.title}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 mt-auto pt-8 border-t border-border">
                <button 
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl bg-surface border border-border text-text hover:text-brand hover:border-brand/50 transition-all group"
                  title="Compartilhar"
                >
                  <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">Compartilhar</span>
                  <AnimatePresence>
                    {copied && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -40, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-brand text-white text-[10px] font-bold rounded-full whitespace-nowrap shadow-lg shadow-brand/20"
                      >
                        Link Copiado!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>

                <button 
                  onClick={handleReport}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                    reported 
                      ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                      : 'bg-surface border-border text-text-muted hover:text-red-500 hover:border-red-500/50'
                  }`}
                  title="Reportar problema com o vídeo"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold">{reported ? 'Relatado' : 'Problemas?'}</span>
                  <AnimatePresence>
                    {reported && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -40, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap shadow-lg shadow-green-500/20"
                      >
                        Relatado ao Admin!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <PersonDetails 
          personId={selectedPersonId} 
          onClose={() => setSelectedPersonId(null)}
          onMovieClick={(m) => {
            setSelectedPersonId(null);
            if (onMovieClick) {
              onMovieClick(m);
            } else {
              onClose();
            }
          }}
        />
      </motion.div>
        )}
      </AnimatePresence>
    );
  };
