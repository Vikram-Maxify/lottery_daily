import React, { useMemo, useState } from "react";
import {
    CalendarDays,
    Clock3,
    Ticket,
    Plus,
    Trash2,
    RefreshCw,
    Pencil,
    Power,
    X,
    Shuffle,
    Settings2,
    Trophy,
    Package,
    CheckCircle2,
    XCircle,
} from "lucide-react";


const getToday = () => {
    const now = new Date();

    return (
        `${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, "0")}-` +
        `${String(now.getDate()).padStart(2, "0")}`
    );
};

const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(`${date}T00:00:00`);

    if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const createId = () => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

/* =========================================================
   DEFAULT FORM
========================================================= */

const getDefaultForm = () => ({
    lotteryName: "Festival Lottery",
    drawDate: getToday(),
    drawTime: "18:30",

    ticketPrice: "50",

    numberPrefix: "",
    letterCount: "2",
    numberCount: "3",

    randomEnabled: true,

    firstPrize: "",
    secondPrize: "",
    thirdPrize: "",

    ticketPackages: [
        {
            id: createId(),
            tickets: "10",
            price: "500",
        },
        {
            id: createId(),
            tickets: "20",
            price: "1000",
        },
        {
            id: createId(),
            tickets: "30",
            price: "1500",
        },
        {
            id: createId(),
            tickets: "50",
            price: "2500",
        },
        {
            id: createId(),
            tickets: "100",
            price: "5000",
        },
    ],
});

/* =========================================================
   COMPONENT
========================================================= */

