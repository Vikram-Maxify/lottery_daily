import { useEffect, useState } from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  getAmount,
  updateAmount,
  clearAmountMessage,
} from "../../reducer/slice/amountReducer";

const Amount = () => {
  const dispatch = useDispatch();

  const {
    amount,
    updatedAt,
    loading,
    updateLoading,
    success,
    error,
    message,
  } = useSelector((state) => state.amount);

  const [inputAmount, setInputAmount] = useState("");

  // =======================
  // GET CURRENT AMOUNT
  // =======================
  useEffect(() => {
    dispatch(getAmount());
  }, [dispatch]);

  // =======================
  // SET INPUT VALUE
  // =======================
  useEffect(() => {
    setInputAmount(amount);
  }, [amount]);

  // =======================
  // CLEAR MESSAGE
  // =======================
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearAmountMessage());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  // =======================
  // UPDATE AMOUNT
  // =======================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      inputAmount === "" ||
      inputAmount === null
    ) {
      return;
    }

    const numericAmount = Number(inputAmount);

    if (
      isNaN(numericAmount) ||
      numericAmount < 0
    ) {
      return;
    }

    dispatch(updateAmount(numericAmount));
  };

  // =======================
  // FORMAT DATE
  // =======================
  const formatDate = (date) => {
    if (!date) return "Never";

    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">

        {/* =======================
            HEADER
        ======================= */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Amount Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update and manage the current system amount.
          </p>
        </div>

        {/* =======================
            MESSAGE
        ======================= */}
        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* =======================
            CURRENT AMOUNT CARD
        ======================= */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-2 text-sm font-medium text-gray-500">
            Current Amount
          </div>

          {loading ? (
            <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
          ) : (
            <div className="text-4xl font-bold text-gray-900">
              ₹{Number(amount || 0).toLocaleString("en-IN")}
            </div>
          )}

          <div className="mt-3 text-sm text-gray-500">
            Last updated:{" "}
            <span className="font-medium text-gray-700">
              {formatDate(updatedAt)}
            </span>
          </div>
        </div>

        {/* =======================
            UPDATE FORM
        ======================= */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Update Amount
          </h2>

          <p className="mb-6 text-sm text-gray-500">
            Enter the new amount below.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* INPUT */}
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Amount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>

                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={inputAmount}
                  onChange={(e) =>
                    setInputAmount(e.target.value)
                  }
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-9 pr-4 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={
                updateLoading ||
                inputAmount === ""
              }
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
            >
              {updateLoading
                ? "Updating..."
                : "Update Amount"}
            </button>
          </form>
        </div>

        {/* =======================
            INFO CARD
        ======================= */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="text-blue-600">
              ℹ️
            </div>

            <div>
              <h3 className="text-sm font-semibold text-blue-900">
                Amount Information
              </h3>

              <p className="mt-1 text-sm text-blue-700">
                The amount entered here will replace the
                existing amount in the system.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Amount;