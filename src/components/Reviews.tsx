import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Send, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, saveReview, toggleReviewLike, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  movieId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  timestamp: any;
  likes: number;
}

interface ReviewsProps {
  movieId: string;
  movieTitle: string;
}

export const Reviews: React.FC<ReviewsProps> = ({ movieId, movieTitle }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [newReview, setNewReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('movieId', '==', movieId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(fetchedReviews);

      // Fetch like status for each review if user is logged in
      if (auth.currentUser) {
        fetchedReviews.forEach(review => {
          const likeDocRef = doc(db, 'reviews', review.id, 'likes', auth.currentUser!.uid);
          getDoc(likeDocRef).then(docSnap => {
            setUserLikes(prev => ({ ...prev, [review.id]: docSnap.exists() }));
          });
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `reviews/${movieId}`);
    });

    return () => unsubscribe();
  }, [movieId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !auth.currentUser) return;

    setIsSubmitting(true);
    try {
      await saveReview(movieId, movieTitle, newReview.trim());
      setNewReview('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeToggle = async (reviewId: string, currentLikes: number) => {
    if (!auth.currentUser) return;
    const isLiked = userLikes[reviewId] || false;
    
    // Optimistic update
    setUserLikes(prev => ({ ...prev, [reviewId]: !isLiked }));
    
    await toggleReviewLike(reviewId, currentLikes, isLiked);
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-text">Comentários</h3>
          <p className="text-sm text-text-muted">{reviews.length} opiniões da comunidade</p>
        </div>
      </div>

      {auth.currentUser ? (
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="O que você achou deste título?"
            className="w-full bg-surface border border-border rounded-2xl p-4 pr-16 text-text focus:outline-none focus:ring-2 focus:ring-brand/50 min-h-[100px] transition-all"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newReview.trim()}
            className="absolute bottom-4 right-4 p-3 bg-brand text-white rounded-xl hover:bg-brand/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      ) : (
        <div className="p-6 bg-surface border border-border border-dashed rounded-2xl text-center">
          <p className="text-text-muted">Faça login para compartilhar sua opinião.</p>
        </div>
      )}

      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface/50 border border-border rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface border border-border overflow-hidden">
                    {review.userPhoto ? (
                      <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand/10">
                        <User className="w-5 h-5 text-brand" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-text text-sm">{review.userName}</h4>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">
                      {review.timestamp?.toDate() ? formatDistanceToNow(review.timestamp.toDate(), { addSuffix: true, locale: ptBR }) : 'agora mesmo'}
                    </p>
                  </div>
                </div>

                {auth.currentUser?.uid === review.userId && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 text-text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-text leading-relaxed mb-4">{review.content}</p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLikeToggle(review.id, review.likes || 0)}
                  className={`flex items-center gap-2 text-xs font-bold transition-colors group ${
                    userLikes[review.id] ? 'text-brand' : 'text-text-muted hover:text-brand'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${userLikes[review.id] ? 'fill-current' : ''} group-hover:scale-110 transition-transform`} />
                  <span>{review.likes || 0} Curtidas</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {reviews.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
            <p className="text-text-muted">Seja o primeiro a comentar!</p>
          </div>
        )}
      </div>
    </div>
  );
};
