import { Movie } from './types';

export const MOVIES: Movie[] = [
  {
    id: '1',
    title: 'The Midnight Sky',
    description: 'A lone scientist in the Arctic races to contact a crew of astronauts who are returning home to a mysterious global catastrophe.',
    rating: 8.4,
    year: 2024,
    duration: '2h 18m',
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    posterUrl: 'https://picsum.photos/seed/midnight/400/600',
    backdropUrl: 'https://picsum.photos/seed/midnight-bg/1920/1080',
    isTrending: true,
    cast: [
      { id: 'c1', name: 'George Clooney', role: 'Augustine', imageUrl: 'https://picsum.photos/seed/george/200/200' },
      { id: 'c2', name: 'Felicity Jones', role: 'Sully', imageUrl: 'https://picsum.photos/seed/felicity/200/200' },
      { id: 'c3', name: 'David Oyelowo', role: 'Adewole', imageUrl: 'https://picsum.photos/seed/david/200/200' },
    ]
  },
  {
    id: '2',
    title: 'Neon Nights',
    description: 'In a future where memories can be traded, a detective uncovers a conspiracy that threatens the fabric of reality.',
    rating: 7.9,
    year: 2025,
    duration: '1h 55m',
    genres: ['Cyberpunk', 'Thriller'],
    posterUrl: 'https://picsum.photos/seed/neon/400/600',
    backdropUrl: 'https://picsum.photos/seed/neon-bg/1920/1080',
    isNew: true,
    cast: [
      { id: 'c4', name: 'Ryan Gosling', role: 'K', imageUrl: 'https://picsum.photos/seed/ryan/200/200' },
      { id: 'c5', name: 'Ana de Armas', role: 'Joi', imageUrl: 'https://picsum.photos/seed/ana/200/200' },
    ]
  },
  {
    id: '3',
    title: 'The Last Frontier',
    description: 'Explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    rating: 9.1,
    year: 2023,
    duration: '2h 49m',
    genres: ['Sci-Fi', 'Epic'],
    posterUrl: 'https://picsum.photos/seed/frontier/400/600',
    backdropUrl: 'https://picsum.photos/seed/frontier-bg/1920/1080',
    cast: []
  },
  {
    id: '4',
    title: 'Shadow Protocol',
    description: 'An elite team of hackers must stop a global cyber-attack before it\'s too late.',
    rating: 7.2,
    year: 2024,
    duration: '1h 42m',
    genres: ['Action', 'Tech'],
    posterUrl: 'https://picsum.photos/seed/shadow/400/600',
    backdropUrl: 'https://picsum.photos/seed/shadow-bg/1920/1080',
    cast: []
  },
  {
    id: '5',
    title: 'Ethereal',
    description: 'A visual journey through the most beautiful and mysterious places on Earth.',
    rating: 8.8,
    year: 2025,
    duration: '1h 20m',
    genres: ['Documentary', 'Nature'],
    posterUrl: 'https://picsum.photos/seed/ethereal/400/600',
    backdropUrl: 'https://picsum.photos/seed/ethereal-bg/1920/1080',
    cast: []
  },
  {
    id: '6',
    title: 'Velocity',
    description: 'The story of the fastest man alive and the price he paid for speed.',
    rating: 7.5,
    year: 2024,
    duration: '2h 05m',
    genres: ['Sport', 'Drama'],
    posterUrl: 'https://picsum.photos/seed/velocity/400/600',
    backdropUrl: 'https://picsum.photos/seed/velocity-bg/1920/1080',
    cast: []
  }
];

export const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Horror', 'Documentary'];
