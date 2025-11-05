import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

/**
 * ProtectedAdminRoute
 *
 * This component restricts access to its children to authenticated users with the "admin" role.
 * It checks for a valid JWT access token in cookies, verifies its expiration, and ensures the role is "admin".
 * If the user is not authorized, they are redirected to the admin login page.
 *
 * Usage:
 * <ProtectedAdminRoute>
 *   <AdminDashboard />
 * </ProtectedAdminRoute>
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Components to render if authorized
 * @returns {React.ReactNode}
 */
const ProtectedAdminRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    auth();
  }, []);

  /**
   * Checks authentication and authorization for admin access.
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
      const admin = JSON.parse(Cookies.get(decoded.user_id));
      if (admin.role !== "admin") {
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
  return isAuthorized ? children : <Navigate to="/admin/auth" />;
};

export default ProtectedAdminRoute;
