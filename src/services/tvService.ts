import { Game, TVChannel } from '../types';

export const tvService = {
  async getGames(): Promise<Game[]> {
    try {
      const response = await fetch('/api/tv/jogos');
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];

      return data.map((item: any, index: number) => ({
        id: `game-${index}`,
        title: item.title,
        image: item.image,
        league: item.data?.league || 'Esportes',
        startTime: item.data?.timer?.start || 0,
        endTime: item.data?.timer?.end || 0,
        homeTeam: {
          name: item.data?.teams?.home?.name || 'Time A',
          image: item.data?.teams?.home?.image || ''
        },
        awayTeam: {
          name: item.data?.teams?.away?.name || 'Time B',
          image: item.data?.teams?.away?.image || ''
        },
        players: item.players || []
      }));
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  },

  async getChannels(): Promise<TVChannel[]> {
    try {
      const [channelsRes, epgsRes] = await Promise.all([
        fetch('/api/tv/channels'),
        fetch('/api/tv/epgs')
      ]);
      
      const channelsData = await channelsRes.json();
      const epgsData = await epgsRes.json();
      
      const categoriesMap: Record<number, string> = {};
      if (channelsData.categories) {
        channelsData.categories.forEach((cat: any) => {
          categoriesMap[cat.id] = cat.name;
        });
      }

      const epgMap: Record<string, any> = {};
      if (Array.isArray(epgsData)) {
        epgsData.forEach((item: any) => {
          epgMap[item.id] = item.epg;
        });
      }

      if (!channelsData.channels) return [];

      return channelsData.channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        category: categoriesMap[ch.categories?.[1]] || categoriesMap[ch.categories?.[0]] || 'Geral',
        url: ch.url,
        logo: ch.image,
        epg: epgMap[ch.id]
      }));
    } catch (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
  }
};
