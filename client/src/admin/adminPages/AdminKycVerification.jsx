
import React, { useState } from "react";

const AdminKycVerification = () => {
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // TEMP DATA
  // API SE DATA AANE KE BAAD ISKO REPLACE KARNA
  // ==========================================
  const [kycList] = useState([
    {
      id: 1,
      name: "Rahul Kumar",
      dob: "15/08/1998",
      status: "Pending",
      submittedAt: "30/09/2026, 10:45 AM",
      aadharFront:
        "https://via.placeholder.com/600x380?text=Aadhaar+Front",
      aadharBack:
        "https://via.placeholder.com/600x380?text=Aadhaar+Back",
      panFront:
        "https://via.placeholder.com/600x380?text=PAN+Card",
      selfie:
        "https://via.placeholder.com/400x500?text=Selfie",
    },
    {
      id: 2,
      name: "Amit Sharma",
      dob: "22/04/1995",
      status: "Pending",
      submittedAt: "30/09/2026, 09:30 AM",
      aadharFront:
        "https://via.placeholder.com/600x380?text=Aadhaar+Front",
      aadharBack:
        "https://via.placeholder.com/600x380?text=Aadhaar+Back",
      panFront:
        "https://via.placeholder.com/600x380?text=PAN+Card",
      selfie:
        "https://via.placeholder.com/400x500?text=Selfie",
    },
  ]);

  // ==========================================
  // VIEW KYC
  // ==========================================
  const handleView = (kyc) => {
    setSelectedKyc(kyc);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================
  const handleClose = () => {
    setSelectedKyc(null);
  };

  // ==========================================
  // APPROVE USER
  // ==========================================
  const handleApprove = async () => {
    if (!selectedKyc) return;

    setLoading(true);

    try {
      // ======================================
      // API / REDUX LOGIC WILL COME HERE
      // Example:
      // await dispatch(approveKyc(selectedKyc.id));
      // ======================================

      console.log("Approve KYC:", selectedKyc.id);

      setSelectedKyc(null);
    } catch (error) {
      console.error("Approve KYC error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // REJECT USER
  // ==========================================
  const handleReject = async () => {
    if (!selectedKyc) return;

    setLoading(true);

    try {
      // ======================================
      // API / REDUX LOGIC WILL COME HERE
      // Example:
      // await dispatch(rejectKyc(selectedKyc.id));
      // ======================================

      console.log("Reject KYC:", selectedKyc.id);

      setSelectedKyc(null);
    } catch (error) {
      console.error("Reject KYC error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================
  const getStatusClass = (status) => {
    if (status === "Approved") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (status === "Rejected") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

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
              Review and manage user KYC verification requests.
            </p>
          </div>

          {/* =================================================
              TABLE CARD
          ================================================= */}
          <div className="rounded-2xl bg-white shadow-sm">

            {/* TABLE HEADER */}
            <div className="border-b border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                KYC Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View submitted KYC details and verify user documents.
              </p>
            </div>

            {/* =================================================
                RESPONSIVE TABLE
            ================================================= */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">

                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      #
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Name
                    </th>

                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                      Date of Birth
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
                  {kycList.length > 0 ? (
                    kycList.map((kyc, index) => (
                      <tr
                        key={kyc.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        {/* NUMBER */}
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        {/* NAME */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {kyc.name}
                          </div>
                        </td>

                        {/* DOB */}
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {kyc.dob}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                              kyc.status
                            )}`}
                          >
                            {kyc.status}
                          </span>
                        </td>

                        {/* DATE */}
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {kyc.submittedAt}
                        </td>

                        {/* ACTION */}
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleView(kyc)}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center"
                      >
                        <div className="text-sm font-medium text-gray-500">
                          No KYC requests found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          KYC VIEW MODAL
      ===================================================== */}
      {selectedKyc && (
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
                  Review user information and submitted documents.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
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

                <h3 className="mb-4 text-base font-semibold text-gray-900">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-500">
                      Name
                    </p>

                    <p className="text-sm font-semibold text-gray-900">
                      {selectedKyc.name}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-500">
                      Date of Birth
                    </p>

                    <p className="text-sm font-semibold text-gray-900">
                      {selectedKyc.dob}
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
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">
                      Aadhaar Card - Front Side
                    </p>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img
                        src={selectedKyc.aadharFront}
                        alt="Aadhaar Front"
                        className="h-64 w-full object-contain"
                      />
                    </div>
                  </div>

                  {/* AADHAAR BACK */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">
                      Aadhaar Card - Back Side
                    </p>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img
                        src={selectedKyc.aadharBack}
                        alt="Aadhaar Back"
                        className="h-64 w-full object-contain"
                      />
                    </div>
                  </div>

                  {/* PAN */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">
                      PAN Card - Front Side
                    </p>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img
                        src={selectedKyc.panFront}
                        alt="PAN Card"
                        className="h-64 w-full object-contain"
                      />
                    </div>
                  </div>

                  {/* SELFIE */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">
                      User Selfie
                    </p>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img
                        src={selectedKyc.selfie}
                        alt="User Selfie"
                        className="h-64 w-full object-contain"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* =================================================
                  KYC STATUS
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

                    <p className="mt-1 text-sm text-blue-700">
                      Review all submitted documents carefully before
                      approving or rejecting this KYC request.
                    </p>
                  </div>

                </div>
              </div>

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
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Close
                </button>

                {/* REJECT */}
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading}
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
                >
                  {loading ? "Processing..." : "Reject User"}
                </button>

                {/* APPROVE */}
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="w-full rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
                >
                  {loading ? "Processing..." : "Approve User"}
                </button>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AdminKycVerification;
