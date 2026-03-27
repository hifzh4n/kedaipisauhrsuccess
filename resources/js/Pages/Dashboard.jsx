import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import MonthlyTrendsChart from "@/Components/Charts/MonthlyTrendsChart";
import BrandModelChart from "@/Components/Charts/BrandModelChart";

export default function Dashboard({
    auth,
    stats,
    monthlyTrends,
    brandModelData,
    recentActivity,
}) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div>
                    <h2 className="font-semibold text-xl text-secondary-800 dark:text-secondary-200 leading-tight">
                        Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                        Overview and quick access to recent activity
                    </p>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Welcome Section */}
                    <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-800 dark:via-primary-700 dark:to-accent-600 overflow-hidden shadow-lg sm:rounded-lg relative">
                        {/* Gradient overlay for better text readability */}
                        <div className="absolute inset-0 bg-black bg-opacity-10 dark:bg-opacity-20"></div>

                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>

                        <div className="relative p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-white drop-shadow-sm">
                                        Welcome back, {auth.user.name}! 👋
                                    </h3>
                                    <p className="mt-1 text-sm text-white text-opacity-90 drop-shadow-sm">
                                        {currentTime.toLocaleDateString(
                                            "en-US",
                                            {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            }
                                        )}{" "}
                                        • {currentTime.toLocaleTimeString()}
                                    </p>
                                </div>

                                {/* Optional: Add a subtle icon or decoration */}
                                <div className="hidden sm:block">
                                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Items */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
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
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Total Items
                                        </div>
                                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            {stats?.totalItems || 0}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Link
                                        href={route("items.index")}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                    >
                                        View all items →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Total Cost */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Total Cost
                                        </div>
                                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            RM{" "}
                                            {(
                                                stats?.totalCost || 0
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Link
                                        href={route("stocks.index", {
                                            tab: "calculator",
                                        })}
                                        className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium"
                                    >
                                        View inventory →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
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
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Low Stock
                                        </div>
                                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            {stats?.lowStock || 0}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Link
                                        href={route("items.index", {
                                            status: "low_stock",
                                        })}
                                        className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-medium"
                                    >
                                        Check stock →
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Out of Stock */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Out of Stock
                                        </div>
                                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            {stats?.outOfStock || 0}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Link
                                        href={route("items.index", {
                                            status: "out_of_stock",
                                        })}
                                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                                    >
                                        Restock items →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trends Chart */}
                    <MonthlyTrendsChart data={monthlyTrends} />

                    {/* Brand Distribution and Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Brand Distribution Chart - Takes 2/3 of the width */}
                        <div className="lg:col-span-2">
                            <BrandModelChart
                                data={brandModelData}
                                onlyBrandChart={true}
                            />
                        </div>

                        {/* Recent Activity - Takes 1/3 of the width */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg h-full">
                                <div className="p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                            Recent Activity
                                        </h3>
                                    </div>
                                    {recentActivity &&
                                    recentActivity.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentActivity.map((activity) => (
                                                <div
                                                    key={activity.id}
                                                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                                >
                                                    <div className="flex-shrink-0">
                                                        <div
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                                activity.type ===
                                                                "stock_in"
                                                                    ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                                                                    : activity.type ===
                                                                      "stock_out"
                                                                    ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                                                                    : activity.type ===
                                                                      "item_created"
                                                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                                                                    : activity.type ===
                                                                      "item_updated"
                                                                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                                                                    : "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
                                                            }`}
                                                        >
                                                            {activity.type ===
                                                            "stock_in" ? (
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
                                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                                    />
                                                                </svg>
                                                            ) : activity.type ===
                                                              "stock_out" ? (
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
                                                                        d="M18 12H6"
                                                                    />
                                                                </svg>
                                                            ) : activity.type ===
                                                              "item_created" ? (
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
                                                                        d="M12 4v16m8-8H4"
                                                                    />
                                                                </svg>
                                                            ) : activity.type ===
                                                              "item_updated" ? (
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
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                            ) : (
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
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {activity.type ===
                                                            "stock_in"
                                                                ? "Stock In"
                                                                : activity.type ===
                                                                  "stock_out"
                                                                ? "Stock Out"
                                                                : activity.type ===
                                                                  "item_created"
                                                                ? "Item Added"
                                                                : activity.type ===
                                                                  "item_updated"
                                                                ? "Item Updated"
                                                                : "Item Deleted"}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {activity.item
                                                                ? activity.item
                                                                      .item_name
                                                                : activity.description}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                                            {activity.metadata
                                                                ?.quantity && (
                                                                <>
                                                                    {
                                                                        activity
                                                                            .metadata
                                                                            .quantity
                                                                    }{" "}
                                                                    units •{" "}
                                                                </>
                                                            )}
                                                            {activity.user.name}
                                                        </div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-600">
                                                            {new Date(
                                                                activity.created_at
                                                            ).toLocaleDateString()}{" "}
                                                            {new Date(
                                                                activity.created_at
                                                            ).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                No recent activity
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Recent stock movements and user
                                                activities will appear here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Models Chart */}
                    <BrandModelChart
                        data={brandModelData}
                        onlyModelChart={true}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
