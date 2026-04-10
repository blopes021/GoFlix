import React, { useState, useMemo, useEffect } from 'react';
import { tvService } from '../services/tvService';
import { TVChannel } from '../types';
import { Play, Search, Tv, Info, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LiveTV: React.FC = () => {
  const [allChannels, setAllChannels] = useState<TVChannel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState<TVChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      setIsLoading(true);
      const channels = await tvService.getChannels();
      setAllChannels(channels);
      setIsLoading(false);
    };
    fetchChannels();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(allChannels.map(c => c.category));
    return ['Todos', ...Array.from(cats)];
  }, [allChannels]);

  const filteredChannels = useMemo(() => {
    return allChannels.filter(channel => {
      const matchesCategory = selectedCategory === 'Todos' || channel.category === selectedCategory;
      const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allChannels, selectedCategory, searchQuery]);

  return (
    <div className="pt-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-text mb-2">TV ao Vivo</h1>
          <p className="text-text-muted">Assista seus canais favoritos em tempo real.</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="Buscar canal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-surface border border-border rounded-2xl py-3 pl-12 pr-6 text-text outline-none focus:ring-2 focus:ring-brand/50 w-full md:w-80 transition-all"
          />
        </div>
      </div>

      {/* Categorias */}
      <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar mb-8">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'bg-surface border border-border text-text-muted hover:border-brand/50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Player Section */}
      <AnimatePresence>
        {activeChannel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-border">
                  <iframe
                    src={activeChannel.url}
                    className="w-full h-full"
                    allowFullScreen
                    frameBorder="0"
                    scrolling="no"
                  />
                  <button
                    onClick={() => setActiveChannel(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-brand transition-colors"
                  >
                    <Tv className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center border border-border overflow-hidden p-2">
                      {activeChannel.logo ? (
                        <img src={activeChannel.logo} alt={activeChannel.name} className="w-full h-full object-contain dark:logo-invert" />
                      ) : (
                        <Tv className="w-6 h-6 text-brand" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text">{activeChannel.name}</h2>
                      <p className="text-text-muted text-sm">{activeChannel.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* EPG Info */}
              <div className="bg-surface border border-border rounded-3xl p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-6 text-brand">
                  <Clock className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Programação</h3>
                </div>
                
                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Current Program */}
                  <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-brand text-white text-[8px] font-black uppercase rounded">No Ar</span>
                      <span className="text-[10px] font-bold text-brand">
                        {activeChannel.epg ? new Date(activeChannel.epg.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-text mb-2">{activeChannel.epg?.title || 'Programação ao Vivo'}</h4>
                    <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                      {activeChannel.epg?.desc || 'Assista a transmissão em tempo real deste canal.'}
                    </p>
                  </div>

                  {/* Next Programs (Simulated) */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">A Seguir</h5>
                    {[
                      { time: '18:30', title: 'Jornal da Noite', desc: 'As principais notícias do dia no Brasil e no mundo.' },
                      { time: '20:00', title: 'Cine GoFlix', desc: 'Uma seleção dos melhores filmes para sua noite.' },
                      { time: '22:30', title: 'Talk Show', desc: 'Entrevistas exclusivas com grandes personalidades.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 group cursor-default">
                        <span className="text-xs font-bold text-text-muted w-10 pt-1">{item.time}</span>
                        <div className="flex-1 pb-4 border-b border-border group-last:border-0">
                          <h6 className="text-sm font-bold text-text mb-1 group-hover:text-brand transition-colors">{item.title}</h6>
                          <p className="text-[10px] text-text-muted line-clamp-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de Canais */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-surface rounded-3xl border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredChannels.map(channel => (
            <motion.div
              key={channel.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ y: -5 }}
              onClick={() => {
                setActiveChannel(channel);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`group relative aspect-square bg-surface rounded-3xl border transition-all cursor-pointer overflow-hidden ${
                activeChannel?.id === channel.id ? 'border-brand ring-2 ring-brand/20' : 'border-border hover:border-brand/50'
              }`}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 mb-4 flex items-center justify-center p-2">
                  {channel.logo ? (
                    <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain filter group-hover:scale-110 transition-transform duration-500 dark:logo-invert" />
                  ) : (
                    <Tv className="w-12 h-12 text-brand/50 group-hover:text-brand transition-colors" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-text line-clamp-1">{channel.name}</h3>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1">{channel.category}</p>
                
                {channel.epg && (
                  <div className="mt-2 px-2 py-1 bg-brand/10 rounded-lg">
                    <p className="text-[9px] font-bold text-brand truncate max-w-full">
                      {channel.epg.title}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <Play className="w-5 h-5 fill-current" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredChannels.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <Tv className="w-16 h-16 text-text-muted/20 mb-6" />
          <h2 className="text-2xl font-bold text-text mb-2">Nenhum canal encontrado</h2>
          <p className="text-text-muted">Tente buscar por outro nome ou categoria.</p>
        </div>
      )}
    </div>
  );
};
