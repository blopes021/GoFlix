import { Movie, CastMember } from '../types';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const mapTMDBMovieToMovie = (tmdbMovie: any): Movie => ({
  id: tmdbMovie.id.toString(),
  title: tmdbMovie.title || tmdbMovie.name,
  description: tmdbMovie.overview,
  rating: parseFloat(tmdbMovie.vote_average.toFixed(1)),
  year: new Date(tmdbMovie.release_date || tmdbMovie.first_air_date).getFullYear(),
  duration: tmdbMovie.runtime ? `${Math.floor(tmdbMovie.runtime / 60)}h ${tmdbMovie.runtime % 60}m` : 'N/A',
  genres: tmdbMovie.genres ? tmdbMovie.genres.map((g: any) => g.name) : [],
  genreIds: tmdbMovie.genre_ids || (tmdbMovie.genres ? tmdbMovie.genres.map((g: any) => g.id) : []),
  posterUrl: tmdbMovie.poster_path ? `${IMAGE_BASE_URL}/w500${tmdbMovie.poster_path}` : 'https://picsum.photos/seed/movie/400/600',
  backdropUrl: tmdbMovie.backdrop_path ? `${IMAGE_BASE_URL}/original${tmdbMovie.backdrop_path}` : 'https://picsum.photos/seed/backdrop/1920/1080',
  cast: [],
  isTrending: false,
  isNew: false,
  mediaType: tmdbMovie.media_type || (tmdbMovie.first_air_date ? 'tv' : 'movie'),
  imdbId: tmdbMovie.imdb_id || (tmdbMovie.external_ids?.imdb_id),
});

export const tmdbService = {
  async getTrending(): Promise<Movie[]> {
    try {
      const response = await fetch('/api/movies/trending');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.results) return [];
      return data.results.map((m: any) => ({ ...mapTMDBMovieToMovie(m), isTrending: true }));
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      return [];
    }
  },

  async getPopular(page: number = 1, sortBy: string = 'popularity.desc'): Promise<Movie[]> {
    try {
      const response = await fetch(`/api/movies/popular?page=${page}&sort_by=${sortBy}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.results) return [];
      return data.results.map((m: any) => ({ ...mapTMDBMovieToMovie(m), isNew: true, mediaType: 'movie' }));
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return [];
    }
  },

  async getPopularTV(page: number = 1, sortBy: string = 'popularity.desc'): Promise<Movie[]> {
    try {
      const response = await fetch(`/api/movies/popular-tv?page=${page}&sort_by=${sortBy}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.results) return [];
      return data.results.map((m: any) => ({ ...mapTMDBMovieToMovie(m), isNew: true, mediaType: 'tv' }));
    } catch (error) {
      console.error('Error fetching popular TV shows:', error);
      return [];
    }
  },

  async searchMovies(query: string): Promise<Movie[]> {
    try {
      const response = await fetch(`/api/movies/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.results) return [];
      return data.results
        .filter((m: any) => m.media_type !== 'person')
        .map(mapTMDBMovieToMovie);
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  },

  async getGenres(type: 'movie' | 'tv'): Promise<{ id: number; name: string }[]> {
    try {
      const response = await fetch(`/api/genres/${type}`);
      const data = await response.json();
      return data.genres || [];
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  },

  async discoverByGenre(type: 'movie' | 'tv', genreId: number | null, page: number = 1, sortBy: string = 'popularity.desc', year?: string): Promise<Movie[]> {
    try {
      let url = `/api/discover/${type}?page=${page}&sort_by=${sortBy}`;
      if (genreId) url += `&genreId=${genreId}`;
      if (year) {
        const yearParam = type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
        url += `&${yearParam}=${year}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (!data.results) return [];
      return data.results.map((m: any) => ({ ...mapTMDBMovieToMovie(m), mediaType: type }));
    } catch (error) {
      console.error('Error discovering content:', error);
      return [];
    }
  },

  async getMovieDetails(id: string, mediaType: 'movie' | 'tv' = 'movie'): Promise<Movie> {
    const [detailsRes, creditsRes, videosRes] = await Promise.all([
      fetch(`/api/movies/${id}?type=${mediaType}`),
      fetch(`/api/movies/${id}/credits?type=${mediaType}`),
      fetch(`/api/movies/${id}/videos?type=${mediaType}`)
    ]);
    
    const details = await detailsRes.json();
    const credits = await creditsRes.json();
    const videos = await videosRes.json();
    
    if (details.error) throw new Error(details.error);
    
    // For TV shows, we might need to merge external_ids if they were fetched
    const movie = mapTMDBMovieToMovie(details);
    if (mediaType === 'tv' && details.seasons) {
      movie.seasons = details.seasons.filter((s: any) => s.season_number > 0);
    }
    if (credits.cast) {
      movie.cast = credits.cast.slice(0, 10).map((c: any): CastMember => ({
        id: c.id.toString(),
        name: c.name,
        role: c.character,
        imageUrl: c.profile_path ? `${IMAGE_BASE_URL}/w185${c.profile_path}` : 'https://picsum.photos/seed/person/200/200'
      }));
    }

    if (videos.results) {
      const trailer = videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        movie.trailerUrl = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
      }
    }
    
    return movie;
  },

  async getSimilarContent(id: string, mediaType: 'movie' | 'tv' = 'movie'): Promise<Movie[]> {
    try {
      const response = await fetch(`/api/movies/${id}/similar?type=${mediaType}`);
      const data = await response.json();
      if (!data.results) return [];
      return data.results.slice(0, 10).map((m: any) => ({ ...mapTMDBMovieToMovie(m), mediaType }));
    } catch (error) {
      console.error('Error fetching similar content:', error);
      return [];
    }
  },

  async getTVSeasonDetails(id: string, seasonNumber: number): Promise<any> {
    try {
      const response = await fetch(`/api/tv/${id}/season/${seasonNumber}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching TV season details:', error);
      return null;
    }
  },

  async getPersonDetails(id: string): Promise<any> {
    try {
      const response = await fetch(`/api/person/${id}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      return {
        id: data.id.toString(),
        name: data.name,
        biography: data.biography,
        birthday: data.birthday,
        placeOfBirth: data.place_of_birth,
        profileUrl: data.profile_path ? `${IMAGE_BASE_URL}/h632${data.profile_path}` : 'https://picsum.photos/seed/person/400/600',
        knownFor: data.credits?.cast?.slice(0, 10).map((m: any) => mapTMDBMovieToMovie(m)) || []
      };
    } catch (error) {
      console.error('Error fetching person details:', error);
      return null;
    }
  }
};
