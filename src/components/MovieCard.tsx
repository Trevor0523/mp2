import { Link } from 'react-router'
import type { Movie, MovieNavigation } from '../types/movie'
import { Poster } from './Poster'

interface MovieCardProps {
  movie: Movie
  navigation: MovieNavigation
}

export function MovieCard({ movie, navigation }: MovieCardProps) {
  return <Link className="movie-card" to={`/movies/${movie.id}`} state={navigation}>
    <Poster path={movie.poster_path} title={movie.title} />
    <div className="movie-card-copy">
      <h3>{movie.title}</h3>
      <div className="movie-card-meta">
        <span className="muted">{movie.release_date?.slice(0, 4) || 'Year unknown'}</span>
        <span className="movie-card-rating" aria-label={`Rating ${movie.vote_average.toFixed(1)} out of 10`}>
          {movie.vote_average.toFixed(1)} <small>/ 10</small>
        </span>
      </div>
    </div>
  </Link>
}
