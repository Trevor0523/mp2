import axios from 'axios'
import type { Genre, MovieDetail, MoviePage } from '../types/movie'

const token = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN?.trim()
export const hasTmdbToken = Boolean(token)
const client = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 15000,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
  params: { language: 'en-US' },
})
// Cache successful responses only; never cache credentials or failed requests.
const cache = new Map<string, { value: unknown; expires: number }>()
async function get<T>(path: string, params: Record<string, string | number | boolean>, signal?: AbortSignal): Promise<T> {
  if (!token) throw new Error('TMDB is not configured. Add VITE_TMDB_READ_ACCESS_TOKEN to .env.local and restart the app.')
  const key = JSON.stringify([path, params])
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) return cached.value as T
  const { data } = await client.get<T>(path, { params, signal })
  if (cache.size >= 100) cache.delete(cache.keys().next().value!)
  cache.set(key, { value: data, expires: Date.now() + 5 * 60 * 1000 })
  return data
}
export function getMovies(query: string, page = 1, signal?: AbortSignal) {
  const normalized = query.trim()
  return get<MoviePage>(normalized ? '/search/movie' : '/discover/movie', {
    ...(normalized ? { query: normalized } : { sort_by: 'popularity.desc' }),
    include_adult: false, page,
  }, signal)
}
export function getMovie(id: number, signal?: AbortSignal) {
  return get<MovieDetail>(`/movie/${id}`, {}, signal)
}
export function getGenres(signal?: AbortSignal) {
  return get<{ genres: Genre[] }>('/genre/movie/list', {}, signal)
}
export function getGalleryMovies(genreIds: number[], page = 1, signal?: AbortSignal) {
  // TMDB uses pipes for OR: a movie can match any selected genre.
  return get<MoviePage>('/discover/movie', {
    sort_by: 'popularity.desc',
    include_adult: false,
    ...(genreIds.length ? { with_genres: [...genreIds].sort((a, b) => a - b).join('|') } : {}),
    page,
  }, signal)
}
export function posterUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : null
}
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) return 'TMDB rejected the access token. Check your API Read Access Token in the app configuration.'
    if (error.response?.status === 404) return 'This movie could not be found.'
    if (error.response?.status === 429) return 'TMDB is receiving too many requests. Please wait a moment and try again.'
    if (error.code === 'ECONNABORTED') return 'TMDB took too long to respond. Please try again.'
    return 'Could not reach TMDB. Check your connection and try again.'
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
