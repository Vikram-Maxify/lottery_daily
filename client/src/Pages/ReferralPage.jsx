import {
  Check,
  Copy,
  Gift,
  HelpCircle,
  Loader2,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchProfile } from "../reducer/slice/authSlice";
import {
  fetchAllSettings,
  fetchMyReferralDetails,
  selectMyReferralDetails,
  selectReferralLoading,
  selectReferralPercentage,
} from "../reducer/slice/settingsSlice";

const ReferralPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth || {});
  const referralDetails = useSelector(selectMyReferralDetails);
  const loading = useSelector(selectReferralLoading);
  const settingPercentage = useSelector(selectReferralPercentage);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState("friends"); // "friends" | "commissions"

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchMyReferralDetails());
    dispatch(fetchAllSettings());
  }, [dispatch]);

  const referralCode =
    referralDetails?.referralCode || user?.referralCode || "N/A";

  const referralPercentage =
    referralDetails?.referralPercentage ?? settingPercentage ?? 5;

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `🎉 Join Dear Daily Lottery & win up to ₹1 Crore jackpot prizes! Use my referral code *${referralCode}* to sign up and get special bonuses:\n👉 ${referralLink}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

  const referredUsers = referralDetails?.referredUsers || [];
  const commissions = referralDetails?.commissions || [];
  const totalReferred = referralDetails?.totalReferred || 0;
  const totalEarnings = referralDetails?.totalEarnings || 0;

  return (
    <div className="min-h-screen bg-[#F0F4FA] pb-24 text-[#1E293B]">
      {/* Top App Header */}

      <div className="mx-auto max-w-[500px] px-3.5 pt-3.5 space-y-3.5">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-[24px] border border-[#ff3155]/40 bg-gradient-to-br from-[#4d0c20] via-[#2f0815] to-[#16050b] p-4 text-white shadow-[0_12px_32px_rgba(215,25,63,0.3)]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#ffd34e]/15 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-[#ed1d43]/20 blur-2xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd34e]/30 bg-[#ffd34e]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#ffd34e]">
              <Sparkles size={13} />
              Exclusive Referral Program
            </div>

            <h2 className="mt-2.5 font-serif text-[22px] font-black leading-tight tracking-tight text-white">
              Invite Friends & Earn{" "}
              <span className="text-[#ffd34e] underline decoration-[#ffd34e]/60 underline-offset-4">
                {referralPercentage}% Commission
              </span>
            </h2>

            <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/80">
              Share your personal invite code with friends. Receive instant
              cashback commissions directly to your wallet every time they play!
            </p>

            {/* Quick stats banner */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                <p className="text-[10px] font-medium text-white/60">
                  Friends Invited
                </p>
                <p className="text-xl font-black text-white">{totalReferred}</p>
              </div>
              <div className="rounded-xl border border-[#ffd34e]/20 bg-[#ffd34e]/10 p-2.5">
                <p className="text-[10px] font-medium text-[#ffd34e]/80">
                  Total Rewards
                </p>
                <p className="text-xl font-black text-[#ffd34e]">
                  ₹{totalEarnings.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code & Link Card */}
        <div className="rounded-[22px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-[#ed1d43]">
                <Gift size={18} />
              </div>
              <h3 className="text-sm font-extrabold text-[#173e70]">
                Your Referral Code
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#10b981]">Active</span>
          </div>

          {/* Referral Code Box */}
          <div className="mt-3 flex items-center justify-between rounded-xl border-2 border-dashed border-[#ed1d43]/40 bg-[#fff5f6] p-2.5">
            <span className="font-mono text-lg font-black tracking-widest text-[#ed1d43]">
              {referralCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1 rounded-lg bg-[#ed1d43] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
            >
              {copiedCode ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedCode ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Referral Link Box */}
          <div className="mt-3">
            <label className="text-[11px] font-bold text-[#6b7280]">
              Personal Referral Link
            </label>
            <div className="mt-1 flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="h-10 min-w-0 flex-1 rounded-xl border border-[#dfe5f0] bg-[#f8fafc] px-3 font-mono text-[11px] text-[#334155] outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-[#cbd5e1] bg-white px-3 text-xs font-bold text-[#173e70] transition hover:bg-gray-50 active:scale-95"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Share CTA Button */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-extrabold text-white shadow-[0_6px_20px_rgba(37,211,102,0.35)] transition hover:brightness-105 active:scale-[0.99]"
          >
            <Share2 size={16} />
            <span>Share via WhatsApp</span>
          </button>
        </div>

        {/* 3 Steps Guide */}
        <div className="rounded-[22px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#173e70]">
              <HelpCircle size={16} />
            </div>
            <h3 className="text-sm font-extrabold text-[#173e70]">
              How It Works
            </h3>
          </div>

          <div className="mt-3 space-y-3">
            {[
              {
                step: "1",
                title: "Share Your Code",
                desc: "Send your invite code or link to friends, family, and groups.",
              },
              {
                step: "2",
                title: "Friend Joins & Deposits",
                desc: "They register using your code and buy tickets or deposit funds.",
              },
              {
                step: "3",
                title: `Earn ${referralPercentage}% Commission`,
                desc: "You instantly receive your referral rewards credited directly into your wallet balance.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#173e70] text-[11px] font-black text-white">
                  {item.step}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1e293b]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#64748b]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referred Friends / Earnings Tab Section */}
        <div className="rounded-[22px] border border-[#e2e8f0] bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f1f5f9] p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("friends")}
              className={`rounded-lg py-2 transition ${
                activeTab === "friends"
                  ? "bg-white text-[#173e70] shadow-sm"
                  : "text-[#64748b] hover:text-[#173e70]"
              }`}
            >
              Referred Friends ({totalReferred})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("commissions")}
              className={`rounded-lg py-2 transition ${
                activeTab === "commissions"
                  ? "bg-white text-[#173e70] shadow-sm"
                  : "text-[#64748b] hover:text-[#173e70]"
              }`}
            >
              Commissions ({commissions.length})
            </button>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#ed1d43]" />
                <p className="mt-2 text-xs text-[#64748b]">
                  Loading referral records...
                </p>
              </div>
            ) : activeTab === "friends" ? (
              referredUsers.length === 0 ? (
                <div className="py-8 text-center">
                  <Users size={32} className="mx-auto text-gray-300" />
                  <p className="mt-2 text-sm font-bold text-[#334155]">
                    No Friends Referred Yet
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748b]">
                    Share your code above to start earning rewards!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {referredUsers.map((u, i) => (
                    <div
                      key={u.id || i}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#173e70]/10 font-bold text-[#173e70]">
                          {(u.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1e293b]">
                            {u.name || "User"}
                          </p>
                          <p className="text-[10px] text-[#64748b]">
                            {u.mobile}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                            u.isKycVerified
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.isKycVerified ? "Verified" : "Registered"}
                        </span>
                        <p className="mt-0.5 text-[9.5px] text-[#94a3b8]">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                },
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : commissions.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp size={32} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm font-bold text-[#334155]">
                  No Referral Commissions Yet
                </p>
                <p className="mt-0.5 text-xs text-[#64748b]">
                  When your friends participate, commissions appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {commissions.map((c, i) => (
                  <div
                    key={c._id || i}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#1e293b]">
                        {c.remark || "Referral Bonus"}
                      </p>
                      <p className="text-[10px] text-[#64748b]">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                    <span className="text-sm font-black text-[#10b981]">
                      +₹{Number(c.amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
