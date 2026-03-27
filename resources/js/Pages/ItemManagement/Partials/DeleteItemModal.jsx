import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";

export default function DeleteItemModal({ show, onClose, item }) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        destroy(route("items.destroy", item.id), {
            onSuccess: () => onClose(),
        });
    };

    if (!item) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg
                            className="h-6 w-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Delete Item
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This action cannot be undone
                        </p>
                    </div>
                </div>

                {/* Warning Message */}
                <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete this item? This will
                        permanently remove the item and all associated data from
                        the system.
                    </p>
                </div>

                {/* Item Details Card */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    {/* Item Information */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            {item.item_name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">SKU:</span>{" "}
                                    {item.sku_id}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">
                                        Barcode:
                                    </span>{" "}
                                    {item.barcode}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Brand:</span>{" "}
                                    {item.brand}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Model:</span>{" "}
                                    {item.model}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">Color:</span>{" "}
                                    {item.color}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">
                                        Quantity:
                                    </span>{" "}
                                    {item.quantity} units
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                    <SecondaryButton onClick={onClose} disabled={processing}>
                        Cancel
                    </SecondaryButton>
                    <DangerButton onClick={handleDelete} disabled={processing}>
                        {processing ? "Deleting..." : "Delete Item"}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}
