import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { getAdminProfile } from "../../reducer/slice/adminAuthReducer";

const PrivateRoute = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const { isAuthenticated, loading } = useSelector(
    (state) => state.adminAuth
  );

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        await dispatch(getAdminProfile()).unwrap();
      } catch (error) {
        console.log("Admin profile error:", error);
      } finally {
        setChecked(true);
      }
    };

    checkProfile();
  }, [dispatch]);


  // Profile API check hone tak loading
  if (!checked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg font-semibold">
          Loading...
        </div>
      </div>
    );
  }

  // Admin login nahi hai
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // Authenticated admin
  return <Outlet />;
};

export default PrivateRoute;