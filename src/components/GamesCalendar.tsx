import React, { useState, useEffect, useMemo } from 'react';
import { tvService } from '../services/tvService';
import { Game } from '../types';
import { Calendar, Clock, Trophy, Play, ExternalLink, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GamesCalendar: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGames = async () => {
      setIsLoading(true);
      const data = await tvService.getGames();
      setGames(data);
      setIsLoading(false);
    };
    fetchGames();
  }, []);

  const leagues = useMemo(() => {
    const cats = new Set(games.map(g => g.league));
    return ['Todas', ...Array.from(cats)];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesLeague = selectedLeague === 'Todas' || game.league === selectedLeague;
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           game.league.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLeague && matchesSearch;
    });
  }, [games, selectedLeague, searchQuery]);

  const groupedGames = useMemo(() => {
    const groups: Record<string, Game[]> = {};
    filteredGames.forEach(game => {
      const date = format(new Date(game.startTime * 1000), 'dd/MM/yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(game);
    });
    return groups;
  }, [filteredGames]);

  return (
    <div className="pt-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-text mb-2">Calendário de Jogos</h1>
          <p className="text-text-muted">Acompanhe as melhores transmissões esportivas.</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="Buscar jogo ou liga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-surface border border-border rounded-2xl py-3 pl-12 pr-6 text-text outline-none focus:ring-2 focus:ring-brand/50 w-full md:w-80 transition-all"
          />
        </div>
      </div>

      {/* Ligas */}
      <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar mb-8">
        {leagues.map(league => (
          <button
            key={league}
            onClick={() => setSelectedLeague(league)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              selectedLeague === league
                ? 'bg-brand text-white shadow-lg shadow-brand/20'
                : 'bg-surface border border-border text-text-muted hover:border-brand/50'
            }`}
          >
            {league}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
          <p className="text-text-muted animate-pulse">Carregando calendário...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {(Object.entries(groupedGames) as [string, Game[]][]).map(([date, dateGames]) => (
            <div key={date}>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-2 px-4 py-1.5 bg-surface border border-border rounded-full">
                  <Calendar className="w-4 h-4 text-brand" />
                  <span className="text-sm font-bold text-text">{date}</span>
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dateGames.map(game => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface border border-border rounded-3xl overflow-hidden group hover:border-brand/50 transition-all"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={game.image} 
                        alt={game.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4 px-3 py-1 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        {game.league}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col items-center gap-2 flex-1">
                          <div className="w-12 h-12 bg-bg rounded-full flex items-center justify-center border border-border overflow-hidden">
                            {game.homeTeam.image ? (
                              <img src={game.homeTeam.image} alt={game.homeTeam.name} className="w-8 h-8 object-contain" />
                            ) : (
                              <Trophy className="w-6 h-6 text-text-muted/20" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-text text-center line-clamp-1">{game.homeTeam.name}</span>
                        </div>

                        <div className="px-4 flex flex-col items-center">
                          <span className="text-xs font-black text-brand mb-1">VS</span>
                          <div className="flex items-center gap-1 text-[10px] text-text-muted font-bold">
                            <Clock className="w-3 h-3" />
                            {format(new Date(game.startTime * 1000), 'HH:mm')}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 flex-1">
                          <div className="w-12 h-12 bg-bg rounded-full flex items-center justify-center border border-border overflow-hidden">
                            {game.awayTeam.image ? (
                              <img src={game.awayTeam.image} alt={game.awayTeam.name} className="w-8 h-8 object-contain" />
                            ) : (
                              <Trophy className="w-6 h-6 text-text-muted/20" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-text text-center line-clamp-1">{game.awayTeam.name}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {game.players.map((player, idx) => (
                          <a
                            key={idx}
                            href={player}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between w-full px-4 py-3 bg-bg border border-border rounded-2xl hover:bg-brand hover:border-brand hover:text-white transition-all group/btn"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center group-hover/btn:bg-white/20 transition-colors">
                                <Play className="w-4 h-4 fill-current" />
                              </div>
                              <span className="text-sm font-bold">Opção {idx + 1}</span>
                            </div>
                            <ExternalLink className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {filteredGames.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <Trophy className="w-16 h-16 text-text-muted/20 mb-6" />
              <h2 className="text-2xl font-bold text-text mb-2">Nenhum jogo encontrado</h2>
              <p className="text-text-muted">Tente buscar por outro time ou liga.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
