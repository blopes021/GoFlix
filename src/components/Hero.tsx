import React, { useState, useEffect, useCallback } from 'react';
import { Play, Info, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Movie } from '../types';

interface HeroProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onInfo: (movie: Movie) => void;
}

export const Hero: React.FC<HeroProps> = ({ movies, onPlay, onInfo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
  }, [movies.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentIndex];

  return (
    <div 
      className="relative h-[85vh] w-full overflow-hidden group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={currentMovie.backdropUrl}
              alt={currentMovie.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-end pb-48">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-brand text-white text-[10px] font-bold uppercase rounded tracking-wider">
                  Destaque
                </span>
                <span className="text-text-muted text-sm font-medium">
                  {currentMovie.year} • {currentMovie.duration || 'N/A'} • {currentMovie.genres.join(', ')}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight text-text">
                {currentMovie.title}
              </h1>

              <p className="text-lg text-text-muted mb-8 line-clamp-3 leading-relaxed">
                {currentMovie.description}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onPlay(currentMovie)}
                  className="flex items-center gap-2 bg-text text-bg px-8 py-3 rounded-full font-bold hover:bg-brand hover:text-white transition-all transform hover:scale-105 shadow-xl shadow-brand/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Assistir Agora
                </button>
                <button
                  onClick={() => onInfo(currentMovie)}
                  className="flex items-center gap-2 bg-surface/50 backdrop-blur-md text-text px-8 py-3 rounded-full font-bold hover:bg-surface transition-all border border-border"
                >
                  <Info className="w-5 h-5" />
                  Mais Informações
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="absolute inset-x-0 bottom-12 z-20 flex items-center justify-center gap-3">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 transition-all rounded-full ${
              index === currentIndex ? 'w-8 bg-brand' : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Side Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};
