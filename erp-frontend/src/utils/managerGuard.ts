// Utility to prevent managers from performing write actions on the client side.
// Use this in onClick handlers before triggering create/update/delete.
// Provides a uniform popup message.
import { useAuth } from '../context/AuthContext';

export function useManagerGuard(message = 'You are a manager and have read-only access.') {
  const { isManagerReadOnly } = useAuth();

  const guard = () => {
    if (isManagerReadOnly()) {
      alert(message);
      return true; // blocked
    }
    return false; // allowed
  };

  return { guard, isReadOnly: isManagerReadOnly() };
}
