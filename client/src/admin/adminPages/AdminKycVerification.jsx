import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import {
    approveKyc,
    clearAdminKycActionError,
    clearAdminKycSuccess,
    getAllKyc,
    rejectKyc,
    selectAdminKycActionError,
    selectAdminKycActionLoading,
    selectAdminKycDocuments,
    selectAdminKycLoading,
} from "../../reducer/slice/adminKycReducer";

import api from "../../reducer/api";

/* =========================================================
   WINZOX THEME TOKENS
   Bright Gold + White

   bg          #FFFDF7
   border      #F3E7C4
   gold        #FFD83D -> #F7B500 -> #E39A00
   gold-soft   #FFEFA8
   gold-line   #F2B705
   on-gold     #1A1204
   text        #1A1A1A
   muted       #6B7280
   brown       #9A5B00
   success     #12A36B
   danger      #D93025
========================================================= */

const GOLD_BTN =
    "bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] text-[#1A1204] font-extrabold shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] hover:brightness-105";

const OUTLINE_BTN =
    "border border-[#F2B705] bg-white font-bold text-[#9A5B00] hover:bg-[#FFEFA8]/60";

const INPUT_CLS =
    "w-full rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-4 py-3 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8] disabled:bg-[#F5F1E4] disabled:text-[#8A8F98]";

const CARD_CLS =
    "rounded-2xl border border-[#F3E7C4] bg-white shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]";

const TH_CLS =
    "px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-[#9A5B00]";

