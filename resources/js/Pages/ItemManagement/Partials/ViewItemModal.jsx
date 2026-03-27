import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";

export default function ViewItemModal({ show, onClose, item }) {
    if (!item) return null;

    const getStatusText = (status) => {
        switch (status) {
            case "out_of_stock":
                return "Out of Stock";
            case "low_stock":
                return "Low Stock";
            case "ready_stock":
                return "Ready Stock";
            default:
                return "Unknown";
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "out_of_stock":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "low_stock":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "ready_stock":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="4xl">
            <div className="flex flex-col max-h-[90vh]">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {item.item_name}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Item ID: {item.item_id}
                            </p>
                        </div>
                        <span
                            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(
                                item.status
                            )}`}
                        >
                            {getStatusText(item.status)}
                        </span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Item Details */}
                    <div className="w-full space-y-6">
                        {/* Basic Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        SKU ID
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {item.sku_id}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Barcode
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {item.barcode || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Brand
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {item.brand}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Model
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {item.model}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Color
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {item.color}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quantity
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {item.quantity}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Description
                            </h3>
                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                {item.description || "No description available"}
                            </p>
                        </div>

                        {/* Pricing Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Pricing Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Cost Price
                                    </label>
                                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        RM{" "}
                                        {parseFloat(item.cost_price).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Retail Price
                                    </label>
                                    <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
                                        RM{" "}
                                        {parseFloat(item.retail_price).toFixed(
                                            2
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Timestamps
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Created At
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {new Date(
                                            item.created_at
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Last Updated
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {new Date(
                                            item.updated_at
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
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
        </Modal>
    );
}
