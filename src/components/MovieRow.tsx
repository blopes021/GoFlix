import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './Skeleton';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
  isLoading?: boolean;
}

export const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onMovieClick, onPlay, isLoading }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!isLoading && movies.length === 0) return null;

  return (
    <div className="mb-12 relative group/row">
      <h2 className="text-2xl font-bold mb-6 px-4 md:px-8 flex items-center gap-3 text-text">
        {title}
        <span className="w-12 h-1 bg-brand rounded-full"></span>
      </h2>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full px-4 bg-gradient-to-r from-bg to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:block text-text"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div
          ref={rowRef}
          className="flex gap-4 md:gap-6 overflow-x-auto px-4 md:px-8 pb-4 no-scrollbar"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} />)
          ) : (
            movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={onMovieClick}
                onPlay={onPlay}
              />
            ))
          )}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full px-4 bg-gradient-to-l from-bg to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:block text-text"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
