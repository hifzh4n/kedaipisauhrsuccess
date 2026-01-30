import { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import { toast } from "@/utils/toast";

export default function History({
    auth,
    stockHistory,
    filters = {},
    pagination = {},
}) {
    // State management
    const [search, setSearch] = useState(filters.search || "");
    const [typeFilter, setTypeFilter] = useState(filters.type || "");
    const [reasonFilter, setReasonFilter] = useState(filters.reason || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    const [isLoading, setIsLoading] = useState(false);

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
            const url = queryString
                ? `${route("stocks.history")}?${queryString}`
                : route("stocks.history");

            router.get(url, {}, { preserveState: true, replace: true });
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [search, typeFilter, reasonFilter, dateFrom, dateTo]);

    const getTypeColor = (type) => {
        return type === "in"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    };

    const formatReason = (reason) => {
        return reason.charAt(0).toUpperCase() + reason.slice(1);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Stock Movement History
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Track all stock movements and transactions
                        </p>
                    </div>

                    <PrimaryButton
                        onClick={() => router.get(route("stocks.index"))}
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
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Back to Stock Management
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Stock History" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* Filters */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <InputLabel
                                        htmlFor="search"
                                        value="Search"
                                    />
                                    <TextInput
                                        id="search"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Search by item name, SKU..."
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
                                            setTypeFilter(e.target.value)
                                        }
                                    >
                                        <option value="">All Types</option>
                                        <option value="in">Stock In</option>
                                        <option value="out">Stock Out</option>
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
                                            setReasonFilter(e.target.value)
                                        }
                                    >
                                        <option value="">All Reasons</option>
                                        <option value="purchase">
                                            Purchase
                                        </option>
                                        <option value="sale">Sale</option>
                                        <option value="return">Return</option>
                                        <option value="transfer">
                                            Transfer
                                        </option>

                                        <option value="loss">Loss</option>
                                        <option value="other">Other</option>
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

                            {/* Stock History Table */}
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
                                                Balance After
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                User
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {stockHistory?.data?.length > 0 ? (
                                            stockHistory.data.map(
                                                (movement) => (
                                                    <tr
                                                        key={movement.id}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                    {movement
                                                                        .item
                                                                        ?.picture_url ? (
                                                                        <img
                                                                            className="h-10 w-10 rounded-lg object-cover"
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
                                                                        />
                                                                    ) : (
                                                                        <div className="h-10 w-10 rounded-lg bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
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
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                        {
                                                                            movement
                                                                                .item
                                                                                ?.item_name
                                                                        }
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                        Item ID:{" "}
                                                                        {
                                                                            movement
                                                                                .item
                                                                                ?.id
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                                                                    movement.type
                                                                )}`}
                                                            >
                                                                {movement.type ===
                                                                "in"
                                                                    ? "Stock In"
                                                                    : "Stock Out"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {movement.type ===
                                                            "in"
                                                                ? "+"
                                                                : "-"}
                                                            {movement.quantity}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {formatReason(
                                                                movement.reason
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {
                                                                movement.balance_after
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {new Date(
                                                                movement.created_at
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                            {movement.user
                                                                ?.name ||
                                                                "System"}
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="px-6 py-8"
                                                    style={{
                                                        textAlign:
                                                            "center !important",
                                                        width: "100%",
                                                        display: "table-cell",
                                                        verticalAlign: "middle",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            textAlign: "center",
                                                            width: "100%",
                                                            margin: "0 auto",
                                                        }}
                                                    >
                                                        <p
                                                            style={{
                                                                textAlign:
                                                                    "center",
                                                                margin: "0",
                                                                color: "#6b7280",
                                                            }}
                                                        >
                                                            No stock movements
                                                            found.
                                                        </p>
                                                    </div>
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
                                        Showing {stockHistory.from} to{" "}
                                        {stockHistory.to} of{" "}
                                        {stockHistory.total} results
                                    </div>
                                    <div className="flex space-x-1">
                                        {stockHistory.links.map(
                                            (link, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        if (link.url) {
                                                            const url = new URL(
                                                                link.url
                                                            );
                                                            const page =
                                                                url.searchParams.get(
                                                                    "page"
                                                                );
                                                            router.get(
                                                                route(
                                                                    "stocks.history"
                                                                ),
                                                                {
                                                                    search: search,
                                                                    type: typeFilter,
                                                                    reason: reasonFilter,
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
                                                    className={`px-3 py-2 text-sm rounded-md ${
                                                        link.active
                                                            ? "bg-indigo-600 text-white"
                                                            : link.url
                                                            ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
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
            </div>
        </AuthenticatedLayout>
    );
}
