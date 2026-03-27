import { toast as sonnerToast } from "sonner";

/**
 * Custom toast utility using Sonner
 * Provides consistent toast notifications throughout the application
 */
export const toast = {
    /**
     * Show a success toast
     * @param {string} message - The success message to display
     * @param {object} options - Additional options for the toast
     */
    success: (message, options = {}) => {
        return sonnerToast.success(message, {
            duration: 4000,
            style: {
                fontFamily: "Poppins, sans-serif",
                background: "rgb(34 197 94)", // Green-500 for success
                color: "rgb(255 255 255)", // White text
                border: "1px solid rgb(22 163 74)", // Green-600 border
                ...options.style,
            },
            className: "dark:bg-green-600 dark:border-green-700",
            ...options,
        });
    },

    /**
     * Show an error toast
     * @param {string} message - The error message to display
     * @param {object} options - Additional options for the toast
     */
    error: (message, options = {}) => {
        return sonnerToast.error(message, {
            duration: 6000, // Longer duration for errors
            style: {
                fontFamily: "Poppins, sans-serif",
                background: "rgb(239 68 68)", // Red-500 for error
                color: "rgb(255 255 255)", // White text
                border: "1px solid rgb(220 38 38)", // Red-600 border
                ...options.style,
            },
            className: "dark:bg-red-600 dark:border-red-700",
            ...options,
        });
    },

    /**
     * Show an info toast
     * @param {string} message - The info message to display
     * @param {object} options - Additional options for the toast
     */
    info: (message, options = {}) => {
        return sonnerToast.info(message, {
            duration: 4000,
            style: {
                fontFamily: "Poppins, sans-serif",
                background: "rgb(59 130 246)", // Blue-500 for info
                color: "rgb(255 255 255)", // White text
                border: "1px solid rgb(37 99 235)", // Blue-600 border
                ...options.style,
            },
            className: "dark:bg-blue-600 dark:border-blue-700",
            ...options,
        });
    },

    /**
     * Show a warning toast
     * @param {string} message - The warning message to display
     * @param {object} options - Additional options for the toast
     */
    warning: (message, options = {}) => {
        return sonnerToast.warning(message, {
            duration: 5000,
            style: {
                fontFamily: "Poppins, sans-serif",
                background: "rgb(245 158 11)", // Amber-500 for warning
                color: "rgb(17 24 39)", // Gray-900 text
                border: "1px solid rgb(217 119 6)", // Amber-600 border
                ...options.style,
            },
            className: "dark:bg-amber-600 dark:text-white dark:border-amber-700",
            ...options,
        });
    },

    /**
     * Show a loading toast
     * @param {string} message - The loading message to display
     * @param {object} options - Additional options for the toast
     */
    loading: (message, options = {}) => {
        return sonnerToast.loading(message, {
            duration: Infinity, // Loading toasts should persist until dismissed
            style: {
                fontFamily: "Poppins, sans-serif",
                background: "rgb(107 114 128)", // Gray-500 for loading
                color: "rgb(255 255 255)", // White text
                border: "1px solid rgb(75 85 99)", // Gray-600 border
                ...options.style,
            },
            className: "dark:bg-gray-600 dark:border-gray-700",
            ...options,
        });
    },

    /**
     * Show a promise toast that automatically updates based on promise state
     * @param {Promise} promise - The promise to track
     * @param {object} messages - Messages for different states
     * @param {object} options - Additional options for the toast
     */
    promise: (promise, messages, options = {}) => {
        return sonnerToast.promise(promise, {
            loading: messages.loading || "Loading...",
            success: messages.success || "Success!",
            error: messages.error || "Something went wrong!",
            style: {
                fontFamily: "Poppins, sans-serif",
                background: "rgb(255 255 255)", // White background
                color: "rgb(17 24 39)", // Gray-900 text
                border: "1px solid rgb(229 231 235)", // Gray-200 border
                ...options.style,
            },
            className: "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
            ...options,
        });
    },

    /**
     * Dismiss a specific toast
     * @param {string} toastId - The ID of the toast to dismiss
     */
    dismiss: (toastId) => {
        return sonnerToast.dismiss(toastId);
    },

    /**
     * Dismiss all toasts
     */
    dismissAll: () => {
        return sonnerToast.dismiss();
    },

    /**
     * Show a custom toast with full control
     * @param {string} message - The message to display
     * @param {object} options - All toast options
     */
    custom: (message, options = {}) => {
        return sonnerToast(message, {
            style: {
                fontFamily: "Poppins, sans-serif",
                background: "rgb(255 255 255)", // White background
                color: "rgb(17 24 39)", // Gray-900 text
                border: "1px solid rgb(229 231 235)", // Gray-200 border
                ...options.style,
            },
            className: "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
            ...options,
        });
    },
};

