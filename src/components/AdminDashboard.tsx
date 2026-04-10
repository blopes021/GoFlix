import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, AlertCircle, Bell, Send, CheckCircle2, Trash2, Loader2, BarChart3, MessageSquare, Star, Search, Plus, Crown, Coins, UserMinus } from 'lucide-react';
import { db, handleFirestoreError, OperationType, updateUserRole, updateUserVip, updateUserPoints, setCustomHighlights, getCustomHighlights, sendUserNotification } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, deleteDoc, addDoc, getDocs, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { tmdbService } from '../services/tmdbService';
import { Movie } from '../types';

interface Report {
  id: string;
  movieId: string;
  title: string;
  mediaType: string;
  status: 'pending' | 'resolved';
  timestamp: any;
  userEmail: string;
}

interface UserData {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  points: number;
  vipUntil?: any;
}

export const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [highlights, setHighlights] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'highlights' | 'notifications' | 'stats'>('reports');
  
  // Notification form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Highlights search
  const [highlightSearch, setHighlightSearch] = useState('');
  const [highlightResults, setHighlightResults] = useState<Movie[]>([]);
  const [isSearchingHighlights, setIsSearchingHighlights] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
      setReports(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      const q = query(collection(db, 'users'), limit(100));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserData[];
        setUsers(data);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchHighlights = async () => {
      const data = await getCustomHighlights();
      if (data) setHighlights(data);
    };
    fetchHighlights();
  }, []);

  const handleResolveReport = async (reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      
      if (report && report.reportedBy && report.reportedBy !== 'anonymous') {
        await sendUserNotification(
          report.reportedBy,
          'Conteúdo Corrigido! 🎉',
          `O conteúdo "${report.title}" que você relatou já foi corrigido e está disponível para assistir.`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await updateUserRole(userId, newRole);
  };

  const handleAddVip = async (userId: string) => {
    await updateUserVip(userId, 30); // Add 30 days
  };

  const handleAddPoints = async (userId: string, currentPoints: number) => {
    await updateUserPoints(userId, currentPoints + 1000);
  };

  const handleSearchHighlights = async () => {
    if (!highlightSearch) return;
    setIsSearchingHighlights(true);
    try {
      const results = await tmdbService.searchMovies(highlightSearch);
      setHighlightResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearchingHighlights(false);
    }
  };

  const handleAddHighlight = async (movie: Movie) => {
    const newHighlights = [...highlights, movie].slice(-10); // Keep last 10
    setHighlights(newHighlights);
    await setCustomHighlights(newHighlights);
    setHighlightResults([]);
    setHighlightSearch('');
  };

  const handleRemoveHighlight = async (movieId: number) => {
    const newHighlights = highlights.filter(m => m.id !== movieId);
    setHighlights(newHighlights);
    await setCustomHighlights(newHighlights);
  };

  const handleSendGlobalNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;

    setIsSending(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = usersSnap.docs.map(userDoc => 
        addDoc(collection(db, 'users', userDoc.id, 'notifications'), {
          title: notifTitle,
          message: notifMessage,
          type: notifType,
          read: false,
          timestamp: new Date()
        })
      );
      
      await Promise.all(batch);
      
      setSendSuccess(true);
      setNotifTitle('');
      setNotifMessage('');
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending notifications:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="pt-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-text mb-2 flex items-center gap-3">
          <Shield className="w-10 h-10 text-brand" />
          Painel Administrativo
        </h1>
        <p className="text-text-muted">Gerencie usuários, destaques, denúncias e notificações.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto no-scrollbar">
        {[
          { id: 'reports', label: 'Denúncias', icon: AlertCircle },
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'highlights', label: 'Destaques', icon: Star },
          { id: 'notifications', label: 'Notificações', icon: Bell },
          { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-brand' : 'text-text-muted hover:text-text'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-t-full" />
            )}
            {tab.id === 'reports' && reports.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-brand text-white text-[10px] rounded-full">
                {reports.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-surface border border-border rounded-3xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text">Tudo limpo!</h3>
                <p className="text-text-muted">Nenhuma denúncia pendente no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map(report => (
                  <div 
                    key={report.id}
                    className={`bg-surface border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                      report.status === 'resolved' ? 'opacity-60 border-border' : 'border-brand/30 shadow-lg shadow-brand/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${report.status === 'resolved' ? 'bg-green-500/10 text-green-500' : 'bg-brand/10 text-brand'}`}>
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text text-lg">{report.title}</h3>
                        <p className="text-sm text-text-muted mb-2">
                          Tipo: <span className="capitalize">{report.mediaType}</span> • ID: {report.movieId}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {report.userEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {report.timestamp?.toDate ? format(report.timestamp.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Recentemente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleResolveReport(report.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Resolver
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-text-muted hover:text-red-500 transition-colors"
                        title="Excluir denúncia"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              {users.map(user => (
                <div key={user.id} className="bg-surface border border-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black">
                      {user.displayName?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-text flex items-center gap-2">
                        {user.displayName || 'Usuário'}
                        {user.role === 'admin' && <Shield className="w-4 h-4 text-brand" />}
                        {user.vipUntil?.toDate() > new Date() && <Crown className="w-4 h-4 text-yellow-500" />}
                      </h3>
                      <p className="text-xs text-text-muted">{user.email}</p>
                      <p className="text-[10px] font-bold text-brand mt-1 uppercase tracking-widest">{user.points} Pontos</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleUpdateRole(user.id, user.role)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        user.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand/10 text-brand border border-brand/20'
                      }`}
                    >
                      {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                    <button
                      onClick={() => handleAddVip(user.id)}
                      className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                    >
                      +30 Dias VIP
                    </button>
                    <button
                      onClick={() => handleAddPoints(user.id, user.points)}
                      className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest"
                    >
                      +1000 Pontos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'highlights' && (
          <motion.div
            key="highlights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-surface border border-border rounded-3xl p-8">
              <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                <Search className="w-6 h-6 text-brand" />
                Adicionar aos Destaques
              </h3>
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={highlightSearch}
                  onChange={(e) => setHighlightSearch(e.target.value)}
                  placeholder="Buscar filme ou série..."
                  className="flex-1 bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                />
                <button
                  onClick={handleSearchHighlights}
                  disabled={isSearchingHighlights}
                  className="px-6 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand/80 transition-all disabled:opacity-50"
                >
                  {isSearchingHighlights ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                </button>
              </div>

              {highlightResults.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {highlightResults.map(movie => (
                    <div key={movie.id} className="relative group aspect-[2/3] rounded-xl overflow-hidden border border-border">
                      <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                        <button
                          onClick={() => handleAddHighlight(movie)}
                          className="p-2 bg-brand text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-text flex items-center gap-2">
                <Star className="w-6 h-6 text-brand" />
                Destaques Atuais
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {highlights.map((movie, index) => (
                  <div key={movie.id} className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-brand/20">#{index + 1}</span>
                      <img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 object-cover rounded-lg" />
                      <div>
                        <h4 className="font-bold text-text">{movie.title}</h4>
                        <p className="text-xs text-text-muted capitalize">{movie.mediaType}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveHighlight(movie.id)}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-surface border border-border rounded-3xl p-8">
              <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6 text-brand" />
                Enviar Notificação Global
              </h3>
              
              <form onSubmit={handleSendGlobalNotification} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Título</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Ex: Novo filme adicionado!"
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Mensagem</label>
                  <textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Descreva a novidade para os usuários..."
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text outline-none focus:ring-2 focus:ring-brand/50 transition-all min-h-[120px] resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Tipo</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['info', 'success', 'warning', 'error'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNotifType(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                          notifType === type 
                            ? 'bg-brand/10 border-brand text-brand' 
                            : 'bg-bg border-border text-text-muted hover:border-brand/50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-brand text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand/20 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      ENVIAR PARA TODOS
                    </>
                  )}
                </button>

                {sendSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-bold text-center"
                  >
                    Notificações enviadas com sucesso!
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { label: 'Total de Denúncias', value: reports.length, icon: AlertCircle, color: 'text-brand' },
              { label: 'Denúncias Pendentes', value: reports.filter(r => r.status === 'pending').length, icon: MessageSquare, color: 'text-yellow-500' },
              { label: 'Resolvidas', value: reports.filter(r => r.status === 'resolved').length, icon: CheckCircle2, color: 'text-green-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface border border-border rounded-3xl p-8">
                <div className={`w-12 h-12 rounded-2xl bg-bg flex items-center justify-center mb-6 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">{stat.label}</h3>
                <p className="text-4xl font-black text-text">{stat.value}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
