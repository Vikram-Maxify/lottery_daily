import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { fetchProfile } from "../reducer/slice/authSlice";

const PrivateRoute = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const profileRequested = useRef(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const {
    user,
    isAuthenticated,
    profileLoading,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    // User already exists in Redux
    if (user) {
      setCheckingAuth(false);
      return;
    }

    // Prevent duplicate profile requests
    if (profileRequested.current) return;

    profileRequested.current = true;

    dispatch(fetchProfile()).finally(() => {
      setCheckingAuth(false);
    });
  }, [dispatch, user]);

  // IMPORTANT:
  // Do not redirect before fetchProfile() has completed.
  if (checkingAuth || profileLoading) {
    return (
      <div className="min-h-screen bg-seth-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-seth-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Profile successfully restored
  if (user || isAuthenticated) {
    return <Outlet />;
  }

  // Profile request failed / no valid authentication
  return (
    <Navigate
      to="/login"
      replace
      state={{ from: location }}
    />
  );
};

export default PrivateRoute;