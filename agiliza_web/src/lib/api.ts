export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (typeof window !== 'undefined') {
    // Se o usuario configurou NEXT_PUBLIC_API_URL customizado, usa ele
    if (process.env.NEXT_PUBLIC_API_URL) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL.endsWith('/') 
        ? process.env.NEXT_PUBLIC_API_URL.slice(0, -1) 
        : process.env.NEXT_PUBLIC_API_URL;
      return `${baseUrl}${cleanEndpoint.startsWith('/api') ? cleanEndpoint : '/api' + cleanEndpoint}`;
    }
    
    // Padrao em producao e desenvolvimento: utilizar path relativo '/api' roteado pelo Nginx
    return cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  }
  
  // No servidor (SSR)
  return `${cleanEndpoint.startsWith('/api') ? cleanEndpoint : '/api' + cleanEndpoint}`;
};
