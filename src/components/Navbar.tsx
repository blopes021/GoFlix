import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Menu, X, Play, Sun, Moon, LogIn, Gift, Coins, Shield, Crown, ChevronDown, Baby } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { View, Movie } from '../types';
import { auth, db, Notification, handleFirestoreError, OperationType, Profile } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { LoginModal } from './LoginModal';
import { NotificationCenter } from './NotificationCenter';
import { tmdbService } from '../services/tmdbService';

interface NavbarProps {
  currentView: View;
  setView: (view: View) => void;
  onSearch: (query: string) => void;
  onMovieClick: (movie: Movie) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeProfile: Profile | null;
  onSwitchProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  setView, 
  onSearch, 
  onMovieClick, 
  theme, 
  toggleTheme,
  activeProfile,
  onSwitchProfile
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [points, setPoints] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      setIsSearching(true);
      try {
        const results = await tmdbService.searchMovies(query);
        setSearchResults(results.slice(0, 5));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleResultClick = (movie: Movie) => {
    onMovieClick(movie);
    setSearchResults([]);
    setSearchQuery('');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPoints(0);
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (user.email === "fabricio.lopes.a@gmail.com") {
          data.role = 'admin';
        }
        setPoints(data.points || 0);
        setUserProfile(data);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(newNotifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/notifications`);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isVip = userProfile?.vipUntil?.toDate() > new Date();

  const mainLinks: { name: string; view: View }[] = [
    { name: 'Home', view: 'home' },
    { name: 'Filmes', view: 'movies' },
    { name: 'Séries', view: 'series' },
  ];

  const liveLinks: { name: string; view: View }[] = [
    { name: 'TV ao Vivo', view: 'live-tv' },
    { name: 'Jogos', view: 'games' },
  ];

  const moreLinks: { name: string; view: View }[] = [
    { name: 'Comunidade', view: 'community' },
    { name: 'Minha Lista', view: 'my-list' },
    { name: 'Recompensas', view: 'rewards' },
  ];

  const [activeDropdown, setActiveDropdown] = useState<'live' | 'more' | null>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (dropdown: 'live' | 'more') => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-bg/90 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setView('home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-text">
              GO<span className="text-brand">FLIX</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            {mainLinks.map((link) => (
              <button
                key={link.view}
                onClick={() => setView(link.view)}
                className={`text-sm font-medium transition-colors hover:text-brand ${
                  currentView === link.view ? 'text-brand' : 'text-text-muted'
                }`}
              >
                {link.name}
              </button>
            ))}

            {/* Live Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('live')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-brand ${
                  liveLinks.some(l => l.view === currentView) ? 'text-brand' : 'text-text-muted'
                }`}
              >
                Ao Vivo
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'live' ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'live' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-2xl shadow-xl py-2 overflow-hidden"
                  >
                    {liveLinks.map((link) => (
                      <button
                        key={link.view}
                        onClick={() => {
                          setView(link.view);
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-brand/10 hover:text-brand ${
                          currentView === link.view ? 'text-brand bg-brand/5' : 'text-text-muted'
                        }`}
                      >
                        {link.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* More Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('more')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-brand ${
                  moreLinks.some(l => l.view === currentView) ? 'text-brand' : 'text-text-muted'
                }`}
              >
                Mais
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeDropdown === 'more' ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {activeDropdown === 'more' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-2xl shadow-xl py-2 overflow-hidden"
                  >
                    {moreLinks.map((link) => (
                      <button
                        key={link.view}
                        onClick={() => {
                          setView(link.view);
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-brand/10 hover:text-brand ${
                          currentView === link.view ? 'text-brand bg-brand/5' : 'text-text-muted'
                        }`}
                      >
                        {link.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative group hidden sm:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              placeholder="Títulos, pessoas, gêneros"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch(searchQuery);
                  setSearchResults([]);
                }
              }}
              className="bg-surface border border-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 w-48 lg:w-64 transition-all focus:w-64 lg:focus:w-80 text-text"
            />

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  {searchResults.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => handleResultClick(movie)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-brand/10 transition-colors text-left group"
                    >
                      <img 
                        src={movie.posterUrl} 
                        alt={movie.title} 
                        className="w-10 h-14 object-cover rounded-lg shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-text truncate group-hover:text-brand transition-colors">{movie.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{movie.mediaType}</span>
                          <span className="text-[10px] font-bold text-brand">{movie.year}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      onSearch(searchQuery);
                      setSearchResults([]);
                    }}
                    className="w-full py-2 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-brand transition-colors border-t border-border"
                  >
                    Ver todos os resultados
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-surface border border-border text-text-muted hover:text-brand transition-colors"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user && (
            <button
              onClick={() => setView('rewards')}
              className={`hidden lg:flex items-center gap-2 px-4 py-1.5 border rounded-full transition-all group ${
                isVip 
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white' 
                  : 'bg-brand/10 border-brand/20 text-brand hover:bg-brand hover:text-white'
              }`}
            >
              {isVip ? (
                <Crown className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              ) : (
                <Coins className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              )}
              <span className="text-xs font-black">{isVip ? 'VIP' : `${points} PTS`}</span>
            </button>
          )}

          {userProfile?.role === 'admin' && (
            <button
              onClick={() => setView('admin')}
              className={`p-2 rounded-full border transition-colors ${
                currentView === 'admin' ? 'bg-brand border-brand text-white' : 'bg-surface border-border text-text-muted hover:text-brand'
              }`}
              title="Painel Admin"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}

          <button 
            onClick={() => user ? setIsNotificationsOpen(true) : setIsLoginModalOpen(true)}
            className="text-text-muted hover:text-text transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-bg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {user && activeProfile ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setView('profile')}
                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-surface border border-border hover:border-brand transition-all group"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden relative">
                  <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" />
                  {activeProfile.isKids && (
                    <div className="absolute bottom-0 right-0 bg-brand text-white p-0.5 rounded-tl-md">
                      <Baby className="w-2 h-2" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-text hidden lg:block">{activeProfile.name}</span>
              </button>
              
              <button 
                onClick={onSwitchProfile}
                className="p-2 text-text-muted hover:text-brand transition-colors"
                title="Trocar Perfil"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => user ? setView('profile') : setIsLoginModalOpen(true)}
              className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden hover:border-brand transition-colors relative"
              title={user ? 'Ver Perfil' : 'Entrar'}
            >
              {user ? (
                <>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-text-muted" />
                  )}
                  {isVip && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border border-bg z-10">
                      <Crown className="w-2 h-2 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <LogIn className="w-5 h-5 text-text-muted" />
              )}
            </button>
          )}

          <button
            className="md:hidden text-text"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <NotificationCenter 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        notifications={notifications}
      />

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-bg/95 backdrop-blur-xl border-b border-border md:hidden"
          >
            <div className="flex flex-col p-4 gap-4">
              <div className="relative group sm:hidden mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="bg-surface border border-border rounded-full py-2 pl-10 pr-4 text-sm w-full text-text"
                />
              </div>
              {[...mainLinks, ...liveLinks, ...moreLinks].map((link) => (
                <button
                  key={link.view}
                  onClick={() => {
                    setView(link.view);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left text-lg font-medium py-2 ${
                    currentView === link.view ? 'text-brand' : 'text-text-muted'
                  }`}
                >
                  {link.name}
                </button>
              ))}
              {userProfile?.role === 'admin' && (
                <button
                  onClick={() => {
                    setView('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left text-lg font-bold py-2 flex items-center gap-2 ${
                    currentView === 'admin' ? 'text-brand' : 'text-brand/70'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Painel Admin
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
