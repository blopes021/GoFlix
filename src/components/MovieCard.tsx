import React from 'react';
import { Play, Plus, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onPlay: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, onPlay }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative flex-none w-48 md:w-64 group cursor-pointer"
      onClick={() => onClick(movie)}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPlay(movie);
              }}
              className="w-10 h-10 bg-brand rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
            >
              <Play className="w-5 h-5 text-white fill-current" />
            </button>
            <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <h3 className="text-white font-bold text-sm md:text-base line-clamp-1 mb-1">
            {movie.title}
          </h3>
          
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-200">
            <span className="flex items-center gap-1 text-yellow-400">
              <Star className="w-3 h-3 fill-current" />
              {movie.rating}
            </span>
            <span>{movie.year}</span>
            <span className="px-1 border border-white/30 rounded text-[8px]">4K</span>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {movie.isTrending && (
            <span className="bg-brand text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Trending
            </span>
          )}
          {movie.isNew && (
            <span className="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Novo
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {movie.progress !== undefined && movie.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-brand" 
              style={{ width: `${movie.progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
