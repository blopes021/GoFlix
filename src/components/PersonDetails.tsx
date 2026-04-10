import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { tmdbService } from '../services/tmdbService';
import { Movie } from '../types';
import { Skeleton } from './Skeleton';

interface PersonDetailsProps {
  personId: string | null;
  onClose: () => void;
  onMovieClick: (movie: Movie) => void;
}

export const PersonDetails: React.FC<PersonDetailsProps> = ({ personId, onClose, onMovieClick }) => {
  const [person, setPerson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (personId) {
      const fetchDetails = async () => {
        setIsLoading(true);
        const data = await tmdbService.getPersonDetails(personId);
        setPerson(data);
        setIsLoading(false);
      };
      fetchDetails();
    } else {
      setPerson(null);
    }
  }, [personId]);

  if (!personId) return null;

  return (
    <AnimatePresence>
      {personId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8"
        >
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-surface rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col md:flex-row max-h-[90vh]"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 rounded-full bg-bg/50 backdrop-blur-md text-text hover:bg-brand hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {isLoading ? (
              <div className="flex flex-col md:flex-row w-full h-full">
                <Skeleton className="md:w-1/3 h-[400px] md:h-auto rounded-none" />
                <div className="md:w-2/3 p-8 md:p-12 space-y-6">
                  <Skeleton className="h-12 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <div className="pt-8 grid grid-cols-3 gap-4">
                    <Skeleton className="aspect-[2/3]" />
                    <Skeleton className="aspect-[2/3]" />
                    <Skeleton className="aspect-[2/3]" />
                  </div>
                </div>
              </div>
            ) : person ? (
              <>
                {/* Left: Image */}
                <div className="md:w-1/3 relative bg-black">
                  <img
                    src={person.profileUrl}
                    alt={person.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                </div>

                {/* Right: Info */}
                <div className="md:w-2/3 p-8 md:p-12 overflow-y-auto">
                  <h2 className="text-4xl font-black mb-6 text-text">{person.name}</h2>
                  
                  <div className="flex flex-wrap items-center gap-6 mb-8 text-text-muted text-sm">
                    {person.birthday && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(person.birthday).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {person.placeOfBirth && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {person.placeOfBirth}
                      </div>
                    )}
                  </div>

                  {person.biography && (
                    <div className="mb-8">
                      <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-3">Biografia</h3>
                      <p className="text-text leading-relaxed text-sm line-clamp-6 hover:line-clamp-none transition-all cursor-pointer">
                        {person.biography}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-4">Conhecido por</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {person.knownFor.map((movie: Movie) => (
                        <div 
                          key={movie.id} 
                          onClick={() => onMovieClick(movie)}
                          className="cursor-pointer group"
                        >
                          <div className="aspect-[2/3] bg-surface rounded-xl overflow-hidden mb-2 border border-border group-hover:border-brand transition-colors">
                            <img 
                              src={movie.posterUrl} 
                              alt={movie.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <p className="text-[10px] font-bold text-text line-clamp-1">{movie.title}</p>
                          <div className="flex items-center gap-1 text-[8px] text-yellow-500">
                            <Star className="w-2 h-2 fill-current" />
                            {movie.rating}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center text-text-muted">
                Não foi possível carregar os detalhes.
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
