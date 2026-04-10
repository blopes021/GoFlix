import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Maximize, Minimize, AlertCircle, RefreshCw, SkipForward } from 'lucide-react';
import { Movie } from '../types';
import { reportIssue } from '../firebase';

interface PlayerProps {
  movie: Movie;
  onClose: () => void;
  onProgress?: (progress: number) => void;
  onNextEpisode?: () => void;
}

export const Player: React.FC<PlayerProps> = ({ movie, onClose, onProgress, onNextEpisode }) => {
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reported, setReported] = useState(false);
  const [activePlayer, setActivePlayer] = useState<'primevicio' | 'superflix' | 'megaembed'>('primevicio');
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      if (onProgress) {
        // Estimate progress based on time spent (very rough)
        // In a real app with a controlled player, we'd get real time
        const timeSpentMinutes = (Date.now() - startTimeRef.current) / 60000;
        onProgress(timeSpentMinutes);
      }
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [onProgress]);

  const handleReport = async () => {
    if (reported) return;
    try {
      await reportIssue(movie.id, movie.title, movie.mediaType || 'movie');
      setReported(true);
    } catch (error) {
      console.error('Failed to report issue:', error);
    }
  };

  const reloadPlayer = () => {
    const currentActive = activePlayer;
    setActivePlayer('primevicio'); // Temporary switch
    setTimeout(() => setActivePlayer(currentActive), 50);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Some players send error messages via postMessage
      // We check for common error patterns in the message data
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === 'error' || data.type === 'error' || data.error) {
          console.warn('Player error detected via postMessage:', data);
          handleReport();
        }
      } catch (e) {
        // Not JSON or not an error message we recognize
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [movie]);

  useEffect(() => {
    let timeout: any;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const id = movie.imdbId || movie.id;
  const tmdbId = movie.id;
  const s = movie.selectedSeason || 1;
  const e = movie.selectedEpisode || 1;
  
  const primevicioUrl = movie.mediaType === 'tv'
    ? `https://www.primevicio.lat/embed/tv/${tmdbId}/${s}/${e}`
    : `https://www.primevicio.lat/embed/movie/${tmdbId}`;

  const superflixUrl = movie.mediaType === 'tv' 
    ? `https://superflixapi.rest/serie/${id}/${s}/${e}#color:FF3D00`
    : `https://superflixapi.rest/filme/${id}#color:FF3D00`;

  const megaembedUrl = movie.mediaType === 'tv'
    ? `https://megaembed.com/embed/tv/${tmdbId}/${s}/${e}`
    : `https://megaembed.com/embed/movie/${tmdbId}`;

  const playerUrl = activePlayer === 'primevicio' ? primevicioUrl : (activePlayer === 'superflix' ? superflixUrl : megaembedUrl);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[300] bg-black flex items-center justify-center overflow-hidden"
    >
      {/* Player Iframe */}
      <iframe
        key={activePlayer} // Force reload when switching players
        src={playerUrl}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media"
        title={movie.title}
        referrerPolicy="no-referrer"
      />

      {/* Controls Overlay */}
      <div className={`absolute top-0 left-0 w-full p-8 flex items-center justify-between transition-opacity duration-500 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex flex-col gap-4 pointer-events-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-3 text-white hover:text-brand transition-colors group bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              <span className="text-lg font-bold">Sair</span>
            </button>

            <div className="flex flex-col gap-0.5">
              <h1 className="text-white text-xl font-black drop-shadow-lg">
                {movie.title}
              </h1>
              {movie.mediaType === 'tv' && (
                <p className="text-brand text-xs font-black uppercase tracking-widest">
                  T{movie.selectedSeason || 1} : E{movie.selectedEpisode || 1}
                </p>
              )}
            </div>
          </div>

          {/* Player Selector */}
          <div className="flex items-center gap-2 p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
            <button
              onClick={() => {
                setActivePlayer('primevicio');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePlayer === 'primevicio' 
                  ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Player 1 (PrimeVicio)
            </button>
            <button
              onClick={() => {
                setActivePlayer('superflix');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePlayer === 'superflix' 
                  ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Player 2 (SuperFlix)
            </button>
            <button
              onClick={() => {
                setActivePlayer('megaembed');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePlayer === 'megaembed' 
                  ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Player 3 (MegaEmbed)
            </button>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:bg-brand transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-sm font-bold">Recarregar</span>
            </button>

            {movie.mediaType === 'tv' && onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="flex items-center gap-2 text-white bg-brand px-6 py-3 rounded-full shadow-lg shadow-brand/20 hover:scale-105 transition-all"
              >
                <SkipForward className="w-5 h-5 fill-current" />
                <span className="text-sm font-bold">Próximo Episódio</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 items-end pointer-events-auto">
          <button
            onClick={reloadPlayer}
            className="p-4 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-brand transition-colors border border-white/10"
            title="Recarregar Player"
          >
            <RefreshCw className="w-6 h-6" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-4 rounded-full bg-black/40 backdrop-blur-md text-white hover:text-brand transition-colors border border-white/10"
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </button>

          <button
            onClick={handleReport}
            className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all backdrop-blur-md ${
              reported 
                ? 'bg-green-500/20 border-green-500/50 text-green-500' 
                : 'bg-black/40 border-white/10 text-white hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500'
            }`}
            title="Reportar problema com o vídeo"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-bold">{reported ? 'Relatado' : 'Vídeo Indisponível?'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
