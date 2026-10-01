import React, { useEffect, useMemo, useRef, useState } from "react";
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

    // Selected grouped user
    const [selectedKyc, setSelectedKyc] = useState(null);

    // Reject section reference
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

            // ---------------------------------------------
            // STORE DOCUMENT
            // ---------------------------------------------

            group.documents.push(kyc);

            // ---------------------------------------------
            // AADHAAR
            // ---------------------------------------------

            if (kyc.documentType === "aadhaar") {
                group.aadhaar = kyc;
            }

            // ---------------------------------------------
            // PAN
            // ---------------------------------------------

            if (kyc.documentType === "pan") {
                group.pan = kyc;
            }

            // ---------------------------------------------
            // EARLIEST CREATED DATE
            // ---------------------------------------------

            if (
                kyc.createdAt &&
                (!group.createdAt ||
                    new Date(kyc.createdAt) <
                        new Date(group.createdAt))
            ) {
                group.createdAt = kyc.createdAt;
            }

            // ---------------------------------------------
            // STATUS
            // ---------------------------------------------

            if (kyc.status) {
                group.statuses.push(kyc.status);
            }
        });

        return Object.values(grouped).map((group) => {
            const uniqueStatuses = [...new Set(group.statuses)];

            let status = "pending";

            if (uniqueStatuses.length === 1) {
                status = uniqueStatuses[0];
            } else if (uniqueStatuses.includes("rejected")) {
                status = "rejected";
            } else if (uniqueStatuses.includes("pending")) {
                status = "pending";
            } else if (uniqueStatuses.includes("approved")) {
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
        if (!url) return null;

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
        if (!date) return "N/A";

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
        if (!status) return "Pending";

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
            return "bg-green-50 text-green-700 border-green-200";
        }

        if (status === "rejected") {
            return "bg-red-50 text-red-700 border-red-200";
        }

        if (status === "mixed") {
            return "bg-blue-50 text-blue-700 border-blue-200";
        }

        return "bg-yellow-50 text-yellow-700 border-yellow-200";
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
        if (!kyc) return;

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
        if (actionLoading) return;

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
        if (!selectedKyc || actionLoading) return;

        const documentIds = getDocumentIds();

        if (!documentIds.length) return;

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
        if (actionLoading) return;

        dispatch(clearAdminKycActionError());

        setShowRejectBox(true);
        setRejectionReason("");

        // Wait until the reject section is rendered
        setTimeout(() => {
            if (!rejectBoxRef.current) return;

            rejectBoxRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });

            // Focus textarea after scroll starts
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
        if (!selectedKyc || actionLoading) return;

        const reason = rejectionReason.trim();

        if (!reason) {
            return;
        }

        const documentIds = getDocumentIds();

        if (!documentIds.length) return;

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
                <div className="flex h-64 w-full items-center justify-center bg-gray-50 px-4 text-center text-sm text-gray-400">
                    {fallbackText}
                </div>
            );
        }

        return (
            <img
                src={imageUrl}
                alt={alt}
                className="h-64 w-full object-contain"
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
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

                        <p className="mt-3 text-sm font-medium text-gray-500">
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
                    <div className="text-sm font-medium text-gray-500">
                        No KYC requests found.
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                        There are no KYC documents for the selected
                        status.
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

            <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-8xl">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            KYC Verification
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Review and manage user KYC verification
                            requests.
                        </p>
                    </div>

                    {/* =================================================
                        TABLE CARD
                    ================================================= */}

                    <div className="rounded-2xl bg-white shadow-sm">

                        {/* =================================================
                            TABLE HEADER
                        ================================================= */}

                        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    KYC Requests
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    View submitted KYC details and verify user
                                    documents.
                                </p>
                            </div>

                            {/* =================================================
                                STATUS FILTER
                            ================================================= */}

                            <div className="flex items-center gap-2">
                                <label
                                    htmlFor="kyc-status"
                                    className="text-sm font-medium text-gray-600"
                                >
                                    Status:
                                </label>

                                <select
                                    id="kyc-status"
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    <tr className="border-b border-gray-200 bg-gray-50">

                                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            #
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            User
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            Documents
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            Submitted
                                        </th>

                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading
                                        ? renderLoading()
                                        : groupedKycList.length > 0
                                        ? groupedKycList.map(
                                              (kyc, index) => (
                                                  <tr
                                                      key={
                                                          kyc.userId?._id ||
                                                          index
                                                      }
                                                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                                                  >
                                                      {/* NUMBER */}

                                                      <td className="px-6 py-4 text-sm text-gray-600">
                                                          {index + 1}
                                                      </td>

                                                      {/* USER */}

                                                      <td className="px-6 py-4">
                                                          <div>
                                                              <div className="text-sm font-semibold text-gray-900">
                                                                  {kyc.userId?.name ||
                                                                      "Unknown User"}
                                                              </div>

                                                              {kyc.userId?.email && (
                                                                  <div className="mt-1 text-xs text-gray-500">
                                                                      {
                                                                          kyc
                                                                              .userId
                                                                              .email
                                                                      }
                                                                  </div>
                                                              )}

                                                              {kyc.userId?.phone && (
                                                                  <div className="mt-1 text-xs text-gray-500">
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
                                                                  (document) => (
                                                                      <span
                                                                          key={
                                                                              document
                                                                          }
                                                                          className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700"
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
                                                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                  kyc.status
                                                              )}`}
                                                          >
                                                              {formatStatus(
                                                                  kyc.status
                                                              )}
                                                          </span>
                                                      </td>

                                                      {/* DATE */}

                                                      <td className="px-6 py-4 text-sm text-gray-500">
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
                                                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={handleClose}
                >
                    <div
                        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* =================================================
                            MODAL HEADER
                        ================================================= */}

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    KYC Details
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Review user information and submitted
                                    documents.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={actionLoading}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
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

                            <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5">

                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <h3 className="text-base font-semibold text-gray-900">
                                        Personal Information
                                    </h3>

                                    <span
                                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
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
                                        <p className="mb-1 text-sm font-medium text-gray-500">
                                            Name
                                        </p>

                                        <p className="text-sm font-semibold text-gray-900">
                                            {selectedKyc.userId?.name ||
                                                "N/A"}
                                        </p>
                                    </div>

                                    {/* EMAIL */}

                                    <div>
                                        <p className="mb-1 text-sm font-medium text-gray-500">
                                            Email
                                        </p>

                                        <p className="break-all text-sm font-semibold text-gray-900">
                                            {selectedKyc.userId?.email ||
                                                "N/A"}
                                        </p>
                                    </div>

                                    {/* PHONE */}

                                    <div>
                                        <p className="mb-1 text-sm font-medium text-gray-500">
                                            Phone
                                        </p>

                                        <p className="text-sm font-semibold text-gray-900">
                                            {selectedKyc.userId?.phone ||
                                                "N/A"}
                                        </p>
                                    </div>

                                    {/* DOCUMENTS */}

                                    <div>
                                        <p className="mb-1 text-sm font-medium text-gray-500">
                                            Documents
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {getDocumentLabels(
                                                selectedKyc
                                            ).map((document) => (
                                                <span
                                                    key={document}
                                                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700"
                                                >
                                                    {document}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SUBMITTED */}

                                    <div>
                                        <p className="mb-1 text-sm font-medium text-gray-500">
                                            Submitted
                                        </p>

                                        <p className="text-sm font-semibold text-gray-900">
                                            {formatDate(
                                                selectedKyc.createdAt
                                            )}
                                        </p>
                                    </div>

                                    {/* DOCUMENT COUNT */}

                                    <div>
                                        <p className="mb-1 text-sm font-medium text-gray-500">
                                            Documents Submitted
                                        </p>

                                        <p className="text-sm font-semibold text-gray-900">
                                            {
                                                selectedKyc.documents
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
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    Submitted Documents
                                </h3>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                    {/* AADHAAR FRONT */}

                                    {selectedKyc.aadhaar && (
                                        <div className="rounded-xl border border-gray-200 bg-white p-4">

                                            <p className="mb-3 text-sm font-semibold text-gray-700">
                                                Aadhaar Card - Front Side
                                            </p>

                                            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                                {renderDocumentImage(
                                                    selectedKyc.aadhaar
                                                        .documentUrl,
                                                    "Aadhaar Front"
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* AADHAAR BACK */}

                                    {selectedKyc.aadhaar && (
                                        <div className="rounded-xl border border-gray-200 bg-white p-4">

                                            <p className="mb-3 text-sm font-semibold text-gray-700">
                                                Aadhaar Card - Back Side
                                            </p>

                                            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                                {renderDocumentImage(
                                                    selectedKyc.aadhaar
                                                        .backDocumentUrl,
                                                    "Aadhaar Back",
                                                    "Aadhaar back document not available"
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* PAN */}

                                    {selectedKyc.pan && (
                                        <div className="rounded-xl border border-gray-200 bg-white p-4">

                                            <p className="mb-3 text-sm font-semibold text-gray-700">
                                                PAN Card
                                            </p>

                                            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
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

                            {selectedKyc.status === "rejected" &&
                                selectedKyc.documents.some(
                                    (document) =>
                                        document.status === "rejected" &&
                                        document.rejectionReason
                                ) && (
                                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm font-semibold text-red-800">
                                            Rejection Reason
                                        </p>

                                        {selectedKyc.documents
                                            .filter(
                                                (document) =>
                                                    document.status ===
                                                        "rejected" &&
                                                    document.rejectionReason
                                            )
                                            .map((document) => (
                                                <div
                                                    key={document._id}
                                                    className="mt-2"
                                                >
                                                    <p className="text-xs font-semibold text-red-600">
                                                        {document.documentType?.toUpperCase()}
                                                    </p>

                                                    <p className="text-sm leading-relaxed text-red-700">
                                                        {
                                                            document.rejectionReason
                                                        }
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                )}

                            {/* =================================================
                                VERIFICATION INFORMATION
                            ================================================= */}

                            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                                <div className="flex gap-3">

                                    <div className="text-blue-600">
                                        ℹ️
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-blue-900">
                                            Verification Information
                                        </h3>

                                        <p className="mt-1 text-sm leading-relaxed text-blue-700">
                                            Review all submitted documents carefully
                                            before approving or rejecting this KYC
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
                                    className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5"
                                >
                                    <h3 className="text-sm font-semibold text-red-900">
                                        Reject KYC
                                    </h3>

                                    <p className="mt-1 text-sm text-red-700">
                                        Please provide a reason for rejecting
                                        this KYC request.
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
                                        className="mt-4 w-full resize-none rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                                    />

                                    <div className="mt-2 flex items-center justify-between">

                                        <span className="text-xs text-gray-400">
                                            {rejectionReason.length}/500
                                        </span>

                                        <button
                                            type="button"
                                            onClick={handleReject}
                                            disabled={
                                                actionLoading ||
                                                !rejectionReason.trim()
                                            }
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
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
                                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-medium text-red-700">
                                        {actionError}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* =================================================
                            MODAL FOOTER
                        ================================================= */}

                        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-5 py-4 sm:px-6">

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                                {/* CLOSE */}

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={actionLoading}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                >
                                    Close
                                </button>

                                {/* REJECT */}

                                {selectedKyc.status !== "approved" && (
                                    <button
                                        type="button"
                                        onClick={handleOpenReject}
                                        disabled={actionLoading}
                                        className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
                                    >
                                        {actionLoading
                                            ? "Processing..."
                                            : "Reject User"}
                                    </button>
                                )}

                                {/* APPROVE */}

                                {selectedKyc.status !== "approved" && (
                                    <button
                                        type="button"
                                        onClick={handleApprove}
                                        disabled={actionLoading}
                                        className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
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