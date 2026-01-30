import React from 'react';
import ReactApexChart from 'react-apexcharts';

const MonthlyTrendsChart = ({ data = [] }) => {
    // Default data structure if no data provided
    const defaultData = [
        { month: 'Jan', stockIn: 150, stockOut: 120 },
        { month: 'Feb', stockIn: 180, stockOut: 140 },
        { month: 'Mar', stockIn: 220, stockOut: 180 },
        { month: 'Apr', stockIn: 190, stockOut: 160 },
        { month: 'May', stockIn: 250, stockOut: 200 },
        { month: 'Jun', stockIn: 280, stockOut: 240 },
    ];

    const chartData = data.length > 0 ? data : defaultData;

    const options = {
        chart: {
            type: 'area',
            height: 350,
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        colors: ['#10B981', '#EF4444'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3,
                stops: [0, 90, 100],
            },
        },
        xaxis: {
            categories: chartData.map(item => item.month),
            labels: {
                style: {
                    colors: '#6B7280',
                    fontSize: '12px',
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#6B7280',
                    fontSize: '12px',
                },
                formatter: function (value) {
                    return value.toLocaleString();
                },
            },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            labels: {
                colors: '#6B7280',
            },
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: function (value) {
                    return value.toLocaleString() + ' items';
                },
            },
        },
        grid: {
            borderColor: '#E5E7EB',
            strokeDashArray: 5,
        },
        responsive: [
            {
                breakpoint: 768,
                options: {
                    chart: {
                        height: 300,
                    },
                    legend: {
                        position: 'bottom',
                        horizontalAlign: 'center',
                    },
                },
            },
        ],
    };

    const series = [
        {
            name: 'Stock In',
            data: chartData.map(item => item.stockIn),
        },
        {
            name: 'Stock Out',
            data: chartData.map(item => item.stockOut),
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Monthly Stock Movement Trends
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stock in and out patterns over the last 6 months
                </p>
            </div>
            <ReactApexChart
                options={options}
                series={series}
                type="area"
                height={350}
            />
        </div>
    );
};

export default MonthlyTrendsChart;
