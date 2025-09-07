import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Global access token getter - will be set by AuthProvider
let getAccessToken: (() => string | null) | null = null;

export function setAuthTokenGetter(tokenGetter: () => string | null) {
  getAccessToken = tokenGetter;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Get fresh token for each request
    const token = getAccessToken?.();
    
    if (!token) {
      throw new Error('No valid authentication session - please log in');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Enhanced error handling with better messaging
    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = res.statusText || errorMessage;
      }
      
      // Special handling for auth errors
      if (res.status === 401) {
        throw new Error(`Authentication failed: ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
    }

    return res;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('🚨 API Request Error:', { method, url, error: errorMessage });
    throw error;
  }
}

type UnauthorizedBehaviour = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehaviour;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehaviour }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add Bearer token if available
    const token = getAccessToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehaviour === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
