import { useState, useRef, useEffect, useCallback } from "react";
import Quagga from "@ericblade/quagga2";

export default function BarcodeScanner({ onScan, onClose }) {
    const scannerRef = useRef(null);
    const [isScanning, setIsScanning] = useState(true); // Auto-start scanning
    const [error, setError] = useState(null);

    const startScanner = useCallback(() => {
        Quagga.init(
            {
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: scannerRef.current,
                    constraints: {
                        width: 640,
                        height: 480,
                        facingMode: "environment", // Use back camera
                    },
                },
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "code_39_vin_reader",
                        "codabar_reader",
                        "upc_reader",
                        "upc_e_reader",
                        "i2of5_reader",
                    ],
                },
                locate: true,
                locator: {
                    halfSample: true,
                    patchSize: "medium", // x-small, small, medium, large, x-large
                },
            },
            (err) => {
                if (err) {
                    console.error("Quagga initialization failed:", err);
                    setError("Camera access failed. Please check permissions.");
                    return;
                }
                console.log("Quagga initialization succeeded");
                Quagga.start();
            }
        );

        Quagga.onDetected((result) => {
            try {
                const code = result?.codeResult?.code;
                if (!code) {
                    console.warn("Invalid barcode result:", result);
                    return;
                }
                console.log("Barcode detected:", code);
                onScan(code);
                stopScanner();
                onClose();
            } catch (error) {
                console.error("Error processing barcode:", error);
                setError("Error processing barcode. Please try again.");
            }
        });
    }, [onScan, onClose]);

    const stopScanner = useCallback(() => {
        if (Quagga) {
            Quagga.stop();
            Quagga.offDetected();
        }
        setIsScanning(false);
    }, []);

    useEffect(() => {
        if (isScanning && scannerRef.current) {
            startScanner();
        }

        return () => {
            stopScanner();
        };
    }, [isScanning, startScanner, stopScanner]);

    const handleStopScan = () => {
        stopScanner();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Barcode Scanner
                    </h3>
                    <button
                        onClick={handleStopScan}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg
                            className="w-6 h-6"
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
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <div
                        ref={scannerRef}
                        className="w-full h-64 bg-black rounded-lg mb-4 relative overflow-hidden"
                    />
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Point your camera at a barcode to scan
                        </p>
                        <button
                            onClick={handleStopScan}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
                        >
                            Close Scanner
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
