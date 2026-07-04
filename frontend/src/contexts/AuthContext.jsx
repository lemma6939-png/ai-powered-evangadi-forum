import {createContext, useContext, useState, useEffect} from "react";
/*sherd storage,comp can access/allow to read/creat state/run code,load,update.*/
import {useNavigate} from "react-router-dom";
/*navigate through pages,redirect to login page after logout.*/
import {authService} from "../services/auth/auth.service.js";
/**communicate with backend,lin,register,lout,check auth status,store user data in session storage.*/ 
/**
 * Authentication Context providing user state ,lin,lout,reg,load and auth methods avlable throughout the applicaton.
 */
const AuthContext = createContext(undefined);

/**
 * AuthProvider component that wraps the app to provide authentication context.
 */
export function AuthProvider({children}) {
  /*creates the provider component,evry comp insid provider can access auth data.
  */
  const [user, setUser] = useState(null);
  /*stores the logged in user. null no one is logged in,but after lo in,user info ,id,fn,email will stord*/
  const [loading, setLoading] = useState(true);
  /*tracks whether authentication verification is in progress. true means checking auth status, false means check complete.*/
  const navigate = useNavigate();
/*this a hook ,crate a navigation function eg navigate("/auth"); redirect user to login page*/
  // Initialize user state from session storage (authoritative) on mount
  useEffect(() => {
    const serviceAuth = authService.isAuthenticated();
    /*check if user is authenticated by checking if token exists in session storage. returns true or false.*/
    const storedUser = authService.getStoredUser()
    /*gets saved user info from session stage{id ,1,fn:"siyoum"} */

    if (serviceAuth && storedUser) {
      setUser(storedUser);
      /*cheks 2 things,valid session,userinfo exists
      restores user info in to react state,so app can use it to display user info and determine access to protected routes.
      */
      
    } else {
      setUser(null);//not logged in 
    }

    setLoading(false);//check complete,wether showpage,orbackto login page
  }, []);//run only once when component loads.

  /**
   * Registers a new user. Does not automatically log them in.
   * @param {Object} userData - { firstName, lastName, email, password }
   */
  const register = async (userData) => {
    setLoading(true);
    try {
      const {user} = await authService.register(userData);
      // Registration does not log user in automatically. Return the user
      // object so UI can prompt for login. Do NOT set any flags that make
      // the app believe the user is authenticated.
      // await is acollback function calls backend api to create new user.
      return {success: true, user};
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
//######################### the fourth comment
  // const register = async (userData) => {
  //   setLoading(true);
  //   try {
  //     const { user } = await authService.register(userData);
    // setUser(user);
  //     // Registration does not log user in automatically. Return the user
  //     // object so UI can prompt for login. Do NOT set any flags that make
  //     // the app believe the user is authenticated.
  //     return { success: true, user };
  //   } catch (error) {
  //     throw error;
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const register = async (userData) => {
  setLoading(true);

  try {
    const { user } = await authService.register(userData);

    setUser(user);

    return { success: true };
  } catch (error) {
    throw error;
  } finally {
    setLoading(false);
  }
};
  /**
   * Authenticates a user and updates the session state.
   * @param {Object} credentials - { email, password }
   */
  const login = async (credentials) => {
    setLoading(true);
    /*logs in an existing true user and show loading screen*/
    try {
      const {user} = await authService.login(credentials);
      setUser(user);
      /* cll backend login api ,Successful login stores token/user in sessionStorage via authService.login*/
      return {success: true};// return success result.
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }; 

  /**
   * Clears the user session and redirects to the login page.
   */
  const logout = () => {
    authService.logout();
    /* clears the user session by removing token/user info from sessionStorage */
    setUser(null);//clear react user state.
    navigate("/auth");//redirect to login page after logout.
  };

  // Context value with state and methods
  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };
/*logged user,auth loding status,reg fun,login fun,logout fun,boolean isAuthenticated true if user is logged in,false otherwise.*/
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access the authentication context.
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
/* this is asefty check user uses useauth  outside auth provider.*/
  return context;
}
/*returns the vallues,of the user,loading,register,login,logout,isAuthenticated to the comp that calls useAuth()*/