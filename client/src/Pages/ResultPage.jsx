import {
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileImage,
  PartyPopper,
  RefreshCw,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getDailyResultImages,
  getFestivalResultImages,
  selectDailyResultImages,
  selectDailyResultImagesLoading,
  selectFestivalResultImages,
  selectFestivalResultImagesLoading,
  selectResultImagesError,
} from "../reducer/slice/resultImageSlice";

import banner from "../assets/dear-result-3.jpg";

// ==========================================================
// CONSTANTS
// ==========================================================

const BOTTOM_NAV_HEIGHT = 64;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1605196560547-b2f7281b7355?auto=format&fit=crop&w=1400&q=80";

// Local (IST) date in YYYY-MM-DD — toISOString() UTC deta hai, jo raat 12 se 5:30 AM tak galat din deta hai
const getLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Item ki date nikalo (YYYY-MM-DD). Festival ke liye field name yahan adjust karna ho to karo.
const getItemDate = (item) => {
  const raw = item?.festivalDate || item?.resultDate || item?.date;
  if (!raw) return "";
  const str = String(raw);
  // ISO string ho to seedha first 10 chars (backend jo date store karta hai wahi)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "" : getLocalDateStr(d);
};

// ==========================================================
// COMPONENT
// ==========================================================

const ResultPage = () => {
  const dispatch = useDispatch();

  // Active view tab: "daily" | "festival"
  const [activeTab, setActiveTab] = useState("daily");

  // Dono tabs ke liye alag date filter ("" = all, ya YYYY-MM-DD)
  const todayStr = useMemo(() => getLocalDateStr(), []);
  const [dailyDate, setDailyDate] = useState("");
  const [festivalDate, setFestivalDate] = useState("");

  const selectedDate = activeTab === "daily" ? dailyDate : festivalDate;

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

  // Date change handler (active tab ke hisaab se)
  const handleDateChange = (date) => {
    if (activeTab === "daily") {
      setDailyDate(date);
      dispatch(getDailyResultImages(date ? { date } : {}));
    } else {
      setFestivalDate(date);
      dispatch(getFestivalResultImages(date ? { date } : {}));
    }
  };

  const handleRefresh = () => {
    if (activeTab === "daily") {
      dispatch(getDailyResultImages(dailyDate ? { date: dailyDate } : {}));
    } else {
      dispatch(
        getFestivalResultImages(festivalDate ? { date: festivalDate } : {}),
      );
    }
  };

  // Client-side filter (backend date param ignore kare tab bhi sahi chalega)
  const filteredDaily = useMemo(() => {
    const list = Array.isArray(dailyImages) ? dailyImages : [];
    if (!dailyDate) return list;
    return list.filter((item) => getItemDate(item) === dailyDate);
  }, [dailyImages, dailyDate]);

  const filteredFestival = useMemo(() => {
    const list = Array.isArray(festivalImages) ? festivalImages : [];
    if (!festivalDate) return list;
    return list.filter((item) => getItemDate(item) === festivalDate);
  }, [festivalImages, festivalDate]);

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
  const currentList = activeTab === "daily" ? filteredDaily : filteredFestival;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eef3fa] text-[#173e70]">
      <div
        className="relative mx-auto w-full max-w-[500px] overflow-x-hidden"
        style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 32 }}
      >
        {/* ================= HERO HEADER ================= */}
        <section className="relative overflow-hidden bg-[#3b0a14] h-[150px]">
          {/* Banner Image */}
          <img
            src={banner}
            draggable={false}
            loading="lazy"
            alt="Official Draw Charts - Lottery Results"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
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
              <span>Daily Results ({filteredDaily.length})</span>
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
              <span>Festival Results ({filteredFestival.length})</span>
            </button>
          </div>
        </section>

        {/* ================= DATE FILTER (DAILY + FESTIVAL) ================= */}
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

        {/* ================= CONTENT LIST ================= */}
        <main className="mt-3 space-y-3 px-3">
          {/* Error Message */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 shadow-sm">
              {typeof error === "string"
                ? error
                : "Failed to load result charts."}
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
                  : selectedDate
                    ? `No festival results published for ${formatDate(selectedDate)}`
                    : "No Festival Results Published Yet"}
              </p>
              <p className="mt-1 max-w-[280px] text-xs leading-relaxed text-[#6b7280]">
                Official draw result charts are updated as soon as the winning
                numbers are announced.
              </p>

              {selectedDate && (
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
              const displayImg =
                item.imageUrl || item.displayUrl || item.thumbUrl;

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

                        {item.type === "FESTIVAL" && getItemDate(item) && (
                          <span className="text-[11px] font-bold text-[#6b7280]">
                            • {formatDate(getItemDate(item))}
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
                        onClick={() =>
                          handleDownload(
                            displayImg,
                            item.title || item.festivalName,
                          )
                        }
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
                  {zoomImage.title ||
                    (zoomImage.type === "DAILY"
                      ? "Daily Result Chart"
                      : zoomImage.festivalName || "Festival Result")}
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
                      zoomImage.title || zoomImage.festivalName,
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
