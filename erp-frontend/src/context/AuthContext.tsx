import { createContext, useContext, useState, useEffect, useMemo } from "react";

type User = {
  token: string;
  role: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, role: string) => void;
  logout: () => void;
};

const TOKEN_KEY = "token";
const ROLE_KEY = "role";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const role = localStorage.getItem(ROLE_KEY);
    if (token && role) {
      setUser({ token, role });
    }
  }, []);

  const login = (token: string, role: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
    setUser({ token, role });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem("userRole"); // clear role used in UserProfile
    setUser(null);
  };

  const value = useMemo(
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
