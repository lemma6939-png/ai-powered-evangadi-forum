import { Navigate, useLocation } from 'react-router-dom';
//imp 2 features.direct to another page,info about current url location.
import { useAuth } from '../../contexts/AuthContext.jsx';
//custom auth hook,login,loading.
import styles from './ProtectedRoute.module.css';

/**
 * Wraps protected pages and redirects unauthenticated users to the login page,
 * preserving the original URL for post-login redirection.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  // get autinticated data from custom hook,the retern is bullian.
  const location = useLocation();
// where the data locat /dashbord,/api..
  // Session restore: show a neutral full-page loader (no route flash).
  if (loading) {
    return (
      <div className={styles.protectedRoute__screen} role='status'>
        //creat full screen with text,/help screen reader read.
        <div className={styles.protectedRoute__spinner} aria-hidden />
        //display loading spinner/ignore by screen reader.
        <span>Checking your session…</span>
        //display text for screen reader.
      </div>
    );
  }

  // Redirect to /auth if not authenticated, preserving the original URL
  if (!isAuthenticated) {
    return <Navigate to='/auth' state={{ from: location }} replace />;
  }
  //if true redirec to the destinaton page,if false remain until(replace) login.

  // Render children if authenticated
  return children;
}
// /dashbord. profile,setting.


