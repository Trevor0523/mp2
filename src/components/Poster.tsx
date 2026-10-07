import { useState } from 'react'
import { posterUrl } from '../services/tmdb'
export function Poster({ path, title }: { path: string | null; title: string }) {
  const [failedPath, setFailedPath] = useState<string | null>(null)
  const url = posterUrl(path)
  return url && failedPath !== path
    ? <img className="poster" src={url} alt={`${title} poster`} loading="lazy" onError={() => setFailedPath(path)} />
    : <div className="poster poster-placeholder" role="img" aria-label={`No poster available for ${title}`}>No poster</div>
}
