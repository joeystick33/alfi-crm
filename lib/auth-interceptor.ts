// Intercepteur pour déconnecter automatiquement en cas d'erreur 401/403

export async function authFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  
  // Si 401 ou 403, déconnecter et rediriger
  if (response.status === 401 || response.status === 403) {
    // Déconnexion
    await fetch('/api/auth/logout', { method: 'POST' })
    
    // Redirection vers login
    window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
    
    throw new Error('Session expirée ou accès non autorisé')
  }
  
  return response
}
