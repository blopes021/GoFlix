import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, LogOut, ChevronRight, Star, Clock, Bell, CheckCircle, Crown, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, logout, db, handleFirestoreError, OperationType, Profile } from '../firebase';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface UserProfileProps {
  onClose: () => void;
  activeProfile: Profile | null;
  onSwitchProfile: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose, activeProfile, onSwitchProfile }) => {
  const user = auth.currentUser;
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentlyWatched, setRecentlyWatched] = useState<any[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (user.email === "fabricio.lopes.a@gmail.com") {
            data.role = 'admin';
          }
          setUserProfile(data);
          setIsAdmin(data.role === 'admin');
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeProfile) {
      const q = query(
        collection(db, 'users', user.uid, 'profiles', activeProfile.id, 'recentlyWatched'),
        orderBy('lastWatched', 'desc'),
        limit(5)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentlyWatched(data);
      });
      return () => unsubscribe();
    }
  }, [user, activeProfile]);

  if (!user) return null;

  const isVip = userProfile?.vipUntil?.toDate() > new Date();

  const getLevelInfo = (points: number) => {
    if (points >= 50000) return { level: 5, name: 'Lenda do Cinema', color: 'text-purple-500', bg: 'bg-purple-500/10', next: 100000 };
    if (points >= 15000) return { level: 4, name: 'Diretor Master', color: 'text-red-500', bg: 'bg-red-500/10', next: 50000 };
    if (points >= 5000) return { level: 3, name: 'Cinéfilo Mestre', color: 'text-orange-500', bg: 'bg-orange-500/10', next: 15000 };
    if (points >= 1000) return { level: 2, name: 'Crítico Amador', color: 'text-blue-500', bg: 'bg-blue-500/10', next: 5000 };
    return { level: 1, name: 'Espectador', color: 'text-brand', bg: 'bg-brand/10', next: 1000 };
  };

  const levelInfo = getLevelInfo(userProfile?.points || 0);
  const prevLevelPoints = levelInfo.level === 1 ? 0 : (levelInfo.level === 2 ? 1000 : (levelInfo.level === 3 ? 5000 : (levelInfo.level === 4 ? 15000 : 50000)));
  const progress = Math.min(100, Math.max(0, ((userProfile?.points || 0) - prevLevelPoints) / (levelInfo.next - prevLevelPoints) * 100));

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const testNotification = async () => {
    setTestStatus('loading');
    try {
      const response = await fetch('/api/reports/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: 'test-123',
          title: 'Teste de Notificação',
          mediaType: 'movie',
          userEmail: user.email
        })
      });
      const data = await response.json();
      if (data.status === 'ok') setTestStatus('success');
      else if (data.status === 'skipped') setTestStatus('error');
      else setTestStatus('error');
    } catch (error) {
      setTestStatus('error');
    }
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="pt-32 px-4 md:px-8 max-w-4xl mx-auto min-h-screen pb-20"
    >
      <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-xl">
        {/* Header/Banner */}
        <div className="h-32 bg-gradient-to-r from-brand to-orange-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-3xl bg-surface border-4 border-surface overflow-hidden shadow-lg relative">
              {activeProfile ? (
                <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" />
              ) : user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand/10">
                  <User className="w-10 h-10 text-brand" />
                </div>
              )}
              {isVip && (
                <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1 shadow-lg">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-text mb-1 flex items-center gap-3">
                {activeProfile ? activeProfile.name : (user.displayName || 'Usuário GoFlix')}
                {isVip && <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black rounded-full border border-yellow-500/20 uppercase tracking-widest">VIP</span>}
                {isAdmin && <span className="px-3 py-1 bg-brand/10 text-brand text-[10px] font-black rounded-full border border-brand/20 uppercase tracking-widest">Admin</span>}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-text-muted flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border border-border ${levelInfo.bg}`}>
                  <Star className={`w-3 h-3 ${levelInfo.color} fill-current`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${levelInfo.color}`}>
                    Nível {levelInfo.level}: {levelInfo.name}
                  </span>
                </div>
              </div>
              <div className="mt-4 max-w-xs">
                <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                  <span>Progresso do Nível</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden border border-border">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${levelInfo.color.replace('text-', 'bg-')}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onSwitchProfile}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border text-text rounded-2xl font-bold hover:border-brand transition-all"
              >
                <User className="w-5 h-5" />
                Trocar Perfil
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                Sair da Conta
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand" />
                Informações da Conta
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-text-muted" />
                    <div>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Membro desde</p>
                      <p className="text-text font-medium">Abril 2026</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <Crown className={`w-5 h-5 ${isVip ? 'text-yellow-500' : 'text-text-muted'}`} />
                    <div>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Status VIP</p>
                      <p className={`font-bold ${isVip ? 'text-yellow-500' : 'text-text'}`}>
                        {isVip ? 'Assinatura Ativa' : 'Plano Grátis'}
                      </p>
                    </div>
                  </div>
                  {!isVip && <button className="text-xs font-bold text-brand hover:underline">Assinar</button>}
                </div>

                {isAdmin && (
                  <div className="p-4 bg-brand/5 rounded-2xl border border-brand/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-brand" />
                        <div>
                          <p className="text-xs text-brand font-bold uppercase tracking-wider">Admin: Notificações</p>
                          <p className="text-text font-medium text-sm">Teste o sistema de e-mail</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={testNotification}
                      disabled={testStatus === 'loading'}
                      className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                        testStatus === 'success' ? 'bg-green-500 text-white' :
                        testStatus === 'error' ? 'bg-red-500 text-white' :
                        'bg-brand text-white hover:bg-brand/80'
                      }`}
                    >
                      {testStatus === 'loading' ? 'Enviando...' : 
                       testStatus === 'success' ? <><CheckCircle className="w-4 h-4" /> E-mail Enviado!</> :
                       testStatus === 'error' ? 'Erro (Verifique os Secrets)' : 'Enviar E-mail de Teste'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Star className="w-5 h-5 text-brand" />
                  Minhas Conquistas
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {userProfile?.badges?.length > 0 ? (
                    userProfile.badges.map((badge: any) => (
                      <div key={badge.id} className="group relative flex flex-col items-center gap-2 p-3 bg-bg border border-border rounded-2xl hover:border-brand/50 transition-all cursor-help">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-xl">
                          {badge.icon}
                        </div>
                        <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest text-center">{badge.name}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-surface border border-border rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <p className="text-[10px] font-bold text-text mb-1">{badge.name}</p>
                          <p className="text-[8px] text-text-muted leading-tight">{badge.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-3 bg-bg border border-border border-dashed rounded-2xl opacity-40">
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-xl grayscale">
                          🔒
                        </div>
                        <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Bloqueado</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand" />
                Continuar Assistindo
              </h3>

              <div className="space-y-4">
                {recentlyWatched.length === 0 ? (
                  <div className="p-8 bg-bg rounded-2xl border border-border text-center">
                    <Play className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-20" />
                    <p className="text-sm text-text-muted">Nenhum histórico recente.</p>
                  </div>
                ) : (
                  recentlyWatched.map(item => (
                    <div key={item.id} className="bg-bg border border-border rounded-2xl p-3 flex items-center gap-4 group hover:border-brand/50 transition-all">
                      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-text text-sm truncate">{item.title}</h4>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">{item.mediaType}</p>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (item.progress || 0) * 5)}%` }} // 5% per minute roughly
                            className="h-full bg-brand"
                          />
                        </div>
                        <p className="text-[9px] text-text-muted mt-1">
                          {item.progress ? `Assistindo • ${Math.round(item.progress)} min` : 'Começar a assistir'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
