import { useState } from "react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import { toast } from "@/utils/toast";
import { router } from "@inertiajs/react";

export default function ExportItemModal({
    show,
    onClose,
    filters = {},
    brands = [],
}) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState("pdf");
    const [exportFilters, setExportFilters] = useState({
        brand: filters.brand || "",
        status: filters.status || "",
    });

    const handleExport = async () => {
        setIsExporting(true);

        try {
            if (exportFormat === "pdf") {
                // Use fetch for PDF export to handle binary response
                const formData = new FormData();
                Object.keys(exportFilters).forEach(key => {
                    if (exportFilters[key]) {
                        formData.append(key, exportFilters[key]);
                    }
                });

                const response = await fetch(route("items.export-pdf"), {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                if (response.ok) {
                    // Create blob and download
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `items-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    toast.success("PDF export completed successfully!");
                } else {
                    throw new Error('PDF export failed');
                }
            } else {
                // Use Inertia router for CSV export
                router.post(route("items.export-csv"), exportFilters, {
                    onSuccess: (page) => {
                        toast.success("CSV export completed successfully!");
                    },
                    onError: (errors) => {
                        console.error("Export error:", errors);
                        toast.error("CSV export failed. Please try again.");
                    },
                    onFinish: () => {
                        setIsExporting(false);
                    }
                });
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

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Note:</strong>{" "}
                            {exportFormat === "pdf"
                                ? "The PDF will be generated in landscape format and include item details, pricing, and status information with summary statistics. Large exports (>1000 items) will be automatically queued for background processing."
                                : "The CSV file will contain all item data in spreadsheet format, suitable for importing into Excel or other applications."}
                        </p>
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
