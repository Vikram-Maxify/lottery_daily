import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  addBanner,
  clearBannerActionState,
  deleteBanner,
  getBanners,
  selectBannerActionError,
  selectBannerActionLoading,
  selectBanners,
  selectBannerSuccess,
} from "../../reducer/slice/bannerReducer";

const AdminHomeBanner = () => {
  const dispatch = useDispatch();

  // =====================================================
  // REDUX
  // =====================================================

  const banners = useSelector(selectBanners);
  const actionLoading = useSelector(
    selectBannerActionLoading
  );
  const actionError = useSelector(
    selectBannerActionError
  );
  const success = useSelector(selectBannerSuccess);

  // =====================================================
  // LOCAL STATE
  // =====================================================

  const [selectedBanners, setSelectedBanners] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // =====================================================
  // GET EXISTING BANNERS
  // =====================================================

  useEffect(() => {
    dispatch(getBanners());

    return () => {
      // Clear old success/error when leaving page
      dispatch(clearBannerActionState());
    };
  }, [dispatch]);

  // =====================================================
  // MAX BANNER LIMIT
  // Backend allows maximum 4 banners
  // =====================================================

  const MAX_BANNERS = 4;

  const remainingSlots =
    MAX_BANNERS - banners.length;

  // =====================================================
  // ADD SELECTED FILES
  // =====================================================

  const addBanners = (files) => {
    const validFiles = Array.from(files || []).filter(
      (file) => {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];

        return allowedTypes.includes(file.type);
      }
    );

    if (!validFiles.length) {
      return;
    }

    // ===================================================
    // CHECK AVAILABLE SLOTS
    // ===================================================

    const availableSlots =
      remainingSlots - selectedBanners.length;

    if (availableSlots <= 0) {
      return;
    }

    const filesToAdd = validFiles.slice(
      0,
      availableSlots
    );

    const newBanners = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
    }));

    setSelectedBanners((prev) => [
      ...prev,
      ...newBanners,
    ]);
  };

  // =====================================================
  // FILE INPUT
  // =====================================================

  const handleBannerChange = (e) => {
    addBanners(e.target.files);

    // Allow selecting same file again
    e.target.value = "";
  };

  // =====================================================
  // DROP
  // =====================================================

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    addBanners(e.dataTransfer.files);
  };

  // =====================================================
  // DRAG OVER
  // =====================================================

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // =====================================================
  // DRAG LEAVE
  // =====================================================

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // =====================================================
  // REMOVE SELECTED FILE
  // =====================================================

  const removeBanner = (id) => {
    setSelectedBanners((prev) => {
      const banner = prev.find(
        (item) => item.id === id
      );

      if (banner?.preview) {
        URL.revokeObjectURL(banner.preview);
      }

      return prev.filter(
        (item) => item.id !== id
      );
    });
  };

  // =====================================================
  // CLEAR ALL SELECTED
  // =====================================================

  const clearAll = () => {
    selectedBanners.forEach((banner) => {
      if (banner.preview) {
        URL.revokeObjectURL(banner.preview);
      }
    });

    setSelectedBanners([]);
  };

  // =====================================================
  // UPLOAD BANNERS
  // =====================================================

  const handleUpload = async () => {
    if (!selectedBanners.length || actionLoading) {
      return;
    }

    // ===================================================
    // SAFETY CHECK
    // ===================================================

    if (
      banners.length + selectedBanners.length >
      MAX_BANNERS
    ) {
      return;
    }

    try {
      // Upload one by one because backend endpoint
      // accepts one file:
      //
      // upload.single("banner")
      //
      // We intentionally use Redux addBanner here.

      for (const banner of selectedBanners) {
        await dispatch(
          addBanner({
            image: banner.file,
            title: "",
          })
        ).unwrap();
      }

      // =================================================
      // CLEAN LOCAL PREVIEWS
      // =================================================

      selectedBanners.forEach((banner) => {
        if (banner.preview) {
          URL.revokeObjectURL(banner.preview);
        }
      });

      setSelectedBanners([]);

      // Refresh admin list from backend
      dispatch(getBanners());
    } catch (error) {
      // Error is already handled by Redux.
      // Keep remaining selected files so admin can retry.
      console.error(
        "Banner upload failed:",
        error
      );
    }
  };

  // =====================================================
  // DELETE UPLOADED BANNER
  // =====================================================

  const handleDeleteBanner = async (id) => {
    if (!id || actionLoading) {
      return;
    }

    try {
      await dispatch(
        deleteBanner(id)
      ).unwrap();

      // Refresh admin list from backend
      dispatch(getBanners());
    } catch (error) {
      // Error is already handled by Redux.
      console.error(
        "Delete banner failed:",
        error
      );
    }
  };

  // =====================================================
  // FILE SIZE
  // =====================================================

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#FFFDF7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] sm:text-3xl">
            Homepage Banners
          </h1>

          <p className="mt-1 text-sm text-[#6B7280] sm:text-base">
            Upload and manage multiple banners displayed on
            your homepage.
          </p>

          <p className="mt-2 text-sm font-semibold text-[#9A5B00]">
            {banners.length} / {MAX_BANNERS} banners used
          </p>
        </div>

        {/* =====================================================
            SUCCESS MESSAGE
        ====================================================== */}

        {success && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-[#B7E4C7] bg-[#F0FFF4] px-4 py-3 text-sm font-semibold text-[#237A3B]">
            <span>{success}</span>

            <button
              type="button"
              onClick={() =>
                dispatch(clearBannerActionState())
              }
              className="font-bold text-[#237A3B]"
            >
              ×
            </button>
          </div>
        )}

        {/* =====================================================
            ERROR MESSAGE
        ====================================================== */}

        {actionError && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-[#F5C2C0] bg-[#FFF5F4] px-4 py-3 text-sm font-semibold text-[#B42318]">
            <span>{actionError}</span>

            <button
              type="button"
              onClick={() =>
                dispatch(clearBannerActionState())
              }
              className="font-bold text-[#B42318]"
            >
              ×
            </button>
          </div>
        )}

        {/* =====================================================
            UPLOAD CARD
        ====================================================== */}

        <div className="rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)] sm:p-6">

          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#1A1A1A] sm:text-xl">
              Upload Homepage Banners
            </h2>

            <p className="mt-1 text-sm text-[#6B7280]">
              Select multiple images at once or drag and
              drop them below.
            </p>

            <p className="mt-2 text-xs font-semibold text-[#9A5B00]">
              Maximum {MAX_BANNERS} banners can be uploaded.
              {remainingSlots > 0
                ? ` ${remainingSlots} slot${
                    remainingSlots === 1 ? "" : "s"
                  } remaining.`
                : " No slots remaining."}
            </p>
          </div>

          {/* =====================================================
              DROPZONE
          ====================================================== */}

          <label
            htmlFor="banner-upload"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`group flex min-h-[230px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition ${
              remainingSlots <= 0
                ? "cursor-not-allowed border-[#D9D9D9] bg-[#F7F7F7]"
                : isDragging
                  ? "cursor-pointer border-[#E39A00] bg-[#FFF9E3]"
                  : "cursor-pointer border-[#F2B705] bg-[#FFFDF7] hover:bg-[#FFF9E3]"
            }`}
          >
            {/* Upload Icon */}

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] transition group-hover:scale-105">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-8 w-8"
              >
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-[#1A1A1A] sm:text-lg">
              {remainingSlots > 0
                ? "Drag & Drop Banner Images"
                : "Maximum Banners Reached"}
            </h3>

            {remainingSlots > 0 && (
              <>
                <p className="mt-2 text-sm text-[#6B7280]">
                  or
                </p>

                <span className="mt-3 inline-flex items-center justify-center rounded-xl border border-[#F2B705] bg-white px-5 py-2.5 text-sm font-bold text-[#9A5B00] transition hover:bg-[#FFEFA8]/60">
                  Choose Images
                </span>

                <p className="mt-4 text-xs text-[#8A8F98]">
                  JPG, JPEG, PNG, WEBP • Maximum 5 MB each
                </p>
              </>
            )}

            <input
              id="banner-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              disabled={remainingSlots <= 0}
              onChange={handleBannerChange}
              className="hidden"
            />
          </label>
        </div>

        {/* =====================================================
            SELECTED BANNERS
        ====================================================== */}

        {selectedBanners.length > 0 && (
          <div className="rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)] sm:p-6">

            {/* Section Header */}

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A] sm:text-xl">
                  Selected Banners
                </h2>

                <p className="mt-1 text-sm text-[#6B7280]">
                  {selectedBanners.length}{" "}
                  {selectedBanners.length === 1
                    ? "banner"
                    : "banners"}{" "}
                  selected for upload.
                </p>
              </div>

              <button
                type="button"
                onClick={clearAll}
                disabled={actionLoading}
                className="w-full rounded-xl border border-[#F2B705] bg-white px-4 py-2.5 text-sm font-bold text-[#9A5B00] transition hover:bg-[#FFEFA8]/60 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Clear All
              </button>
            </div>

            {/* Banner Grid */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {selectedBanners.map(
                (banner, index) => (
                  <div
                    key={banner.id}
                    className="overflow-hidden rounded-2xl border border-[#F3E7C4] bg-[#FFFDF7] shadow-sm"
                  >

                    {/* Image */}

                    <div className="relative aspect-video overflow-hidden bg-[#FFF9E3]">

                      <img
                        src={banner.preview}
                        alt={`Banner ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      {/* Number */}

                      <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-sm font-extrabold text-[#9A5B00] shadow-sm">
                        {index + 1}
                      </div>

                      {/* Remove */}

                      <button
                        type="button"
                        onClick={() =>
                          removeBanner(
                            banner.id
                          )
                        }
                        disabled={actionLoading}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-[#D93025] shadow-sm transition hover:bg-[#FDE8E6] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Remove banner"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      </button>
                    </div>

                    {/* Details */}

                    <div className="p-4">

                      <p
                        className="truncate text-sm font-semibold text-[#1A1A1A]"
                        title={banner.file.name}
                      >
                        {banner.file.name}
                      </p>

                      <p className="mt-1 text-xs text-[#8A8F98]">
                        {formatFileSize(
                          banner.file.size
                        )}
                      </p>

                    </div>
                  </div>
                )
              )}

            </div>

            {/* =====================================================
                UPLOAD BUTTON
            ====================================================== */}

            <div className="mt-6 flex justify-end border-t border-[#F3E7C4] pt-5">

              <button
                type="button"
                onClick={handleUpload}
                disabled={
                  selectedBanners.length === 0 ||
                  actionLoading
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-6 py-3 text-sm font-extrabold text-[#1A1204] shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >

                {actionLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>

                    Uploading...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                    >
                      <path d="M12 16V4" />
                      <path d="m7 9 5-5 5 5" />
                      <path d="M5 20h14" />
                    </svg>

                    Upload{" "}
                    {selectedBanners.length}{" "}
                    {selectedBanners.length === 1
                      ? "Banner"
                      : "Banners"}
                  </>
                )}

              </button>

            </div>
          </div>
        )}

        {/* =====================================================
            UPLOADED BANNERS
        ====================================================== */}

        {banners.length > 0 && (
          <div className="rounded-2xl border border-[#F3E7C4] bg-white p-5 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)] sm:p-6">

            {/* Section Header */}

            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#1A1A1A] sm:text-xl">
                Uploaded Banners
              </h2>

              <p className="mt-1 text-sm text-[#6B7280]">
                These banners are currently saved and can be displayed
                on your homepage.
              </p>
            </div>

            {/* Banner Grid */}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {banners.map((banner, index) => (
                <div
                  key={banner._id}
                  className="overflow-hidden rounded-2xl border border-[#F3E7C4] bg-[#FFFDF7] shadow-sm"
                >

                  {/* Image */}

                  <div className="relative aspect-video overflow-hidden bg-[#FFF9E3]">

                    <img
                      src={banner.imageUrl}
                      alt={
                        banner.title ||
                        `Uploaded Banner ${index + 1}`
                      }
                      className="h-full w-full object-cover"
                    />

                    {/* Number */}

                    <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-sm font-extrabold text-[#9A5B00] shadow-sm">
                      {index + 1}
                    </div>

                  </div>

                  {/* Details */}

                  <div className="p-4">

                    <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                      {banner.title ||
                        `Banner ${index + 1}`}
                    </p>

                    {/* Delete */}

                    <div className="mt-4 flex justify-end">

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          handleDeleteBanner(
                            banner._id
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F5C2C0] bg-white text-[#D93025] transition hover:bg-[#FDE8E6] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete banner"
                        title="Delete banner"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      </button>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          </div>
        )}

        {/* =====================================================
            EMPTY STATE
        ====================================================== */}

        {selectedBanners.length === 0 && (
          <div className="rounded-2xl border border-[#F3E7C4] bg-white p-8 text-center shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF9E3] text-[#F2B705]">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-7 w-7"
              >
                <rect
                  width="18"
                  height="18"
                  x="3"
                  y="3"
                  rx="2"
                />

                <circle
                  cx="8.5"
                  cy="8.5"
                  r="1.5"
                />

                <path d="m21 15-5-5L5 21" />
              </svg>

            </div>

            <h3 className="mt-4 text-base font-bold text-[#1A1A1A]">
              No Banners Selected
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-[#6B7280]">
              Select one or more banner images above to
              preview them before uploading.
            </p>

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminHomeBanner;