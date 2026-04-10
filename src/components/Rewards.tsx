import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Play, Coins, ShieldCheck, Zap, Timer, CheckCircle2, AlertCircle, Tv, Crown, Loader2 as Spinner } from 'lucide-react';
import { auth, addPoints, db, buyVip } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { monetagService } from '../services/monetagService';

export const Rewards: React.FC = () => {
  const [points, setPoints] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [timer, setTimer] = useState(15);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isBuying, setIsBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setPoints(doc.data().points || 0);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const handleStartAd = () => {
    // Open Monetag Direct Link
    monetagService.showAd();
    
    setIsWatching(true);
    setTimer(15);
  };

  const handleAdComplete = async () => {
    if (!auth.currentUser) return;
    
    setIsWatching(false);
    await addPoints(auth.currentUser.uid, 50);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleBuyVip = async (hours: number, cost: number) => {
    if (!auth.currentUser || points < cost) return;
    
    setIsBuying(`${hours}h`);
    const success = await buyVip(auth.currentUser.uid, hours, cost);
    setIsBuying(null);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const vipOptions = [
    { hours: 24, cost: 1000, title: 'VIP 24 Horas' },
    { hours: 72, cost: 2500, title: 'VIP 3 Dias' },
    { hours: 168, cost: 5000, title: 'VIP 7 Dias' },
  ];

  return (
    <div className="pt-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-text mb-2 flex items-center gap-3">
          <Gift className="w-10 h-10 text-brand" />
          Recompensas
        </h1>
        <p className="text-text-muted">Assista anúncios, ganhe pontos e desbloqueie conteúdo sem interrupções.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Points Card */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Coins className="w-32 h-32 text-brand" />
            </div>
            
            <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Seu Saldo</h2>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-6xl font-black text-text">{points}</span>
              <span className="text-brand font-bold mb-2">PTS</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span>Conta Protegida</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-muted">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>Pontos Acumulativos</span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-brand/10 border border-brand/20 rounded-3xl p-6">
            <h3 className="font-bold text-brand mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Como funciona?
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Cada anúncio assistido garante 50 pontos. Use seus pontos para ativar o status VIP e assistir filmes e séries sem precisar ver anúncios.
            </p>
          </div>
        </div>

        {/* Earn Section */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!isWatching ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 text-brand fill-current" />
                  </div>
                  <h2 className="text-3xl font-black text-text mb-4">Ganhar Pontos Agora</h2>
                  <p className="text-text-muted mb-8 max-w-md">
                    Assista a um vídeo curto de 15 segundos e receba 50 pontos instantaneamente na sua conta.
                  </p>
                  <button
                    onClick={handleStartAd}
                    className="bg-brand text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 hover:scale-105 transition-all active:scale-95"
                  >
                    ASSISTIR ANÚNCIO
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="watching"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative w-40 h-40 mb-8">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-border"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * (15 - timer)) / 15}
                        className="text-brand transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-black text-text">{timer}s</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-text mb-2">Assistindo Anúncio...</h2>
                  <p className="text-text-muted">Não feche esta página para garantir seus pontos.</p>
                  
                  <div className="mt-12 w-full max-w-sm aspect-video bg-black rounded-2xl flex items-center justify-center border border-border">
                    <div className="flex flex-col items-center gap-4">
                      <Spinner className="w-8 h-8 text-brand animate-spin" />
                      <p className="text-xs text-text-muted uppercase tracking-widest">Simulando Anúncio</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 bg-brand flex flex-col items-center justify-center z-50"
                >
                  <CheckCircle2 className="w-24 h-24 text-white mb-4" />
                  <h2 className="text-4xl font-black text-white mb-2">SUCESSO!</h2>
                  <p className="text-white/80 font-bold">Sua conta foi atualizada.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* VIP Shop */}
      <div className="mt-12">
        <h2 className="text-2xl font-black text-text mb-8 flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          Loja VIP
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vipOptions.map((option, i) => (
            <div key={i} className="bg-surface border border-border rounded-3xl p-8 flex flex-col items-center text-center group hover:border-brand/50 transition-all">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">{option.title}</h3>
              <p className="text-sm text-text-muted mb-6">Fique livre de anúncios em todos os players por {option.hours} horas.</p>
              
              <div className="flex items-center gap-2 text-brand font-black text-2xl mb-8">
                <Coins className="w-6 h-6" />
                {option.cost} PTS
              </div>

              <button 
                onClick={() => handleBuyVip(option.hours, option.cost)}
                disabled={points < option.cost || isBuying !== null}
                className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                  points >= option.cost 
                    ? 'bg-brand text-white shadow-lg shadow-brand/20 hover:scale-105' 
                    : 'bg-border text-text-muted cursor-not-allowed'
                }`}
              >
                {isBuying === `${option.hours}h` ? (
                  <Spinner className="w-5 h-5 animate-spin" />
                ) : (
                  points >= option.cost ? 'ATIVAR AGORA' : 'PONTOS INSUFICIENTES'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
