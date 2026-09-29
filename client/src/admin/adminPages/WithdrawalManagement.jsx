import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAllWithdrawals,
    updateWithdrawalStatus,
} from "../../reducer/slice/withdrawalSlice";

const STATUS_TABS = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "", label: "All" },
];

const StatusBadge = ({ status }) => {
    const styles = {
        pending: "bg-amber-100 text-amber-700 ring-amber-200",
        approved: "bg-emerald-100 text-emerald-700 ring-emerald-200",
        rejected: "bg-rose-100 text-rose-700 ring-rose-200",
    };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset capitalize ${
                styles[status] || "bg-gray-100 text-gray-700 ring-gray-200"
            }`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
            {status}
        </span>
    );
};

/* Small copy-to-clipboard hook */
const useCopy = () => {
    const [copied, setCopied] = useState("");
    const copy = (text, key) => {
        navigator.clipboard?.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(""), 1200);
    };
    return { copied, copy };
};

/* Highlighted Bank Details block */
const BankDetails = ({ bank }) => {
    const { copied, copy } = useCopy();
    if (!bank) return <span className="text-xs text-slate-400 italic">No bank info</span>;

    const rows = [
        { label: "A/C", value: bank.accountNumber, key: "acc", mono: true },
        { label: "IFSC", value: bank.ifscCode, key: "ifsc", mono: true },
        { label: "Holder", value: bank.accountHolderName, key: "holder" },
    ];

    return (
        <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 ring-1 ring-indigo-100 p-3 shadow-sm min-w-[220px]">
            {/* Bank name — main highlight */}
            <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    🏦
                </span>
                <span className="font-bold text-sm text-indigo-900">
                    {bank.bankName || "—"}
                </span>
            </div>

            {/* Detail rows */}
            <div className="space-y-1">
                {rows.map(
                    (r) =>
                        r.value && (
                            <div
                                key={r.key}
                                className="flex items-center justify-between gap-2 text-xs group"
                            >
                                <span className="text-slate-400 font-medium shrink-0 w-12">
                                    {r.label}
                                </span>
                                <span
                                    className={`flex-1 text-slate-700 font-semibold truncate ${
                                        r.mono ? "font-mono tracking-tight" : ""
                                    }`}
                                    title={r.value}
                                >
                                    {r.value}
                                </span>
                                <button
                                    onClick={() => copy(r.value, r.key)}
                                    className="opacity-0 group-hover:opacity-100 text-indigo-500 hover:text-indigo-700 transition-opacity text-[10px] font-bold"
                                    title="Copy"
                                >
                                    {copied === r.key ? "✓" : "⧉"}
                                </button>
                            </div>
                        )
                )}
            </div>

            {/* UPI highlight */}
            {bank.upiId && (
                <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        UPI
                    </span>
                    <span className="flex-1 text-xs font-semibold text-emerald-700 truncate">
                        {bank.upiId}
                    </span>
                    <button
                        onClick={() => copy(bank.upiId, "upi")}
                        className="text-emerald-500 hover:text-emerald-700 text-[10px] font-bold"
                        title="Copy UPI"
                    >
                        {copied === "upi" ? "✓" : "⧉"}
                    </button>
                </div>
            )}
        </div>
    );
};

const WithdrawalManagement = () => {
    const dispatch = useDispatch();
    const { allWithdrawals } = useSelector((s) => s.withdrawal);

    const [filter, setFilter] = useState("pending");
    const [selected, setSelected] = useState(null);
    const [remark, setRemark] = useState("");
    const [txnId, setTxnId] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchAllWithdrawals({ status: filter }));
    }, [dispatch, filter]);

    const openModal = (w, action) => {
        setSelected({ ...w, action });
        setRemark("");
        setTxnId("");
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await dispatch(
                updateWithdrawalStatus({
                    id: selected._id,
                    status: selected.action,
                    adminRemark: remark,
                    transactionId: selected.action === "approved" ? txnId : "",
                })
            );
            setSelected(null);
            dispatch(fetchAllWithdrawals({ status: filter }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        Withdrawal Requests
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Review and manage user withdrawal requests
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 flex flex-wrap gap-2 p-1.5 bg-white rounded-xl shadow-sm ring-1 ring-slate-200 w-fit">
                    {STATUS_TABS.map(({ key, label }) => {
                        const active = filter === key;
                        return (
                            <button
                                key={key || "all"}
                                onClick={() => setFilter(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200 scale-105"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-2xl shadow-lg ring-1 ring-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Bank Details
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allWithdrawals.map((w, idx) => (
                                    <tr
                                        key={w._id}
                                        className="hover:bg-indigo-50/40 transition-colors duration-150"
                                        style={{
                                            animation: `fadeIn 0.3s ease ${idx * 0.03}s both`,
                                        }}
                                    >
                                        <td className="px-5 py-4 align-top">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {w.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-sm">
                                                        {w.user?.name || "Unknown"}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {w.user?.mobile}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <span className="text-base font-bold text-slate-800">
                                                ₹{Number(w.amount).toLocaleString("en-IN")}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            {/* 🔥 Highlighted bank details */}
                                            <BankDetails bank={w.bankDetail} />
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <StatusBadge status={w.status} />
                                        </td>
                                        <td className="px-5 py-4 align-top text-xs text-slate-500">
                                            {new Date(w.createdAt).toLocaleString("en-IN", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            {w.status === "pending" ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openModal(w, "approved")}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-150 active:scale-95"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => openModal(w, "rejected")}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow-md transition-all duration-150 active:scale-95"
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">
                                                    {w.adminRemark || "—"}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {allWithdrawals.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                                                    📭
                                                </div>
                                                <p className="text-slate-500 font-medium">
                                                    No withdrawal requests found
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Try changing the filter
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selected && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                    style={{ animation: "fadeIn 0.2s ease" }}
                    onClick={() => !loading && setSelected(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        style={{ animation: "slideUp 0.25s ease" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div
                            className={`px-6 py-5 ${
                                selected.action === "approved"
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                    : "bg-gradient-to-r from-rose-500 to-pink-500"
                            }`}
                        >
                            <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                                {selected.action === "approved" ? "✓" : "✕"}{" "}
                                {selected.action} Withdrawal
                            </h3>
                            <p className="text-white/80 text-sm mt-1">
                                {selected.user?.name} · {selected.user?.mobile}
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200">
                                <div className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                                    Amount
                                </div>
                                <div className="text-2xl font-bold text-slate-800 mt-1">
                                    ₹{Number(selected.amount).toLocaleString("en-IN")}
                                </div>
                            </div>

                            {/* 🔥 Bank details also highlighted in modal */}
                            <div>
                                <div className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Bank Details
                                </div>
                                <BankDetails bank={selected.bankDetail} />
                            </div>

                            {selected.action === "approved" && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                        Transaction ID / UTR
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter transaction reference"
                                        value={txnId}
                                        onChange={(e) => setTxnId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                                    Remark <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    placeholder="Add a note for the user..."
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
                            <button
                                onClick={() => setSelected(null)}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={loading}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2 ${
                                    selected.action === "approved"
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                        : "bg-gradient-to-r from-rose-500 to-pink-500"
                                }`}
                            >
                                {loading && (
                                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                )}
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
};

export default WithdrawalManagement;