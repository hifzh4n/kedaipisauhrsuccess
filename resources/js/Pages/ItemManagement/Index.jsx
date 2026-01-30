import { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import SearchWithBarcode from "@/Components/SearchWithBarcode";
import ImagePreview from "@/Components/ImagePreview";
import { toast, toastUtils } from "@/utils/toast";

// Import modals
import AddItemModal from "./Partials/AddItemModal";
import EditItemModal from "./Partials/EditItemModal";
import ViewItemModal from "./Partials/ViewItemModal";
import DeleteItemModal from "./Partials/DeleteItemModal";
import ExportItemModal from "./Partials/ExportItemModal";
import ImportItemModal from "./Partials/ImportItemModal";

export default function Index({
    auth,
    items,
    filters,
    brands: initialBrands,
    models: initialModels,
    colors: initialColors,
}) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [search, setSearch] = useState(filters.search || "");
    const [brandFilter, setBrandFilter] = useState(filters.brand || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [isLoading, setIsLoading] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showActionsDropdown, setShowActionsDropdown] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [forceRender, setForceRender] = useState(0);
    


    // Local state for brands, models, and colors to allow updates
    const [brands, setBrands] = useState(initialBrands);
    const [models, setModels] = useState(initialModels);
    const [colors, setColors] = useState(initialColors);

    const { flash } = usePage().props;

    // Monitor local state changes for debugging
    useEffect(() => {
        console.log('Local colors state updated:', colors);
    }, [colors]);

    // Update local state when props change (but not when we manually add data)
    useEffect(() => {
        console.log('Props changed - updating local state');
        console.log('Initial brands:', initialBrands);
        console.log('Initial models:', initialModels);
        console.log('Initial colors:', initialColors);
        
        setBrands(initialBrands);
        setModels(initialModels);
        setColors(initialColors);
    }, [initialBrands, initialModels, initialColors]);



    // Handle new data being added
    const handleDataAdded = (type, newData) => {
        console.log('handleDataAdded called:', type, newData);
        
        switch (type) {
            case 'brand':
                console.log('Adding new brand to state:', newData);
                setBrands(prev => {
                    const updated = [...prev, newData];
                    console.log('Updated brands:', updated);
                    return updated;
                });
                break;
            case 'model':
                console.log('Adding new model to state:', newData);
                setModels(prev => {
                    const updated = [...prev, newData];
                    console.log('Updated models:', updated);
                    return updated;
                });
                break;
            case 'color':
                console.log('Adding new color to state:', newData);
                setColors(prev => {
                    const updated = [...prev, newData];
                    console.log('Updated colors:', updated);
                    return updated;
                });
                break;
        }
    };



    // Show flash messages as toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Auto-search and auto-filter functionality
    useEffect(() => {
        setIsLoading(true);
        const timeoutId = setTimeout(() => {
            router.get(
                route("items.index"),
                {
                    search,
                    brand: brandFilter,
                    status: statusFilter,

                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsLoading(false),
                }
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, brandFilter, statusFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveDropdown(null);
            setShowActionsDropdown(false);
        };

        if (activeDropdown || showActionsDropdown) {
            document.addEventListener("click", handleClickOutside);
            return () =>
                document.removeEventListener("click", handleClickOutside);
        }
    }, [activeDropdown, showActionsDropdown]);

    const toggleActionsDropdown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowActionsDropdown(!showActionsDropdown);
    };

    const handleAdd = () => {
        setShowAddModal(true);
        setShowActionsDropdown(false);
    };



    const handleEdit = (item) => {
        setSelectedItem(item);
        setShowEditModal(true);
    };

    const handleItemUpdated = (itemId, updatedData) => {
        console.log('handleItemUpdated called:', { itemId, updatedData });
        
        // Update the local items state to reflect the changes
        setItems(prevItems => {
            return prevItems.map(item => {
                if (item.id === itemId) {
                    console.log('Updating item:', item.id, 'Old picture_url:', item.picture_url);
                    
                    // Create a completely new object to force React re-render
                    const updatedItem = {
                        ...item,
                        ...updatedData,
                        // Force immediate image refresh by adding a unique timestamp
                        picture_url: updatedData.picture ? 
                            `/storage/${updatedData.picture}?v=${Date.now()}` : 
                            item.picture_url
                    };
                    
                    // Force the image element to reload by updating the key
                    updatedItem._imageKey = Date.now();
                    
                    console.log('New picture_url:', updatedItem.picture_url, 'Image key:', updatedItem._imageKey);
                    
                    // Force browser to invalidate cache for the old image
                    if (item.picture_url && item.picture_url !== updatedItem.picture_url) {
                        // Create a temporary image element to force cache invalidation
                        const img = new Image();
                        img.src = item.picture_url + '?invalidate=' + Date.now();
                        console.log('Cache invalidation triggered for:', item.picture_url);
                    }
                    
                    return updatedItem;
                }
                return item;
            });
        });
        
        // Force a complete re-render of the component
        setTimeout(() => {
            setForceRender(prev => prev + 1);
            console.log('Force render triggered');
        }, 100);
    };

    const handleView = (item) => {
        setSelectedItem(item);
        setShowViewModal(true);
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const handleExport = () => {
        setShowExportModal(true);
        setShowActionsDropdown(false);
    };

    const handleImport = () => {
        setShowImportModal(true);
        setShowActionsDropdown(false);
    };

    const handleManageAttributes = () => {
        router.visit(route("attributes.index"));
        setShowActionsDropdown(false);
    };

    const handleImagePreview = (src, alt) => {
        setPreviewImage({ src, alt });
    };

    const closeImagePreview = () => {
        setPreviewImage(null);
    };

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
        <AuthenticatedLayout
            key={forceRender}
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Item Management
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Manage items, pricing, and inventory details
                        </p>
                    </div>

                    {/* Desktop Actions Button */}
                    <div className="hidden sm:block relative actions-dropdown">
                        <PrimaryButton onClick={toggleActionsDropdown}>
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Actions
                            <svg
                                className="w-4 h-4 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </PrimaryButton>

                        {showActionsDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() =>
                                        setShowActionsDropdown(false)
                                    }
                                ></div>
                                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 origin-top-right">
                                    <div className="py-1">
                                        <button
                                            onClick={handleAdd}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2 inline"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                />
                                            </svg>
                                            Add New Item
                                        </button>
                                        <button
                                            onClick={handleExport}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2 inline"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            Export Items
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2 inline"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                                />
                                            </svg>
                                            Import Items
                                        </button>
                                        <hr className="my-1 border-gray-200 dark:border-gray-600" />
                                        <button
                                            onClick={handleManageAttributes}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2 inline"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                />
                                            </svg>
                                            Manage Brands/Models/Colors
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Actions Button */}
                    <div className="sm:hidden relative actions-dropdown">
                        <PrimaryButton
                            onClick={toggleActionsDropdown}
                            className="w-full justify-center"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Actions
                            <svg
                                className="w-4 h-4 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </PrimaryButton>

                        {showActionsDropdown && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() =>
                                        setShowActionsDropdown(false)
                                    }
                                ></div>
                                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 origin-top-right">
                                    <div className="py-1">
                                        <button
                                            onClick={handleAdd}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2 inline"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                />
                                            </svg>
                                            Add New Item
                                        </button>
                                        <button
                                            onClick={handleExport}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2 inline"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            Export Items
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2 inline"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                                                />
                                            </svg>
                                            Import Items
                                        </button>
                                        <hr className="my-1 border-gray-200 dark:border-gray-600" />
                                        <button
                                            onClick={handleManageAttributes}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                        >
                                            <svg
                                                className="w-4 h-4 mr-2 inline"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                />
                                            </svg>
                                            Manage Brands/Models/Colors
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Item Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg relative">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* Search and Filter Section */}
                            <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <InputLabel
                                            htmlFor="search"
                                            value="Search"
                                        />
                                        <SearchWithBarcode
                                            id="search"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Search by name, SKU, barcode..."
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            htmlFor="brand"
                                            value="Brand"
                                        />
                                        <select
                                            id="brand"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={brandFilter}
                                            onChange={(e) =>
                                                setBrandFilter(e.target.value)
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
                                            htmlFor="status"
                                            value="Status"
                                        />
                                        <select
                                            id="status"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={statusFilter}
                                            onChange={(e) =>
                                                setStatusFilter(e.target.value)
                                            }
                                        >
                                            <option value="">All Status</option>
                                            <option value="ready_stock">
                                                Ready Stock
                                            </option>
                                            <option value="low_stock">
                                                Low Stock
                                            </option>
                                            <option value="out_of_stock">
                                                Out of Stock
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="relative">
                                <div
                                    className="overflow-x-auto -mx-4 sm:mx-0"
                                    style={{
                                        overflowY: "visible",
                                        overflowX: "auto",
                                    }}
                                >
                                    <div className="inline-block min-w-full align-middle">
                                        <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Item Details
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Brand/Model
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Pricing
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {(() => {
                                                        // Handle both paginated (items.data) and simple array (items) formats
                                                        const itemsArray =
                                                            items?.data ||
                                                            items ||
                                                            [];
                                                        return itemsArray.length >
                                                            0 ? (
                                                            itemsArray.map(
                                                                (item) => (
                                                                    <tr
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                    >
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="flex items-center">
                                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                                    {item.picture_url ? (
                                                                                        <img
                                                                                            key={item._imageKey || item.id}
                                                                                            className="h-10 w-10 rounded-full object-cover cursor-pointer"
                                                                                            src={
                                                                                                item.picture_url
                                                                                            }
                                                                                            alt={
                                                                                                item.item_name
                                                                                            }
                                                                                            onClick={() =>
                                                                                                handleImagePreview(
                                                                                                    item.picture_url,
                                                                                                    item.item_name
                                                                                                )
                                                                                            }
                                                                                            onError={(
                                                                                                e
                                                                                            ) => {
                                                                                                e.target.style.display =
                                                                                                    "none";
                                                                                            }}
                                                                                            onLoad={() => {
                                                                                                // Force a re-render when image loads
                                                                                                if (item._imageKey) {
                                                                                                    setItems(prevItems => 
                                                                                                        prevItems.map(prevItem => 
                                                                                                            prevItem.id === item.id ? 
                                                                                                                { ...prevItem, _imageLoaded: true } : 
                                                                                                                prevItem
                                                                                                        )
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
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
                                                                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                                />
                                                                                            </svg>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="ml-4">
                                                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                                        {
                                                                                            item.item_name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                        SKU:{" "}
                                                                                        {
                                                                                            item.sku_id
                                                                                        }
                                                                                    </div>
                                                                                    {item.barcode && (
                                                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                            Barcode:{" "}
                                                                                            {
                                                                                                item.barcode
                                                                                            }
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                                                {typeof item.brand ===
                                                                                "object"
                                                                                    ? item
                                                                                          .brand
                                                                                          ?.name ||
                                                                                      item.brand
                                                                                    : item.brand}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                {typeof item.model ===
                                                                                "object"
                                                                                    ? item
                                                                                          .model
                                                                                          ?.name ||
                                                                                      item.model
                                                                                    : item.model}
                                                                            </div>
                                                                            {item.color && (
                                                                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                    Color:{" "}
                                                                                    {typeof item.color ===
                                                                                    "object"
                                                                                        ? item
                                                                                              .color
                                                                                              ?.name ||
                                                                                          item.color
                                                                                        : item.color}
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                                RM{" "}
                                                                                {parseFloat(
                                                                                    item.retail_price
                                                                                ).toFixed(
                                                                                    2
                                                                                )}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                Cost:
                                                                                RM{" "}
                                                                                {parseFloat(
                                                                                    item.cost_price
                                                                                ).toFixed(
                                                                                    2
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                Qty:{" "}
                                                                                {
                                                                                    item.quantity
                                                                                }
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 whitespace-nowrap">
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
                                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                            <div className="relative">
                                                                                <button
                                                                                    data-dropdown-trigger={
                                                                                        item.id
                                                                                    }
                                                                                    onClick={(
                                                                                        e
                                                                                    ) => {
                                                                                        e.stopPropagation();
                                                                                        if (
                                                                                            activeDropdown ===
                                                                                            item.id
                                                                                        ) {
                                                                                            setActiveDropdown(
                                                                                                null
                                                                                            );
                                                                                        } else {
                                                                                            setActiveDropdown(
                                                                                                item.id
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition ease-in-out duration-150"
                                                                                >
                                                                                    <svg
                                                                                        className="w-5 h-5"
                                                                                        fill="currentColor"
                                                                                        viewBox="0 0 20 20"
                                                                                    >
                                                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                                    </svg>
                                                                                </button>

                                                                                {activeDropdown ===
                                                                                    item.id && (
                                                                                    <>
                                                                                        <div
                                                                                            className="fixed inset-0 z-40"
                                                                                            onClick={() =>
                                                                                                setActiveDropdown(
                                                                                                    null
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                        <div
                                                                                            className="fixed z-[9999] w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
                                                                                            style={{
                                                                                                top: `${
                                                                                                    document
                                                                                                        .querySelector(
                                                                                                            `[data-dropdown-trigger="${item.id}"]`
                                                                                                        )
                                                                                                        ?.getBoundingClientRect()
                                                                                                        .bottom +
                                                                                                    4
                                                                                                }px`,
                                                                                                right: `${
                                                                                                    window.innerWidth -
                                                                                                    document
                                                                                                        .querySelector(
                                                                                                            `[data-dropdown-trigger="${item.id}"]`
                                                                                                        )
                                                                                                        ?.getBoundingClientRect()
                                                                                                        .right
                                                                                                }px`,
                                                                                            }}
                                                                                        >
                                                                                            <div className="py-1">
                                                                                                <button
                                                                                                    onClick={(
                                                                                                        e
                                                                                                    ) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        setActiveDropdown(
                                                                                                            null
                                                                                                        );
                                                                                                        handleView(
                                                                                                            item
                                                                                                        );
                                                                                                    }}
                                                                                                    className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                                                                                >
                                                                                                    View
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={(
                                                                                                        e
                                                                                                    ) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        setActiveDropdown(
                                                                                                            null
                                                                                                        );
                                                                                                        handleEdit(
                                                                                                            item
                                                                                                        );
                                                                                                    }}
                                                                                                    className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                                                                                >
                                                                                                    Edit
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={(
                                                                                                        e
                                                                                                    ) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        setActiveDropdown(
                                                                                                            null
                                                                                                        );
                                                                                                        handleDelete(
                                                                                                            item
                                                                                                        );
                                                                                                    }}
                                                                                                    className="block w-full px-4 py-2 text-start text-sm leading-5 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                                                                                >
                                                                                                    Delete
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan="5"
                                                                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                                                                >
                                                                    No items
                                                                    found.
                                                                </td>
                                                            </tr>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pagination */}
                            {items?.links && (
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Showing{" "}
                                        {items?.from || 0} to{" "}
                                        {items?.to || 0} of{" "}
                                        {items?.total || 0}{" "}
                                        results
                                    </div>
                                    <div className="flex gap-1">
                                        {items.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (link.url) {
                                                        const url = new URL(link.url);
                                                        const page = url.searchParams.get("page");
                                                        router.get(
                                                            route("items.index"),
                                                            {
                                                                search: search,
                                                                brand: brandFilter,
                                                                status: statusFilter,
                                                                page: page,
                                                            },
                                                            {
                                                                preserveState: true,
                                                                preserveScroll: true,
                                                            }
                                                        );
                                                    }
                                                }}
                                                disabled={!link.url}
                                                className={`px-3 py-2 text-sm rounded ${
                                                    link.active
                                                        ? "bg-indigo-500 text-white"
                                                        : link.url
                                                        ? "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                                                        : "text-gray-400 cursor-not-allowed"
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddItemModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                brands={brands}
                models={models}
                colors={colors}
                onDataAdded={handleDataAdded}
            />

                            <EditItemModal
                    show={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    item={selectedItem}
                    brands={brands}
                    models={models}
                    colors={colors}
                    onItemUpdated={handleItemUpdated}
                />

            <ViewItemModal
                show={showViewModal}
                onClose={() => setShowViewModal(false)}
                item={selectedItem}
            />

            <DeleteItemModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                item={selectedItem}
            />

            <ExportItemModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                filters={filters}
                brands={brands}
            />

            <ImportItemModal
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
            />

            {/* Image Preview Modal */}
            {previewImage && (
                <ImagePreview
                    src={previewImage.src}
                    alt={previewImage.alt}
                    onClose={closeImagePreview}
                />
            )}
        </AuthenticatedLayout>
    );
}
