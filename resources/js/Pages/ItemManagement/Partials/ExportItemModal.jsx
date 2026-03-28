import { useEffect, useRef, useState } from "react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import { toast } from "@/utils/toast";
import { downloadRouteFile, saveResponseFile } from "@/utils/desktopDownload";

export default function ExportItemModal({
    show,
    onClose,
    filters = {},
    brands = [],
}) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState("pdf");
    const exportPollingRef = useRef(null);
    const [exportFilters, setExportFilters] = useState({
        brand: filters.brand || "",
        status: filters.status || "",
    });

    const stopPolling = () => {
        if (exportPollingRef.current) {
            clearInterval(exportPollingRef.current);
            exportPollingRef.current = null;
        }
    };

    const pollQueuedExport = (filename) => {
        stopPolling();

        exportPollingRef.current = setInterval(async () => {
            try {
                const response = await fetch(route("items.export-status"), {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    credentials: "same-origin",
                });

                if (!response.ok) {
                    return;
                }

                const statusData = await response.json();
                const matching = (statusData.notifications || []).find(
                    (notification) => notification.filename === filename
                );

                if (!matching || matching.status === "pending") {
                    return;
                }

                stopPolling();

                if (matching.status === "completed") {
                    const downloadResult = await downloadRouteFile(route("items.download-pdf", { filename }), filename);

                    if (downloadResult?.canceled) {
                        toast.warning("Download canceled.");
                        return;
                    }

                    toast.success("PDF export completed successfully.");
                    return;
                }

                toast.error(matching.error_message || "Export failed. Please try again.");
            } catch (error) {
                console.error("Failed to poll item export status:", error);
            }
        }, 5000);
    };

    useEffect(() => {
        return () => stopPolling();
    }, []);

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const formData = new FormData();
            Object.keys(exportFilters).forEach(key => {
                if (exportFilters[key]) {
                    formData.append(key, exportFilters[key]);
                }
            });

            let endpoint = route("items.export-pdf");
            if (exportFormat === "csv") endpoint = route("items.export-csv");

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const contentType = response.headers.get("content-type");

                // If backend returns JSON, it might be a message that it's queued
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    if (data.status === 'queued' && data.filename) {
                        toast.success(data.message);
                        pollQueuedExport(data.filename);
                        return;
                    }
                }

                const fileExt = exportFormat === "csv" ? "csv" : "pdf";
                const saveResult = await saveResponseFile(
                    response,
                    `items-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${fileExt}`
                );

                if (saveResult?.canceled) {
                    toast.warning("Export download canceled.");
                    return;
                }

                toast.success(`${exportFormat.toUpperCase()} export completed successfully!`);
            } else {
                throw new Error(`${exportFormat.toUpperCase()} export failed`);
            }
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };



    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="flex flex-col max-h-[90vh]">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Export Items
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Configure the export settings below. The export will
                        include items based on your current filters.
                    </p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="export_format"
                                value="Export Format"
                            />
                            <select
                                id="export_format"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                value={exportFormat}
                                onChange={(e) =>
                                    setExportFormat(e.target.value)
                                }
                            >
                                <option value="pdf">PDF Report</option>
                                <option value="csv">CSV Spreadsheet</option>
                            </select>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="export_brand"
                                value="Brand Filter"
                            />
                            <select
                                id="export_brand"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                value={exportFilters.brand}
                                onChange={(e) =>
                                    setExportFilters({
                                        ...exportFilters,
                                        brand: e.target.value,
                                    })
                                }
                            >
                                <option value="">All Brands</option>
                                {brands.map((brand) => (
                                    <option
                                        key={brand.id || brand}
                                        value={brand.name || brand}
                                    >
                                        {brand.name || brand}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="export_status"
                                value="Status Filter"
                            />
                            <select
                                id="export_status"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                value={exportFilters.status}
                                onChange={(e) =>
                                    setExportFilters({
                                        ...exportFilters,
                                        status: e.target.value,
                                    })
                                }
                            >
                                <option value="">All Status</option>
                                <option value="out_of_stock">
                                    Out of Stock
                                </option>
                                <option value="low_stock">Low Stock</option>
                                <option value="ready_stock">Ready Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-end gap-4">
                        <SecondaryButton
                            onClick={onClose}
                            disabled={isExporting}
                        >
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <div className="flex items-center">
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
                                    Generating {exportFormat.toUpperCase()}...
                                </div>
                            ) : (
                                `Export ${exportFormat.toUpperCase()}`
                            )}
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
