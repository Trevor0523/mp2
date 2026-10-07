export interface Movie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
}
export interface Genre { id: number; name: string }
export interface MovieDetail extends Omit<Movie, 'genre_ids'> {
  genres: Genre[]
  runtime: number | null
  tagline: string
  status: string
}
export interface MoviePage {
  page: number
  results: Movie[]
  total_pages: number
  total_results: number
}
export interface MovieNavigation { ids: number[]; returnTo: string }
