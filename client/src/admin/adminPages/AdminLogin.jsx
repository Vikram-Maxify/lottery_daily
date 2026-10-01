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

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    admin,
    isAuthenticated,
    loading,
    error,
  } = useSelector(
    (state) => state.adminAuth
  );
  console.log(admin);

  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });

  // Already logged in
  if (isAuthenticated && admin) {
    const role = String(
      admin?.role || ""
    ).toLowerCase();

    if (role === "admin") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // Input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Login submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await dispatch(
      adminLogin(formData)
    );

    if (adminLogin.fulfilled.match(result)) {
      const loggedAdmin = result.payload?.data;

      const role = String(
        loggedAdmin?.role || ""
      ).toLowerCase();

      console.log(
        "ADMIN LOGIN RESPONSE:",
        result.payload
      );
      console.log("ADMIN ROLE:", role);

      if (role === "admin") {
        navigate("/dashboard", {
          replace: true,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-2xl border border-[#F3E7C4] bg-white p-8 shadow-[0_10px_30px_-12px_rgba(247,181,0,0.35)]">

          {/* Header */}
          <div className="mb-8 text-center">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)]">
              <span className="text-xl font-extrabold">
                A
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Admin Login
            </h1>

            <p className="mt-2 text-sm text-[#6B7280]">
              Login to access your admin panel
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-[#F5C7C3] bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
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
              <label className="mb-2 block text-sm font-semibold text-[#1A1A1A]">
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
                className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:bg-[#F5F1E4] disabled:text-[#8A8F98]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1A1A1A]">
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
                className="w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:bg-[#F5F1E4] disabled:text-[#8A8F98]"
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-4 py-3 text-sm font-extrabold text-[#1A1204] shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#8A8F98]">
          Admin Panel
        </p>

      </div>
    </div>
  );
};

export default AdminLogin;