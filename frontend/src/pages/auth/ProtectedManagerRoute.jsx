import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

/**
 * ProtectedManagerRoute
 *
 * This component restricts access to its children to authenticated users with the "manager" role.
 * It checks for a valid JWT access token in cookies, verifies its expiration, and ensures the role is "manager".
 * If the user is not authorized, they are redirected to the manager login page.
 *
 * Usage:
 * <ProtectedManagerRoute>
 *   <ManagerDashboard />
 * </ProtectedManagerRoute>
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Components to render if authorized
 * @returns {React.ReactNode}
 */
const ProtectedManagerRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    auth();
  }, []);

  /**
   * Checks authentication and authorization for manager access.
   * Sets isAuthorized state based on token validity and role.
   */
  const auth = () => {
    const token = Cookies.get("access");
    if (!token) {
      setIsAuthorized(false);
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const tokenExpiration = decoded.exp;
      const now = Date.now() / 1000;
      if (tokenExpiration < now) {
        setIsAuthorized(false);
        return;
      }
      const manager = JSON.parse(Cookies.get(decoded.user_id));
      if (manager.role !== "manager") {
        setIsAuthorized(false);
        return;
      }
      setIsAuthorized(true);
    } catch {
      setIsAuthorized(false);
    }
  };

  // Show loading indicator while checking authorization
  if (isAuthorized === null) {
    return <div>...</div>;
  }

  // Render children if authorized, otherwise redirect to login
  return isAuthorized ? children : <Navigate to="/manager/login" />;
};

export default ProtectedManagerRoute;