const AdminFestivalLottery = () => {
    /* =======================================================
       FORM
    ======================================================= */

    const [formData, setFormData] = useState(getDefaultForm());

    /* =======================================================
       VALIDATION
    ======================================================= */

    const [validationError, setValidationError] = useState("");

    /* =======================================================
       LOTTERY LIST
    ======================================================= */

    const [lotteries, setLotteries] = useState([]);

    /* =======================================================
       EDIT STATE
    ======================================================= */

    const [editingId, setEditingId] = useState(null);

    /* =======================================================
       DELETE MODAL
    ======================================================= */

    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    /* =======================================================
       SUCCESS MESSAGE
    ======================================================= */

    const [successMessage, setSuccessMessage] = useState("");

    /* =======================================================
       PACKAGE MODAL
    ======================================================= */

    const [packageModal, setPackageModal] = useState(false);

    const [newPackage, setNewPackage] = useState({
        tickets: "",
        price: "",
    });

    /* =======================================================
       TICKET NUMBER PREVIEW
    ======================================================= */

    const ticketPreview = useMemo(() => {
        const letters = Math.max(0, Number(formData.letterCount) || 0);
        const numbers = Math.max(0, Number(formData.numberCount) || 0);

        let letterPart = "";

        for (let i = 0; i < letters; i++) {
            letterPart += String.fromCharCode(65 + (i % 26));
        }

        let numberPart = "";

        for (let i = 0; i < numbers; i++) {
            numberPart += i === 0 ? "1" : "0";
        }

        return `${formData.numberPrefix || "12"}${letterPart}${numberPart}`;
    }, [
        formData.numberPrefix,
        formData.letterCount,
        formData.numberCount,
    ]);

    /* =======================================================
       HANDLE FORM CHANGE
    ======================================================= */

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;

        setValidationError("");
        setSuccessMessage("");

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    /* =======================================================
       PACKAGE CHANGE
    ======================================================= */

    const handlePackageChange = (id, field, value) => {
        setFormData((prev) => ({
            ...prev,
            ticketPackages: prev.ticketPackages.map((pkg) =>
                pkg.id === id
                    ? {
                        ...pkg,
                        [field]: value,
                    }
                    : pkg
            ),
        }));
    };

    /* =======================================================
       REMOVE PACKAGE
    ======================================================= */

    const handleRemovePackage = (id) => {
        setFormData((prev) => ({
            ...prev,
            ticketPackages: prev.ticketPackages.filter(
                (pkg) => pkg.id !== id
            ),
        }));
    };

    /* =======================================================
       OPEN PACKAGE MODAL
    ======================================================= */

    const handleOpenPackageModal = () => {
        setNewPackage({
            tickets: "",
            price: "",
        });

        setPackageModal(true);
    };

    /* =======================================================
       CLOSE PACKAGE MODAL
    ======================================================= */

    const handleClosePackageModal = () => {
        setPackageModal(false);
        setNewPackage({
            tickets: "",
            price: "",
        });
    };

    /* =======================================================
       ADD PACKAGE
    ======================================================= */

    const handleAddPackage = () => {
        const tickets = Number(newPackage.tickets);
        const price = Number(newPackage.price);

        if (!tickets || tickets <= 0) {
            return;
        }

        if (!price || price <= 0) {
            return;
        }

        const packageExists = formData.ticketPackages.some(
            (pkg) => Number(pkg.tickets) === tickets
        );

        if (packageExists) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            ticketPackages: [
                ...prev.ticketPackages,
                {
                    id: createId(),
                    tickets: String(tickets),
                    price: String(price),
                },
            ],
        }));

        handleClosePackageModal();
    };

    /* =======================================================
       VALIDATE
    ======================================================= */

    const validateForm = () => {
        if (!formData.lotteryName.trim()) {
            return "Lottery name is required.";
        }

        if (!formData.drawDate) {
            return "Draw date is required.";
        }

        if (!formData.drawTime) {
            return "Draw time is required.";
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDate = new Date(
            `${formData.drawDate}T00:00:00`
        );

        if (Number.isNaN(selectedDate.getTime())) {
            return "Invalid draw date.";
        }

        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return "Past draw date cannot be selected.";
        }

        const ticketPrice = Number(formData.ticketPrice);

        if (!ticketPrice || ticketPrice <= 0) {
            return "Please enter a valid ticket price.";
        }

        if (
            formData.firstPrize === "" ||
            formData.firstPrize === null
        ) {
            return "First prize is required.";
        }

        if (
            formData.secondPrize === "" ||
            formData.secondPrize === null
        ) {
            return "Second prize is required.";
        }

        if (
            formData.thirdPrize === "" ||
            formData.thirdPrize === null
        ) {
            return "Third prize is required.";
        }

        if (Number(formData.firstPrize) < 0) {
            return "Invalid first prize.";
        }

        if (Number(formData.secondPrize) < 0) {
            return "Invalid second prize.";
        }

        if (Number(formData.thirdPrize) < 0) {
            return "Invalid third prize.";
        }

        if (!formData.ticketPackages.length) {
            return "At least one ticket package is required.";
        }

        return "";
    };

    /* =======================================================
       CREATE / UPDATE
    ======================================================= */

    const handleSubmit = (e) => {
        e.preventDefault();

        setValidationError("");
        setSuccessMessage("");

        const error = validateForm();

        if (error) {
            setValidationError(error);
            return;
        }

        const payload = {
            id: editingId || createId(),

            lotteryName: formData.lotteryName.trim(),

            drawDate: formData.drawDate,

            drawTime: formData.drawTime,

            ticketPrice: Number(formData.ticketPrice),

            ticketNumberConfig: {
                prefix: formData.numberPrefix,
                letterCount: Number(formData.letterCount),
                numberCount: Number(formData.numberCount),
                randomEnabled: formData.randomEnabled,
                format: ticketPreview,
            },

            prizes: {
                first: Number(formData.firstPrize),
                second: Number(formData.secondPrize),
                third: Number(formData.thirdPrize),
            },

            ticketPackages: formData.ticketPackages.map((pkg) => ({
                tickets: Number(pkg.tickets),
                price: Number(pkg.price),
            })),

            isActive: true,

            createdAt: new Date().toISOString(),
        };

        if (editingId) {
            setLotteries((prev) =>
                prev.map((lottery) =>
                    lottery.id === editingId
                        ? {
                            ...lottery,
                            ...payload,
                        }
                        : lottery
                )
            );

            setSuccessMessage(
                "Festival lottery updated successfully."
            );
        } else {
            setLotteries((prev) => [payload, ...prev]);

            setSuccessMessage(
                "Festival lottery created successfully."
            );
        }

        setFormData(getDefaultForm());
        setEditingId(null);
    };

    /* =======================================================
       EDIT
    ======================================================= */

    const handleEdit = (lottery) => {
        setEditingId(lottery.id);

        setFormData({
            lotteryName: lottery.lotteryName || "Festival Lottery",

            drawDate: lottery.drawDate || getToday(),

            drawTime: lottery.drawTime || "18:30",

            ticketPrice: String(lottery.ticketPrice || 50),

            numberPrefix:
                lottery.ticketNumberConfig?.prefix || "",

            letterCount: String(
                lottery.ticketNumberConfig?.letterCount ?? 2
            ),

            numberCount: String(
                lottery.ticketNumberConfig?.numberCount ?? 3
            ),

            randomEnabled:
                lottery.ticketNumberConfig?.randomEnabled ?? true,

            firstPrize: String(lottery.prizes?.first ?? ""),

            secondPrize: String(lottery.prizes?.second ?? ""),

            thirdPrize: String(lottery.prizes?.third ?? ""),

            ticketPackages:
                lottery.ticketPackages?.map((pkg) => ({
                    id: createId(),
                    tickets: String(pkg.tickets),
                    price: String(pkg.price),
                })) || [],
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /* =======================================================
       CANCEL EDIT
    ======================================================= */

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData(getDefaultForm());
        setValidationError("");
        setSuccessMessage("");
    };

    /* =======================================================
       TOGGLE STATUS
    ======================================================= */

    const handleToggleStatus = (id) => {
        setLotteries((prev) =>
            prev.map((lottery) =>
                lottery.id === id
                    ? {
                        ...lottery,
                        isActive: !lottery.isActive,
                    }
                    : lottery
            )
        );
    };

    /* =======================================================
       DELETE OPEN
    ======================================================= */

    const handleOpenDelete = (id) => {
        setDeleteId(id);
        setDeleteModal(true);
    };

    /* =======================================================
       DELETE CLOSE
    ======================================================= */

    const handleCloseDelete = () => {
        setDeleteId(null);
        setDeleteModal(false);
    };

    /* =======================================================
       DELETE
    ======================================================= */

    const handleDelete = () => {
        if (!deleteId) return;

        setLotteries((prev) =>
            prev.filter((lottery) => lottery.id !== deleteId)
        );

        if (editingId === deleteId) {
            handleCancelEdit();
        }

        setSuccessMessage(
            "Festival lottery deleted successfully."
        );

        handleCloseDelete();
    };

    /* =======================================================
       REFRESH
    ======================================================= */

    const handleRefresh = () => {
        setSuccessMessage("Festival lottery list refreshed.");

        setTimeout(() => {
            setSuccessMessage("");
        }, 2500);
    };

    /* =======================================================
       RESET FORM
    ======================================================= */

    const handleReset = () => {
        setFormData(getDefaultForm());
        setEditingId(null);
        setValidationError("");
        setSuccessMessage("");
    };

    /* =======================================================
       RENDER
    ======================================================= */

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">

            {/* ===================================================
          HEADER
      =================================================== */}

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                    <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Ticket size={23} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Festival Lottery
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Create and manage festival lottery draws,
                                tickets and prize settings.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                    <RefreshCw size={16} />

                    Refresh
                </button>
            </div>

            {/* ===================================================
          SUCCESS
      =================================================== */}

            {successMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    <CheckCircle2 size={17} />

                    {successMessage}
                </div>
            )}

            {/* ===================================================
          VALIDATION ERROR
      =================================================== */}

            {validationError && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

                    <div className="flex items-center gap-2">
                        <XCircle size={17} />

                        {validationError}
                    </div>

                    <button
                        type="button"
                        onClick={() => setValidationError("")}
                        className="text-lg font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* ===================================================
          CREATE / EDIT
      =================================================== */}

            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                {/* HEADER */}

                <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">

                    <div>
                        <div className="flex items-center gap-2">

                            <Settings2
                                size={19}
                                className="text-blue-600"
                            />

                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingId
                                    ? "Edit Festival Lottery"
                                    : "Create Festival Lottery"}
                            </h2>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            Configure draw, ticket, random number and
                            prize settings.
                        </p>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <X size={16} />

                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit}>

                    {/* =================================================
              BASIC INFORMATION
          ================================================= */}

                    <div className="mb-7">

                        <div className="mb-4 flex items-center gap-2">

                            <CalendarDays
                                size={18}
                                className="text-blue-600"
                            />

                            <h3 className="text-sm font-semibold text-gray-900">
                                Draw Information
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

                            {/* LOTTERY NAME */}

                            <div className="lg:col-span-2">

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Lottery Name
                                </label>

                                <input
                                    type="text"
                                    name="lotteryName"
                                    value={formData.lotteryName}
                                    onChange={handleFormChange}
                                    placeholder="Enter lottery name"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* DATE */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Draw Date
                                </label>

                                <input
                                    type="date"
                                    name="drawDate"
                                    value={formData.drawDate}
                                    min={getToday()}
                                    onChange={handleFormChange}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <p className="mt-1 text-xs text-gray-500">
                                    Past dates are not allowed.
                                </p>
                            </div>

                            {/* TIME */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Draw Time
                                </label>

                                <div className="relative">

                                    <Clock3
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="time"
                                        name="drawTime"
                                        value={formData.drawTime}
                                        onChange={handleFormChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
              TICKET SETTINGS
          ================================================= */}

                    <div className="mb-7 border-t border-gray-100 pt-6">

                        <div className="mb-4 flex items-center gap-2">

                            <Ticket
                                size={18}
                                className="text-blue-600"
                            />

                            <h3 className="text-sm font-semibold text-gray-900">
                                Ticket Settings
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

                            {/* TICKET PRICE */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Ticket Price
                                </label>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        name="ticketPrice"
                                        value={formData.ticketPrice}
                                        min="1"
                                        onChange={handleFormChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-8 pr-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* PREFIX */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Number Prefix
                                </label>

                                <input
                                    type="text"
                                    name="numberPrefix"
                                    value={formData.numberPrefix}
                                    onChange={handleFormChange}
                                    placeholder="Example: 12"
                                    maxLength={5}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* LETTER COUNT */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Letter Count
                                </label>

                                <input
                                    type="number"
                                    name="letterCount"
                                    value={formData.letterCount}
                                    min="0"
                                    max="10"
                                    onChange={handleFormChange}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* NUMBER COUNT */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Number Count
                                </label>

                                <input
                                    type="number"
                                    name="numberCount"
                                    value={formData.numberCount}
                                    min="1"
                                    max="10"
                                    onChange={handleFormChange}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        {/* FORMAT PREVIEW */}

                        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">

                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                                <div>
                                    <p className="text-xs font-medium text-blue-600">
                                        Ticket Number Format
                                    </p>

                                    <p className="mt-1 text-lg font-bold tracking-wider text-gray-900">
                                        {ticketPreview}
                                    </p>
                                </div>

                                <div className="text-left md:text-right">

                                    <p className="text-xs text-gray-500">
                                        Example used by Random
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-blue-700">
                                        {ticketPreview}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RANDOM */}

                        <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">

                            <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                                    <Shuffle size={17} />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        Random Ticket Selection
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        Allow users to generate random ticket
                                        numbers.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        randomEnabled: !prev.randomEnabled,
                                    }))
                                }
                                className={`relative h-6 w-11 rounded-full transition ${formData.randomEnabled
                                    ? "bg-blue-600"
                                    : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${formData.randomEnabled
                                        ? "left-6"
                                        : "left-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* =================================================
              PRIZES
          ================================================= */}

                    <div className="mb-7 border-t border-gray-100 pt-6">

                        <div className="mb-4 flex items-center gap-2">

                            <Trophy
                                size={18}
                                className="text-blue-600"
                            />

                            <h3 className="text-sm font-semibold text-gray-900">
                                Prize Configuration
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                            {/* FIRST */}

                            <div className="rounded-lg border border-gray-200 p-4">

                                <div className="mb-3 flex items-center justify-between">

                                    <span className="text-sm font-semibold text-gray-700">
                                        1st Prize
                                    </span>

                                    <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                                        Winner 1
                                    </span>
                                </div>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        name="firstPrize"
                                        value={formData.firstPrize}
                                        min="0"
                                        placeholder="Enter first prize"
                                        onChange={handleFormChange}
                                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* SECOND */}

                            <div className="rounded-lg border border-gray-200 p-4">

                                <div className="mb-3 flex items-center justify-between">

                                    <span className="text-sm font-semibold text-gray-700">
                                        2nd Prize
                                    </span>

                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        Winner 2
                                    </span>
                                </div>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        name="secondPrize"
                                        value={formData.secondPrize}
                                        min="0"
                                        placeholder="Enter second prize"
                                        onChange={handleFormChange}
                                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* THIRD */}

                            <div className="rounded-lg border border-gray-200 p-4">

                                <div className="mb-3 flex items-center justify-between">

                                    <span className="text-sm font-semibold text-gray-700">
                                        3rd Prize
                                    </span>

                                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                                        Winner 3
                                    </span>
                                </div>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        name="thirdPrize"
                                        value={formData.thirdPrize}
                                        min="0"
                                        placeholder="Enter third prize"
                                        onChange={handleFormChange}
                                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
              TICKET PACKAGES
          ================================================= */}

                    <div className="border-t border-gray-100 pt-6">

                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                            <div className="flex items-center gap-2">

                                <Package
                                    size={18}
                                    className="text-blue-600"
                                />

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Ticket Packages
                                    </h3>

                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Packages displayed to users on the
                                        purchase screen.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleOpenPackageModal}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                            >
                                <Plus size={16} />

                                Add Package
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-gray-200">

                            <div className="overflow-x-auto">

                                <table className="w-full min-w-[650px]">

                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Tickets
                                            </th>

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Package Price
                                            </th>

                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Price / Ticket
                                            </th>

                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {formData.ticketPackages.map(
                                            (pkg) => (
                                                <tr
                                                    key={pkg.id}
                                                    className="border-b border-gray-100 last:border-0"
                                                >

                                                    <td className="px-4 py-3">

                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={pkg.tickets}
                                                            onChange={(e) =>
                                                                handlePackageChange(
                                                                    pkg.id,
                                                                    "tickets",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                        />

                                                        <span className="ml-2 text-sm text-gray-500">
                                                            Tickets
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3">

                                                        <div className="relative w-36">

                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                                                                ₹
                                                            </span>

                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={pkg.price}
                                                                onChange={(e) =>
                                                                    handlePackageChange(
                                                                        pkg.id,
                                                                        "price",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">

                                                        ₹
                                                        {Number(pkg.tickets) > 0
                                                            ? (
                                                                Number(pkg.price) /
                                                                Number(pkg.tickets)
                                                            ).toFixed(2)
                                                            : "0.00"}

                                                    </td>

                                                    <td className="px-4 py-3 text-right">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemovePackage(
                                                                    pkg.id
                                                                )
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                            title="Remove package"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        )}

                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* =================================================
              SUBMIT
          ================================================= */}

                    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">

                        <button
                            type="button"
                            onClick={handleReset}
                            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            {editingId ? (
                                <>
                                    <Pencil size={16} />

                                    Update Festival Lottery
                                </>
                            ) : (
                                <>
                                    <Plus size={17} />

                                    Create Festival Lottery
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* =====================================================
          ALL FESTIVAL LOTTERIES
      ===================================================== */}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                {/* HEADER */}

                <div className="flex flex-col gap-3 border-b border-gray-200 p-5 md:flex-row md:items-center md:justify-between">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            All Festival Lotteries
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Total: {lotteries.length}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">

                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            {
                                lotteries.filter(
                                    (lottery) => lottery.isActive
                                ).length
                            }{" "}
                            Active
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            {
                                lotteries.filter(
                                    (lottery) => !lottery.isActive
                                ).length
                            }{" "}
                            Inactive
                        </span>
                    </div>
                </div>

                {/* EMPTY */}

                {lotteries.length === 0 && (
                    <div className="p-12 text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Ticket size={25} />
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-gray-700">
                            No festival lotteries found
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                            Create your first festival lottery using
                            the form above.
                        </p>
                    </div>
                )}

                {/* TABLE */}

                {lotteries.length > 0 && (
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1250px]">

                            <thead>

                                <tr className="border-b border-gray-200 bg-gray-50">

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        #
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Lottery
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Draw Date
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Time
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Ticket Price
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Ticket Format
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Prizes
                                    </th>

                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Action
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {lotteries.map((lottery, index) => (

                                    <tr
                                        key={lottery.id}
                                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                                    >

                                        {/* INDEX */}

                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {index + 1}
                                        </td>

                                        {/* LOTTERY */}

                                        <td className="px-4 py-4">

                                            <div className="font-semibold text-gray-900">
                                                {lottery.lotteryName}
                                            </div>

                                            <div className="mt-1 text-xs text-gray-400">
                                                {lottery.ticketPackages?.length || 0}{" "}
                                                packages
                                            </div>
                                        </td>

                                        {/* DATE */}

                                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                            {formatDate(lottery.drawDate)}
                                        </td>

                                        {/* TIME */}

                                        <td className="px-4 py-4">

                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                                                <Clock3 size={14} />

                                                {lottery.drawTime}
                                            </span>
                                        </td>

                                        {/* PRICE */}

                                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">

                                            ₹
                                            {Number(
                                                lottery.ticketPrice || 0
                                            ).toLocaleString("en-IN")}
                                        </td>

                                        {/* FORMAT */}

                                        <td className="px-4 py-4">

                                            <span className="rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-sm font-semibold text-gray-700">
                                                {
                                                    lottery.ticketNumberConfig
                                                        ?.format
                                                }
                                            </span>
                                        </td>

                                        {/* PRIZES */}

                                        <td className="px-4 py-4">

                                            <div className="space-y-1 text-xs">

                                                <div>
                                                    <span className="font-semibold text-gray-500">
                                                        1st:
                                                    </span>{" "}
                                                    ₹
                                                    {Number(
                                                        lottery.prizes?.first || 0
                                                    ).toLocaleString("en-IN")}
                                                </div>

                                                <div>
                                                    <span className="font-semibold text-gray-500">
                                                        2nd:
                                                    </span>{" "}
                                                    ₹
                                                    {Number(
                                                        lottery.prizes?.second || 0
                                                    ).toLocaleString("en-IN")}
                                                </div>

                                                <div>
                                                    <span className="font-semibold text-gray-500">
                                                        3rd:
                                                    </span>{" "}
                                                    ₹
                                                    {Number(
                                                        lottery.prizes?.third || 0
                                                    ).toLocaleString("en-IN")}
                                                </div>
                                            </div>
                                        </td>

                                        {/* STATUS */}

                                        <td className="px-4 py-4">

                                            {lottery.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                    <CheckCircle2 size={13} />

                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                                                    <XCircle size={13} />

                                                    Inactive
                                                </span>
                                            )}
                                        </td>

                                        {/* ACTION */}

                                        <td className="px-4 py-4">

                                            <div className="flex justify-end gap-2">

                                                {/* EDIT */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(lottery)
                                                    }
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                                    title="Edit"
                                                >
                                                    <Pencil size={15} />
                                                </button>

                                                {/* ACTIVATE / DEACTIVATE */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            lottery.id
                                                        )
                                                    }
                                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${lottery.isActive
                                                        ? "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                                                        : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                                                        }`}
                                                    title={
                                                        lottery.isActive
                                                            ? "Deactivate"
                                                            : "Activate"
                                                    }
                                                >
                                                    <Power size={15} />
                                                </button>

                                                {/* DELETE */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleOpenDelete(
                                                            lottery.id
                                                        )
                                                    }
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* =====================================================
          ADD PACKAGE MODAL
      ===================================================== */}

            {packageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

                        {/* HEADER */}

                        <div className="flex items-center justify-between border-b border-gray-200 p-5">

                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Add Ticket Package
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Add a package that users can purchase.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleClosePackageModal}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {/* BODY */}

                        <div className="space-y-4 p-5">

                            {/* TICKETS */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Number of Tickets
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={newPackage.tickets}
                                    onChange={(e) =>
                                        setNewPackage((prev) => ({
                                            ...prev,
                                            tickets: e.target.value,
                                        }))
                                    }
                                    placeholder="Example: 200"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* PRICE */}

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Package Price
                                </label>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-gray-500">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        min="1"
                                        value={newPackage.price}
                                        onChange={(e) =>
                                            setNewPackage((prev) => ({
                                                ...prev,
                                                price: e.target.value,
                                            }))
                                        }
                                        placeholder="Example: 10000"
                                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}

                        <div className="flex justify-end gap-3 border-t border-gray-200 p-5">

                            <button
                                type="button"
                                onClick={handleClosePackageModal}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleAddPackage}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                <Plus size={16} />

                                Add Package
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
          DELETE MODAL
      ===================================================== */}

            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <Trash2 size={20} />
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-gray-900">
                            Delete Festival Lottery
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            Are you sure you want to delete this festival
                            lottery? This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={handleCloseDelete}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFestivalLottery;