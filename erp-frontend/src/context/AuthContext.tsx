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
  login: (userData: User) => void;
  logout: () => void;
};

const USER_KEY = "user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("❌ Invalid user data in localStorage");
        localStorage.removeItem(USER_KEY);
      }
    }
  }, []);

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

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!user,
      user,
      login,
      logout,
    }),
    [user]
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
