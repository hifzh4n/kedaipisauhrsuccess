import { useState } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

export default function ImportItemModal({ show, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
    });

    const submit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("file", data.file);

        post(route("items.bulk-import"), {
            data: formData,
            forceFormData: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="4xl">
            <div className="flex flex-col max-h-[90vh]">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Import Items from CSV
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Upload a CSV file to bulk import items. Download the
                        template below to get started.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="flex flex-col flex-1 min-h-0"
                >
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                        📄 CSV Template
                                    </p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                        Download this template with sample data
                                        and required columns
                                    </p>
                                </div>
                                <a
                                    href={route("items.download-template")}
                                    className="inline-flex items-center px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600 dark:hover:bg-blue-700"
                                >
                                    <svg
                                        className="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    Download Template
                                </a>
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="file" value="CSV File" />
                            <input
                                id="file"
                                type="file"
                                accept=".csv,.txt"
                                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={(e) =>
                                    setData("file", e.target.files[0])
                                }
                                required
                            />
                            <InputError
                                message={errors.file}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-end gap-4">
                            <SecondaryButton
                                onClick={handleClose}
                                disabled={processing}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton disabled={processing || !data.file}>
                                {processing ? "Importing..." : "Import Items"}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
