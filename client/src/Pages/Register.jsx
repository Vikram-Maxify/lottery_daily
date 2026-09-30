import {
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { register } from "../reducer/slice/authSlice";

// ⚠️ Apne bottom navbar ki height (px). Content isse peeche nahi chhupega.
// Agar is page par navbar nahi hai to 0 kar do.
const BOTTOM_NAV_HEIGHT = 64;

const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=1200&q=70";

const inputWrap =
  "flex h-[52px] w-full items-center overflow-hidden rounded-xl border border-[#d6dfec] bg-[#eaf1ff] transition-all focus-within:border-[#ed1d43] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(237,29,67,0.12)]";

const inputBase =
  "h-full min-w-0 flex-1 border-none bg-transparent text-[14px] font-medium text-[#173e70] outline-none placeholder:text-[#8a97ab] focus:outline-none focus:ring-0 disabled:opacity-60";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    number: "",
    name: "",
    password: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const { registerLoading, registerError } = useSelector(
    (state) => state.auth
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "number") {
      const numericValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        [name]: numericValue,
      }));

      if (error) setError("");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.number ||
      !form.name ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (form.number.length !== 10) {
      setError("Mobile number must be 10 digits");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const result = await dispatch(
      register({
        name: form.name.trim(),
        mobile: form.number,
        password: form.password,
      })
    );

    if (register.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#EBF0F7]">
      <div
        className="mx-auto w-full max-w-[500px]"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 16 }}
      >
        {/* ================= BANNER ================= */}
        <section
          className="relative isolate overflow-hidden bg-[#1a0a1c] bg-cover bg-center"
          style={{ backgroundImage: `url(${BANNER_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#06132d]/95 via-[#3b0d1c]/88 to-[#7a0f1e]/80" />
          <div className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-[#ff1744]/25 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-[#ff8a00]/30 blur-3xl" />

          <Sparkles
            size={18}
            className="pointer-events-none absolute right-[8%] top-3 text-[#ffb82e]/80"
          />
          <Sparkles
            size={12}
            className="pointer-events-none absolute left-[46%] top-[18%] text-[#ffcf4a]/70"
          />
          <Sparkles
            size={14}
            className="pointer-events-none absolute bottom-[30%] left-[3%] text-[#ff3155]/70"
          />

          <div className="relative grid grid-cols-[1fr_1.05fr] items-center gap-1 px-4 pb-14 pt-5">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white">
                Join India's Most Exciting
              </p>

              <h1 className="mt-0.5 font-black leading-[0.9] tracking-tight">
                <span className="block bg-gradient-to-b from-[#ffe08a] to-[#e0a11b] bg-clip-text text-[50px] text-transparent">
                  DEAR
                </span>
                <span className="block text-[32px] text-white">LOTTERY</span>
              </h1>

              <p className="mt-1.5 text-[14px] font-medium leading-tight text-white">
                Register Today
                <br />
                Win Big
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <Coin className="-left-1 top-[22%] h-7 w-7 rotate-[-20deg]" />
              <Coin className="-right-1 top-[46%] h-7 w-7 rotate-[15deg]" />

              <div className="relative w-full max-w-[220px]">
                <div
                  className="relative z-10 rotate-[3deg] rounded-[0.9em] border-[0.35em] border-[#f7d9a8] bg-[#fffaf0] p-[0.55em] shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                  style={{ fontSize: "10px" }}
                >
                  <div className="absolute -inset-[0.3em] rounded-[1em] border border-[#ff4d68]/50" />

                  <div className="border border-[#e5c8a4] p-[0.55em]">
                    <div className="flex items-center gap-[0.4em]">
                      <div className="flex h-[2.3em] w-[2.3em] shrink-0 items-center justify-center rounded-full bg-[#d7193f] text-white">
                        <Crown size="1.3em" />
                      </div>
                      <p className="text-[0.72em] font-bold leading-tight text-[#d22a43]">
                        Nagaland State Lotteries
                      </p>
                    </div>

                    <p className="text-[2.8em] font-black leading-[0.95] text-[#d7193f]">
                      DEAR
                    </p>

                    <div className="flex items-center justify-between gap-[0.3em]">
                      <div>
                        <p className="text-[0.6em] font-bold text-[#d7193f]">
                          First Prize
                        </p>
                        <p className="whitespace-nowrap text-[2.4em] font-black leading-none text-[#153c78]">
                          1 CRORE
                        </p>
                      </div>

                      <div className="flex h-[3em] w-[3em] shrink-0 flex-col items-center justify-center rounded-full bg-[#d7198c] text-center text-[0.6em] font-black leading-tight text-white">
                        Price
                        <span className="text-[1.25em]">₹6/-</span>
                      </div>
                    </div>

                    <div className="mt-[0.4em] border-y border-[#d7bba5] py-[0.25em] text-center">
                      <p className="text-[0.5em] font-bold text-[#26354b]">
                        Ticket Number
                      </p>
                      <p className="text-[1.7em] font-black tracking-[0.2em] text-[#173e70]">
                        10F 68057
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mx-auto -mt-3 h-6 w-[92%] rounded-[50%] bg-gradient-to-r from-[#8a5210] via-[#ffd85c] to-[#8a5210] shadow-[0_0_30px_rgba(255,190,50,0.6)]" />
              </div>
            </div>
          </div>
        </section>

        {/* ================= REGISTER CARD (sirf ek border + ek padding) ================= */}
        <div className="relative z-10 mx-3 -mt-8 rounded-[20px] border border-[#e6c97c]/70 bg-[#fffaf4] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
          <div className="mb-4 text-center">
            <h1 className="text-[23px] font-extrabold leading-[1.25] text-[#173e70]">
              Create Your <span className="text-[#d7193f]">Account</span>
            </h1>

            <p className="mt-1 text-[12px] text-[#4b5563]">
              Join now and start your winning journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {/* MOBILE */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <Smartphone
                  size={20}
                  strokeWidth={2.3}
                  className="text-[#d7193f]"
                />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <div className="flex h-full shrink-0 items-center px-2 text-[14px] font-semibold text-[#173e70]">
                +91
              </div>

              <input
                type="tel"
                name="number"
                maxLength={10}
                value={form.number}
                onChange={handleChange}
                placeholder="Enter your mobile number"
                autoComplete="tel"
                disabled={registerLoading}
                className={inputBase}
              />
            </div>

            {/* NAME */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <User
                  size={20}
                  strokeWidth={2.3}
                  className="text-[#d7193f]"
                />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={registerLoading}
                className={`${inputBase} px-3`}
              />
            </div>

            {/* PASSWORD */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <Lock
                  size={20}
                  strokeWidth={2.3}
                  className="text-[#d7193f]"
                />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <input
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={registerLoading}
                className={`${inputBase} px-3`}
              />

              <button
                type="button"
                onClick={() => setShowPass((prev) => !prev)}
                disabled={registerLoading}
                aria-label="Show or hide password"
                className="flex h-full w-[45px] shrink-0 items-center justify-center"
              >
                {showPass ? (
                  <EyeOff
                    size={19}
                    strokeWidth={2.3}
                    className="text-[#173e70]"
                  />
                ) : (
                  <Eye
                    size={19}
                    strokeWidth={2.3}
                    className="text-[#173e70]"
                  />
                )}
              </button>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <Lock
                  size={20}
                  strokeWidth={2.3}
                  className="text-[#d7193f]"
                />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={registerLoading}
                className={`${inputBase} px-3`}
              />

              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                disabled={registerLoading}
                aria-label="Show or hide confirm password"
                className="flex h-full w-[45px] shrink-0 items-center justify-center"
              >
                {showConfirm ? (
                  <EyeOff
                    size={19}
                    strokeWidth={2.3}
                    className="text-[#173e70]"
                  />
                ) : (
                  <Eye
                    size={19}
                    strokeWidth={2.3}
                    className="text-[#173e70]"
                  />
                )}
              </button>
            </div>

            {(error || registerError) && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                {error || registerError}
              </p>
            )}

            {/* REGISTER BUTTON */}
            <button
              type="submit"
              disabled={registerLoading}
              className="mt-0.5 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-[17px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.4)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registerLoading ? (
                <>
                  <Loader2
                    size={19}
                    strokeWidth={3}
                    className="animate-spin"
                  />
                  Registering...
                </>
              ) : (
                <>
                  Register Now
                  <ArrowRight size={21} strokeWidth={2.8} />
                </>
              )}
            </button>

            {/* DIVIDER */}
            <div className="my-1 flex items-center gap-2.5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d8c8ad]" />
              <span className="whitespace-nowrap text-[11px] text-[#6b7280]">
                Already have an account?
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d8c8ad]" />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              disabled={registerLoading}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#173e70] to-[#0d2547] text-[15px] font-bold text-white shadow-lg transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Login
              <ArrowRight size={19} strokeWidth={2.8} />
            </button>
          </form>

          {/* FEATURES */}
          <div className="mt-5 grid grid-cols-3 border-t border-[#d8c8ad] pt-4">
            <Feature
              icon={<Zap size={20} fill="currentColor" strokeWidth={2.2} />}
              lines={["Fast", "Registration"]}
            />
            <Feature
              icon={<ShieldCheck size={21} strokeWidth={2.2} />}
              lines={["100%", "Secure"]}
            />
            <Feature
              icon={<Users size={21} strokeWidth={2.2} />}
              lines={["Thousands", "of Players"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Coin = ({ className = "" }) => (
  <div
    className={`absolute z-20 flex items-center justify-center rounded-full border-2 border-[#f5bf35] bg-gradient-to-br from-[#fff08a] to-[#d9950b] text-xs font-black text-[#855500] shadow-lg ${className}`}
  >
    ₹
  </div>
);

const Feature = ({ icon, lines }) => (
  <div className="flex flex-col items-center px-1 text-center">
    <div className="mb-1.5 flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d8c8ad] bg-[#f7f0e4] text-[#173e70]">
      {icon}
    </div>

    <p className="text-[10px] font-medium leading-[1.3] text-[#344054]">
      {lines[0]}
      <br />
      {lines[1]}
    </p>
  </div>
);

export default Register;