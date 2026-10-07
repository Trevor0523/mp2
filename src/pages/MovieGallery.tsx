import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { GenreFilters } from '../components/GenreFilters'
import { MovieCard } from '../components/MovieCard'
import { apiErrorMessage, getGalleryMovies, getGenres, hasTmdbToken } from '../services/tmdb'
import type { Genre, Movie, MovieNavigation } from '../types/movie'

const MOVIE_LIMIT = 100

export function MovieGallery() {
  return <section>
    <p className="eyebrow">THE MOVIE COLLECTION</p>
    <h1>Explore movies by genre.</h1>
    {hasTmdbToken ? <GalleryContent /> : <div className="notice" role="status">
      <h2>Connect to TMDB</h2>
      <p>Add your TMDB API Read Access Token to the app configuration and restart the dev server to explore the gallery.</p>
    </div>}
  </section>
}

function GalleryContent() {
  const [params, setParams] = useSearchParams()
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const requestedIds = (params.get('genres') ?? '').split(',').map(Number)
  // Only use IDs from TMDB's genre catalog, including for manually edited URLs.
  const selectedIds = genres.filter(genre => requestedIds.includes(genre.id)).map(genre => genre.id).sort((a, b) => a - b)
  const filterKey = selectedIds.join(',')

  useEffect(() => {
    const controller = new AbortController()
    getGenres(controller.signal).then(data => {
      if (!controller.signal.aborted) setGenres(data.genres)
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(apiErrorMessage(cause))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [attempt])

  function updateGenres(ids: number[]) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (ids.length) next.set('genres', [...ids].sort((a, b) => a - b).join(','))
      else next.delete('genres')
      return next
    }, { replace: true })
  }

  if (loading) return <p className="notice" role="status">Loading genres…</p>
  if (error) return <div className="notice error" role="alert">
    <p>{error}</p>
    <button onClick={() => { setError(''); setLoading(true); setAttempt(value => value + 1) }}>Try again</button>
  </div>

  return <>
    <GenreFilters genres={genres} selectedIds={selectedIds} onChange={updateGenres} />
    <GalleryResults filterKey={filterKey} />
  </>
}

function GalleryResults({ filterKey }: { filterKey: string }) {
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
        const data = await getGalleryMovies([], page, controller.signal)
        if (controller.signal.aborted) return []
        data.results.forEach(movie => collection.set(movie.id, movie))
        totalPages = data.total_pages
        if (!data.results.length) break
      }
      return [...collection.values()].slice(0, MOVIE_LIMIT)
    }
    loadMovies().then(results => {
      if (!controller.signal.aborted) setMovies(results)
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(apiErrorMessage(cause))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [attempt])

  const ids = filterKey ? filterKey.split(',').map(Number) : []
  const filteredMovies = ids.length
    ? movies.filter(movie =>
        movie.genre_ids.some(id => ids.includes(id))
      )
    : movies

  const navigation: MovieNavigation = {
    ids: filteredMovies.map(movie => movie.id),
    returnTo: location.pathname + location.search,
  }
  return <div aria-busy={loading}>
    <div className="results-heading">
      <h2>{filterKey ? 'Matching movies' : 'Popular movies'}</h2>
      <span aria-live="polite">{loading ? 'Loading movies…' : `${filteredMovies.length} movies`}</span>
    </div>
    {error && <div className="notice error" role="alert">
      <p>{error}</p>
      <button onClick={() => { setError(''); setLoading(true); setAttempt(value => value + 1) }}>Try again</button>
    </div>}
    {loading && <p className="notice" role="status">Loading movie posters…</p>}
    {!loading && !error && !filteredMovies.length && <p className="notice" role="status">No movies match these genres. Try another selection or clear the filters.</p>}
    <ul className="movie-gallery">
      {filteredMovies.map(movie => <li key={movie.id}><MovieCard movie={movie} navigation={navigation} /></li>)}
    </ul>
  </div>
}
