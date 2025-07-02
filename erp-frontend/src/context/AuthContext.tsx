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
  id?: string; // ✅ NEW: User ID for tracking who added/updated follow-ups
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
          if (parsedUser.token && isTokenValid(parsedUser.token)) {
            setUser(parsedUser);
          } else {
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

  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) return false;
      return true;
    } catch (error) {
      return false;
    }
  };

  const login = (userData: User) => {
    let preservedOriginalRole = userData.role;

    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        preservedOriginalRole = parsed.originalRole || parsed.role;
      } catch {
        preservedOriginalRole = userData.role;
      }
    }

    // ✅ Try to decode user ID from token payload
    let decodedId: string | undefined;
    try {
      const payload = JSON.parse(atob(userData.token.split(".")[1]));
      decodedId = payload.id || payload._id; // JWT might have id or _id
    } catch (e) {
      decodedId = undefined;
    }

    const enrichedUser: User = {
      ...userData,
      originalRole: preservedOriginalRole,
      id: decodedId,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));
    setUser(enrichedUser);
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const getAuthHeaders = (): HeadersInit => {
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
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
