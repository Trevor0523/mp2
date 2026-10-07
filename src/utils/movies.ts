import type { Movie } from '../types/movie'
export type SortProperty = 'title' | 'vote_average' | 'release_date' | 'popularity'
export type SortOrder = 'asc' | 'desc'
export function sortMovies(movies: Movie[], property: SortProperty, order: SortOrder) {
  return [...movies].sort((a, b) => {
    const first = a[property]
    const second = b[property]
    // Unknown dates stay at the end in either direction.
    if (property === 'release_date' && (!first || !second)) return first ? -1 : second ? 1 : a.id - b.id
    const comparison = typeof first === 'number' && typeof second === 'number'
      ? first - second
      : String(first).localeCompare(String(second), 'en', { sensitivity: 'base' })
    return (order === 'asc' ? comparison : -comparison) || a.id - b.id
  })
}
