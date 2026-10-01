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
    <div className="min-h-screen bg-[#FFFDF7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">

        {/* =======================
            HEADER
        ======================= */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Amount Management
          </h1>

          <p className="mt-1 text-sm text-[#6B7280]">
            Update and manage the current system amount.
          </p>
        </div>

        {/* =======================
            MESSAGE
        ======================= */}
        {success && (
          <div className="mb-5 rounded-lg border border-[#12A36B]/30 bg-[#E6F6EF] px-4 py-3 text-sm font-medium text-[#0E7A52]">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-[#D93025]/30 bg-[#FDE8E6] px-4 py-3 text-sm font-medium text-[#B3261E]">
            {error}
          </div>
        )}

        {/* =======================
            CURRENT AMOUNT CARD
        ======================= */}
        <div className="mb-6 rounded-2xl border border-[#F3E7C4] bg-white p-6 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">

          <div className="mb-2 text-sm font-medium text-[#6B7280]">
            Current Amount
          </div>

          {loading ? (
            <div className="h-10 w-40 animate-pulse rounded bg-[#F5F1E4]" />
          ) : (
            <div className="text-4xl font-bold text-[#1A1A1A]">
              ₹{Number(amount || 0).toLocaleString("en-IN")}
            </div>
          )}

          <div className="mt-3 text-sm text-[#6B7280]">
            Last updated:{" "}
            <span className="font-medium text-[#1A1A1A]">
              {formatDate(updatedAt)}
            </span>
          </div>
        </div>

        {/* =======================
            UPDATE FORM
        ======================= */}
        <div className="rounded-2xl border border-[#F3E7C4] bg-white p-6 shadow-[0_6px_18px_-10px_rgba(247,181,0,0.35)]">

          <h2 className="mb-1 text-lg font-semibold text-[#1A1A1A]">
            Update Amount
          </h2>

          <p className="mb-6 text-sm text-[#6B7280]">
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
                className="mb-2 block text-sm font-medium text-[#1A1A1A]"
              >
                Amount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A5B00]">
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
                  className="w-full rounded-lg border border-[#F3E7C4] bg-[#FFFDF7] py-3 pl-9 pr-4 text-[#1A1A1A] outline-none transition placeholder:text-[#8A8F98] focus:border-[#F2B705] focus:ring-2 focus:ring-[#FFEFA8]"
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
              className="w-full rounded-lg bg-gradient-to-b from-[#FFD83D] via-[#F7B500] to-[#E39A00] px-5 py-3 text-sm font-extrabold text-[#1A1204] shadow-[0_4px_10px_-3px_rgba(227,154,0,0.55),inset_0_1px_0_rgba(255,255,255,0.55)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#F5F1E4] disabled:bg-none disabled:text-[#8A8F98] disabled:shadow-none sm:w-auto"
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
        <div className="mt-6 rounded-xl border border-[#F3E7C4] bg-[#FFF9E3] p-4">
          <div className="flex gap-3">
            <div className="text-[#9A5B00]">
              ℹ️
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                Amount Information
              </h3>

              <p className="mt-1 text-sm text-[#6B7280]">
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