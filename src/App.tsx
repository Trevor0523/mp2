import { Link, Navigate, NavLink, Route, Routes } from 'react-router'
import { MovieList } from './pages/MovieList'
import { MovieDetails } from './pages/MovieDetails'
import { MovieGallery } from './pages/MovieGallery'
import './App.css'

export default function App() {
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Link className="brand" to="/movies">Movie Explorer</Link>
      <nav aria-label="Main navigation"><NavLink to="/movies" end>List</NavLink><NavLink to="/gallery">Gallery</NavLink></nav>
    </header>
    <main id="main"><Routes>
      <Route path="/" element={<Navigate to="/movies" replace />} />
      <Route path="/movies" element={<MovieList />} />
      <Route path="/movies/:movieId" element={<MovieDetails />} />
      <Route path="/gallery" element={<MovieGallery />} />
      <Route path="*" element={<section className="notice"><h1>Page not found</h1><Link to="/movies">Return to movies</Link></section>} />
    </Routes></main>
    <footer>Movie data and images from <a href="https://www.themoviedb.org/">TMDB</a>.</footer>
  </div>
}
