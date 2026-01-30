import React from 'react';
import { toast, toastUtils } from '@/utils/toast';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

/**
 * Demo component to showcase all toast notification types
 * This can be used for testing and as a reference for developers
 */
export default function ToastDemo() {
    const handleSuccessToast = () => {
        toast.success('Operation completed successfully!');
    };

    const handleErrorToast = () => {
        toast.error('Something went wrong. Please try again.');
    };

    const handleInfoToast = () => {
        toast.info('Here is some useful information for you.');
    };

    const handleWarningToast = () => {
        toast.warning('Please check your input before proceeding.');
    };

    const handleLoadingToast = () => {
        const loadingToast = toast.loading('Processing your request...');
        
        // Simulate async operation
        setTimeout(() => {
            toast.dismiss(loadingToast);
            toast.success('Request processed successfully!');
        }, 3000);
    };

    const handlePromiseToast = () => {
        const mockApiCall = new Promise((resolve, reject) => {
            setTimeout(() => {
                Math.random() > 0.5 ? resolve('Success!') : reject(new Error('Failed!'));
            }, 2000);
        });

        toast.promise(mockApiCall, {
            loading: 'Saving data...',
            success: 'Data saved successfully!',
            error: 'Failed to save data. Please try again.',
        });
    };

    const handleApiSuccessToast = () => {
        toastUtils.apiSuccess('created', 'item');
    };

    const handleApiErrorToast = () => {
        toastUtils.apiError('create', 'item', 'Validation failed');
    };

    const handleValidationErrorToast = () => {
        const errors = {
            name: ['The name field is required.'],
            email: ['The email field must be a valid email address.']
        };
        toastUtils.validationError(errors);
    };

    const handleNetworkErrorToast = () => {
        toastUtils.networkError();
    };

    const handleUnauthorizedToast = () => {
        toastUtils.unauthorized();
    };

    const handleServerErrorToast = () => {
        toastUtils.serverError();
    };

    const handleCustomToast = () => {
        toast.custom('This is a custom toast with special styling!', {
            duration: 5000,
            style: {
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                color: 'white',
                fontWeight: 'bold',
            },
        });
    };

    const handleDismissAll = () => {
        toast.dismissAll();
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Toast Notification Demo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Basic Toast Types */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Basic Types
                    </h3>
                    <PrimaryButton onClick={handleSuccessToast} className="w-full">
                        Success Toast
                    </PrimaryButton>
                    <SecondaryButton onClick={handleErrorToast} className="w-full">
                        Error Toast
                    </SecondaryButton>
                    <SecondaryButton onClick={handleInfoToast} className="w-full">
                        Info Toast
                    </SecondaryButton>
                    <SecondaryButton onClick={handleWarningToast} className="w-full">
                        Warning Toast
                    </SecondaryButton>
                </div>

                {/* Advanced Toast Types */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Advanced Types
                    </h3>
                    <SecondaryButton onClick={handleLoadingToast} className="w-full">
                        Loading Toast
                    </SecondaryButton>
                    <SecondaryButton onClick={handlePromiseToast} className="w-full">
                        Promise Toast
                    </SecondaryButton>
                    <SecondaryButton onClick={handleCustomToast} className="w-full">
                        Custom Toast
                    </SecondaryButton>
                </div>

                {/* Utility Toast Types */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Utility Types
                    </h3>
                    <SecondaryButton onClick={handleApiSuccessToast} className="w-full">
                        API Success
                    </SecondaryButton>
                    <SecondaryButton onClick={handleApiErrorToast} className="w-full">
                        API Error
                    </SecondaryButton>
                    <SecondaryButton onClick={handleValidationErrorToast} className="w-full">
                        Validation Error
                    </SecondaryButton>
                    <SecondaryButton onClick={handleNetworkErrorToast} className="w-full">
                        Network Error
                    </SecondaryButton>
                    <SecondaryButton onClick={handleUnauthorizedToast} className="w-full">
                        Unauthorized
                    </SecondaryButton>
                    <SecondaryButton onClick={handleServerErrorToast} className="w-full">
                        Server Error
                    </SecondaryButton>
                </div>
            </div>

            {/* Control Buttons */}
            <div className="mt-6 flex justify-center">
                <SecondaryButton onClick={handleDismissAll}>
                    Dismiss All Toasts
                </SecondaryButton>
            </div>

            {/* Usage Examples */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Usage Examples
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p><code>toast.success('Success message')</code></p>
                    <p><code>toast.error('Error message')</code></p>
                    <p><code>toastUtils.apiSuccess('created', 'item')</code></p>
                    <p><code>toastUtils.validationError(errors)</code></p>
                </div>
            </div>
        </div>
    );
}