/**
 * Utility functions for common toast patterns
 */
export const toastUtils = {
    /**
     * Show a toast for API success responses
     * @param {string} action - The action that was performed (e.g., 'created', 'updated', 'deleted')
     * @param {string} resource - The resource that was affected (e.g., 'item', 'user', 'stock')
     */
    apiSuccess: (action, resource) => {
        const message = `${
            resource.charAt(0).toUpperCase() + resource.slice(1)
        } ${action} successfully!`;
        return toast.success(message);
    },

    /**
     * Show a toast for API error responses
     * @param {string} action - The action that failed (e.g., 'create', 'update', 'delete')
     * @param {string} resource - The resource that was affected (e.g., 'item', 'user', 'stock')
     * @param {string} error - Optional specific error message
     */
    apiError: (action, resource, error = null) => {
        const baseMessage = `Failed to ${action} ${resource}`;
        const message = error
            ? `${baseMessage}: ${error}`
            : `${baseMessage}. Please try again.`;
        return toast.error(message);
    },

    /**
     * Show a validation error toast
     * @param {object} errors - Validation errors object
     */
    validationError: (errors) => {
        if (typeof errors === "string") {
            return toast.error(errors);
        }

        if (typeof errors === "object" && errors !== null) {
            const firstError = Object.values(errors)[0];
            const message = Array.isArray(firstError)
                ? firstError[0]
                : firstError;
            return toast.error(
                message || "Please check your input and try again."
            );
        }

        return toast.error("Please check your input and try again.");
    },

    /**
     * Show a network error toast
     */
    networkError: () => {
        return toast.error(
            "Network error. Please check your connection and try again."
        );
    },

    /**
     * Show an unauthorized error toast
     */
    unauthorized: () => {
        return toast.error("You are not authorized to perform this action.");
    },

    /**
     * Show a server error toast
     */
    serverError: () => {
        return toast.error("Server error. Please try again later.");
    },

    /**
     * Show a confirmation toast with action buttons
     * @param {string} message - The confirmation message
     * @param {function} onConfirm - Function to call when confirmed
     * @param {object} options - Additional options
     */
    confirm: (message, onConfirm, options = {}) => {
        return toast(message, {
            duration: Infinity,
            action: {
                label: options.confirmLabel || "Confirm",
                onClick: () => {
                    onConfirm();
                    toast.dismiss();
                },
            },
            cancel: {
                label: options.cancelLabel || "Cancel",
                onClick: () => toast.dismiss(),
            },
            ...options,
        });
    },

    /**
     * Show a destructive action confirmation
     * @param {string} message - The confirmation message
     * @param {function} onConfirm - Function to call when confirmed
     * @param {object} options - Additional options
     */
    confirmDelete: (message, onConfirm, options = {}) => {
        return toastUtils.confirm(message, onConfirm, {
            confirmLabel: "Delete",
            cancelLabel: "Cancel",
            style: {
                background: "#fee2e2",
                color: "#991b1b",
                border: "1px solid #fecaca",
            },
            ...options,
        });
    },
};

export default toast;
