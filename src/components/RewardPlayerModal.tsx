import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Coins, X, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { auth, spendPoints, addPoints, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { monetagService } from '../services/monetagService';

interface RewardPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  movieTitle: string;
}

export const RewardPlayerModal: React.FC<RewardPlayerModalProps> = ({ isOpen, onClose, onUnlock, movieTitle }) => {
  const [points, setPoints] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [timer, setTimer] = useState(15);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      const fetchPoints = async () => {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists()) {
          setPoints(userDoc.data().points || 0);
        }
      };
      fetchPoints();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWatching && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (isWatching && timer === 0) {
      handleAdComplete();
    }
    return () => clearInterval(interval);
  }, [isWatching, timer]);

  const handleSpendPoints = async () => {
    if (!auth.currentUser) return;
    
    if (points < 100) {
      setError('Pontos insuficientes. Assista a um anúncio para ganhar mais!');
      return;
    }

    const success = await spendPoints(auth.currentUser.uid, 100);
    if (success) {
      onUnlock();
    } else {
      setError('Erro ao processar pontos. Tente novamente.');
    }
  };

  const handleWatchAd = () => {
    // Open Monetag Direct Link
    monetagService.showAd();
    
    setIsWatching(true);
    setTimer(15);
  };

  const handleAdComplete = async () => {
    setIsWatching(false);
    
    // If user is logged in, give them some points
    if (auth.currentUser) {
      try {
        await addPoints(auth.currentUser.uid, 10);
      } catch (error) {
        console.error('Failed to add points after ad:', error);
      }
    }
    
    // Always unlock the movie after the ad, even for guests
    onUnlock();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
        <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {!isWatching ? (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-brand" />
                  </div>
                  
                  <h2 className="text-2xl font-black text-text mb-2">Desbloquear Conteúdo</h2>
                  <p className="text-text-muted mb-8">
                    Para assistir <span className="text-text font-bold">"{movieTitle}"</span>, escolha uma das opções abaixo:
                  </p>

                  <div className="grid grid-cols-1 gap-4 mb-8">
                    <button
                      onClick={handleWatchAd}
                      className="flex items-center justify-between p-6 bg-surface-light border border-border rounded-2xl hover:border-brand transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                          <Play className="w-5 h-5 fill-current" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-text">Assistir Anúncio</p>
                          <p className="text-xs text-text-muted">Vídeo curto de 15 segundos</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-brand uppercase tracking-widest">Grátis</span>
                    </button>

                    <button
                      onClick={handleSpendPoints}
                      className={`flex items-center justify-between p-6 bg-surface-light border border-border rounded-2xl transition-all group ${
                        points >= 100 ? 'hover:border-brand' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-text">Usar Pontos</p>
                          <p className="text-xs text-text-muted">Seu saldo: {points} PTS</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-yellow-500 uppercase tracking-widest">100 PTS</span>
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm mb-6 justify-center">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <p className="text-[10px] text-text-muted uppercase tracking-widest">
                    O GoFlix é gratuito graças aos nossos apoiadores e anúncios.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="ad"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="text-center py-12"
                >
                  <div className="relative w-32 h-32 mx-auto mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        className="text-border"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={352}
                        strokeDashoffset={352 - (352 * (15 - timer)) / 15}
                        className="text-brand transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-black text-text">{timer}s</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-text mb-2">Desbloqueando seu filme...</h2>
                  <p className="text-text-muted text-sm">Aguarde o anúncio terminar para começar a assistir.</p>
                  
                  <div className="mt-8 aspect-video bg-black rounded-2xl flex flex-col items-center justify-center border border-border">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Vídeo Publicitário</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
