import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth, saveRating, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface RatingProps {
  movieId: string;
  movieTitle: string;
  genreIds?: number[];
  initialRating?: number;
}

export const Rating: React.FC<RatingProps> = ({ movieId, movieTitle, genreIds }) => {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [communityAverage, setCommunityAverage] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);

  // Fetch user's own rating and community average
  useEffect(() => {
    // Community average via top-level collection
    const q = query(collection(db, 'ratings'), where('movieId', '==', movieId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ratings = snapshot.docs.map(doc => doc.data().rating);
      if (ratings.length > 0) {
        const sum = ratings.reduce((a, b) => a + b, 0);
        setCommunityAverage(parseFloat((sum / ratings.length).toFixed(1)));
        setTotalRatings(ratings.length);
      } else {
        setCommunityAverage(null);
        setTotalRatings(0);
      }

      // Find current user's rating in the snapshot
      if (auth.currentUser) {
        const myRatingDoc = snapshot.docs.find(doc => doc.data().userId === auth.currentUser!.uid);
        if (myRatingDoc) {
          setUserRating(myRatingDoc.data().rating);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `ratings/${movieId}`);
    });

    return () => unsubscribe();
  }, [movieId]);

  const handleRate = async (rating: number) => {
    if (!auth.currentUser) return;
    setUserRating(rating);
    await saveRating(auth.currentUser.uid, movieId, rating, genreIds, movieTitle);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Sua Avaliação</h3>
        {communityAverage && (
          <div className="flex items-center gap-1.5 text-brand font-bold text-sm">
            <Star className="w-4 h-4 fill-current" />
            <span>{communityAverage}</span>
            <span className="text-text-muted font-normal text-xs">({totalRatings} votos)</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(null)}
            onClick={() => handleRate(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                (hoverRating !== null ? star <= hoverRating : star <= (userRating || 0))
                  ? 'text-yellow-500 fill-current'
                  : 'text-surface-light border-border'
              }`}
            />
          </motion.button>
        ))}
        {userRating && (
          <span className="ml-2 text-sm font-bold text-text">
            {userRating === 5 ? 'Excelente!' : userRating >= 4 ? 'Muito Bom' : userRating >= 3 ? 'Bom' : 'Regular'}
          </span>
        )}
      </div>
      {!auth.currentUser && (
        <p className="text-[10px] text-text-muted italic">Faça login para avaliar este título.</p>
      )}
    </div>
  );
};
