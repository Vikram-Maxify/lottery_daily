import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  createDeposit,
  selectDepositError,
  selectDepositLoading,
  selectDepositOrderId,
  selectDepositPaymentUrl,
} from "../reducer/slice/depositSlice";

// =====================================================
// AUTO GENERATE TEST UTR
// =====================================================
const generateUTR = () => {
  const timestamp = Date.now().toString().slice(-10);

  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `QWP${timestamp}${random}`;
};

export default function QwackPayDeposit() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectDepositLoading);
  const error = useSelector(selectDepositError);
  const paymentUrl = useSelector(selectDepositPaymentUrl);
  const orderId = useSelector(selectDepositOrderId);

  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [localError, setLocalError] = useState("");

  // =====================================================
  // CREATE DEPOSIT
  // =====================================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setLocalError("");

    const numericAmount = Number(amount);

    // QwackPay minimum amount
    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 200
    ) {
      setLocalError(
        "Minimum QwackPay deposit amount is ₹200."
      );
      return;
    }

    // QwackPay maximum amount
    if (numericAmount > 30000) {
      setLocalError(
        "Maximum QwackPay deposit amount is ₹30,000."
      );
      return;
    }

    // =====================================================
    // AUTO UTR
    // =====================================================
    const generatedUtr = generateUTR();

    setUtr(generatedUtr);

    try {
      const result = await dispatch(
        createDeposit({
          amount: numericAmount,
          paymentMethod: "INR",
          channel: "qwackpay",

          // UTR sent with create request
          utr: generatedUtr,
        })
      ).unwrap();

      const createdOrderId = String(
        result?.orderId ||
          result?.deposit?.orderId ||
          ""
      ).trim();

      const url = String(
        result?.paymentUrl ||
          result?.payment_url ||
          result?.data?.paymentUrl ||
          result?.data?.payment_url ||
          ""
      ).trim();

      // =====================================================
      // SAVE ORDER ID
      // =====================================================
      if (createdOrderId) {
        try {
          localStorage.setItem(
            "qwackpay_order_id",
            createdOrderId
          );
        } catch {}
      }

      // =====================================================
      // SAVE GENERATED UTR
      // =====================================================
      if (generatedUtr) {
        try {
          localStorage.setItem(
            "qwackpay_test_utr",
            generatedUtr
          );
        } catch {}
      }

      if (!url) {
        setLocalError(
          "Payment URL was not returned by the gateway."
        );
        return;
      }

      // =====================================================
      // OPEN QWACKPAY
      // =====================================================
      window.location.assign(url);
    } catch (err) {
      setLocalError(
        String(
          err ||
            "Payment order creation failed."
        )
      );
    }
  };

  // =====================================================
  // CHECK STATUS
  // =====================================================
  const handleStatus = () => {
    const id = String(orderId || "").trim();

    if (!id) {
      setLocalError(
        "Payment order ID is not available."
      );
      return;
    }

    navigate(
      `/payment-success?order_id=${encodeURIComponent(
        id
      )}`
    );
  };

  // =====================================================
  // REGENERATE UTR
  // =====================================================
  const handleGenerateUtr = () => {
    const newUtr = generateUTR();

    setUtr(newUtr);

    try {
      localStorage.setItem(
        "qwackpay_test_utr",
        newUtr
      );
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        {/* =================================================
            HEADER
        ================================================= */}
        <h1 className="text-2xl font-bold text-slate-900">
          Add Money
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Secure payment through QwackPay
        </p>

        {/* =================================================
            FORM
        ================================================= */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >

          {/* =================================================
              AMOUNT
          ================================================= */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Amount (INR)
            </label>

            <input
              type="number"
              min="200"
              max="30000"
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setLocalError("");
              }}
              placeholder="Minimum ₹200"
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />

            <p className="mt-1 text-xs text-slate-500">
              Minimum ₹200 • Maximum ₹30,000
            </p>
          </div>

          {/* =================================================
              UTR
          ================================================= */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              UTR
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={utr}
                readOnly
                placeholder="UTR will be generated automatically"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm outline-none"
              />

              <button
                type="button"
                onClick={handleGenerateUtr}
                disabled={loading}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Generate
              </button>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Test UTR is generated automatically.
            </p>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}
          {(localError || error) && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {localError || error}
            </div>
          )}

          {/* =================================================
              SUBMIT
          ================================================= */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Creating payment..."
              : "Pay with QwackPay"}
          </button>
        </form>

        {/* =================================================
            CREATED ORDER
        ================================================= */}
        {paymentUrl && orderId && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">

            <p className="text-xs text-slate-500">
              Order ID
            </p>

            <p className="mt-1 break-all font-mono text-sm font-semibold">
              {orderId}
            </p>

            {/* =================================================
                UTR
            ================================================= */}
            {utr && (
              <div className="mt-3">
                <p className="text-xs text-slate-500">
                  Test UTR
                </p>

                <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                  {utr}
                </p>
              </div>
            )}

            {/* =================================================
                OPEN PAYMENT
            ================================================= */}
            <button
              type="button"
              onClick={() =>
                window.location.assign(paymentUrl)
              }
              className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-900"
            >
              Open Payment Page
            </button>

            {/* =================================================
                CHECK STATUS
            ================================================= */}
            <button
              type="button"
              onClick={handleStatus}
              className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-600"
            >
              Check Payment Status
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
