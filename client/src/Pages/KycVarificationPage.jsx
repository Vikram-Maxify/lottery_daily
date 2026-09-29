import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ⚠️ Apne bottom navbar ki height (px)
const BOTTOM_NAV_HEIGHT = 64;

const MAX_FILE_MB = 5;

const BANNER_IMAGE =
  "https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=1200&q=70";

const inputWrap =
  "flex h-[52px] w-full items-center overflow-hidden rounded-xl border border-[#d6dfec] bg-[#eaf1ff] transition-all focus-within:border-[#ed1d43] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(237,29,67,0.12)]";

const inputBase =
  "h-full min-w-0 flex-1 border-none bg-transparent text-[14px] font-medium text-[#173e70] outline-none placeholder:text-[#8a97ab] focus:outline-none focus:ring-0 disabled:opacity-60";

const emptyFile = { file: null, preview: "" };

const todayString = () => new Date().toISOString().split("T")[0];

const getAge = (dob) => {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
};

const KycVarificationPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", dob: "" });

  const [files, setFiles] = useState({
    aadhaarFront: emptyFile,
    aadhaarBack: emptyFile,
    pan: emptyFile,
    selfie: emptyFile,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      Object.values(files).forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleFile = (key, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG or PNG)");
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_FILE_MB} MB`);
      return;
    }

    setFiles((prev) => {
      if (prev[key].preview) URL.revokeObjectURL(prev[key].preview);
      return {
        ...prev,
        [key]: { file, preview: URL.createObjectURL(file) },
      };
    });

    setError("");
    setSuccess("");
  };

  const removeFile = (key) => {
    setFiles((prev) => {
      if (prev[key].preview) URL.revokeObjectURL(prev[key].preview);
      return { ...prev, [key]: emptyFile };
    });
  };

  const uploadedCount = Object.values(files).filter((f) => f.file).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.name.trim().length < 3) {
      setError("Please enter your full name");
      return;
    }

    if (!form.dob) {
      setError("Please select your date of birth");
      return;
    }

    if (getAge(form.dob) < 18) {
      setError("You must be at least 18 years old");
      return;
    }

    if (!files.aadhaarFront.file) {
      setError("Please upload Aadhaar card front photo");
      return;
    }

    if (!files.aadhaarBack.file) {
      setError("Please upload Aadhaar card back photo");
      return;
    }

    if (!files.pan.file) {
      setError("Please upload PAN card photo");
      return;
    }

    if (!files.selfie.file) {
      setError("Please take your selfie");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("dob", form.dob);
      formData.append("aadhaarFront", files.aadhaarFront.file);
      formData.append("aadhaarBack", files.aadhaarBack.file);
      formData.append("pan", files.pan.file);
      formData.append("selfie", files.selfie.file);

      // TODO: apni KYC API / redux dispatch yahan lagao
      console.log("KYC SUBMIT", Object.fromEntries(formData.entries()));

      setSuccess("KYC submitted. Verification usually takes some time.");
    } catch (err) {
      setError(err?.message || "Could not submit KYC. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#EBF0F7]">
      <div
        className="mx-auto w-full max-w-[480px]"
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

          <div className="relative grid grid-cols-[1fr_auto] items-center gap-3 px-4 pb-14 pt-6">
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-white">
                Secure your account with
              </p>

              <h1 className="mt-0.5 font-black leading-[0.9] tracking-tight">
                <span className="block bg-gradient-to-b from-[#ffe08a] to-[#e0a11b] bg-clip-text text-[44px] text-transparent">
                  KYC
                </span>
                <span className="block text-[26px] text-white">
                  VERIFICATION
                </span>
              </h1>

              <p className="mt-1.5 text-[13px] font-medium leading-tight text-white">
                Quick, Safe
                <br />
                &amp; Easy
              </p>
            </div>

            <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-full border-[3px] border-[#f7d9a8] bg-gradient-to-br from-[#fff8e6] to-[#ffe9b8] shadow-[0_0_30px_rgba(255,190,50,0.6)]">
              <ShieldCheck size={54} className="text-[#d7193f]" strokeWidth={2} />
              <span className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#14a06a] text-white shadow-lg">
                <BadgeCheck size={20} />
              </span>
            </div>
          </div>
        </section>

        {/* ================= KYC CARD ================= */}
        <div className="relative z-10 mx-3 -mt-8 rounded-[20px] border border-[#e6c97c]/70 bg-[#fffaf4] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
          <div className="mb-4 text-center">
            <h1 className="text-[23px] font-extrabold leading-[1.25] text-[#173e70]">
              Verify Your <span className="text-[#d7193f]">Identity</span>
            </h1>

            <p className="mt-1 text-[12px] text-[#4b5563]">
              Complete KYC to start withdrawing your winnings
            </p>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3e9f3]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff1744] to-[#e0102f] transition-all"
                  style={{ width: `${(uploadedCount / 4) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[#173e70]">
                {uploadedCount}/4 photos
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {/* NAME */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <User size={20} strokeWidth={2.3} className="text-[#d7193f]" />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name (as on Aadhaar)"
                autoComplete="name"
                disabled={loading}
                className={`${inputBase} px-3`}
              />
            </div>

            {/* DOB */}
            <div className={inputWrap}>
              <div className="flex w-[45px] shrink-0 justify-center">
                <Calendar
                  size={20}
                  strokeWidth={2.3}
                  className="text-[#d7193f]"
                />
              </div>

              <div className="h-[28px] w-px shrink-0 bg-[#d6dfec]" />

              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                max={todayString()}
                disabled={loading}
                className={`${inputBase} px-3`}
              />
            </div>

            {/* SECTION: AADHAAR */}
            <SectionTitle title="Aadhaar Card" note="Front & back both" />

            <div className="grid grid-cols-2 gap-2.5">
              <UploadBox
                label="Front side"
                hint="Aadhaar front"
                data={files.aadhaarFront}
                disabled={loading}
                icon="file"
                onPick={(file) => handleFile("aadhaarFront", file)}
                onRemove={() => removeFile("aadhaarFront")}
              />
              <UploadBox
                label="Back side"
                hint="Aadhaar back"
                data={files.aadhaarBack}
                disabled={loading}
                icon="file"
                onPick={(file) => handleFile("aadhaarBack", file)}
                onRemove={() => removeFile("aadhaarBack")}
              />
            </div>

            {/* SECTION: PAN */}
            <SectionTitle title="PAN Card" note="Front side only" />

            <UploadBox
              label="Front side"
              hint="PAN card front"
              data={files.pan}
              disabled={loading}
              icon="file"
              onPick={(file) => handleFile("pan", file)}
              onRemove={() => removeFile("pan")}
            />

            {/* SECTION: SELFIE */}
            <SectionTitle title="Your Selfie" note="Clear face, good light" />

            <UploadBox
              label="Take selfie"
              hint="Open camera"
              icon="camera"
              selfie
              data={files.selfie}
              disabled={loading}
              onPick={(file) => handleFile("selfie", file)}
              onRemove={() => removeFile("selfie")}
            />

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[11px] font-medium text-red-600">
                {error}
              </p>
            )}

            {success && (
              <p className="flex items-center justify-center gap-1.5 rounded-lg border border-[#bfe8d3] bg-[#e7f8ef] px-3 py-1.5 text-center text-[11px] font-medium text-[#14805a]">
                <CheckCircle2 size={14} />
                {success}
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="mt-0.5 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff1744] to-[#e0102f] text-[17px] font-extrabold text-white shadow-[0_8px_25px_rgba(255,20,67,0.4)] transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={19} strokeWidth={3} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit KYC
                  <ArrowRight size={21} strokeWidth={2.8} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="flex h-[46px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#173e70] to-[#0d2547] text-[14px] font-bold text-white shadow-lg transition active:scale-[0.985] disabled:opacity-60"
            >
              Do it later
            </button>
          </form>

          <p className="mt-4 border-t border-[#d8c8ad] pt-3 text-center text-[10px] leading-snug text-[#6b7280]">
            Upload clear, uncropped photos. Your documents are used only for
            identity verification.
          </p>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SMALL COMPONENTS
// =====================================================

const SectionTitle = ({ title, note }) => (
  <div className="mt-2 flex items-end justify-between">
    <h3 className="text-[14px] font-extrabold text-[#173e70]">{title}</h3>
    <span className="text-[10px] text-[#6b7280]">{note}</span>
  </div>
);

const UploadBox = ({
  label,
  hint,
  data,
  onPick,
  onRemove,
  disabled,
  icon = "file",        // 👈 default is now "file" (gallery), not "upload"
  selfie = false,
}) => {
  const inputRef = useRef(null);

  // 👇 file → Upload icon (gallery picker) | camera → Camera icon (selfie)
  const Icon = icon === "camera" ? Camera : Upload;

  const handleInput = (e) => {
    onPick(e.target.files?.[0]);
    e.target.value = "";
  };

  return (
    <div className="min-w-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // 👇 capture ONLY for selfie (opens camera); otherwise gallery picker
        capture={selfie ? "user" : undefined}
        onChange={handleInput}
        disabled={disabled}
        className="hidden"
      />

      {data.preview ? (
        <div className="relative overflow-hidden rounded-xl border-2 border-[#14a06a] bg-white">
          <img
            src={data.preview}
            alt={label}
            className={`block w-full object-cover ${
              selfie ? "aspect-[4/3]" : "aspect-[16/10]"
            }`}
          />

          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[#14a06a] px-2 py-0.5 text-[9px] font-bold text-white">
            <CheckCircle2 size={11} />
            Added
          </span>

          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remove ${label}`}
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#d7193f] shadow disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="w-full bg-[#173e70] py-1.5 text-[10px] font-semibold text-white disabled:opacity-60"
          >
            {selfie ? "Retake" : "Change photo"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#c9d3e3] bg-[#eaf1ff] px-2 text-center transition active:scale-[0.98] disabled:opacity-60 ${
            selfie ? "aspect-[4/3]" : "aspect-[16/10]"
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#d7193f] shadow-sm">
            <Icon size={20} strokeWidth={2.3} />
          </span>
          <span className="text-[12px] font-bold text-[#173e70]">{label}</span>
          <span className="text-[9px] text-[#6b7280]">{hint}</span>
        </button>
      )}
    </div>
  );
};

export default KycVarificationPage;