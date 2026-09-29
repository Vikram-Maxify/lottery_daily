import { useState } from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { adminLogin } from "../../reducer/slice/adminAuthReducer";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isAuthenticated,
    loading,
    error,
  } = useSelector(
    (state) => state.adminAuth
  );

  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      adminLogin(formData)
    );

    if (adminLogin.fulfilled.match(result)) {
      const from =
        location.state?.from?.pathname ||
        "/dashboard";

      navigate(from, {
        replace: true,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Card */}

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* Header */}

          <div className="text-center mb-8">

            <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-slate-900 flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                A
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Admin Login
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Login to access your admin panel
            </p>

          </div>

          {/* Error */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Mobile */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Mobile Number
              </label>

              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />

            </div>

            {/* Password */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />

            </div>

            {/* Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Admin Panel
        </p>

      </div>

    </div>
  );
};

export default Login;