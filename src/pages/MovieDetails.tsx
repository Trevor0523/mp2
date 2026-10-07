import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Poster } from '../components/Poster'
import { apiErrorMessage, getMovie } from '../services/tmdb'
import type { MovieDetail, MovieNavigation } from '../types/movie'

export function MovieDetails() {
  const { movieId = '' } = useParams()
  return /^\d+$/.test(movieId) && Number.isSafeInteger(Number(movieId)) && Number(movieId) > 0
    ? <DetailContent key={movieId} id={Number(movieId)} />
    : <section className="notice"><h1>Invalid movie ID</h1><Link to="/movies">Return to movies</Link></section>
}
function readNavigation(value: unknown): MovieNavigation | null {
  if (!value || typeof value !== 'object') return null
  const state = value as Partial<MovieNavigation>
  if (!Array.isArray(state.ids) || !state.ids.every(id => Number.isSafeInteger(id) && id > 0)) return null
  if (typeof state.returnTo !== 'string' || !/^\/(?:movies|gallery)(?:\?|$)/.test(state.returnTo)) return null
  return { ids: state.ids, returnTo: state.returnTo }
}
function DetailContent({ id }: { id: number }) {
  const location = useLocation()
  const navigation = readNavigation(location.state)
  const fromGallery = navigation?.returnTo.split('?')[0] === '/gallery'
  const [movie, setMovie] = useState<MovieDetail | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    getMovie(id, controller.signal).then(data => {
      if (!controller.signal.aborted) setMovie(data)
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(apiErrorMessage(cause))
    })
    return () => controller.abort()
  }, [id, attempt])
  const position = navigation?.ids.indexOf(id) ?? -1
  const previous = position > 0 ? navigation?.ids[position - 1] : undefined
  const next = position >= 0 ? navigation?.ids[position + 1] : undefined
  return <section>
    <Link className="back-link" to={navigation?.returnTo ?? '/movies'}>← {fromGallery ? 'Back to gallery' : 'Back to movies'}</Link>
    {error ? <div className="notice error" role="alert"><p>{error}</p><button onClick={() => { setError(''); setAttempt(value => value + 1) }}>Try again</button></div>
      : movie ? <article className="movie-detail"><Poster path={movie.poster_path} title={movie.title} /><div>
        <p className="eyebrow">MOVIE DETAILS</p><h1>{movie.title}</h1>
        {movie.tagline && <p>{movie.tagline}</p>}
        <p>{movie.overview || 'No synopsis available.'}</p>
        <dl><dt>Release date</dt><dd>{movie.release_date || 'Unknown'}</dd><dt>Rating</dt><dd>{movie.vote_average.toFixed(1)} / 10 ({movie.vote_count.toLocaleString()} votes)</dd><dt>Runtime</dt><dd>{movie.runtime ? `${movie.runtime} minutes` : 'Unknown'}</dd><dt>Genres</dt><dd>{movie.genres.map(genre => genre.name).join(', ') || 'Unknown'}</dd><dt>Status</dt><dd>{movie.status}</dd></dl>
      </div></article> : <p className="notice" role="status">Loading movie details…</p>}
    <nav className="detail-navigation" aria-label="Movie navigation">
      {previous ? <Link className="button" to={`/movies/${previous}`} state={navigation}>← Previous</Link> : <button disabled>← Previous</button>}
      {next ? <Link className="button" to={`/movies/${next}`} state={navigation}>Next →</Link> : <button disabled>Next →</button>}
    </nav>
    <p className="muted">{position >= 0 ? `Movie ${position + 1} of ${navigation!.ids.length} in your ${fromGallery ? 'filtered gallery' : 'loaded, sorted results'}.` : 'Open a movie from the list or gallery to browse previous and next results.'}</p>
  </section>
}
