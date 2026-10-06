import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileImage,
  Filter,
  PartyPopper,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  X,
  XCircle,
} from "lucide-react";

import {
  getDailyResultImages,
  getFestivalResultImages,
  selectDailyResultImages,
  selectFestivalResultImages,
  selectDailyResultImagesLoading,
  selectFestivalResultImagesLoading,
  selectResultImagesError,
} from "../reducer/slice/resultImageSlice";

// ==========================================================
// CONSTANTS
// ==========================================================

const BOTTOM_NAV_HEIGHT = 64;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

// ==========================================================
// COMPONENT
// ==========================================================

const ResultPage = () => {
  const dispatch = useDispatch();

  // Active view tab: "daily" | "festival"
  const [activeTab, setActiveTab] = useState("daily");

  // Date filter for Daily results (empty = all, or YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState(""); // "" means all, or specific date

  // Fullscreen zoom modal image
  const [zoomImage, setZoomImage] = useState(null);

  // Redux state from resultImageSlice
  const dailyImages = useSelector(selectDailyResultImages);
  const festivalImages = useSelector(selectFestivalResultImages);
  const dailyLoading = useSelector(selectDailyResultImagesLoading);
  const festivalLoading = useSelector(selectFestivalResultImagesLoading);
  const error = useSelector(selectResultImagesError);

  // Initial fetch on mount
  useEffect(() => {
    dispatch(getDailyResultImages());
    dispatch(getFestivalResultImages());
  }, [dispatch]);

  // When date filter changes, fetch or filter daily results
  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) {
      dispatch(getDailyResultImages({ date }));
    } else {
      dispatch(getDailyResultImages());
    }
  };

  const handleRefresh = () => {
    if (activeTab === "daily") {
      dispatch(getDailyResultImages(selectedDate ? { date: selectedDate } : {}));
    } else {
      dispatch(getFestivalResultImages());
    }
  };

  // Helper date formatter
  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Download image helper
  const handleDownload = async (imgUrl, title) => {
    if (!imgUrl) return;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "lottery-result").replace(/\s+/g, "-")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(imgUrl, "_blank", "noopener");
    }
  };

  const isLoading = activeTab === "daily" ? dailyLoading : festivalLoading;
  const currentList = activeTab === "daily" ? dailyImages : festivalImages;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-full max-w-[500px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 32 }}
      >
        {/* ================= HERO HEADER ================= */}
        <section
          className="relative overflow-hidden bg-[#3b0a14] bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#2a0610]/95 via-[#4a0b18]/85 to-[#2a0610]/70" />
          <div className="pointer-events-none absolute -right-10 top-0 h-52 w-52 rounded-full bg-[#ff8a00]/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#ff1744]/20 blur-3xl" />

          <Sparkles
            size={16}
            className="pointer-events-none absolute left-[46%] top-4 text-[#ffcf4a]/80"
          />
          <Sparkles
            size={12}
            className="pointer-events-none absolute bottom-[25%] left-[6%] text-[#ffb82e]/70"
          />

          <div className="relative flex items-center justify-between px-4 pb-14 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#ffd34e] bg-white/10 shadow-[0_0_25px_rgba(255,209,90,0.25)]">
                <Trophy
                  className="h-8 w-8 text-[#ffd34e]"
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#ffd34e]">
                  Official Draw Charts
                </p>
                <h1 className="mt-0.5 bg-gradient-to-b from-[#fff1a8] to-[#e0a11b] bg-clip-text font-serif text-[28px] font-black leading-none text-transparent">
                  Lottery Results
                </h1>
                <p className="mt-1 text-[11px] leading-tight text-white/80">
                  View published daily & festival bumper result charts
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition active:scale-95 hover:bg-white/20 disabled:opacity-50"
              title="Refresh Results"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </section>

        {/* ================= CATEGORY TABS ================= */}
        <section className="relative z-10 -mt-7 px-3">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/60 bg-white p-1.5 shadow-md">
            <button
              type="button"
              onClick={() => setActiveTab("daily")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition ${
                activeTab === "daily"
                  ? "bg-gradient-to-r from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-md shadow-[#F7B500]/25"
                  : "text-[#6b7280] hover:text-[#173e70]"
              }`}
            >
              <Ticket size={16} />
              <span>Daily Results ({dailyImages.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("festival")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition ${
                activeTab === "festival"
                  ? "bg-gradient-to-r from-[#FFD83D] to-[#F7B500] text-[#1A1204] shadow-md shadow-[#F7B500]/25"
                  : "text-[#6b7280] hover:text-[#173e70]"
              }`}
            >
              <PartyPopper size={16} />
              <span>Festival Results ({festivalImages.length})</span>
            </button>
          </div>
        </section>

        {/* ================= DATE FILTER (FOR DAILY) ================= */}
        {activeTab === "daily" && (
          <section className="mt-3 px-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e2e5f0] bg-white p-2.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDateChange("")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedDate === ""
                      ? "bg-[#173e70] text-white"
                      : "bg-[#eef3fa] text-[#6b7280] hover:text-[#173e70]"
                  }`}
                >
                  All Dates
                </button>

                <button
                  type="button"
                  onClick={() => handleDateChange(todayStr)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedDate === todayStr
                      ? "bg-[#173e70] text-white"
                      : "bg-[#eef3fa] text-[#6b7280] hover:text-[#173e70]"
                  }`}
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#9A5B00]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="rounded-lg border border-[#e2e5f0] bg-[#f9fbff] px-2 py-0.5 text-xs font-bold text-[#173e70] outline-none"
                />
              </div>
            </div>
          </section>
        )}

        {/* ================= CONTENT LIST ================= */}
        <main className="mt-3 space-y-3 px-3">
          {/* Error Message */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 shadow-sm">
              {typeof error === "string" ? error : "Failed to load result charts."}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-2xl bg-white shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173e70] text-[#ffd34e] shadow-lg animate-pulse">
                <RefreshCw size={24} className="animate-spin" />
              </div>
              <p className="mt-3 text-xs font-black text-[#173e70]">
                Loading official results...
              </p>
            </div>
          ) : currentList.length === 0 ? (
            /* Empty State */
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef3fa] text-[#173e70] mb-3">
                <FileImage size={28} />
              </div>
              <p className="text-sm font-black text-[#173e70]">
                {activeTab === "daily"
                  ? selectedDate
                    ? `No result charts published for ${formatDate(selectedDate)}`
                    : "No Daily Results Published Yet"
                  : "No Festival Results Published Yet"}
              </p>
              <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-[#6b7280]">
                Official draw result charts are updated as soon as the winning numbers are announced.
              </p>

              {selectedDate && activeTab === "daily" && (
                <button
                  type="button"
                  onClick={() => handleDateChange("")}
                  className="mt-3 text-xs font-bold text-[#E39A00] hover:underline"
                >
                  View all dates results
                </button>
              )}
            </div>
          ) : (
            /* Result Cards */
            currentList.map((item, index) => {
              const displayImg = item.imageUrl || item.displayUrl || item.thumbUrl;

              return (
                <div
                  key={item._id || `result-card-${index}`}
                  className="overflow-hidden rounded-2xl border border-[#e2e5f0] bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-[#eef3fa] bg-gradient-to-r from-[#FFFDF7] to-white px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase text-white ${
                            item.type === "FESTIVAL"
                              ? "bg-gradient-to-r from-purple-600 to-pink-600"
                              : "bg-gradient-to-r from-[#E39A00] to-[#b37400]"
                          }`}
                        >
                          {item.type}
                        </span>

                        {item.type === "DAILY" && item.resultDate && (
                          <span className="text-xs font-bold text-[#173e70]">
                            {formatDate(item.resultDate)}
                          </span>
                        )}

                        {item.type === "FESTIVAL" && item.festivalName && (
                          <span className="text-xs font-bold text-purple-900">
                            {item.festivalName}
                          </span>
                        )}
                      </div>

                      {item.title && (
                        <h2 className="mt-1 truncate text-sm font-black text-[#173e70]">
                          {item.title}
                        </h2>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setZoomImage(item)}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] px-2.5 py-1 text-xs font-bold text-[#9A5B00] shadow-sm hover:bg-[#FFEFA8]"
                    >
                      <Eye size={13} />
                      <span>Zoom</span>
                    </button>
                  </div>

                  {/* Card Image Body */}
                  <div
                    onClick={() => setZoomImage(item)}
                    className="group relative cursor-pointer overflow-hidden bg-gray-50 p-2"
                  >
                    <img
                      src={displayImg}
                      alt={item.title || "Lottery Result Chart"}
                      className="max-h-[460px] w-full rounded-xl object-contain transition duration-200 group-hover:scale-[1.01]"
                      loading="lazy"
                    />

                    {/* Hover Zoom Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition group-hover:opacity-100">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-[#173e70] shadow-lg">
                        <Eye size={14} /> Tap to Zoom Chart
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between border-t border-[#eef3fa] bg-[#f9fbff] px-3.5 py-2.5 text-xs">
                    <span className="text-[11px] text-[#6b7280]">
                      Updated: {formatDate(item.createdAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(displayImg, item.title || item.festivalName)}
                        className="inline-flex items-center gap-1 font-bold text-[#173e70] hover:text-[#0c2444]"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>

                      <span className="text-gray-300">|</span>

                      <button
                        type="button"
                        onClick={() => setZoomImage(item)}
                        className="inline-flex items-center gap-1 font-bold text-[#E39A00] hover:underline"
                      >
                        <ExternalLink size={13} />
                        <span>Full View</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* ================= TRUST FOOTER ================= */}
          <div className="flex flex-col items-center px-4 pt-4">
            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#173e70]/30" />
              <ShieldCheck size={22} className="text-[#173e70]" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#173e70]/30" />
            </div>
            <p className="mt-2 text-xs font-bold text-[#173e70]">
              Official Verified Results • Play with Trust
            </p>
          </div>
        </main>
      </div>

      {/* =====================================================
          FULLSCREEN ZOOM MODAL
      ====================================================== */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="flex max-h-[96vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-[#FFFDF7] px-4 py-3">
              <div className="min-w-0 pr-2">
                <h3 className="truncate text-sm font-black text-[#173e70]">
                  {zoomImage.title || (zoomImage.type === "DAILY" ? "Daily Result Chart" : zoomImage.festivalName || "Festival Result")}
                </h3>
                <p className="text-[11px] text-[#6b7280]">
                  {zoomImage.type === "DAILY"
                    ? `Draw Date: ${formatDate(zoomImage.resultDate)}`
                    : `Festival: ${zoomImage.festivalName}`}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      zoomImage.imageUrl || zoomImage.displayUrl,
                      zoomImage.title || zoomImage.festivalName
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-[#173e70] hover:bg-gray-100"
                  title="Download Image"
                >
                  <Download size={15} />
                </button>

                <a
                  href={zoomImage.imageUrl || zoomImage.displayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-[#173e70] hover:bg-gray-100"
                  title="Open original"
                >
                  <ExternalLink size={15} />
                </a>

                <button
                  type="button"
                  onClick={() => setZoomImage(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-[#6b7280] hover:bg-gray-200 hover:text-[#173e70]"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex max-h-[82vh] items-center justify-center overflow-auto bg-gray-950 p-2">
              <img
                src={zoomImage.imageUrl || zoomImage.displayUrl}
                alt={zoomImage.title || "Zoomed Result Chart"}
                className="max-h-[78vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;