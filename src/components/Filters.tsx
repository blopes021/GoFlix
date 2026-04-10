import React from 'react';
import { Filter, X } from 'lucide-react';

interface FiltersProps {
  genres: { id: number; name: string }[];
  selectedGenre: number | null;
  onGenreChange: (genreId: number | null) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  genres,
  selectedGenre,
  onGenreChange,
  selectedYear,
  onYearChange,
  sortBy,
  onSortChange
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-surface rounded-2xl border border-border">
      <div className="flex items-center gap-2 text-text-muted mr-2">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-bold uppercase tracking-wider">Filtros</span>
      </div>

      {/* Gêneros */}
      <select
        value={selectedGenre || ''}
        onChange={(e) => onGenreChange(e.target.value ? parseInt(e.target.value) : null)}
        className="bg-bg border border-border text-text text-sm rounded-xl px-4 py-2 outline-none focus:border-brand transition-colors cursor-pointer"
      >
        <option value="">Todos os Gêneros</option>
        {genres.map((genre) => (
          <option key={genre.id} value={genre.id}>
            {genre.name}
          </option>
        ))}
      </select>

      {/* Anos */}
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className="bg-bg border border-border text-text text-sm rounded-xl px-4 py-2 outline-none focus:border-brand transition-colors cursor-pointer"
      >
        <option value="">Todos os Anos</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      {/* Ordenação */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="bg-bg border border-border text-text text-sm rounded-xl px-4 py-2 outline-none focus:border-brand transition-colors cursor-pointer"
      >
        <option value="popularity.desc">Mais Populares</option>
        <option value="vote_average.desc">Melhor Avaliados</option>
        <option value="primary_release_date.desc">Mais Recentes</option>
        <option value="revenue.desc">Maior Bilheteria</option>
      </select>

      {(selectedGenre || selectedYear || sortBy !== 'popularity.desc') && (
        <button
          onClick={() => {
            onGenreChange(null);
            onYearChange('');
            onSortChange('popularity.desc');
          }}
          className="flex items-center gap-2 text-brand text-sm font-bold hover:underline ml-auto"
        >
          <X className="w-4 h-4" />
          Limpar Filtros
        </button>
      )}
    </div>
  );
};
