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
  id?: string; // Decoded user ID from JWT
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  getAuthHeaders: () => HeadersInit;
  isManagerReadOnly: () => boolean;
};

const USER_KEY = "user";
const TOKEN_KEY = "token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Validate JWT expiration
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  // ✅ Restore user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        const parsed: User = JSON.parse(storedUser);
        if (parsed.token && isTokenValid(parsed.token)) {
          setUser(parsed);
          localStorage.setItem(TOKEN_KEY, parsed.token); // ensure token is restored
        } else {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (err) {
        console.error("Failed to parse stored user:", err);
      }
    }
    setIsLoading(false);
  }, []);

  // ✅ Login handler
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

    // ✅ Decode ID from token
    let decodedId: string | undefined;
    try {
      const payload = JSON.parse(atob(userData.token.split(".")[1]));
      decodedId = payload.id || payload._id;
    } catch {
      decodedId = undefined;
    }

    const enrichedUser: User = {
      ...userData,
      originalRole: preservedOriginalRole,
      id: decodedId,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));
    localStorage.setItem(TOKEN_KEY, userData.token);

    setUser(enrichedUser);
  };

  // ✅ Logout handler
  const logout = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  // ✅ Headers for secure API usage
  const getAuthHeaders = (): HeadersInit => {
    const token = user?.token || localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ✅ Helper: detect manager role (case-insensitive) for read-only enforcement
  const isManagerReadOnly = () => {
    const role = user?.role?.toLowerCase();
    return role === 'manager';
  };

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!user,
      user,
      isLoading,
      login,
      logout,
      getAuthHeaders,
      isManagerReadOnly,
    }),
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
