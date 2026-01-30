import React from "react";
import ReactApexChart from "react-apexcharts";

const BrandModelChart = ({
    data = [],
    onlyBrandChart = false,
    onlyModelChart = false,
}) => {
    const chartData = data || [];

    // If no data, show empty state
    if (chartData.length === 0) {
        const EmptyState = () => (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="text-center py-8">
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
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        No data available
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Add some items to see brand and model distribution.
                    </p>
                </div>
            </div>
        );

        if (onlyBrandChart || onlyModelChart) {
            return <EmptyState />;
        }

        return (
            <div className="space-y-6">
                <EmptyState />
                <EmptyState />
            </div>
        );
    }

    // Group data by brand
    const brandData = chartData.reduce((acc, item) => {
        if (!acc[item.brand]) {
            acc[item.brand] = 0;
        }
        acc[item.brand] += item.count;
        return acc;
    }, {});

    // Prepare data for pie chart
    const pieSeries = Object.values(brandData);
    const pieLabels = Object.keys(brandData);

    // Prepare data for bar chart (top models)
    const topModels = chartData.sort((a, b) => b.count - a.count).slice(0, 8);

    const barOptions = {
        chart: {
            type: "bar",
            height: 350,
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "55%",
                endingShape: "rounded",
                borderRadius: 4,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ["transparent"],
        },
        colors: [
            "#3B82F6",
            "#8B5CF6",
            "#EF4444",
            "#10B981",
            "#F59E0B",
            "#EC4899",
            "#06B6D4",
            "#84CC16",
        ],
        xaxis: {
            categories: topModels.map((item) => `${item.brand} ${item.model}`),
            labels: {
                style: {
                    colors: "#6B7280",
                    fontSize: "11px",
                },
                rotate: -45,
                rotateAlways: false,
            },
        },
        yaxis: {
            title: {
                text: "Item Count",
                style: {
                    color: "#6B7280",
                    fontSize: "12px",
                },
            },
            labels: {
                style: {
                    colors: "#6B7280",
                    fontSize: "12px",
                },
            },
        },
        fill: {
            opacity: 1,
        },
        tooltip: {
            theme: "dark",
            y: {
                formatter: function (value) {
                    return value + " items";
                },
            },
        },
        grid: {
            borderColor: "#E5E7EB",
            strokeDashArray: 5,
        },
        responsive: [
            {
                breakpoint: 768,
                options: {
                    chart: {
                        height: 300,
                    },
                    xaxis: {
                        labels: {
                            rotate: -90,
                            style: {
                                fontSize: "10px",
                            },
                        },
                    },
                },
            },
        ],
    };

    const pieOptions = {
        chart: {
            type: "pie",
            height: 300,
        },
        labels: pieLabels,
        colors: [
            "#3B82F6",
            "#8B5CF6",
            "#EF4444",
            "#10B981",
            "#F59E0B",
            "#EC4899",
            "#06B6D4",
            "#84CC16",
        ],
        legend: {
            position: "bottom",
            labels: {
                colors: "#6B7280",
            },
        },
        tooltip: {
            theme: "dark",
            y: {
                formatter: function (value) {
                    return value + " items";
                },
            },
        },
        responsive: [
            {
                breakpoint: 768,
                options: {
                    chart: {
                        height: 250,
                    },
                    legend: {
                        position: "bottom",
                    },
                },
            },
        ],
    };

    // If only brand chart is requested
    if (onlyBrandChart) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Brand Distribution
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total items by brand
                    </p>
                </div>
                <ReactApexChart
                    options={pieOptions}
                    series={pieSeries}
                    type="pie"
                    height={300}
                />
            </div>
        );
    }

    // If only model chart is requested
    if (onlyModelChart) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Top Models by Item Count
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Most popular models across all brands
                    </p>
                </div>
                <ReactApexChart
                    options={barOptions}
                    series={[
                        {
                            name: "Item Count",
                            data: topModels.map((item) => item.count),
                        },
                    ]}
                    type="bar"
                    height={350}
                />
            </div>
        );
    }

    // Default: render both charts
    return (
        <div className="space-y-6">
            {/* Brand Distribution Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Brand Distribution
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total items by brand
                    </p>
                </div>
                <ReactApexChart
                    options={pieOptions}
                    series={pieSeries}
                    type="pie"
                    height={300}
                />
            </div>

            {/* Top Models Bar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Top Models by Item Count
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Most popular models across all brands
                    </p>
                </div>
                <ReactApexChart
                    options={barOptions}
                    series={[
                        {
                            name: "Item Count",
                            data: topModels.map((item) => item.count),
                        },
                    ]}
                    type="bar"
                    height={350}
                />
            </div>
        </div>
    );
};

export default BrandModelChart;
