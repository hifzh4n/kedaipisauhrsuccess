import { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

export default function StockInModal({ show, onClose }) {
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemSearch, setItemSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSelectingItem, setIsSelectingItem] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        item_id: "",
        quantity: "",
        reason: "purchase",
        other_reason: "",
    });

    // Search for items
    useEffect(() => {
        if (itemSearch.length >= 2 && !isSelectingItem) {
            setIsSearching(true);

            const timer = setTimeout(async () => {
                try {
                    const response = await fetch(
                        `/stocks/items/search?search=${encodeURIComponent(
                            itemSearch
                        )}`,
                        {
                            headers: {
                                "X-Requested-With": "XMLHttpRequest",
                                "X-CSRF-TOKEN":
                                    document
                                        .querySelector(
                                            'meta[name="csrf-token"]'
                                        )
                                        ?.getAttribute("content") || "",
                            },
                        }
                    );

                    if (response.ok) {
                        const results = await response.json();
                        setSearchResults(results);
                    } else {
                        setSearchResults([]);
                    }
                } catch (error) {
                    console.error("Search error:", error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 300);

            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [itemSearch]);

    const handleItemSelect = (item) => {
        setIsSelectingItem(true);
        setSelectedItem(item);
        setData("item_id", item.id);
        setItemSearch(item.item_name);
        setSearchResults([]);

        // Reset the flag after a short delay to allow for future searches
        setTimeout(() => {
            setIsSelectingItem(false);
        }, 100);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Stock In Modal - Form data being submitted:", data);
        post(route("stocks.in"), {
            onSuccess: () => {
                reset();
                setSelectedItem(null);
                setItemSearch("");
                onClose();
            },
            onError: (errors) => {
                console.error("Stock In Modal - Validation errors:", errors);
            },
        });
    };

    const handleClose = () => {
        reset();
        setSelectedItem(null);
        setItemSearch("");
        setSearchResults([]);
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="4xl">
            <div className="flex flex-col max-h-[90vh]">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Stock In
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Add stock to inventory by selecting an item and entering
                        the quantity.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col flex-1 min-h-0"
                >
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        {/* Item Selection */}
                        <div className="relative">
                            <InputLabel
                                htmlFor="item_search"
                                value="Search Item"
                            />
                            <TextInput
                                id="item_search"
                                type="text"
                                className="mt-1 block w-full"
                                value={itemSearch}
                                onChange={(e) => setItemSearch(e.target.value)}
                                placeholder="Search by item name or SKU..."
                            />
                            <InputError
                                message={errors.item_id}
                                className="mt-2"
                            />

                            {/* Search Results Dropdown */}
                            {(searchResults.length > 0 || isSearching) && (
                                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {isSearching ? (
                                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                            Searching...
                                        </div>
                                    ) : (
                                        searchResults.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    handleItemSelect(item)
                                                }
                                                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        {item.picture_url ? (
                                                            <img
                                                                className="h-8 w-8 rounded object-cover"
                                                                src={
                                                                    item.picture_url
                                                                }
                                                                alt={
                                                                    item.item_name
                                                                }
                                                            />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
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
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {item.item_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            Item ID: {item.id} •
                                                            SKU: {item.sku_id} •
                                                            Current Stock:{" "}
                                                            {item.current_stock}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Item Display */}
                        {selectedItem && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        {selectedItem.picture_url ? (
                                            <img
                                                className="h-12 w-12 rounded-lg object-cover"
                                                src={selectedItem.picture_url}
                                                alt={selectedItem.item_name}
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                <svg
                                                    className="h-6 w-6 text-gray-400"
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
                                    <div>
                                        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                            {selectedItem.item_name}
                                        </h3>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Item ID: {selectedItem.id} • SKU:{" "}
                                            {selectedItem.sku_id} • Current
                                            Stock: {selectedItem.current_stock}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stock In Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel
                                    htmlFor="quantity"
                                    value="Quantity *"
                                />
                                <TextInput
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    className="mt-1 block w-full"
                                    value={data.quantity}
                                    onChange={(e) =>
                                        setData("quantity", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.quantity}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="reason" value="Reason *" />
                                <select
                                    id="reason"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.reason}
                                    onChange={(e) => {
                                        const newReason = e.target.value;
                                        setData((prevData) => ({
                                            ...prevData,
                                            reason: newReason,
                                            other_reason:
                                                newReason === "other"
                                                    ? prevData.other_reason
                                                    : "",
                                        }));
                                    }}
                                >
                                    <option value="purchase">Purchase</option>
                                    <option value="return">Return</option>
                                    <option value="transfer">
                                        Transfer In
                                    </option>
                                    <option value="other">Other</option>
                                </select>
                                <InputError
                                    message={errors.reason}
                                    className="mt-2"
                                />
                            </div>

                            {/* Conditional Other Reason Field */}
                            {data.reason === "other" && (
                                <div>
                                    <InputLabel
                                        htmlFor="other_reason"
                                        value="Please specify reason *"
                                    />
                                    <TextInput
                                        id="other_reason"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.other_reason}
                                        onChange={(e) =>
                                            setData(
                                                "other_reason",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter your reason..."
                                        required={data.reason === "other"}
                                    />
                                    <InputError
                                        message={errors.other_reason}
                                        className="mt-2"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-end gap-4">
                            <SecondaryButton
                                onClick={handleClose}
                                disabled={processing}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton
                                disabled={processing || !selectedItem}
                            >
                                {processing ? "Adding Stock..." : "Add Stock"}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
