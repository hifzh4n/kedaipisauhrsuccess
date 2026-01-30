import { useState, useRef, useEffect } from "react";
import TextInput from "@/Components/TextInput";
import BarcodeScanner from "@/Components/BarcodeScanner";

export default function SearchWithBarcode({
    value,
    onChange,
    placeholder = "Search by name, SKU, barcode...",
    className = "",
    ...props
}) {
    const [showScanner, setShowScanner] = useState(false);
    const inputRef = useRef(null);
    const scanBufferRef = useRef("");
    const scanTimeoutRef = useRef(null);

    // Handle physical barcode scanner input
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Only process if the search input is focused or no specific input is focused
            const activeElement = document.activeElement;
            const isSearchFocused = activeElement === inputRef.current;
            const isInputFocused =
                activeElement && activeElement.tagName === "INPUT";

            if (!isSearchFocused && isInputFocused) {
                return; // Don't interfere with other inputs
            }

            // Clear previous timeout
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }

            // Add character to buffer
            if (e.key.length === 1) {
                // Only printable characters
                scanBufferRef.current += e.key;
            }

            // Set timeout to process the buffer
            scanTimeoutRef.current = setTimeout(() => {
                const scannedCode = scanBufferRef.current.trim();

                // Check if it looks like a barcode (typically 8+ characters, alphanumeric)
                if (
                    scannedCode.length >= 8 &&
                    /^[a-zA-Z0-9]+$/.test(scannedCode)
                ) {
                    // Focus the search input and set the value
                    if (inputRef.current) {
                        inputRef.current.focus();
                        onChange({ target: { value: scannedCode } });
                    }
                }

                // Clear the buffer
                scanBufferRef.current = "";
            }, 100); // 100ms timeout to capture full barcode
        };

        // Add event listener
        document.addEventListener("keypress", handleKeyPress);

        // Cleanup
        return () => {
            document.removeEventListener("keypress", handleKeyPress);
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        };
    }, [onChange]);

    const handleCameraScan = (scannedCode) => {
        try {
            if (scannedCode && typeof scannedCode === "string") {
                onChange({ target: { value: scannedCode } });
            } else {
                console.warn("Invalid scanned code:", scannedCode);
            }
        } catch (error) {
            console.error("Error handling camera scan:", error);
        } finally {
            setShowScanner(false);
        }
    };

    const openScanner = () => {
        setShowScanner(true);
    };

    const closeScanner = () => {
        setShowScanner(false);
    };

    return (
        <>
            <div className="relative">
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`pr-12 ${className}`}
                    {...props}
                />
                <button
                    type="button"
                    onClick={openScanner}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    title="Scan barcode with camera or use physical scanner"
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
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                        />
                    </svg>
                </button>
            </div>

            {showScanner && (
                <BarcodeScanner
                    onScan={handleCameraScan}
                    onClose={closeScanner}
                />
            )}
        </>
    );
}
