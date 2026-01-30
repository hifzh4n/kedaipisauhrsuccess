import { useState, useEffect, useRef, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";

import SearchWithBarcode from "@/Components/SearchWithBarcode";
import ImagePreview from "@/Components/ImagePreview";
import { toast, toastUtils } from "@/utils/toast";

// Import modals
import StockAgingModal from "./Partials/StockAgingModal";
import ExportStockModal from "./Partials/ExportStockModal";
import DeleteBatchModal from "./Partials/DeleteBatchModal";
import StockInModal from "./Partials/StockInModal";
import StockOutModal from "./Partials/StockOutModal";

export default function Index({
    stockHistory,
    stockAging,
    filter,
    tab,
    error,
    auth,
}) {


    const [activeTab, setActiveTab] = useState(() => {
        if (tab === "calculator") return "stock-calculator";
        if (filter) return "stock-aging";
        return "stock-movement";
    });
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [showStockOutModal, setShowStockOutModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showStockAgingModal, setShowStockAgingModal] = useState(false);
    const [showDeleteBatchModal, setShowDeleteBatchModal] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState(null);
    const [isDeletingBatch, setIsDeletingBatch] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredHistory, setFilteredHistory] = useState(
        stockHistory?.data || []
    );
    const [currentPage, setCurrentPage] = useState(
        stockHistory?.current_page || 1
    );
    const [totalPages, setTotalPages] = useState(stockHistory?.last_page || 1);
    const [itemsPerPage] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [agingSearch, setAgingSearch] = useState("");
    const [agingStatusFilter, setAgingStatusFilter] = useState("all");
    const [agingDateFrom, setAgingDateFrom] = useState("");
    const [agingDateTo, setAgingDateTo] = useState("");
    const [stockAgingData, setStockAgingData] = useState(
        stockAging || { data: [] }
    );

    // Update stockAgingData when stockAging prop changes
    useEffect(() => {
        if (stockAging) {
            setStockAgingData(stockAging);
        }
    }, [stockAging]);
    const [agingCurrentPage, setAgingCurrentPage] = useState(1);
    const [agingTotalPages, setAgingTotalPages] = useState(1);

    // Damaged Items states
    const [damagedItemsData, setDamagedItemsData] = useState({
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [damagedSearch, setDamagedSearch] = useState("");
    const [damagedDateFrom, setDamagedDateFrom] = useState("");
    const [damagedDateTo, setDamagedDateTo] = useState("");

    // Stock Calculator states
    const [calculatorItems, setCalculatorItems] = useState({
        data: [],
        links: [],
        from: 0,
        to: 0,
        total: 0,
        last_page: 1,
    });
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [calculatorSearch, setCalculatorSearch] = useState("");
    const [calculatorBrandFilter, setCalculatorBrandFilter] = useState("");
    const [calculatorModelFilter, setCalculatorModelFilter] = useState("");
    const [calculatorLoading, setCalculatorLoading] = useState(false);
    const [stockInSubmitting, setStockInSubmitting] = useState(false);
    const [stockOutSubmitting, setStockOutSubmitting] = useState(false);

    // Add missing filter variables
    const [typeFilter, setTypeFilter] = useState("");
    const [reasonFilter, setReasonFilter] = useState("");

    // Stock In form state
    const [stockInForm, setStockInForm] = useState({
        item_id: "",
        quantity: "",
        reason: "",
        other_reason: "",
        expiry_date: "",
        item_search: "",
        selected_item: null,
    });

    // Stock Out form state
    const [stockOutForm, setStockOutForm] = useState({
        item_id: "",
        quantity: "",
        reason: "",
        other_reason: "",
        damage_reason: "",
        unit_price: "",
        notes: "",
        item_search: "",
        selected_item: null,
    });

    // Search states
    const [stockInSearchResults, setStockInSearchResults] = useState([]);
    const [stockOutSearchResults, setStockOutSearchResults] = useState([]);
    const [stockInSearching, setStockInSearching] = useState(false);
    const [stockOutSearching, setStockOutSearching] = useState(false);
    const [stockInShowResults, setStockInShowResults] = useState(false);
    const [stockOutShowResults, setStockOutShowResults] = useState(false);

    // Export form state
    const [exportForm, setExportForm] = useState({
        report_type: "stock_movements",
        date_from: "",
        date_to: "",
        date_range: "",
        export_from_date: "",
        export_to_date: "",
        movement_type: "",
        reason_filter: "",
        export_notes: "",
    });
    const [isExporting, setIsExporting] = useState(false);

    // Image preview state
    const [previewImage, setPreviewImage] = useState(null);

    const handleImagePreview = (imageUrl, itemName) => {
        if (!imageUrl) {
            console.warn("No image URL provided for preview");
            return;
        }
        setPreviewImage({
            src: imageUrl,
            alt: itemName || "Item Image",
        });
    };

    const closeImagePreview = () => {
        setPreviewImage(null);
    };



    // Stock Calculator functions

    const loadDamagedItems = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (damagedSearch) params.append("search", damagedSearch);
            if (damagedDateFrom) params.append("date_from", damagedDateFrom);
            if (damagedDateTo) params.append("date_to", damagedDateTo);

            const response = await fetch(`/stocks/damaged?${params.toString()}`, {
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDamagedItemsData(data);
            }
        } catch (error) {
            console.error("Failed to load damaged items:", error);
        }
    }, [damagedSearch, damagedDateFrom, damagedDateTo]);

    const loadDamagedItemsWithPage = async (page) => {
        try {
            const params = new URLSearchParams();
            if (damagedSearch) params.append("search", damagedSearch);
            if (damagedDateFrom) params.append("date_from", damagedDateFrom);
            if (damagedDateTo) params.append("date_to", damagedDateTo);
            params.append("page", page);

            const response = await fetch(`/stocks/damaged?${params.toString()}`, {
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setDamagedItemsData(data);
            }
        } catch (error) {
            console.error("Failed to load damaged items:", error);
        }
    };

    const loadCalculatorItemsWithPage = async (page) => {
        try {
            const params = new URLSearchParams();
            // For calculator, we want to load all items, so use a wildcard search if no specific search
            const searchTerm = calculatorSearch || "*";
            params.append("search", searchTerm);
            if (calculatorBrandFilter)
                params.append("brand", calculatorBrandFilter);
            if (calculatorModelFilter)
                params.append("model", calculatorModelFilter);
            params.append("page", page);

            const response = await fetch(
                `/stocks/items/search?${params.toString()}`,
                {
                    headers: {
                        Accept: "application/json",
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setCalculatorItems(data);
            } else {
                // Corrected: Set to initial state structure on error
                setCalculatorItems({ data: [], links: [], from: 0, to: 0, total: 0, last_page: 1 });
            }
        } catch (error) {
            console.error("Failed to load calculator items:", error);
            // Corrected: Set to initial state structure on error
            setCalculatorItems({ data: [], links: [], from: 0, to: 0, total: 0, last_page: 1 });
        }
    };

    // Load damaged items when tab changes to damaged items
    useEffect(() => {
        if (activeTab === "damaged-items") {
            loadDamagedItems();
        }
    }, [activeTab, loadDamagedItems]);

    const loadCalculatorItems = useCallback(async () => {
        setCalculatorLoading(true);
        try {
            const params = new URLSearchParams();
            // For calculator, we want to load all items, so use a wildcard search if no specific search
            const searchTerm = calculatorSearch || "*";
            params.append("search", searchTerm);
            if (calculatorBrandFilter)
                params.append("brand", calculatorBrandFilter);
            if (calculatorModelFilter)
                params.append("model", calculatorModelFilter);
            // Always add page parameter to get paginated response
            params.append("page", "1");

            const url = `/stocks/items/search?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCalculatorItems(data);
            } else {
                console.error("Failed to load calculator items");
                // Corrected: Set to initial state structure on error
                setCalculatorItems({ data: [], links: [], from: 0, to: 0, total: 0, last_page: 1 });
            }
        } catch (error) {
            console.error("Error loading calculator items:", error);
            // Corrected: Set to initial state structure on error
            setCalculatorItems({ data: [], links: [], from: 0, to: 0, total: 0, last_page: 1 });
        } finally {
            setCalculatorLoading(false);
        }
    }, [calculatorSearch, calculatorBrandFilter, calculatorModelFilter]);

    // Load calculator items when tab changes to calculator
    useEffect(() => {
        if (activeTab === "stock-calculator") {
            loadCalculatorItems();
        }
    }, [activeTab, loadCalculatorItems]);

    const handleItemSelection = (itemId, isSelected) => {
        const newSelectedItems = new Set(selectedItems);
        if (isSelected) {
            newSelectedItems.add(itemId);
        } else {
            newSelectedItems.delete(itemId);
        }
        setSelectedItems(newSelectedItems);
    };

    const handleSelectAll = (isSelected) => {
        if (isSelected) {
            const allItemIds = (calculatorItems.data || []).map((item) => item.id);
            setSelectedItems(new Set(allItemIds));
        } else {
            setSelectedItems(new Set());
        }
    };

    const calculateTotals = () => {
        const selectedItemsData = (calculatorItems.data || []).filter((item) =>
            selectedItems.has(item.id)
        );

        const totalCost = selectedItemsData.reduce((sum, item) => {
            const cost = parseFloat(item.purchase_price || 0);
            const quantity = parseInt(item.current_stock || 0);
            return sum + cost * quantity;
        }, 0);

        const totalRetail = selectedItemsData.reduce((sum, item) => {
            const retail = parseFloat(item.selling_price || 0);
            const quantity = parseInt(item.current_stock || 0);
            return sum + retail * quantity;
        }, 0);

        const margin = totalRetail - totalCost;
        const marginPercentage = totalCost > 0 ? (margin / totalCost) * 100 : 0;

        return {
            totalCost,
            totalRetail,
            margin,
            marginPercentage,
            selectedCount: selectedItemsData.length,
        };
    };

    const handleExportChange = (field, value) => {
        setExportForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleExportSubmit = (e) => {
        e.preventDefault();

        if (!exportForm.report_type) {
            toast.warning("Please select a report type");
            return;
        }

        setIsExporting(true);

        // Map frontend report types to backend report types
        const reportTypeMap = {
            stock_movements: "stock_movements",
            stock_aging: "aging_report",
            damaged_items: "damaged_items",
            current_stock: "current_stock",
            stock_summary: "current_stock",
        };

        // Create download URL with parameters
        const params = new URLSearchParams({
            format: "pdf",
            report_type: reportTypeMap[exportForm.report_type],
            columns: JSON.stringify([
                "item_name",
                "batch_number",
                "quantity",
                "date_added",
                "days_in_stock",
                "status",
            ]),
            search: "",
            movement_type: exportForm.movement_type || "",
            date_from: exportForm.export_from_date || "",
            date_to: exportForm.export_to_date || "",
        });

        // Create a temporary link to download the PDF
        const downloadUrl = `/stocks/export?${params.toString()}`;

        // Create temporary anchor element for download
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `stock_report_${exportForm.report_type}_${
            new Date().toISOString().split("T")[0]
        }.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Keep loading state for a reasonable time to show user feedback
        setTimeout(() => {
            setIsExporting(false);
            toast.success(
                "PDF export initiated. Download should start shortly."
            );
        }, 2000); // 2 seconds delay
    };

    const { flash } = usePage().props;

    // Show flash messages as toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // Debounced search
    const searchTimeoutRef = useRef(null);

    // Form handlers
    const handleStockInChange = (field, value) => {
        setStockInForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleStockOutChange = (field, value) => {
        setStockOutForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Search functions
    const searchItems = async (query, setResults, setSearching) => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }


        setSearching(true);

        try {
            const url = `/stocks/items/search?search=${encodeURIComponent(
                query
            )}`;
            

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                credentials: "same-origin",
            });

            

            if (response.ok) {
                const data = await response.json();
                
                // Transform the data to match what the frontend expects
                const transformedData = data.map((item) => ({
                    id: item.id,
                    name: item.item_name,
                    sku: item.sku_id,
                    barcode: item.barcode || "N/A",
                    photo: item.picture_url,
                    quantity: item.current_stock || 0,
                }));
                
                setResults(transformedData);
            } else {
                console.error(
                    "Search response not ok:",
                    response.status,
                    response.statusText
                );
                setResults([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Search function specifically for Stock Out - filters out items with 0 quantity
    const searchItemsForStockOut = async (query, setResults, setSearching) => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        
        setSearching(true);

        try {
            const url = `/stocks/items/search?search=${encodeURIComponent(
                query
            )}`;
            

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
                credentials: "same-origin",
            });

            

            if (response.ok) {
                const data = await response.json();
                

                // Filter out items with 0 quantity and transform the data
                const availableItems = data.filter(
                    (item) => (item.current_stock || 0) > 0
                );

                const transformedData = availableItems.map((item) => ({
                    id: item.id,
                    name: item.item_name,
                    sku: item.sku_id,
                    barcode: item.barcode || "N/A",
                    photo: item.picture_url,
                    quantity: item.current_stock || 0,
                }));
                
                setResults(transformedData);
            } else {
                console.error(
                    "Search response not ok:",
                    response.status,
                    response.statusText
                );
                setResults([]);
            }
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Auto-search with debouncing
    const handleStockInAutoSearch = (query) => {
        handleStockInChange("item_search", query);

        if (debouncedStockInSearch.current) {
            clearTimeout(debouncedStockInSearch.current);
        }

        debouncedStockInSearch.current = setTimeout(() => {
            if (query.trim().length >= 2) {
                searchItems(
                    query.trim(),
                    setStockInSearchResults,
                    setStockInSearching
                );
                setStockInShowResults(true);
            } else {
                setStockInSearchResults([]);
                setStockInShowResults(false);
            }
        }, 300);
    };

    const handleStockOutAutoSearch = (query) => {
        handleStockOutChange("item_search", query);

        if (debouncedStockOutSearch.current) {
            clearTimeout(debouncedStockOutSearch.current);
        }

        debouncedStockOutSearch.current = setTimeout(() => {
            if (query.trim().length >= 2) {
                searchItems(
                    query.trim(),
                    setStockOutSearchResults,
                    setStockOutSearching
                );
                setStockOutShowResults(true);
            } else {
                setStockOutSearchResults([]);
                setStockOutShowResults(false);
            }
        }, 300);
    };

    // Debounced search refs
    const debouncedStockInSearch = useRef(null);
    const debouncedStockOutSearch = useRef(null);

    const selectStockInItem = (item) => {
        
        setStockInForm((prev) => ({
            ...prev,
            item_search: item.name,
            selected_item: item,
        }));
        setStockInShowResults(false);
        setStockInSearchResults([]);
    };

    const selectStockOutItem = (item) => {
        
        setStockOutForm((prev) => ({
            ...prev,
            item_search: item.name,
            selected_item: item,
        }));
        setStockOutShowResults(false);
        setStockOutSearchResults([]);
    };

    const clearStockInSearch = () => {
        setStockInForm((prev) => ({
            ...prev,
            item_search: "",
            selected_item: null,
        }));
        setStockInShowResults(false);
        setStockInSearchResults([]);
    };

    const clearStockOutSearch = () => {
        setStockOutForm((prev) => ({
            ...prev,
            item_search: "",
            selected_item: null,
        }));
        setStockOutShowResults(false);
        setStockOutSearchResults([]);
    };

    const handleStockInSubmit = (e) => {
        e.preventDefault();

        

        if (!stockInForm.selected_item) {
            toast.warning("Please select an item first");
            return;
        }

        if (!stockInForm.quantity || stockInForm.quantity < 1) {
            toast.warning("Please enter a valid quantity");
            return;
        }

        if (!stockInForm.reason) {
            toast.warning("Please select a reason");
            return;
        }

        if (
            stockInForm.reason === "other" &&
            !stockInForm.other_reason.trim()
        ) {
            toast.warning("Please specify the reason when selecting 'Other'");
            return;
        }

        const submitData = {
            item_id: stockInForm.selected_item.id,
            quantity: parseInt(stockInForm.quantity),
            reason: stockInForm.reason,
        };

        // Only include other_reason if reason is "other"
        if (stockInForm.reason === "other") {
            submitData.other_reason = stockInForm.other_reason;
        }

        

        setStockInSubmitting(true);

        // Submit stock in to backend
        router.post("/stocks/in", submitData, {
            onSuccess: (response) => {
                
                // Reset form
                setStockInForm({
                    item_id: "",
                    quantity: "",
                    reason: "",
                    other_reason: "",
                    expiry_date: "",
                    item_search: "",
                    selected_item: null,
                });
                setStockInSearchResults([]);
                setStockInShowResults(false);
            },
            onError: (errors) => {
                console.error("Stock in errors:", errors);
                console.error(
                    "Stock in errors details:",
                    JSON.stringify(errors, null, 2)
                );
                // Error will be handled by flash message
            },
            onFinish: () => {
                setStockInSubmitting(false);
            },
        });
    };

    const handleStockOutSubmit = (e) => {
        e.preventDefault();

        

        if (!stockOutForm.selected_item) {
            toast.warning("Please select an item first");
            return;
        }

        if (!stockOutForm.quantity || stockOutForm.quantity < 1) {
            toast.warning("Please enter a valid quantity");
            return;
        }

        if (!stockOutForm.reason) {
            toast.warning("Please select a reason");
            return;
        }

        if (
            stockOutForm.reason === "other" &&
            !stockOutForm.other_reason.trim()
        ) {
            toast.warning("Please specify the reason when selecting 'Other'");
            return;
        }

        if (
            stockOutForm.reason === "damage" &&
            !stockOutForm.damage_reason.trim()
        ) {
            toast.warning("Please specify the damage reason when selecting 'Damage'");
            return;
        }

        const submitData = {
            item_id: stockOutForm.selected_item.id,
            quantity: parseInt(stockOutForm.quantity),
            reason: stockOutForm.reason,
        };

        // Only include other_reason if reason is "other"
        if (stockOutForm.reason === "other") {
            submitData.other_reason = stockOutForm.other_reason;
        }

        // Only include damage_reason if reason is "damage"
        if (stockOutForm.reason === "damage") {
            submitData.damage_reason = stockOutForm.damage_reason;
        }



        

        setStockOutSubmitting(true);

        // Submit stock out to backend
        router.post("/stocks/out", submitData, {
            onSuccess: (response) => {
                
                // Reset form
                setStockOutForm({
                    item_id: "",
                    quantity: "",
                    reason: "",
                    other_reason: "",
                    damage_reason: "",
                    unit_price: "",
                    notes: "",
                    item_search: "",
                    selected_item: null,
                });
                setStockOutSearchResults([]);
                setStockOutShowResults(false);
            },
            onError: (errors) => {
                console.error("Stock out errors:", errors);
                console.error(
                    "Stock out errors details:",
                    JSON.stringify(errors, null, 2)
                );
                // Error will be handled by flash message
            },
            onFinish: () => {
                setStockOutSubmitting(false);
            },
        });
    };

    const handleDeleteBatch = (batch) => {
        // Check if quantity is 0 before allowing deletion
        if (batch.quantity_remaining > 0) {
            toast.warning(
                "Cannot delete batch with remaining quantity. Please ensure the quantity is 0 before deletion."
            );
            return;
        }

        setBatchToDelete(batch);
        setShowDeleteBatchModal(true);
    };

    const confirmDeleteBatch = async () => {
        if (!batchToDelete) return;

        setIsDeletingBatch(true);
        try {
            const response = await fetch(`/stocks/batch/${batchToDelete.id}`, {
                method: "DELETE",
                headers: {
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                    Accept: "application/json",
                },
            });

            const data = await response.json();
            if (data.success) {
                toast.success("Batch deleted successfully!");
                // Refresh the page to get updated data
                window.location.reload();
            } else {
                toast.error("Failed to delete batch: " + data.message);
            }
        } catch (error) {
            console.error("Error deleting batch:", error);
            toast.error("Failed to delete batch. Please try again.");
        } finally {
            setIsDeletingBatch(false);
            setShowDeleteBatchModal(false);
            setBatchToDelete(null);
        }
    };

    const cancelDeleteBatch = () => {
        setShowDeleteBatchModal(false);
        setBatchToDelete(null);
    };

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (typeFilter) params.append("type", typeFilter);
            if (reasonFilter) params.append("reason", reasonFilter);
            if (dateFrom) params.append("date_from", dateFrom);
            if (dateTo) params.append("date_to", dateTo);

            const queryString = params.toString();
            const url = queryString ? `/stocks?${queryString}` : "/stocks";

            router.get(url, {}, { preserveState: true, replace: true });
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [search, typeFilter, reasonFilter, dateFrom, dateTo]);

    // Handle stock aging filters
    useEffect(() => {
        if (activeTab === "stock-aging") {
            const timeoutId = setTimeout(() => {
                const params = new URLSearchParams();
                if (agingSearch) params.append("aging_search", agingSearch);
                if (agingStatusFilter)
                    params.append("aging_status", agingStatusFilter);
                if (agingDateFrom)
                    params.append("aging_date_from", agingDateFrom);
                if (agingDateTo) params.append("aging_date_to", agingDateTo);

                const queryString = params.toString();
                const url = queryString ? `/stocks?${queryString}` : "/stocks";

                router.get(url, {}, { preserveState: true, replace: true });
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [agingSearch, agingStatusFilter, agingDateFrom, agingDateTo, activeTab]);

    // Debug: Log stockAging data
    useEffect(() => {
        if (activeTab === "stock-aging") {
            // Stock aging tab is active
        }
    }, [stockAging, stockAgingData, activeTab]);

    // Apply filter from dashboard when component mounts
    useEffect(() => {
        if (filter) {
            // Automatically switch to stock aging tab
            setActiveTab("stock-aging");

            // Apply the appropriate status filter
            if (filter === "low_stock") {
                setAgingStatusFilter("active");
            } else if (filter === "out_of_stock") {
                setAgingStatusFilter("empty");
            }

            // Update stock aging data with the filter
            setStockAgingData(stockAging);
            setAgingCurrentPage(stockAging.current_page || 1);
            setAgingTotalPages(stockAging.last_page || 1);
        }
    }, [filter, stockAging]);

    // Handle clicking outside search results
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                !event.target.closest("#item_search") &&
                !event.target.closest("#item_search_out")
            ) {
                setStockInShowResults(false);
                setStockOutShowResults(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    // Load calculator items when tab is active or filters change
    useEffect(() => {
        if (activeTab === "stock-calculator") {
            loadCalculatorItems();
        }
    }, [
        activeTab,
        calculatorSearch,
        calculatorBrandFilter,
        calculatorModelFilter,
    ]);

    // Handle date range selection
    useEffect(() => {
        if (exportForm.date_range) {
            const today = new Date();
            let fromDate = new Date();
            let toDate = new Date();

            switch (exportForm.date_range) {
                case "today":
                    fromDate = today;
                    toDate = today;
                    break;
                case "yesterday":
                    fromDate.setDate(today.getDate() - 1);
                    toDate.setDate(today.getDate() - 1);
                    break;
                case "last_7_days":
                    fromDate.setDate(today.getDate() - 7);
                    break;
                case "last_30_days":
                    fromDate.setDate(today.getDate() - 30);
                    break;
                case "this_month":
                    fromDate = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                    );
                    break;
                case "last_month":
                    fromDate = new Date(
                        today.getFullYear(),
                        today.getMonth() - 1,
                        1
                    );
                    toDate = new Date(today.getFullYear(), today.getMonth(), 0);
                    break;
                case "this_year":
                    fromDate = new Date(today.getFullYear(), 0, 1);
                    break;
                case "custom":
                    // Don't auto-set dates for custom
                    return;
            }

            setExportForm((prev) => ({
                ...prev,
                export_from_date: fromDate.toISOString().split("T")[0],
                export_to_date: toDate.toISOString().split("T")[0],
            }));
        }
    }, [exportForm.date_range]);

    const getStockStatusBadgeClass = (quantity, minStock = 10) => {
        if (quantity === 0) {
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
        } else if (quantity <= minStock) {
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
        } else {
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        }
    };

    const getStockStatusText = (quantity, minStock = 10) => {
        if (quantity === 0) {
            return "Out of Stock";
        } else if (quantity <= minStock) {
            return "Low Stock";
        } else {
            return "In Stock";
        }
    };



    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Stock Management
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Manage stock movements, aging analysis, and current
                            stock levels
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Stock Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Backend Error Messages */}
                    {error && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <div className="flex items-center">
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                                <span className="font-medium">Error:</span>
                                <span className="ml-2">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        {/* Tab Navigation */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <div className="overflow-x-auto sm:overflow-x-visible">
                                <nav className="-mb-px flex space-x-4 sm:space-x-8 px-6 pt-6 sm:min-w-0 min-w-max">
                                    <button
                                        onClick={() =>
                                            setActiveTab("stock-movement")
                                        }
                                        className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                            activeTab === "stock-movement"
                                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        <span className="hidden sm:inline">
                                            Stock Movement
                                        </span>
                                        <span className="sm:hidden">
                                            Movement
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("stock-in")}
                                        className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                            activeTab === "stock-in"
                                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        <span className="hidden sm:inline">
                                            Stock In
                                        </span>
                                        <span className="sm:hidden">In</span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveTab("stock-out")
                                        }
                                        className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                            activeTab === "stock-out"
                                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        <span className="hidden sm:inline">
                                            Stock Out
                                        </span>
                                        <span className="sm:hidden">Out</span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveTab("stock-aging")
                                        }
                                        className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                            activeTab === "stock-aging"
                                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        <span className="hidden sm:inline">
                                            Stock Aging
                                        </span>
                                        <span className="sm:hidden">Aging</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab("damaged-items");
                                        }}
                                        className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                            activeTab === "damaged-items"
                                                ? "border-indigo-500 text-indigo-600 dark:text-gray-400"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        <span className="hidden sm:inline">
                                            Damaged Items
                                        </span>
                                        <span className="sm:hidden">
                                            Damaged
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab("stock-calculator");
                                        }}
                                        className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                            activeTab === "stock-calculator"
                                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        <span className="hidden sm:inline">
                                            Stock Calculator
                                        </span>
                                        <span className="sm:hidden">
                                            Calculator
                                        </span>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveTab("export-pdf")
                                        }
                                        className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                            activeTab === "export-pdf"
                                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        <span className="hidden sm:inline">
                                            Export PDF
                                        </span>
                                        <span className="sm:hidden">
                                            Export
                                        </span>
                                    </button>
                                </nav>
                            </div>
                        </div>

                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* Tab Content */}
                            {activeTab === "stock-movement" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Stock Movement Management
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Track all stock movements and transactions
                                        </p>
                                    </div>

                                    {/* Search and Filters with Table */}
                                    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                            <div>
                                            <InputLabel
                                                htmlFor="search"
                                                value="Search"
                                            />
                                            <SearchWithBarcode
                                                value={search}
                                                onChange={(e) =>
                                                    setSearch(e.target.value)
                                                }
                                                placeholder="Search by item name, SKU, barcode..."
                                                className="mt-1 block w-full"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="type"
                                                value="Movement Type"
                                            />
                                            <select
                                                id="type"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={typeFilter}
                                                onChange={(e) =>
                                                    setTypeFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    All Types
                                                </option>
                                                <option value="in">
                                                    Stock In
                                                </option>
                                                <option value="out">
                                                    Stock Out
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="reason"
                                                value="Reason"
                                            />
                                            <select
                                                id="reason"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={reasonFilter}
                                                onChange={(e) =>
                                                    setReasonFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    All Reasons
                                                </option>
                                                <option value="purchase">
                                                    Purchase
                                                </option>
                                                <option value="sale">
                                                    Sale
                                                </option>
                                                <option value="return">
                                                    Return
                                                </option>
                                                <option value="transfer">
                                                    Transfer
                                                </option>

                                                <option value="loss">
                                                    Loss
                                                </option>
                                                <option value="other">
                                                    Other
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="date_from"
                                                value="From Date"
                                            />
                                            <TextInput
                                                id="date_from"
                                                type="date"
                                                className="mt-1 block w-full"
                                                value={dateFrom}
                                                onChange={(e) =>
                                                    setDateFrom(e.target.value)
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="date_to"
                                                value="To Date"
                                            />
                                            <TextInput
                                                id="date_to"
                                                type="date"
                                                className="mt-1 block w-full"
                                                value={dateTo}
                                                onChange={(e) =>
                                                    setDateTo(e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                          <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Item
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Type
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Quantity
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Reason
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Batch Number
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        User
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                                {stockHistory?.data &&
                                                stockHistory.data.length > 0 ? (
                                                    stockHistory.data.map(
                                                        (movement) => (
                                                            <tr
                                                                key={
                                                                    movement.id
                                                                }
                                                                className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                            >
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <div className="flex-shrink-0 h-10 w-10">
                                                                            {movement
                                                                                .item
                                                                                ?.picture_url ? (
                                                                                <img
                                                                                    className="h-10 w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                                                    src={
                                                                                        movement
                                                                                            .item
                                                                                            .picture_url
                                                                                    }
                                                                                    alt={
                                                                                        movement
                                                                                            .item
                                                                                            .item_name
                                                                                    }
                                                                                    onClick={() =>
                                                                                        handleImagePreview(
                                                                                            movement
                                                                                                .item
                                                                                                .picture_url,
                                                                                            movement
                                                                                                .item
                                                                                                .item_name
                                                                                        )
                                                                                    }
                                                                                    title="Click to preview"
                                                                                                                                                                    onError={(
                                                                                    e
                                                                                ) => {
                                                                                    if (e.target) {
                                                                                        e.target.style.display = "none";
                                                                                    }
                                                                                    if (e.target && e.target.nextSibling) {
                                                                                        e.target.nextSibling.style.display = "flex";
                                                                                    }
                                                                                }}
                                                                                />
                                                                            ) : (
                                                                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                                                    <svg
                                                                                        className="h-6 w-6 text-gray-500 dark:text-gray-400"
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
                                                                                {movement
                                                                                    .item
                                                                                    ?.item_name ||
                                                                                    "Unknown Item"}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                {movement
                                                                                    .item
                                                                                    ?.sku_id ||
                                                                                    "No SKU"}
                                                                            </div>
                                                                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                {movement
                                                                                    .item
                                                                                    ?.barcode ||
                                                                                    "No Barcode"}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span
                                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                            movement.type ===
                                                                            "in"
                                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                                        }`}
                                                                    >
                                                                        {movement.type ===
                                                                        "in"
                                                                            ? "Stock In"
                                                                            : "Stock Out"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    {
                                                                        movement.quantity
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    {
                                                                        movement.reason
                                                                    }
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    {movement.batch_number ||
                                                                        "N/A"}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    {new Date(
                                                                        movement.created_at
                                                                    ).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    {movement
                                                                        .user
                                                                        ?.name ||
                                                                        "System"}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan="8"
                                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                                        >
                                                            No stock records
                                                            found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {stockHistory?.links && (
                                        <div className="mt-6 flex justify-between items-center">
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                Showing{" "}
                                                {stockHistory?.from || 0} to{" "}
                                                {stockHistory?.to || 0} of{" "}
                                                {stockHistory?.total || 0}{" "}
                                                results
                                            </div>
                                            <div className="flex gap-1">
                                                {stockHistory.links.map(
                                                    (link, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => {
                                                                if (link.url) {
                                                                    const url =
                                                                        new URL(
                                                                            link.url
                                                                        );
                                                                    const page =
                                                                        url.searchParams.get(
                                                                            "page"
                                                                        );
                                                                    router.get(
                                                                        route(
                                                                            "stocks.index"
                                                                        ),
                                                                        {
                                                                            search: search,
                                                                            status: statusFilter,
                                                                            date_from:
                                                                                dateFrom,
                                                                            date_to:
                                                                                dateTo,
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
                                                                    ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                                            }`}
                                                            dangerouslySetInnerHTML={{
                                                                __html: link.label,
                                                            }}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            )}

                            {/* Stock In Tab */}
                            {activeTab === "stock-in" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Stock In Management
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Record new stock additions and
                                            purchases
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                                        <form
                                            onSubmit={handleStockInSubmit}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <InputLabel
                                                        htmlFor="item_search"
                                                        value="Search Item"
                                                    />
                                                    <div className="relative">
                                                        <input
                                                            id="item_search"
                                                            type="text"
                                                            value={
                                                                stockInForm.item_search
                                                            }
                                                            onChange={(e) =>
                                                                handleStockInAutoSearch(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Enter item name, SKU, or barcode..."
                                                            className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                        />
                                                    </div>

                                                    {/* Search Results Container */}
                                                    <div className="relative">
                                                        {stockInForm.selected_item && (
                                                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-2">
                                                                        <svg
                                                                            className="h-4 w-4 text-green-600 dark:text-green-400"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth="2"
                                                                                d="M5 13l4 4L19 7"
                                                                            />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="text-sm">
                                                                        <span className="font-medium text-green-800 dark:text-green-200">
                                                                            Selected:
                                                                        </span>
                                                                        <span className="text-green-700 dark:text-green-300 ml-1">
                                                                            {
                                                                                stockInForm
                                                                                    .selected_item
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                                                            <span className="mr-3">
                                                                                Item
                                                                                ID:{" "}
                                                                                {
                                                                                    stockInForm
                                                                                        .selected_item
                                                                                        .id
                                                                                }
                                                                            </span>
                                                                            <span>
                                                                                SKU:{" "}
                                                                                {
                                                                                    stockInForm
                                                                                        .selected_item
                                                                                        .sku
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {stockInSearching && (
                                                            <div className="mt-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                                <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
                                                                    <svg
                                                                        className="animate-spin h-4 w-4 text-indigo-500"
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
                                                                    <span>
                                                                        Searching...
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {stockInShowResults &&
                                                            stockInSearchResults.length >
                                                                0 && (
                                                                <div className="mt-3 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                                                                    {stockInSearchResults.map(
                                                                        (
                                                                            item
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    item.id
                                                                                }
                                                                                className="flex items-center p-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150"
                                                                                onClick={() =>
                                                                                    selectStockInItem(
                                                                                        item
                                                                                    )
                                                                                }
                                                                            >
                                                                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                                                                                    {item.photo ? (
                                                                                        <img
                                                                                            src={
                                                                                                item.photo
                                                                                            }
                                                                                            alt={
                                                                                                item.name
                                                                                            }
                                                                                            className="h-8 w-8 rounded-lg object-cover"
                                                                                            onError={(
                                                                                                e
                                                                                            ) => {
                                                                                                if (e.target) {
                                                                                                    e.target.style.display = "none";
                                                                                                }
                                                                                                if (e.target && e.target.nextSibling) {
                                                                                                    e.target.nextSibling.style.display = "flex";
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    ) : (
                                                                                        <svg
                                                                                            className="h-6 w-6 text-gray-500 dark:text-gray-400"
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
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                                        {
                                                                                            item.name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                                                                        <span>
                                                                                            Item
                                                                                            ID:{" "}
                                                                                            {
                                                                                                item.id
                                                                                            }
                                                                                        </span>
                                                                                        <span>
                                                                                            •
                                                                                        </span>
                                                                                        <span>
                                                                                            SKU:{" "}
                                                                                            {
                                                                                                item.sku
                                                                                            }
                                                                                        </span>
                                                                                        <span>
                                                                                            •
                                                                                        </span>
                                                                                        <span>
                                                                                            Barcode:{" "}
                                                                                            {
                                                                                                item.barcode
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-shrink-0">
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
                                                                                            d="M9 5l7 7-7 7"
                                                                                        />
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}

                                                        {stockInShowResults &&
                                                            stockInSearchResults.length ===
                                                                0 &&
                                                            stockInForm
                                                                .item_search
                                                                .length >= 2 &&
                                                            !stockInSearching && (
                                                                <div className="mt-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                                    <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                                                                        No items
                                                                        found
                                                                        matching
                                                                        "
                                                                        {
                                                                            stockInForm.item_search
                                                                        }
                                                                        "
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        htmlFor="quantity"
                                                        value="Quantity"
                                                    />
                                                    <TextInput
                                                        id="quantity"
                                                        type="number"
                                                        min="1"
                                                        value={
                                                            stockInForm.quantity
                                                        }
                                                        onChange={(e) =>
                                                            handleStockInChange(
                                                                "quantity",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter quantity"
                                                        className="mt-1 block w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        htmlFor="reason"
                                                        value="Reason"
                                                    />
                                                    <select
                                                        id="reason"
                                                        value={
                                                            stockInForm.reason
                                                        }
                                                        onChange={(e) => {
                                                            const newReason =
                                                                e.target.value;
                                                            setStockInForm(
                                                                (prevData) => ({
                                                                    ...prevData,
                                                                    reason: newReason,
                                                                    other_reason:
                                                                        newReason ===
                                                                        "other"
                                                                            ? prevData.other_reason
                                                                            : "",
                                                                })
                                                            );
                                                        }}
                                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    >
                                                        <option value="">
                                                            Select reason
                                                        </option>
                                                        <option value="purchase">
                                                            Purchase
                                                        </option>
                                                        <option value="return">
                                                            Return
                                                        </option>
                                                        <option value="transfer">
                                                            Transfer
                                                        </option>
                                                        <option value="other">
                                                            Other
                                                        </option>
                                                    </select>
                                                </div>

                                                {/* Conditional Other Reason Field */}
                                                {stockInForm.reason ===
                                                    "other" && (
                                                    <div className="md:col-span-2">
                                                        <InputLabel
                                                            htmlFor="other_reason"
                                                            value="Please specify reason *"
                                                        />
                                                        <TextInput
                                                            id="other_reason"
                                                            type="text"
                                                            className="mt-1 block w-full"
                                                            value={
                                                                stockInForm.other_reason
                                                            }
                                                            onChange={(e) =>
                                                                handleStockInChange(
                                                                    "other_reason",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Enter your reason..."
                                                            required={
                                                                stockInForm.reason ===
                                                                "other"
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                                                <PrimaryButton
                                                    type="submit"
                                                    className="px-8 py-3 text-base"
                                                    disabled={stockInSubmitting}
                                                >
                                                    {stockInSubmitting ? (
                                                        <>
                                                            <svg
                                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                                                            Recording...
                                                        </>
                                                    ) : (
                                                        "Record Stock In"
                                                    )}
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Stock Out Tab */}
                            {activeTab === "stock-out" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Stock Out Management
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Record stock sales, transfers, and
                                            adjustments
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                                        <form
                                            onSubmit={handleStockOutSubmit}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <InputLabel
                                                        htmlFor="item_search_out"
                                                        value="Search Item"
                                                    />
                                                    <div className="relative">
                                                        <input
                                                            id="item_search_out"
                                                            type="text"
                                                            value={
                                                                stockOutForm.item_search
                                                            }
                                                            onChange={(e) =>
                                                                handleStockOutAutoSearch(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Enter item name, SKU, or barcode..."
                                                            className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                        />
                                                    </div>

                                                    {/* Search Results Container */}
                                                    <div className="relative">
                                                        {stockOutForm.selected_item && (
                                                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mr-2">
                                                                        <svg
                                                                            className="h-4 w-4 text-green-600 dark:text-green-400"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth="2"
                                                                                d="M5 13l4 4L19 7"
                                                                            />
                                                                        </svg>
                                                                    </div>
                                                                    <div className="text-sm">
                                                                        <span className="font-medium text-green-800 dark:text-green-200">
                                                                            Selected:
                                                                        </span>
                                                                        <span className="text-green-700 dark:text-green-300 ml-1">
                                                                            {
                                                                                stockOutForm
                                                                                    .selected_item
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                                                            <span className="mr-3">
                                                                                Item
                                                                                ID:{" "}
                                                                                {
                                                                                    stockOutForm
                                                                                        .selected_item
                                                                                        .id
                                                                                }
                                                                            </span>
                                                                            <span>
                                                                                SKU:{" "}
                                                                                {
                                                                                    stockOutForm
                                                                                        .selected_item
                                                                                        .sku
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {stockOutSearching && (
                                                            <div className="mt-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                                <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
                                                                    <svg
                                                                        className="animate-spin h-4 w-4 text-indigo-500"
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
                                                                    <span>
                                                                        Searching...
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {stockOutShowResults &&
                                                            stockOutSearchResults.length >
                                                                0 && (
                                                                <div className="mt-3 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                                                                    {stockOutSearchResults.map(
                                                                        (
                                                                            item
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    item.id
                                                                                }
                                                                                className={`flex items-center p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors duration-150 ${
                                                                                    (item.quantity ||
                                                                                        0) >
                                                                                    0
                                                                                        ? "cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                                                        : "cursor-not-allowed bg-gray-50 dark:bg-gray-700/50 opacity-60"
                                                                                }`}
                                                                                onClick={() => {
                                                                                    if (
                                                                                        (item.quantity ||
                                                                                            0) >
                                                                                        0
                                                                                    ) {
                                                                                        selectStockOutItem(
                                                                                            item
                                                                                        );
                                                                                    } else {
                                                                                        toast.warning(
                                                                                            `Cannot select "${item.name}" - Item has 0 quantity in stock`
                                                                                        );
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                                                                                    {item.photo ? (
                                                                                        <img
                                                                                            src={
                                                                                                item.photo
                                                                                            }
                                                                                            alt={
                                                                                                item.name
                                                                                            }
                                                                                            className="h-8 w-8 rounded-lg object-cover"
                                                                                            onError={(
                                                                                                e
                                                                                            ) => {
                                                                                                if (e.target) {
                                                                                                    e.target.style.display = "none";
                                                                                                }
                                                                                                if (e.target && e.target.nextSibling) {
                                                                                                    e.target.nextSibling.style.display = "flex";
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    ) : (
                                                                                        <svg
                                                                                            className="h-6 w-6 text-gray-500 dark:text-gray-400"
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
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                                        {
                                                                                            item.name
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                                                                        <span>
                                                                                            Item
                                                                                            ID:{" "}
                                                                                            {
                                                                                                item.id
                                                                                            }
                                                                                        </span>
                                                                                        <span>
                                                                                            •
                                                                                        </span>
                                                                                        <span>
                                                                                            SKU:{" "}
                                                                                            {
                                                                                                item.sku
                                                                                            }
                                                                                        </span>
                                                                                        <span>
                                                                                            •
                                                                                        </span>
                                                                                        <span>
                                                                                            Barcode:{" "}
                                                                                            {
                                                                                                item.barcode
                                                                                            }
                                                                                        </span>
                                                                                        <span>
                                                                                            •
                                                                                        </span>
                                                                                        <span
                                                                                            className={`font-medium ${
                                                                                                (item.quantity ||
                                                                                                    0) >
                                                                                                0
                                                                                                    ? "text-green-600 dark:text-green-400"
                                                                                                    : "text-red-600 dark:text-red-400"
                                                                                            }`}
                                                                                        >
                                                                                            Stock:{" "}
                                                                                            {item.quantity ||
                                                                                                0}
                                                                                            {(item.quantity ||
                                                                                                0) ===
                                                                                                0 &&
                                                                                                " (Out of Stock)"}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-shrink-0">
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
                                                                                            d="M9 5l7 7-7 7"
                                                                                        />
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}

                                                        {stockOutShowResults &&
                                                            stockOutSearchResults.length ===
                                                                0 &&
                                                            stockOutForm
                                                                .item_search
                                                                .length >= 2 &&
                                                            !stockOutSearching && (
                                                                <div className="mt-3 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                                    <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                                                                        No items
                                                                        found
                                                                        matching
                                                                        "
                                                                        {
                                                                            stockOutForm.item_search
                                                                        }
                                                                        "
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        htmlFor="quantity_out"
                                                        value="Quantity"
                                                    />
                                                    <TextInput
                                                        id="quantity_out"
                                                        type="number"
                                                        min="1"
                                                        value={
                                                            stockOutForm.quantity
                                                        }
                                                        onChange={(e) =>
                                                            handleStockOutChange(
                                                                "quantity",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Enter quantity"
                                                        className="mt-1 block w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        htmlFor="reason_out"
                                                        value="Reason"
                                                    />
                                                    <select
                                                        id="reason_out"
                                                        value={
                                                            stockOutForm.reason
                                                        }
                                                        onChange={(e) => {
                                                            const newReason =
                                                                e.target.value;
                                                            setStockOutForm(
                                                                (prevData) => ({
                                                                    ...prevData,
                                                                    reason: newReason,
                                                                    other_reason:
                                                                        newReason ===
                                                                        "other"
                                                                            ? prevData.other_reason
                                                                            : "",
                                                                    damage_reason:
                                                                        newReason ===
                                                                        "damage"
                                                                            ? prevData.damage_reason
                                                                            : "",
                                                                })
                                                            );
                                                        }}
                                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    >
                                                        <option value="">
                                                            Select reason
                                                        </option>
                                                        <option value="sale">
                                                            Sale
                                                        </option>
                                                        <option value="transfer">
                                                            Transfer
                                                        </option>
                                                        <option value="damage">
                                                            Damage
                                                        </option>
                                                        <option value="loss">
                                                            Loss
                                                        </option>
                                                        <option value="other">
                                                            Other
                                                        </option>
                                                    </select>
                                                </div>

                                                {/* Conditional Other Reason Field */}
                                                {stockOutForm.reason ===
                                                    "other" && (
                                                    <div className="md:col-span-2">
                                                        <InputLabel
                                                            htmlFor="other_reason_out"
                                                            value="Please specify reason *"
                                                        />
                                                        <TextInput
                                                            id="other_reason_out"
                                                            type="text"
                                                            className="mt-1 block w-full"
                                                            value={
                                                                stockOutForm.other_reason
                                                            }
                                                            onChange={(e) =>
                                                                handleStockOutChange(
                                                                    "other_reason",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Enter your reason..."
                                                            required={
                                                                stockOutForm.reason ===
                                                                "other"
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {/* Conditional Damage Reason Field */}
                                                {stockOutForm.reason ===
                                                    "damage" && (
                                                    <div className="md:col-span-2">
                                                        <InputLabel
                                                            htmlFor="damage_reason_out"
                                                            value="Please specify damage reason *"
                                                        />
                                                        <TextInput
                                                            id="damage_reason_out"
                                                            type="text"
                                                            className="mt-1 block w-full"
                                                            value={
                                                                stockOutForm.damage_reason
                                                            }
                                                            onChange={(e) =>
                                                                handleStockOutChange(
                                                                    "damage_reason",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Enter damage reason..."
                                                            required={
                                                                stockOutForm.reason ===
                                                                "damage"
                                                            }
                                                        />
                                                    </div>
                                                )}


                                            </div>
                                            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                                                <PrimaryButton
                                                    type="submit"
                                                    className="px-8 py-3 text-base"
                                                    disabled={
                                                        stockOutSubmitting
                                                    }
                                                >
                                                    {stockOutSubmitting ? (
                                                        <>
                                                            <svg
                                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                                                            Recording...
                                                        </>
                                                    ) : (
                                                        "Record Stock Out"
                                                    )}
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Stock Aging Tab */}
                            {activeTab === "stock-aging" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Stock Aging
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Analyze stock aging and identify slow-moving items
                                        </p>
                                    </div>



                                    {/* Search and Filters */}
                                    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <InputLabel
                                                    htmlFor="aging_search"
                                                    value="Search"
                                                />
                                                <SearchWithBarcode
                                                    value={agingSearch}
                                                    onChange={(e) =>
                                                        setAgingSearch(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Search by item name, SKU, barcode..."
                                                    className="mt-1 block w-full"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="aging_status"
                                                    value="Status"
                                                />
                                                <select
                                                    id="aging_status"
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    value={agingStatusFilter}
                                                    onChange={(e) =>
                                                        setAgingStatusFilter(
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        All Status
                                                    </option>
                                                    <option value="active">
                                                        Active
                                                    </option>
                                                    <option value="empty">
                                                        Empty
                                                    </option>
                                                </select>
                                            </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="aging_date_from"
                                                    value="From Date"
                                                />
                                                <TextInput
                                                    id="aging_date_from"
                                                    type="date"
                                                    className="mt-1 block w-full"
                                                    value={agingDateFrom}
                                                    onChange={(e) =>
                                                        setAgingDateFrom(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="aging_date_to"
                                                    value="To Date"
                                                />
                                                <TextInput
                                                    id="aging_date_to"
                                                    type="date"
                                                    className="mt-1 block w-full"
                                                    value={agingDateTo}
                                                    onChange={(e) =>
                                                        setAgingDateTo(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* Stock Aging Table */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Item
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Batch Number
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Quantity
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Date Added
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Days in Stock
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {stockAgingData?.data &&
                                                    stockAgingData.data.length >
                                                        0 ? (
                                                        stockAgingData.data.map(
                                                            (batch) => (
                                                                <tr
                                                                    key={
                                                                        batch.id
                                                                    }
                                                                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                                                >
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="flex items-center">
                                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                                {batch
                                                                                    .item
                                                                                    ?.picture_url ? (
                                                                                    <img
                                                                                        className="h-10 w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                                                        src={
                                                                                            batch
                                                                                                .item
                                                                                                .picture_url
                                                                                        }
                                                                                        alt={
                                                                                            batch
                                                                                                .item
                                                                                                .item_name
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleImagePreview(
                                                                                                batch
                                                                                                    .item
                                                                                                    .picture_url,
                                                                                                batch
                                                                                                    .item
                                                                                                    .item_name
                                                                                            )
                                                                                        }
                                                                                        title="Click to preview"
                                                                                        onError={(
                                                                                            e
                                                                                        ) => {
                                                                                            if (e.target) {
                                                                                                e.target.style.display = "none";
                                                                                            }
                                                                                            if (e.target && e.target.nextSibling) {
                                                                                                e.target.nextSibling.style.display = "flex";
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                                                        <svg
                                                                                            className="h-6 w-6 text-gray-500 dark:text-gray-400"
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
                                                                                    {batch
                                                                                        .item
                                                                                        ?.item_name ||
                                                                                        "Unknown Item"}
                                                                                </div>
                                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                    {batch
                                                                                        .item
                                                                                        ?.sku_id ||
                                                                                        "No SKU"}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                        {
                                                                            batch.batch_number
                                                                        }
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                        <span
                                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                                (batch.quantity_remaining ||
                                                                                    0) ===
                                                                                0
                                                                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                                                    : (batch.quantity_remaining ||
                                                                                          0) <=
                                                                                      10
                                                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                            }`}
                                                                        >
                                                                            {batch.quantity_remaining ||
                                                                                0}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                        {batch.created_at
                                                                            ? new Date(
                                                                                  batch.created_at
                                                                              ).toLocaleDateString()
                                                                            : "N/A"}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                        {batch.created_at
                                                                            ? Math.floor(
                                                                                  (new Date() -
                                                                                      new Date(
                                                                                          batch.created_at
                                                                                      )) /
                                                                                      (1000 *
                                                                                          60 *
                                                                                          60 *
                                                                                          24)
                                                                              )
                                                                            : 0}{" "}
                                                                        days
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span
                                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                                batch.status ===
                                                                                "Fresh"
                                                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                                    : batch.status ===
                                                                                      "Aging"
                                                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                                                    : batch.status ===
                                                                                      "Empty"
                                                                                    ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                batch.status
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteBatch(
                                                                                    batch
                                                                                )
                                                                            }
                                                                            className={`${
                                                                                batch.quantity_remaining >
                                                                                0
                                                                                    ? "text-gray-400 cursor-not-allowed dark:text-gray-600"
                                                                                    : "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                                            }`}
                                                                            disabled={
                                                                                batch.quantity_remaining >
                                                                                0
                                                                            }
                                                                            title={
                                                                                batch.quantity_remaining >
                                                                                0
                                                                                    ? "Cannot delete batch with remaining quantity"
                                                                                    : "Delete batch"
                                                                            }
                                                                        >
                                                                            <svg
                                                                                className="w-5 h-5"
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
                                                            )
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan="7"
                                                                className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                                            >
                                                                No aging data
                                                                found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {stockAgingData?.links && (
                                            <div className="mt-6 flex justify-between items-center">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    Showing{" "}
                                                    {stockAgingData.from} to{" "}
                                                    {stockAgingData.to} of{" "}
                                                    {stockAgingData.total}{" "}
                                                    results
                                                </div>
                                                <div className="flex gap-1">
                                                    {stockAgingData.links.map(
                                                        (link, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => {
                                                                    if (
                                                                        link.url
                                                                    ) {
                                                                        const url =
                                                                            new URL(
                                                                                link.url
                                                                            );
                                                                        const page =
                                                                            url.searchParams.get(
                                                                                "page"
                                                                            );
                                                                        router.get(
                                                                            route(
                                                                                "stocks.index"
                                                                            ),
                                                                            {
                                                                                filter: "aging",
                                                                                search: agingSearch,
                                                                                status: agingStatusFilter,
                                                                                date_from:
                                                                                    agingDateFrom,
                                                                                date_to:
                                                                                    agingDateTo,
                                                                                page: page,
                                                                            },
                                                                            {
                                                                                preserveState: true,
                                                                                preserveScroll: true,
                                                                            }
                                                                        );
                                                                    }
                                                                }}
                                                                disabled={
                                                                    !link.url
                                                                }
                                                                className={`px-3 py-2 text-sm rounded ${
                                                                    link.active
                                                                        ? "bg-indigo-500 text-white"
                                                                        : link.url
                                                                        ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                                                }`}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: link.label,
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Damaged Items Tab */}
                            {activeTab === "damaged-items" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Damaged Items Management
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Track and manage damaged inventory items
                                        </p>
                                    </div>

                                    {/* Search and Filters with Table */}
                                    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <InputLabel
                                                    htmlFor="damaged_search"
                                                    value="Search"
                                                />
                                                <SearchWithBarcode
                                                    value={damagedSearch}
                                                    onChange={(e) => {
                                                        setDamagedSearch(e.target.value);
                                                        // Auto-apply search after a short delay
                                                        if (searchTimeoutRef.current) {
                                                            clearTimeout(searchTimeoutRef.current);
                                                        }
                                                        searchTimeoutRef.current = setTimeout(() => {
                                                            loadDamagedItems();
                                                        }, 500);
                                                    }}
                                                    placeholder="Search by item name, SKU, barcode..."
                                                    className="mt-1 block w-full"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="damaged_date_from"
                                                    value="Date From"
                                                />
                                                <TextInput
                                                    id="damaged_date_from"
                                                    type="date"
                                                    className="mt-1 block w-full"
                                                    value={damagedDateFrom}
                                                    onChange={(e) => {
                                                        setDamagedDateFrom(e.target.value);
                                                        loadDamagedItems();
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="damaged_date_to"
                                                    value="Date To"
                                                />
                                                <TextInput
                                                    id="damaged_date_to"
                                                    type="date"
                                                    className="mt-1 block w-full"
                                                    value={damagedDateTo}
                                                    onChange={(e) => {
                                                        setDamagedDateTo(e.target.value);
                                                        loadDamagedItems();
                                                    }}
                                                />
                                            </div>

                                        </div>

                                        {/* Damaged Items Table */}
                                        <div className="overflow-x-auto">

                                        {damagedItemsData.data.length === 0 ? (
                                            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                No damaged items found. Try adjusting your search or filters.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Item
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Quantity
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Damage Reason
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Batch Number
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                Date
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                User
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                                        {damagedItemsData.data.map((damagedItem) => (
                                                            <tr key={damagedItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <div className="flex-shrink-0 h-10 w-10">
                                                                            {damagedItem.item.picture_url ? (
                                                                                <img
                                                                                    className="h-10 w-10 rounded-full object-cover cursor-pointer"
                                                                                    src={damagedItem.item.picture_url}
                                                                                    alt={damagedItem.item.item_name}
                                                                                    onClick={() => handleImagePreview(damagedItem.item.picture_url, damagedItem.item.item_name)}
                                                                                    onError={(e) => {
                                                                                        if (e.target) {
                                                                                            e.target.style.display = "none";
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                                                    <svg className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="ml-4">
                                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                                {damagedItem.item.item_name}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                {damagedItem.item.sku_id}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                {damagedItem.item.brand}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    {damagedItem.quantity}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                    {damagedItem.damage_reason}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                    {damagedItem.batch_number}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                    {new Date(damagedItem.created_at).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                    {damagedItem.user?.name || 'System'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Pagination */}
                                        {damagedItemsData?.links && (
                                            <div className="mt-6 flex justify-between items-center">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    Showing{" "}
                                                    {damagedItemsData.from} to{" "}
                                                    {damagedItemsData.to} of{" "}
                                                    {damagedItemsData.total}{" "}
                                                    results
                                                </div>
                                                <div className="flex gap-1">
                                                    {damagedItemsData.links.map(
                                                        (link, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => {
                                                                    if (
                                                                        link.url
                                                                    ) {
                                                                        const url =
                                                                            new URL(
                                                                                link.url
                                                                            );
                                                                        const page =
                                                                            url.searchParams.get(
                                                                                "page"
                                                                            );
                                                                        // Load damaged items with the new page
                                                                        loadDamagedItemsWithPage(page);
                                                                    }
                                                                }}
                                                                disabled={
                                                                    !link.url
                                                                }
                                                                className={`px-3 py-2 text-sm rounded ${
                                                                    link.active
                                                                        ? "bg-indigo-500 text-white"
                                                                        : link.url
                                                                        ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                                                }`}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: link.label,
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stock Calculator Tab */}
                            {activeTab === "stock-calculator" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Stock Calculator
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Calculate total value of selected items
                                        </p>
                                    </div>



                                    {/* Search and Filters with Table */}
                                    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                                        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <InputLabel htmlFor="calculator-search" value="Search Items" />
                                                <TextInput
                                                    id="calculator-search"
                                                    type="text"
                                                    className="mt-1 block w-full"
                                                    value={calculatorSearch}
                                                    onChange={(e) => setCalculatorSearch(e.target.value)}
                                                    placeholder="Search by name, SKU, or barcode..."
                                                />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="calculator-brand-filter" value="Brand" />
                                                <select
                                                    id="calculator-brand-filter"
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    value={calculatorBrandFilter}
                                                    onChange={(e) => setCalculatorBrandFilter(e.target.value)}
                                                >
                                                    <option value="">All Brands</option>
                                                    {Array.from(new Set((calculatorItems.data || []).map(item => item.brand).filter(Boolean))).map((brand) => (
                                                        <option key={brand} value={brand}>
                                                            {brand}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="calculator-model-filter" value="Model" />
                                                <select
                                                    id="calculator-model-filter"
                                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    value={calculatorModelFilter}
                                                    onChange={(e) => setCalculatorModelFilter(e.target.value)}
                                                >
                                                    <option value="">All Models</option>
                                                    {Array.from(new Set((calculatorItems.data || []).map(item => item.model).filter(Boolean))).map((model) => (
                                                        <option key={model} value={model}>
                                                            {model}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                                                            {/* Business Calculator */}
                                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                                        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                                            Business Calculator
                                        </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                                                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Cost</div>
                                                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                                                                                                RM {Array.from(selectedItems).reduce((total, itemId) => {
                                                            const item = (calculatorItems.data || []).find(i => i.id === itemId);
                                                            const stockValue = item?.current_stock || 0;
                                                            return total + (item ? parseFloat(item.purchase_price || 0) * stockValue : 0);
                                                        }, 0).toFixed(2)}
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Total Retail</div>
                                                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                                        RM {Array.from(selectedItems).reduce((total, itemId) => {
                                                            const item = (calculatorItems.data || []).find(i => i.id === itemId);
                                                            return total + (item ? parseFloat(item.selling_price || 0) * item.current_stock : 0);
                                                        }, 0).toFixed(2)}
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                                    <div className="text-sm font-medium text-purple-600 dark:text-purple-400">Gross Profit</div>
                                                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                                        RM {Array.from(selectedItems).reduce((total, itemId) => {
                                                            const item = (calculatorItems.data || []).find(i => i.id === itemId);
                                                            if (!item) return total;
                                                            const cost = parseFloat(item.purchase_price || 0) * item.current_stock;
                                                            const retail = parseFloat(item.selling_price || 0) * item.current_stock;
                                                            return total + (retail - cost);
                                                        }, 0).toFixed(2)}
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                                                    <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Profit Margin %</div>
                                                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                                        {(() => {
                                                            const totalCost = Array.from(selectedItems).reduce((total, itemId) => {
                                                                const item = (calculatorItems.data || []).find(i => i.id === itemId);
                                                                return total + (item ? parseFloat(item.purchase_price || 0) * item.current_stock : 0);
                                                            }, 0);
                                                            const totalRetail = Array.from(selectedItems).reduce((total, itemId) => {
                                                                const item = (calculatorItems.data || []).find(i => i.id === itemId);
                                                                return total + (item ? parseFloat(item.selling_price || 0) * item.current_stock : 0);
                                                            }, 0);
                                                            if (totalCost === 0) return '0.00';
                                                            return (((totalRetail - totalCost) / totalCost) * 100).toFixed(2);
                                                        })()}%
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Selected Items</div>
                                                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                        {selectedItems.size}
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Stock Qty</div>
                                                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                        {Array.from(selectedItems).reduce((total, itemId) => {
                                                            const item = (calculatorItems.data || []).find(i => i.id === itemId);
                                                            return total + (item ? item.current_stock : 0);
                                                        }, 0)}
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Cost per Item</div>
                                                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                        RM {(() => {
                                                            const totalCost = Array.from(selectedItems).reduce((total, itemId) => {
                                                                const item = (calculatorItems.data || []).find(i => i.id === itemId);
                                                                return total + (item ? parseFloat(item.purchase_price || 0) * item.current_stock : 0);
                                                            }, 0);
                                                            const totalQty = Array.from(selectedItems).reduce((total, itemId) => {
                                                                const item = (calculatorItems.data || []).find(i => i.id === itemId);
                                                                return total + (item ? item.current_stock : 0);
                                                            }, 0);
                                                            if (totalQty === 0) return '0.00';
                                                            return (totalCost / totalQty).toFixed(2);
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calculator Items List */}
                                    <div className="overflow-x-auto">
                                        {calculatorLoading ? (
                                            <div className="px-6 py-8 text-center">
                                                <div className="inline-flex items-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Loading items...
                                                </div>
                                            </div>
                                        ) : (calculatorItems.data || []).length === 0 ? (
                                                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    No items found. Try adjusting your search or filters.
                                                </div>
                                            ) : (
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            <input
                                                                type="checkbox"
                                                                id="select-all-calculator"
                                                                checked={selectedItems.size > 0 && selectedItems.size === (calculatorItems.data || []).length}
                                                                onChange={(e) => {
                                                                    const newSelected = new Set();
                                                                    if (e.target.checked) {
                                                                        // Select all items on current page
                                                                        (calculatorItems.data || []).forEach(item => {
                                                                            newSelected.add(item.id);
                                                                        });
                                                                    }
                                                                    setSelectedItems(newSelected);
                                                                }}
                                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                            />
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Item
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Stock
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Price
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Total Value
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                                {(calculatorItems.data || []).map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                id={`item-${item.id}`}
                                                                checked={selectedItems.has(item.id)}
                                                                onChange={(e) => {
                                                                    const newSelected = new Set(selectedItems);
                                                                    if (e.target.checked) {
                                                                        newSelected.add(item.id);
                                                                    } else {
                                                                        newSelected.delete(item.id);
                                                                    }
                                                                    setSelectedItems(newSelected);
                                                                }}
                                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                {item.picture_url ? (
                                                                                                                                            <img
                                                                            className="h-10 w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                                            src={item.picture_url}
                                                                            alt={item.item_name}
                                                                            onClick={() => handleImagePreview(item.picture_url, item.item_name)}
                                                                            title="Click to preview"
                                                                            onError={(e) => {
                                                                                if (e.target) {
                                                                                    e.target.style.display = "none";
                                                                                }
                                                                            }}
                                                                        />
                                                                ) : (
                                                                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                                                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                        {item.item_name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {item.sku_id}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {item.current_stock}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            RM {parseFloat(item.selling_price || 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            RM {(parseFloat(item.selling_price || 0) * item.current_stock).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        )}

                                        {/* Calculator Pagination */}
                                        {calculatorItems?.links && (
                                            <div className="mt-6 flex justify-between items-center">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    Showing{" "}
                                                    {calculatorItems.from} to{" "}
                                                    {calculatorItems.to} of{" "}
                                                    {calculatorItems.total}{" "}
                                                    results
                                                </div>
                                                <div className="flex gap-1">
                                                    {(calculatorItems.links || []).map(
                                                        (link, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => {
                                                                    if (
                                                                        link.url
                                                                    ) {
                                                                        const url =
                                                                            new URL(
                                                                                link.url
                                                                            );
                                                                        const page =
                                                                            url.searchParams.get(
                                                                                "page"
                                                                            );
                                                                        // Load calculator items with the new page
                                                                        loadCalculatorItemsWithPage(page);
                                                                    }
                                                                }}
                                                                disabled={
                                                                    !link.url
                                                                }
                                                                className={`px-3 py-2 text-sm rounded ${
                                                                    link.active
                                                                        ? "bg-indigo-500 text-white"
                                                                        : link.url
                                                                        ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                                                }`}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: link.label,
                                                                }}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Export PDF Tab */}
                            {activeTab === "export-pdf" && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Export Reports
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Generate and download comprehensive
                                            stock reports
                                        </p>
                                    </div>

                                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                                        <form
                                            onSubmit={handleExportSubmit}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <InputLabel
                                                        htmlFor="report_type"
                                                        value="Report Type"
                                                    />
                                                    <select
                                                        id="report_type"
                                                        value={
                                                            exportForm.report_type
                                                        }
                                                        onChange={(e) =>
                                                            handleExportChange(
                                                                "report_type",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    >
                                                        <option value="">
                                                            Select report type
                                                        </option>
                                                        <option value="stock_movements">
                                                            Stock Movements
                                                        </option>
                                                        <option value="stock_aging">
                                                            Stock Aging
                                                        </option>
                                                        <option value="damaged_items">
                                                            Damaged Items
                                                        </option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        htmlFor="movement_type"
                                                        value="Movement Type"
                                                    />
                                                    <select
                                                        id="movement_type"
                                                        value={
                                                            exportForm.movement_type
                                                        }
                                                        onChange={(e) =>
                                                            handleExportChange(
                                                                "movement_type",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                    >
                                                        <option value="">
                                                            All Types
                                                        </option>
                                                        <option value="in">
                                                            Stock In
                                                        </option>
                                                        <option value="out">
                                                            Stock Out
                                                        </option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        htmlFor="export_from_date"
                                                        value="From Date"
                                                    />
                                                    <TextInput
                                                        id="export_from_date"
                                                        type="date"
                                                        value={
                                                            exportForm.export_from_date
                                                        }
                                                        onChange={(e) =>
                                                            handleExportChange(
                                                                "export_from_date",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="mt-1 block w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        htmlFor="export_to_date"
                                                        value="To Date"
                                                    />
                                                    <TextInput
                                                        id="export_to_date"
                                                        type="date"
                                                        value={
                                                            exportForm.export_to_date
                                                        }
                                                        onChange={(e) =>
                                                            handleExportChange(
                                                                "export_to_date",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="mt-1 block w-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                                                <PrimaryButton
                                                    type="submit"
                                                    className="px-8 py-3 text-base"
                                                    disabled={isExporting}
                                                >
                                                    {isExporting ? (
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
                                                            Generating PDF...
                                                        </>
                                                    ) : (
                                                        "Export PDF"
                                                    )}
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <ImagePreview
                    src={previewImage.src}
                    alt={previewImage.alt}
                    onClose={closeImagePreview}
                />
            )}

            {/* Stock In Modal */}
            {showStockInModal && (
                <StockInModal
                    isOpen={showStockInModal}
                    onClose={() => setShowStockInModal(false)}
                    onSuccess={() => {
                        setShowStockInModal(false);
                        router.reload();
                    }}
                />
            )}

            {/* Stock Out Modal */}
            {showStockOutModal && (
                <StockOutModal
                    isOpen={showStockOutModal}
                    onClose={() => setShowStockOutModal(false)}
                    onSuccess={() => {
                        setShowStockOutModal(false);
                        router.reload();
                    }}
                />
            )}

            {/* Export Modal */}
            {showExportModal && (
                <ExportStockModal
                    isOpen={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    onSuccess={() => {
                        setShowExportModal(false);
                        router.reload();
                    }}
                />
            )}

            {/* Stock Aging Modal */}
            {showStockAgingModal && (
                <StockAgingModal
                    isOpen={showStockAgingModal}
                    onClose={() => setShowStockAgingModal(false)}
                    onSuccess={() => {
                        setShowStockAgingModal(false);
                        router.reload();
                    }}
                />
            )}

            {/* Delete Batch Modal */}
            {showDeleteBatchModal && (
                <DeleteBatchModal
                    show={showDeleteBatchModal}
                    onClose={() => setShowDeleteBatchModal(false)}
                    batch={batchToDelete}
                    onConfirm={confirmDeleteBatch}
                    processing={isDeletingBatch}
                />
            )}
        </AuthenticatedLayout>
    );
}