const AdminKycVerification = () => {
    const dispatch = useDispatch();

    // =====================================================
    // REDUX STATE
    // =====================================================

    const kycList = useSelector(selectAdminKycDocuments);
    const loading = useSelector(selectAdminKycLoading);
    const actionLoading = useSelector(selectAdminKycActionLoading);
    const actionError = useSelector(selectAdminKycActionError);

    // =====================================================
    // LOCAL STATE
    // =====================================================

    const [showModal, setShowModal] = useState(false);
    const [showRejectBox, setShowRejectBox] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [selectedKyc, setSelectedKyc] = useState(null);

    const rejectBoxRef = useRef(null);

    // =====================================================
    // API ORIGIN
    // =====================================================

    const API_ORIGIN = (
        api.defaults.baseURL || "http://localhost:5099/api"
    ).replace(/\/api\/?$/, "");

    // =====================================================
    // FETCH ALL KYC
    // =====================================================

    useEffect(() => {
        dispatch(getAllKyc(statusFilter));
    }, [dispatch, statusFilter]);

    // =====================================================
    // CLEAR REDUX STATES ON UNMOUNT
    // =====================================================

    useEffect(() => {
        return () => {
            dispatch(clearAdminKycActionError());
            dispatch(clearAdminKycSuccess());
        };
    }, [dispatch]);

    // =====================================================
    // GROUP KYC BY USER ID
    // =====================================================

    const groupedKycList = useMemo(() => {
        if (!Array.isArray(kycList)) {
            return [];
        }

        const grouped = {};

        kycList.forEach((kyc) => {
            const userId = kyc?.userId?._id || kyc?.userId;

            if (!userId) {
                return;
            }

            if (!grouped[userId]) {
                grouped[userId] = {
                    userId: kyc.userId,
                    aadhaar: null,
                    pan: null,
                    documents: [],
                    createdAt: kyc.createdAt,
                    statuses: [],
                };
            }

            const group = grouped[userId];

            // STORE DOCUMENT
            group.documents.push(kyc);

            // AADHAAR
            if (kyc.documentType === "aadhaar") {
                group.aadhaar = kyc;
            }

            // PAN
            if (kyc.documentType === "pan") {
                group.pan = kyc;
            }

            // EARLIEST CREATED DATE
            if (
                kyc.createdAt &&
                (!group.createdAt ||
                    new Date(kyc.createdAt) <
                        new Date(group.createdAt))
            ) {
                group.createdAt = kyc.createdAt;
            }

            // STATUS
            if (kyc.status) {
                group.statuses.push(kyc.status);
            }
        });

        return Object.values(grouped).map((group) => {
            const uniqueStatuses = [
                ...new Set(group.statuses),
            ];

            let status = "pending";

            if (uniqueStatuses.length === 1) {
                status = uniqueStatuses[0];
            } else if (
                uniqueStatuses.includes("rejected")
            ) {
                status = "rejected";
            } else if (
                uniqueStatuses.includes("pending")
            ) {
                status = "pending";
            } else if (
                uniqueStatuses.includes("approved")
            ) {
                status = "approved";
            }

            return {
                ...group,
                status,
            };
        });
    }, [kycList]);

    // =====================================================
    // IMAGE URL
    // =====================================================

    const getImageUrl = (url) => {
        if (!url) {
            return null;
        }

        if (
            url.startsWith("http://") ||
            url.startsWith("https://")
        ) {
            return url;
        }

        return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return "N/A";
        }

        try {
            return new Date(date).toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch (error) {
            return "N/A";
        }
    };

    // =====================================================
    // FORMAT STATUS
    // =====================================================

    const formatStatus = (status) => {
        if (!status) {
            return "Pending";
        }

        if (status === "mixed") {
            return "Mixed";
        }

        return (
            status.charAt(0).toUpperCase() +
            status.slice(1)
        );
    };

    // =====================================================
    // STATUS STYLE
    // =====================================================

    const getStatusClass = (status) => {
        if (status === "approved") {
            return "bg-[#E6F6EF] text-[#0E7A52] border-[#12A36B]/30";
        }

        if (status === "rejected") {
            return "bg-[#FDE8E6] text-[#B3261E] border-[#D93025]/30";
        }

        if (status === "mixed") {
            return "bg-[#FFF4C8] text-[#9A5B00] border-[#F2B705]/40";
        }

        return "bg-[#FFEFA8] text-[#9A5B00] border-[#F2B705]/50";
    };

    // =====================================================
    // DOCUMENT BADGES
    // =====================================================

    const getDocumentLabels = (kyc) => {
        const labels = [];

        if (kyc?.aadhaar) {
            labels.push("Aadhaar");
        }

        if (kyc?.pan) {
            labels.push("PAN");
        }

        return labels;
    };

    // =====================================================
    // VIEW KYC
    // =====================================================

    const handleView = (kyc) => {
        if (!kyc) {
            return;
        }

        setSelectedKyc(kyc);
        setShowModal(true);
        setShowRejectBox(false);
        setRejectionReason("");

        dispatch(clearAdminKycActionError());
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const handleClose = () => {
        if (actionLoading) {
            return;
        }

        setShowModal(false);
        setShowRejectBox(false);
        setRejectionReason("");
        setSelectedKyc(null);

        dispatch(clearAdminKycActionError());
    };

    // =====================================================
    // GET DOCUMENT IDS
    // =====================================================

    const getDocumentIds = () => {
        if (!selectedKyc) {
            return [];
        }

        return selectedKyc.documents
            .map((document) => document?._id)
            .filter(Boolean);
    };

    // =====================================================
    // APPROVE KYC
    // =====================================================

    const handleApprove = async () => {
        if (!selectedKyc || actionLoading) {
            return;
        }

        const documentIds = getDocumentIds();

        if (!documentIds.length) {
            return;
        }

        dispatch(clearAdminKycActionError());

        try {
            for (const documentId of documentIds) {
                await dispatch(
                    approveKyc(documentId)
                ).unwrap();
            }

            setShowModal(false);
            setShowRejectBox(false);
            setRejectionReason("");
            setSelectedKyc(null);

            await dispatch(
                getAllKyc(statusFilter)
            ).unwrap();
        } catch (error) {
            console.error("Approve KYC error:", error);
        }
    };

    // =====================================================
    // OPEN REJECT BOX + SCROLL
    // =====================================================

    const handleOpenReject = () => {
        if (actionLoading) {
            return;
        }

        dispatch(clearAdminKycActionError());

        setShowRejectBox(true);
        setRejectionReason("");

        setTimeout(() => {
            if (!rejectBoxRef.current) {
                return;
            }

            rejectBoxRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            setTimeout(() => {
                const textarea =
                    rejectBoxRef.current?.querySelector(
                        "textarea"
                    );

                textarea?.focus();
            }, 300);
        }, 100);
    };

    // =====================================================
    // REJECT KYC
    // =====================================================

    const handleReject = async () => {
        if (!selectedKyc || actionLoading) {
            return;
        }

        const reason = rejectionReason.trim();

        if (!reason) {
            return;
        }

        const documentIds = getDocumentIds();

        if (!documentIds.length) {
            return;
        }

        dispatch(clearAdminKycActionError());

        try {
            for (const documentId of documentIds) {
                await dispatch(
                    rejectKyc({
                        id: documentId,
                        rejectionReason: reason,
                    })
                ).unwrap();
            }

            setShowModal(false);
            setShowRejectBox(false);
            setRejectionReason("");
            setSelectedKyc(null);

            await dispatch(
                getAllKyc(statusFilter)
            ).unwrap();
        } catch (error) {
            console.error("Reject KYC error:", error);
        }
    };

    // =====================================================
    // DOCUMENT IMAGE
    // =====================================================

    const renderDocumentImage = (
        url,
        alt,
        fallbackText = "Document not available"
    ) => {
        const imageUrl = getImageUrl(url);

        if (!imageUrl) {
            return (
                <div className="flex h-64 w-full items-center justify-center bg-[#FFF9E3] px-4 text-center text-sm text-[#8A8F98]">
                    {fallbackText}
                </div>
            );
        }

        return (
            <img
                src={imageUrl}
                alt={alt}
                className="h-64 w-full object-contain bg-[#FFFDF7]"
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                }}
            />
        );
    };

    // =====================================================
    // LOADING ROW
    // =====================================================

    const renderLoading = () => {
        return (
            <tr>
                <td
                    colSpan="6"
                    className="px-6 py-16 text-center"
                >
                    <div className="flex flex-col items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FFEFA8] border-t-[#F7B500]" />

                        <p className="mt-3 text-sm font-medium text-[#6B7280]">
                            Loading KYC requests...
                        </p>
                    </div>
                </td>
            </tr>
        );
    };

    // =====================================================
    // EMPTY ROW
    // =====================================================

    const renderEmpty = () => {
        return (
            <tr>
                <td
                    colSpan="6"
                    className="px-6 py-12 text-center"
                >
                    <div className="text-sm font-medium text-[#6B7280]">
                        No KYC requests found.
                    </div>

                    <p className="mt-1 text-xs text-[#8A8F98]">
                        There are no KYC documents for the
                        selected status.
                    </p>
                </td>
            </tr>
        );
    };

    // =====================================================
    // MAIN UI
    // =====================================================

    return (
        <>
            {/* =====================================================
                MAIN PAGE
            ===================================================== */}

            <div className="min-h-screen bg-[#FFFDF7] p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-8xl">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="mb-6">
                        <h1 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
                            KYC Verification
                        </h1>

                        <p className="mt-1 text-sm text-[#6B7280]">
                            Review and manage user KYC
                            verification requests.
                        </p>
                    </div>

                    {/* =================================================
                        TABLE CARD
                    ================================================= */}

                    <div className={`overflow-hidden ${CARD_CLS}`}>

                        {/* =================================================
                            TABLE HEADER
                        ================================================= */}

                        <div className="flex flex-col gap-4 border-b border-[#F3E7C4] p-6 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <h2 className="text-lg font-black text-[#1A1A1A]">
                                    KYC Requests
                                </h2>

                                <p className="mt-1 text-sm text-[#6B7280]">
                                    View submitted KYC details
                                    and verify user documents.
                                </p>
                            </div>

                            {/* =================================================
                                STATUS FILTER
                            ================================================= */}

                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="kyc-status"
                                    className="text-sm font-bold text-[#6B7280]"
                                >
                                    Status:
                                </label>

                                <select
                                    id="kyc-status"
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(
                                            e.target.value
                                        )
                                    }
                                    className="rounded-xl border border-[#F3E7C4] bg-[#FFFDF7] px-3 py-2 text-sm font-medium text-[#1A1A1A] outline-none transition focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
                                >
                                    <option value="">
                                        All
                                    </option>

                                    <option value="pending">
                                        Pending
                                    </option>

                                    <option value="approved">
                                        Approved
                                    </option>

                                    <option value="rejected">
                                        Rejected
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* =================================================
                            TABLE
                        ================================================= */}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left">

                                <thead>
                                    <tr className="border-b border-[#F3E7C4] bg-[#FFF9E3]">

                                        <th className={TH_CLS}>
                                            #
                                        </th>

                                        <th className={TH_CLS}>
                                            User
                                        </th>

                                        <th className={TH_CLS}>
                                            Documents
                                        </th>

                                        <th className={TH_CLS}>
                                            Status
                                        </th>

                                        <th className={TH_CLS}>
                                            Submitted
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[#9A5B00]">
                                            Action
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[#F3E7C4]">
                                    {loading
                                        ? renderLoading()
                                        : groupedKycList.length > 0
                                        ? groupedKycList.map(
                                              (kyc, index) => (
                                                  <tr
                                                      key={
                                                          kyc
                                                              .userId
                                                              ?._id ||
                                                          index
                                                      }
                                                      className="transition hover:bg-[#FFFDF7]"
                                                  >

                                                      {/* NUMBER */}

                                                      <td className="px-6 py-4 text-sm text-[#8A8F98]">
                                                          {index + 1}
                                                      </td>

                                                      {/* USER */}

                                                      <td className="px-6 py-4">
                                                          <div>

                                                              <div className="text-sm font-bold text-[#1A1A1A]">
                                                                  {kyc
                                                                      .userId
                                                                      ?.name ||
                                                                      "Unknown User"}
                                                              </div>

                                                              {kyc
                                                                  .userId
                                                                  ?.email && (
                                                                  <div className="mt-1 text-xs text-[#6B7280]">
                                                                      {
                                                                          kyc
                                                                              .userId
                                                                              .email
                                                                      }
                                                                  </div>
                                                              )}

                                                              {kyc
                                                                  .userId
                                                                  ?.phone && (
                                                                  <div className="mt-1 text-xs text-[#6B7280]">
                                                                      {
                                                                          kyc
                                                                              .userId
                                                                              .phone
                                                                      }
                                                                  </div>
                                                              )}

                                                          </div>
                                                      </td>

                                                      {/* DOCUMENTS */}

                                                      <td className="px-6 py-4">
                                                          <div className="flex flex-wrap gap-2">

                                                              {getDocumentLabels(
                                                                  kyc
                                                              ).map(
                                                                  (
                                                                      document
                                                                  ) => (
                                                                      <span
                                                                          key={
                                                                              document
                                                                          }
                                                                          className="inline-flex rounded-lg border border-[#F2B705]/50 bg-[#FFEFA8] px-3 py-1.5 text-xs font-bold text-[#9A5B00]"
                                                                      >
                                                                          {
                                                                              document
                                                                          }
                                                                      </span>
                                                                  )
                                                              )}

                                                          </div>
                                                      </td>

                                                      {/* STATUS */}

                                                      <td className="px-6 py-4">
                                                          <span
                                                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                                                  kyc.status
                                                              )}`}
                                                          >
                                                              {formatStatus(
                                                                  kyc.status
                                                              )}
                                                          </span>
                                                      </td>

                                                      {/* DATE */}

                                                      <td className="px-6 py-4 text-sm text-[#6B7280]">
                                                          {formatDate(
                                                              kyc.createdAt
                                                          )}
                                                      </td>

                                                      {/* ACTION */}

                                                      <td className="px-6 py-4 text-right">
                                                          <button
                                                              type="button"
                                                              onClick={() =>
                                                                  handleView(
                                                                      kyc
                                                                  )
                                                              }
                                                              className={`rounded-xl px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${GOLD_BTN}`}
                                                              disabled={
                                                                  actionLoading
                                                              }
                                                          >
                                                              View
                                                          </button>
                                                      </td>

                                                  </tr>
                                              )
                                          )
                                        : renderEmpty()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================================
                KYC VIEW MODAL
            ===================================================== */}

            {showModal && selectedKyc && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1204]/60 p-4 backdrop-blur-[2px]"
                    onClick={handleClose}
                >
                    <div
                        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#F3E7C4] bg-white shadow-2xl"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* =================================================
                            MODAL HEADER
                        ================================================= */}

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#F3E7C4] bg-white px-5 py-4 sm:px-6">

                            <div>
                                <h2 className="text-lg font-black text-[#1A1A1A]">
                                    KYC Details
                                </h2>

                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Review user information
                                    and submitted documents.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={actionLoading}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-[#8A8F98] transition hover:bg-[#FFEFA8] hover:text-[#9A5B00] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                ✕
                            </button>

                        </div>

                        {/* =================================================
                            MODAL CONTENT
                        ================================================= */}

                        <div className="p-5 sm:p-6">

                            {/* =================================================
                                PERSONAL INFORMATION
                            ================================================= */}

                            <div className={`mb-6 p-5 ${CARD_CLS}`}>

                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <h3 className="text-base font-black text-[#1A1A1A]">
                                        Personal Information
                                    </h3>

                                    <span
                                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                            selectedKyc.status
                                        )}`}
                                    >
                                        {formatStatus(
                                            selectedKyc.status
                                        )}
                                    </span>

                                </div>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                                    {/* NAME */}

                                    <div>
                                        <p className="mb-1 text-sm font-semibold text-[#6B7280]">
                                            Name
                                        </p>

                                        <p className="text-sm font-bold text-[#1A1A1A]">
                                            {selectedKyc.userId
                                                ?.name ||
                                                "N/A"}
                                        </p>
                                    </div>

                                    {/* EMAIL */}

                                    <div>
                                        <p className="mb-1 text-sm font-semibold text-[#6B7280]">
                                            Email
                                        </p>

                                        <p className="break-all text-sm font-bold text-[#1A1A1A]">
                                            {selectedKyc.userId
                                                ?.email ||
                                                "N/A"}
                                        </p>
                                    </div>

                                    {/* PHONE */}

                                    <div>
                                        <p className="mb-1 text-sm font-semibold text-[#6B7280]">
                                            Phone
                                        </p>

                                        <p className="text-sm font-bold text-[#1A1A1A]">
                                            {selectedKyc.userId
                                                ?.phone ||
                                                "N/A"}
                                        </p>
                                    </div>

                                    {/* DOCUMENTS */}

                                    <div>
                                        <p className="mb-1 text-sm font-semibold text-[#6B7280]">
                                            Documents
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {getDocumentLabels(
                                                selectedKyc
                                            ).map(
                                                (document) => (
                                                    <span
                                                        key={
                                                            document
                                                        }
                                                        className="rounded-lg border border-[#F2B705]/50 bg-[#FFEFA8] px-2 py-1 text-xs font-bold text-[#9A5B00]"
                                                    >
                                                        {document}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* SUBMITTED */}

                                    <div>
                                        <p className="mb-1 text-sm font-semibold text-[#6B7280]">
                                            Submitted
                                        </p>

                                        <p className="text-sm font-bold text-[#1A1A1A]">
                                            {formatDate(
                                                selectedKyc.createdAt
                                            )}
                                        </p>
                                    </div>

                                    {/* DOCUMENT COUNT */}

                                    <div>
                                        <p className="mb-1 text-sm font-semibold text-[#6B7280]">
                                            Documents Submitted
                                        </p>

                                        <p className="text-sm font-bold text-[#1A1A1A]">
                                            {
                                                selectedKyc
                                                    .documents
                                                    ?.length
                                            }
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* =================================================
                                DOCUMENTS
                            ================================================= */}

                            <div>
                                <h3 className="mb-4 text-lg font-black text-[#1A1A1A]">
                                    Submitted Documents
                                </h3>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                    {/* AADHAAR FRONT */}

                                    {selectedKyc.aadhaar && (
                                        <div
                                            className={`p-4 ${CARD_CLS}`}
                                        >
                                            <p className="mb-3 text-sm font-bold text-[#1A1A1A]">
                                                Aadhaar Card -
                                                Front Side
                                            </p>

                                            <div className="overflow-hidden rounded-xl border border-[#F3E7C4] bg-[#FFF9E3]">
                                                {renderDocumentImage(
                                                    selectedKyc
                                                        .aadhaar
                                                        .documentUrl,
                                                    "Aadhaar Front"
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* AADHAAR BACK */}

                                    {selectedKyc.aadhaar && (
                                        <div
                                            className={`p-4 ${CARD_CLS}`}
                                        >
                                            <p className="mb-3 text-sm font-bold text-[#1A1A1A]">
                                                Aadhaar Card -
                                                Back Side
                                            </p>

                                            <div className="overflow-hidden rounded-xl border border-[#F3E7C4] bg-[#FFF9E3]">
                                                {renderDocumentImage(
                                                    selectedKyc
                                                        .aadhaar
                                                        .backDocumentUrl,
                                                    "Aadhaar Back",
                                                    "Aadhaar back document not available"
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* PAN */}

                                    {selectedKyc.pan && (
                                        <div
                                            className={`p-4 ${CARD_CLS}`}
                                        >
                                            <p className="mb-3 text-sm font-bold text-[#1A1A1A]">
                                                PAN Card
                                            </p>

                                            <div className="overflow-hidden rounded-xl border border-[#F3E7C4] bg-[#FFF9E3]">
                                                {renderDocumentImage(
                                                    selectedKyc.pan
                                                        .documentUrl,
                                                    "PAN Card"
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* =================================================
                                REJECTION REASON
                            ================================================= */}

                            {selectedKyc.status ===
                                "rejected" &&
                                selectedKyc.documents.some(
                                    (document) =>
                                        document.status ===
                                            "rejected" &&
                                        document.rejectionReason
                                ) && (
                                    <div className="mt-6 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-4">

                                        <p className="text-sm font-bold text-[#B3261E]">
                                            Rejection Reason
                                        </p>

                                        {selectedKyc.documents
                                            .filter(
                                                (document) =>
                                                    document.status ===
                                                        "rejected" &&
                                                    document.rejectionReason
                                            )
                                            .map(
                                                (
                                                    document
                                                ) => (
                                                    <div
                                                        key={
                                                            document._id
                                                        }
                                                        className="mt-3"
                                                    >
                                                        <p className="text-xs font-bold text-[#D93025]">
                                                            {document.documentType?.toUpperCase()}
                                                        </p>

                                                        <p className="text-sm leading-relaxed text-[#B3261E]">
                                                            {
                                                                document.rejectionReason
                                                            }
                                                        </p>
                                                    </div>
                                                )
                                            )}

                                    </div>
                                )}

                            {/* =================================================
                                VERIFICATION INFORMATION
                            ================================================= */}

                            <div className="mt-6 rounded-xl border border-[#F2B705]/30 bg-[#FFF9E3] p-4">

                                <div className="flex gap-3">

                                    <div className="text-lg text-[#F2B705]">
                                        ℹ️
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-[#9A5B00]">
                                            Verification
                                            Information
                                        </h3>

                                        <p className="mt-1 text-sm leading-relaxed text-[#6B7280]">
                                            Review all submitted
                                            documents carefully
                                            before approving or
                                            rejecting this KYC
                                            request.
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* =================================================
                                REJECT REASON INPUT
                            ================================================= */}

                            {showRejectBox && (
                                <div
                                    ref={rejectBoxRef}
                                    className="mt-6 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-5"
                                >
                                    <h3 className="text-sm font-bold text-[#B3261E]">
                                        Reject KYC
                                    </h3>

                                    <p className="mt-1 text-sm text-[#D93025]">
                                        Please provide a reason
                                        for rejecting this KYC
                                        request.
                                    </p>

                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) =>
                                            setRejectionReason(
                                                e.target.value
                                            )
                                        }
                                        rows={4}
                                        maxLength={500}
                                        placeholder="Enter rejection reason..."
                                        disabled={actionLoading}
                                        className="mt-4 w-full resize-none rounded-xl border border-[#D93025]/25 bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#D93025] focus:ring-2 focus:ring-[#FDE8E6] disabled:cursor-not-allowed disabled:bg-[#F5F1E4]"
                                    />

                                    <div className="mt-2 flex items-center justify-between">

                                        <span className="text-xs text-[#8A8F98]">
                                            {
                                                rejectionReason.length
                                            }
                                            /500
                                        </span>

                                        <button
                                            type="button"
                                            onClick={
                                                handleReject
                                            }
                                            disabled={
                                                actionLoading ||
                                                !rejectionReason.trim()
                                            }
                                            className="rounded-xl bg-[#D93025] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#B3261E] disabled:cursor-not-allowed disabled:bg-[#BDBDBD]"
                                        >
                                            {actionLoading
                                                ? "Rejecting..."
                                                : "Confirm Rejection"}
                                        </button>

                                    </div>
                                </div>
                            )}

                            {/* =================================================
                                ACTION ERROR
                            ================================================= */}

                            {actionError && (
                                <div className="mt-6 rounded-xl border border-[#D93025]/30 bg-[#FDE8E6] p-4">
                                    <p className="text-sm font-semibold text-[#B3261E]">
                                        {actionError}
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* =================================================
                            MODAL FOOTER
                        ================================================= */}

                        <div className="sticky bottom-0 border-t border-[#F3E7C4] bg-white px-5 py-4 sm:px-6">

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                {/* CLOSE */}

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={actionLoading}
                                    className={`w-full rounded-xl px-5 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${OUTLINE_BTN}`}
                                >
                                    Close
                                </button>

                                {/* REJECT */}

                                {selectedKyc.status !==
                                    "approved" && (
                                    <button
                                        type="button"
                                        onClick={
                                            handleOpenReject
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className="w-full rounded-xl bg-[#D93025] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#B3261E] disabled:cursor-not-allowed disabled:bg-[#BDBDBD] sm:w-auto"
                                    >
                                        {actionLoading
                                            ? "Processing..."
                                            : "Reject User"}
                                    </button>
                                )}

                                {/* APPROVE */}

                                {selectedKyc.status !==
                                    "approved" && (
                                    <button
                                        type="button"
                                        onClick={
                                            handleApprove
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                        className={`w-full rounded-xl px-5 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${GOLD_BTN}`}
                                    >
                                        {actionLoading
                                            ? "Processing..."
                                            : "Approve User"}
                                    </button>
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default AdminKycVerification;