import type { Genre } from '../types/movie'

interface GenreFiltersProps {
  genres: Genre[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function GenreFilters({ genres, selectedIds, onChange }: GenreFiltersProps) {
  return <fieldset className="genre-filters">
    <legend>Filter by genre</legend>
    <p className="muted">Select one or more genres. Movies match any selected genre.</p>
    <div className="genre-options">
      {genres.map(genre => <label className="genre-option" key={genre.id}>
        <input
          type="checkbox"
          checked={selectedIds.includes(genre.id)}
          onChange={() => onChange(selectedIds.includes(genre.id)
            ? selectedIds.filter(id => id !== genre.id)
            : [...selectedIds, genre.id])}
        />
        <span>{genre.name}</span>
      </label>)}
    </div>
    <button className="clear-filters" disabled={!selectedIds.length} onClick={() => onChange([])}>Clear filters</button>
  </fieldset>
}
