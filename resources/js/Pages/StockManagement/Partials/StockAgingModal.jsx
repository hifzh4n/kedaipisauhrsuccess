import { useState, useEffect } from "react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { toast, toastUtils } from "@/utils/toast";

export default function StockAgingModal({ show, onClose }) {
    const [agingData, setAgingData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        status: "all",
    });

    // This will be replaced with real API call
    const mockAgingData = [];

    useEffect(() => {
        if (show) {
            loadAgingData();
        }
    }, [show, filters]);

    const loadAgingData = async () => {
        setIsLoading(true);

        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (filters.search) {
                params.append("search", filters.search);
            }
            if (filters.status !== "all") {
                params.append("status", filters.status);
            }

            // Fetch real data from stocks aging API
            const response = await fetch(`/stocks/aging?${params.toString()}`, {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAgingData(data);
            } else {
                console.error("Failed to fetch aging data");
                setAgingData([]);
            }
        } catch (error) {
            console.error("Error fetching aging data:", error);
            setAgingData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "good":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "empty":
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "good":
                return "Active";
            case "empty":
                return "Empty";
            default:
                return "Unknown";
        }
    };

    const handleExportAging = async () => {
        setIsExporting(true);
        try {
            // Build query parameters for export
            const params = new URLSearchParams();
            if (filters.search) {
                params.append("search", filters.search);
            }
            if (filters.status !== "all") {
                params.append("status", filters.status);
            }

            // Call the export endpoint
            const response = await fetch("/stocks/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                body: JSON.stringify({
                    format: "pdf",
                    report_type: "aging_report",
                    columns: [
                        "item_name",
                        "batch_number",
                        "quantity",
                        "date_added",
                        "days_in_stock",
                        "status",
                    ],
                    filters: {
                        search: filters.search,
                        status:
                            filters.status !== "all" ? filters.status : null,
                    },
                }),
            });

            if (response.ok) {
                // Handle successful export
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `stock-aging-report-${
                    new Date().toISOString().split("T")[0]
                }.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error("Export failed:", response.statusText);
                toast.error("Export failed. Please try again.");
            }
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteItem = (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            const response = await fetch(`/stocks/batch/${itemToDelete.id}`, {
                method: "DELETE",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
            });

            if (response.ok) {
                // Remove the item from the local state
                setAgingData((prevData) =>
                    prevData.filter(
                        (item) =>
                            !(
                                item.id === itemToDelete.id &&
                                item.batch_number === itemToDelete.batch_number
                            )
                    )
                );
                setShowDeleteConfirm(false);
                setItemToDelete(null);
            } else {
                toast.error("Failed to delete item. Please try again.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Delete failed. Please try again.");
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
    };

    return (
        <Modal show={show} onClose={onClose}>
            <div className="flex flex-col max-h-[90vh]">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Stock Aging Report
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Monitor stock levels and aging by batch numbers.
                    </p>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <InputLabel
                                htmlFor="search_filter"
                                value="Search Items"
                            />
                            <TextInput
                                id="search_filter"
                                type="text"
                                className="mt-1 block w-full"
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        search: e.target.value,
                                    }))
                                }
                                placeholder="Search by item name, item ID, or barcode..."
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="status_filter"
                                value="Status Filter"
                            />
                            <select
                                id="status_filter"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        status: e.target.value,
                                    }))
                                }
                            >
                                <option value="all">All Items</option>
                                <option value="good">Active Batches</option>
                                <option value="empty">Empty Batches</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <PrimaryButton
                                onClick={handleExportAging}
                                disabled={isExporting}
                                className="px-4 py-2 text-sm h-10"
                            >
                                {isExporting ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Exporting...
                                    </>
                                ) : (
                                    "Export Report"
                                )}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                                Loading aging data...
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block">
                                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Item
                                            </th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Batch
                                            </th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Qty
                                            </th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Added
                                            </th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Days
                                            </th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {agingData.length > 0 ? (
                                            agingData.map((item) => (
                                                <tr
                                                    key={`${item.id}-${item.batch_number}`}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                                >
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8">
                                                                {item.picture_url ? (
                                                                    <img
                                                                        className="h-8 w-8 rounded-lg object-cover"
                                                                        src={
                                                                            item.picture_url
                                                                        }
                                                                        alt={
                                                                            item.item_name
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                                        <svg
                                                                            className="h-4 w-4 text-gray-400"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth="2"
                                                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                                            />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-2 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                    {
                                                                        item.item_name
                                                                    }
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                    ID:{" "}
                                                                    {
                                                                        item.item_id
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                        {item.batch_number}
                                                    </td>
                                                    <td className="px-2 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                        {item.date_added
                                                            ? new Date(
                                                                  item.date_added
                                                              ).toLocaleDateString()
                                                            : "N/A"}
                                                    </td>
                                                    <td className="px-2 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                        {item.days_in_stock}
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <span
                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                                                                item.status
                                                            )}`}
                                                        >
                                                            {getStatusText(
                                                                item.status
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteItem(
                                                                    item
                                                                )
                                                            }
                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Delete this batch"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                                                >
                                                    No aging data found for the
                                                    selected criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {agingData.length > 0 ? (
                                    agingData.map((item) => (
                                        <div
                                            key={`${item.id}-${item.batch_number}`}
                                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0">
                                                    {item.picture_url ? (
                                                        <img
                                                            className="h-16 w-16 rounded-lg object-cover"
                                                            src={
                                                                item.picture_url
                                                            }
                                                            alt={item.item_name}
                                                        />
                                                    ) : (
                                                        <div className="h-16 w-16 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                            <svg
                                                                className="h-8 w-8 text-gray-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {item.item_name}
                                                        </h3>
                                                        <div className="flex items-center space-x-2">
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                                                                    item.status
                                                                )}`}
                                                            >
                                                                {getStatusText(
                                                                    item.status
                                                                )}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteItem(
                                                                        item
                                                                    )
                                                                }
                                                                className="inline-flex items-center p-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                title="Delete this batch"
                                                            >
                                                                <svg
                                                                    className="w-3 h-3"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Item ID: {item.item_id}{" "}
                                                        • Batch:{" "}
                                                        {item.batch_number}
                                                    </p>
                                                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                Quantity:
                                                            </span>
                                                            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                                                                {item.quantity}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                Date Added:
                                                            </span>
                                                            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                                                                {item.created_at
                                                                    ? new Date(
                                                                          item.created_at
                                                                      ).toLocaleDateString()
                                                                    : "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                            No aging data
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            No items found matching the selected
                                            criteria.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Fixed Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-end">
                        <SecondaryButton onClick={onClose}>
                            Close
                        </SecondaryButton>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-6 w-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Delete Batch
                                </h3>
                            </div>
                        </div>
                        <div className="mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete the batch{" "}
                                <strong>{itemToDelete?.batch_number}</strong>{" "}
                                for item{" "}
                                <strong>{itemToDelete?.item_name}</strong>? This
                                action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <SecondaryButton
                                onClick={cancelDelete}
                                className="px-4 py-2 text-sm"
                            >
                                Cancel
                            </SecondaryButton>
                            <button
                                onClick={confirmDelete}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
