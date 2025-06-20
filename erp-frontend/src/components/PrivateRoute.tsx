import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: JSX.Element;
  roles?: string[]; // Optional: ['admin', 'manager']
};

const PrivateRoute = ({ children, roles }: Props) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

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
