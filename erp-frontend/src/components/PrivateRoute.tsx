import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

type Props = {
  children: React.ReactElement;
  roles?: string[]; // Optional: ['admin', 'manager']
};

const PrivateRoute = ({ children, roles }: Props) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // 🔄 Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner size="sm" text="Authenticating..." />;
  }

  // 🔐 If user is not logged in, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentRole = user.role;

  // 🚫 Role restriction check
  if (roles && !roles.includes(currentRole)) {
    console.warn(`Access denied for role: ${currentRole} to ${location.pathname}`);
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Authorized user with allowed role
  return children;
};

export default PrivateRoute;
