import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Heart, TrendingUp, Users, Clock, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'review' | 'rating';
  userId: string;
  userName: string;
  userPhoto?: string;
  movieId: string;
  movieTitle: string;
  content?: string;
  rating?: number;
  likes?: number;
  timestamp: any;
}

export const CommunityFeed: React.FC<{ onMovieClick: (movieId: string) => void }> = ({ onMovieClick }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to recent reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const ratingsQuery = query(
      collection(db, 'ratings'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'review' as const,
        ...doc.data()
      })) as Activity[];
      
      updateActivities(reviewActivities, 'review');
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reviews'));

    const unsubRatings = onSnapshot(ratingsQuery, (snapshot) => {
      const ratingActivities = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'rating' as const,
        ...doc.data()
      })) as Activity[];

      updateActivities(ratingActivities, 'rating');
    }, (error) => handleFirestoreError(error, OperationType.GET, 'ratings'));

    const updateActivities = (newItems: Activity[], type: 'review' | 'rating') => {
      setActivities(prev => {
        const filtered = prev.filter(a => a.type !== type);
        const combined = [...filtered, ...newItems].sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
        });
        return combined.slice(0, 20);
      });
      setIsLoading(false);
    };

    return () => {
      unsubReviews();
      unsubRatings();
    };
  }, []);

  return (
    <div className="pt-32 px-4 md:px-8 max-w-4xl mx-auto min-h-screen pb-20">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-text">Comunidade</h1>
          <p className="text-text-muted">Veja o que está acontecendo agora no GoFlix.</p>
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 hover:border-brand/30 transition-all group"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-bg border border-border flex items-center justify-center overflow-hidden">
                    {activity.userPhoto ? (
                      <img src={activity.userPhoto} alt={activity.userName} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-6 h-6 text-text-muted" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-text truncate">
                      {activity.userName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      {activity.timestamp && formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>

                  <p className="text-sm text-text-muted mb-4">
                    {activity.type === 'review' ? (
                      <>escreveu uma crítica para <span className="text-text font-bold cursor-pointer hover:text-brand transition-colors" onClick={() => onMovieClick(activity.movieId)}>{activity.movieTitle}</span></>
                    ) : (
                      <>avaliou <span className="text-text font-bold cursor-pointer hover:text-brand transition-colors" onClick={() => onMovieClick(activity.movieId)}>{activity.movieTitle}</span> com {activity.rating} estrelas</>
                    )}
                  </p>

                  {activity.type === 'review' && activity.content && (
                    <div className="bg-bg/50 border border-border rounded-2xl p-4 mb-4 relative">
                      <MessageSquare className="absolute -top-2 -left-2 w-5 h-5 text-brand/20" />
                      <p className="text-sm text-text italic line-clamp-3">"{activity.content}"</p>
                    </div>
                  )}

                  {activity.type === 'rating' && activity.rating && (
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= activity.rating! ? 'text-yellow-500 fill-current' : 'text-text-muted/20'}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => onMovieClick(activity.movieId)}
                      className="flex items-center gap-2 text-xs font-bold text-brand hover:underline"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Ver Título
                    </button>
                    {activity.type === 'review' && (
                      <div className="flex items-center gap-1 text-xs text-text-muted font-bold">
                        <Heart className="w-3 h-3 text-brand" />
                        {activity.likes || 0} curtidas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <TrendingUp className="w-12 h-12 text-text-muted/20 mb-4" />
            <h3 className="text-xl font-bold text-text">Silêncio na sala...</h3>
            <p className="text-text-muted">Ainda não há atividades recentes na comunidade.</p>
          </div>
        )}
      </div>
    </div>
  );
};
