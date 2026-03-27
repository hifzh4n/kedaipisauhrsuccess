import { useState } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";

export default function ExportStockModal({ show, onClose }) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        format: "pdf",
        report_type: "current_stock",
        include_images: false,
        include_batches: false,
        stock_status: "all",
        date_range: "all",
        start_date: "",
        end_date: "",
        columns: [
            "item_name",
            "sku",
            "current_stock",
            "min_stock",
            "status",
            "last_updated",
        ],
    });

    const reportTypes = [
        { value: "current_stock", label: "Current Stock Report" },
        { value: "stock_movements", label: "Stock Movements Report" },
        { value: "aging_report", label: "Stock Aging Report" },
        { value: "low_stock", label: "Low Stock Alert Report" },
        { value: "valuation", label: "Stock Valuation Report" },
    ];

    const formatOptions = [
        { value: "pdf", label: "PDF Document" },
        { value: "excel", label: "Excel Spreadsheet" },
        { value: "csv", label: "CSV File" },
    ];

    const stockStatusOptions = [
        { value: "all", label: "All Stock" },
        { value: "in_stock", label: "In Stock Only" },
        { value: "low_stock", label: "Low Stock Only" },
        { value: "out_of_stock", label: "Out of Stock Only" },
    ];

    const dateRangeOptions = [
        { value: "all", label: "All Time" },
        { value: "today", label: "Today" },
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "quarter", label: "This Quarter" },
        { value: "year", label: "This Year" },
        { value: "custom", label: "Custom Range" },
    ];

    const availableColumns = [
        { value: "item_name", label: "Item Name" },
        { value: "sku", label: "SKU" },
        { value: "category", label: "Category" },
        { value: "current_stock", label: "Current Stock" },
        { value: "min_stock", label: "Minimum Stock" },
        { value: "status", label: "Stock Status" },
        { value: "last_updated", label: "Last Updated" },
        { value: "supplier", label: "Supplier" },
        { value: "purchase_price", label: "Purchase Price" },
        { value: "total_value", label: "Total Value" },
    ];

    const handleColumnToggle = (columnValue) => {
        const currentColumns = data.columns;
        if (currentColumns.includes(columnValue)) {
            setData(
                "columns",
                currentColumns.filter((col) => col !== columnValue)
            );
        } else {
            setData("columns", [...currentColumns, columnValue]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsExporting(true);

        post("/stocks/export", {
            onSuccess: () => {
                reset();
                onClose();
                setIsExporting(false);
            },
            onError: () => {
                setIsExporting(false);
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="flex flex-col max-h-[90vh]">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Export Stock Report
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Generate and download stock reports in various formats.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col flex-1 min-h-0"
                >
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        {/* Report Type and Format */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel
                                    htmlFor="report_type"
                                    value="Report Type"
                                />
                                <select
                                    id="report_type"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.report_type}
                                    onChange={(e) =>
                                        setData("report_type", e.target.value)
                                    }
                                >
                                    {reportTypes.map((type) => (
                                        <option
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.report_type}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="format"
                                    value="Export Format"
                                />
                                <select
                                    id="format"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.format}
                                    onChange={(e) =>
                                        setData("format", e.target.value)
                                    }
                                >
                                    {formatOptions.map((format) => (
                                        <option
                                            key={format.value}
                                            value={format.value}
                                        >
                                            {format.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.format}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel
                                    htmlFor="stock_status"
                                    value="Stock Status Filter"
                                />
                                <select
                                    id="stock_status"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.stock_status}
                                    onChange={(e) =>
                                        setData("stock_status", e.target.value)
                                    }
                                >
                                    {stockStatusOptions.map((status) => (
                                        <option
                                            key={status.value}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.stock_status}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="date_range"
                                    value="Date Range"
                                />
                                <select
                                    id="date_range"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.date_range}
                                    onChange={(e) =>
                                        setData("date_range", e.target.value)
                                    }
                                >
                                    {dateRangeOptions.map((range) => (
                                        <option
                                            key={range.value}
                                            value={range.value}
                                        >
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.date_range}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        {/* Custom Date Range */}
                        {data.date_range === "custom" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel
                                        htmlFor="start_date"
                                        value="Start Date"
                                    />
                                    <input
                                        id="start_date"
                                        type="date"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={data.start_date}
                                        onChange={(e) =>
                                            setData(
                                                "start_date",
                                                e.target.value
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.start_date}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="end_date"
                                        value="End Date"
                                    />
                                    <input
                                        id="end_date"
                                        type="date"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={data.end_date}
                                        onChange={(e) =>
                                            setData("end_date", e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.end_date}
                                        className="mt-2"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Additional Options */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Additional Options
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        checked={data.include_images}
                                        onChange={(e) =>
                                            setData(
                                                "include_images",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        Include item images (PDF only)
                                    </span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        checked={data.include_batches}
                                        onChange={(e) =>
                                            setData(
                                                "include_batches",
                                                e.target.checked
                                            )
                                        }
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        Include batch information
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Column Selection */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Select Columns to Include
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {availableColumns.map((column) => (
                                    <label
                                        key={column.value}
                                        className="flex items-center"
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            checked={data.columns.includes(
                                                column.value
                                            )}
                                            onChange={() =>
                                                handleColumnToggle(column.value)
                                            }
                                        />
                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            {column.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <InputError
                                message={errors.columns}
                                className="mt-2"
                            />
                        </div>

                        {/* Preview Information */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-blue-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                        Export Information
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                        <p>
                                            Report Type:{" "}
                                            <strong>
                                                {
                                                    reportTypes.find(
                                                        (t) =>
                                                            t.value ===
                                                            data.report_type
                                                    )?.label
                                                }
                                            </strong>
                                        </p>
                                        <p>
                                            Format:{" "}
                                            <strong>
                                                {
                                                    formatOptions.find(
                                                        (f) =>
                                                            f.value ===
                                                            data.format
                                                    )?.label
                                                }
                                            </strong>
                                        </p>
                                        <p>
                                            Columns:{" "}
                                            <strong>
                                                {data.columns.length} selected
                                            </strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-end gap-4">
                            <SecondaryButton
                                onClick={handleClose}
                                disabled={processing || isExporting}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                disabled={
                                    processing ||
                                    isExporting ||
                                    data.columns.length === 0
                                }
                            >
                                {processing || isExporting ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Generating...
                                    </>
                                ) : (
                                    `Export ${data.format.toUpperCase()}`
                                )}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
