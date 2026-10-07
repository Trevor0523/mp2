import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Poster } from '../components/Poster'
import { apiErrorMessage, getMovies, hasTmdbToken } from '../services/tmdb'
import type { Movie, MovieNavigation } from '../types/movie'
import { sortMovies } from '../utils/movies'
import type { SortOrder, SortProperty } from '../utils/movies'

const MOVIE_LIMIT = 100

export function MovieList() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const rawSort = params.get('sort')
  const sort: SortProperty = rawSort === 'title' || rawSort === 'vote_average' || rawSort === 'release_date' || rawSort === 'popularity' ? rawSort : 'popularity'
  const order: SortOrder = params.get('order') === 'asc' ? 'asc' : 'desc'
  function update(name: string, value: string) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(name, value)
      else next.delete(name)
      return next
    }, { replace: true })
  }
  return <section>
    <p className="eyebrow">THE MOVIE COLLECTION</p><h1>Find your next great watch.</h1>
    <div className="toolbar">
      <label className="search-field">Search movies<input type="search" value={query} placeholder="Search by movie title…" onChange={event => update('q', event.target.value)} /></label>
      <label>Sort by<select value={sort} onChange={event => update('sort', event.target.value)}><option value="popularity">Popularity</option><option value="release_date">Release date</option><option value="vote_average">Rating</option><option value="title">Title</option></select></label>
      <label>Order<select value={order} onChange={event => update('order', event.target.value)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></label>
    </div>
    {hasTmdbToken ? <MovieResults query={query.trim()} sort={sort} order={order} />
      : <div className="notice" role="status"><h2>Connect to TMDB</h2><p>Set <code>VITE_TMDB_READ_ACCESS_TOKEN</code> in <code>.env.local</code> to your TMDB API Read Access Token, and restart the dev server.</p></div>}
  </section>
}

function MovieResults({ query, sort, order }: { query: string; sort: SortProperty; order: SortOrder }) {
  const location = useLocation()
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    async function loadMovies() {
      const collection = new Map<number, Movie>()
      let totalPages = 1
      for (let page = 1; page <= totalPages && collection.size < MOVIE_LIMIT; page += 1) {
        const data = await getMovies('', page, controller.signal)
        if (controller.signal.aborted) return []
        data.results.forEach(movie => collection.set(movie.id, movie))
        totalPages = data.total_pages
        if (!data.results.length) break
      }
      return [...collection.values()].slice(0, MOVIE_LIMIT)
    }
    loadMovies().then(results => {
      if (controller.signal.aborted) return
      setMovies(results)
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(apiErrorMessage(cause))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [attempt])
  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(query.trim().toLowerCase())
  )
  const sorted = sortMovies(filteredMovies, sort, order)
  const navigation: MovieNavigation = { ids: sorted.map(movie => movie.id), returnTo: location.pathname + location.search }
  return <div aria-busy={loading}>
    <div className="results-heading"><h2>{query ? `Results for “${query}”` : 'Popular movies'}</h2><span>{filteredMovies.length} movies</span></div>
    {error && <div className="notice error" role="alert"><p>{error}</p><button onClick={() => { setError(''); setLoading(true); setAttempt(value => value + 1) }}>Try again</button></div>}
    {!loading && !error && !filteredMovies.length && <p className="notice" role="status">No movies found. Try another title.</p>}
    <ul className="movie-list">{sorted.map(movie => <li key={movie.id}>
      <Link className="movie-row" to={`/movies/${movie.id}`} state={navigation}>
        <Poster path={movie.poster_path} title={movie.title} />
        <div className="movie-copy"><h3>{movie.title}</h3><p className="muted">{movie.release_date || 'Release date unknown'} <span aria-hidden="true">·</span> {(movie.vote_count ?? 0).toLocaleString()} votes</p><p className="overview">{movie.overview || 'No synopsis available.'}</p></div>
        <span className="rating" aria-label={`Rating ${(movie.vote_average ?? 0).toFixed(1)} out of 10`}>{(movie.vote_average ?? 0).toFixed(1)}<small>/ 10</small></span>
      </Link>
    </li>)}</ul>
    {loading && <p className="notice" role="status">Loading movies…</p>}
  </div>
}
