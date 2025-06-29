import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

type User = {
  token: string;
  role: string;
  originalRole?: string;
  name?: string;
  email?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  getAuthHeaders: () => HeadersInit;
};

const USER_KEY = "user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Validate that the token exists and is not expired
          if (parsedUser.token && isTokenValid(parsedUser.token)) {
            setUser(parsedUser);
          } else {
            // Token is invalid or expired, remove it
            localStorage.removeItem(USER_KEY);
          }
        }
      } catch (err) {
        console.error("❌ Invalid user data in localStorage");
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Helper function to check if token is valid (not expired)
  const isTokenValid = (token: string): boolean => {
    try {
      // Decode JWT payload (second part of token)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token has expiration and if it's still valid
      if (payload.exp && payload.exp < currentTime) {
        return false; // Token expired
      }
      
      return true; // Token is valid
    } catch (error) {
      // Invalid token format
      return false;
    }
  };

  const login = (userData: User) => {
    // If originalRole is already set in localStorage, preserve it
    const stored = localStorage.getItem(USER_KEY);
    let preservedOriginalRole = userData.role;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        preservedOriginalRole = parsed.originalRole || parsed.role;
      } catch {
        preservedOriginalRole = userData.role;
      }
    }

    const enrichedUser: User = {
      ...userData,
      originalRole: preservedOriginalRole,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));
    setUser(enrichedUser);
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const getAuthHeaders = (): HeadersInit => {
    return user?.token
      ? { Authorization: `Bearer ${user.token}` }
      : {};
  };

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!user,
      user,
      isLoading,
      login,
      logout,
      getAuthHeaders,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
