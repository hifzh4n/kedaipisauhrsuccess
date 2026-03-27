import { useState, useEffect } from "react";

export default function ImagePreview({ src, alt, onClose }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [loadStartTime, setLoadStartTime] = useState(null);

    useEffect(() => {
        // Close on Escape key
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        // Set a timeout for image loading (5 seconds)
        const timeoutId = setTimeout(() => {
                            if (isLoading) {
                    setIsLoading(false);
                    setHasError(true);
                }
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [isLoading, src]);

    // Debug: Log the image source when component mounts


    const handleImageLoad = () => {
        setIsLoading(false);

    };

    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleBackdropClick = (e) => {
        // Only close if clicking the backdrop, not the image
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-[90vw] max-h-[90vh] w-auto h-auto">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2"
                    title="Close (Esc)"
                >
                    <svg
                        className="w-8 h-8"
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

                {/* Loading spinner */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center w-32 h-32 bg-gray-800 rounded-lg">
                        <svg
                            className="animate-spin h-8 w-8 text-white mb-2"
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
                        <p className="text-xs text-gray-300 text-center">Loading image...</p>
                        <p className="text-xs text-gray-400 text-center mt-1">This may take a few seconds</p>
                    </div>
                )}

                {/* Error state */}
                {hasError && (
                    <div className="flex flex-col items-center justify-center w-32 h-32 bg-gray-800 rounded-lg text-white">
                        <svg
                            className="w-16 h-16 text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                        <p className="text-sm text-gray-300">Failed to load image</p>
                        <button
                                                                onClick={() => {
                                        setIsLoading(true);
                                        setHasError(false);
                                        setLoadStartTime(Date.now());
                                    }}
                            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Image */}
                <img
                    src={src}
                    alt={alt}
                    className={`max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl ${
                        isLoading || hasError ? "hidden" : "block"
                    }`}
                    style={{
                        maxWidth: 'calc(90vw - 2rem)',
                        maxHeight: 'calc(90vh - 6rem)'
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                                onLoadStart={() => {
                setLoadStartTime(Date.now());
            }}
                />

                {/* Image info */}
                {!isLoading && !hasError && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-b-lg">
                        <p className="text-sm truncate">{alt}</p>
                        <p className="text-xs text-gray-300 mt-1">
                            Click outside to close • Press Esc to close
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
