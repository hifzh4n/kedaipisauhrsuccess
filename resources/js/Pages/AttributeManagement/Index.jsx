import { useState, useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";
import { toast } from "@/utils/toast";

export default function Index({ auth, brands, models, colors, allBrands, allModels, activeTab: initialActiveTab }) {
    console.log("Attribute Management Data:", { brands, models, colors });

    const [activeTab, setActiveTab] = useState(initialActiveTab || "brands");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        brand_id: "",
        model_id: "",
    });
    const [errors, setErrors] = useState({});

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

    const resetForm = () => {
        setFormData({
            name: "",
            brand_id: "",
            model_id: "",
        });
        setErrors({});
    };

    const handleAdd = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({
            name: item.name,
            brand_id: item.brand_id || "",
            model_id: item.model_id || "",
        });
        setErrors({});
        setShowEditModal(true);
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const handleSubmitAdd = (e) => {
        e.preventDefault();
        setIsLoading(true);

        let endpoint = "";
        let data = { name: formData.name };

        if (activeTab === "brands") {
            endpoint = route("attributes.brands.store");
        } else if (activeTab === "models") {
            endpoint = route("attributes.models.store");
            data.brand_id = formData.brand_id;
        } else if (activeTab === "colors") {
            endpoint = route("attributes.colors.store");
            data.brand_id = formData.brand_id;
            data.model_id = formData.model_id;
        }

        router.post(endpoint, data, {
            onSuccess: () => {
                setShowAddModal(false);
                resetForm();
                setIsLoading(false);
            },
            onError: (errors) => {
                setErrors(errors);
                setIsLoading(false);
            },
        });
    };

    const handleSubmitEdit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        let endpoint = "";
        let data = { name: formData.name };

        if (activeTab === "brands") {
            endpoint = route("attributes.brands.update", selectedItem.id);
        } else if (activeTab === "models") {
            endpoint = route("attributes.models.update", selectedItem.id);
            data.brand_id = formData.brand_id;
        } else if (activeTab === "colors") {
            endpoint = route("attributes.colors.update", selectedItem.id);
            data.brand_id = formData.brand_id;
            data.model_id = formData.model_id;
        }

        router.put(endpoint, data, {
            onSuccess: () => {
                setShowEditModal(false);
                resetForm();
                setSelectedItem(null);
                setIsLoading(false);
            },
            onError: (errors) => {
                setErrors(errors);
                setIsLoading(false);
            },
        });
    };

    const handleSubmitDelete = () => {
        setIsLoading(true);

        let endpoint = "";

        if (activeTab === "brands") {
            endpoint = route("attributes.brands.destroy", selectedItem.id);
        } else if (activeTab === "models") {
            endpoint = route("attributes.models.destroy", selectedItem.id);
        } else if (activeTab === "colors") {
            endpoint = route("attributes.colors.destroy", selectedItem.id);
        }

        router.delete(endpoint, {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedItem(null);
                setIsLoading(false);
            },
            onError: (errors) => {
                console.error("Delete errors:", errors);
                setIsLoading(false);
            },
        });
    };

    const getFilteredModels = (brandId) => {
        return allModels.filter((model) => model.brand_id == brandId);
    };

    const getFilteredColors = (brandId, modelId) => {
        return colors.filter(
            (color) => color.brand_id == brandId && color.model_id == modelId
        );
    };

    const getCurrentData = () => {
        if (activeTab === "brands") return brands.data || brands;
        if (activeTab === "models") return models.data || models;
        if (activeTab === "colors") return colors.data || colors;
        return [];
    };

    const getCurrentPagination = () => {
        if (activeTab === "brands") return brands;
        if (activeTab === "models") return models;
        if (activeTab === "colors") return colors;
        return null;
    };

    const getTabTitle = () => {
        if (activeTab === "brands") return "Brands";
        if (activeTab === "models") return "Models";
        if (activeTab === "colors") return "Colors";
        return "";
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            Attribute Management
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Manage brands, models, and colors for your items
                        </p>
                    </div>

                    <PrimaryButton onClick={handleAdd}>
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
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        Add {getTabTitle().slice(0, -1)}
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Attribute Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        {/* Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8 px-6">
                                {["brands", "models", "colors"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            // Switch tabs and reset pagination
                                            router.get(
                                                route("attributes.index"),
                                                { tab: tab },
                                                {
                                                    preserveState: false,
                                                    preserveScroll: false,
                                                }
                                            );
                                        }}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                                            activeTab === tab
                                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Name
                                            </th>
                                            {activeTab === "models" && (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Brand
                                                </th>
                                            )}
                                            {activeTab === "colors" && (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Brand
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Model
                                                    </th>
                                                </>
                                            )}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {getCurrentData().map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {item.name}
                                                </td>
                                                {activeTab === "models" && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {item.brand?.name ||
                                                            "N/A"}
                                                    </td>
                                                )}
                                                {activeTab === "colors" && (
                                                    <>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {item.brand?.name ||
                                                                "N/A"}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {item.model?.name ||
                                                                "N/A"}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <SecondaryButton
                                                        onClick={() =>
                                                            handleEdit(item)
                                                        }
                                                        className="text-xs"
                                                    >
                                                        Edit
                                                    </SecondaryButton>
                                                    <DangerButton
                                                        onClick={() =>
                                                            handleDelete(item)
                                                        }
                                                        className="text-xs"
                                                    >
                                                        Delete
                                                    </DangerButton>
                                                </td>
                                            </tr>
                                        ))}
                                        {getCurrentData().length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        activeTab === "brands"
                                                            ? 2
                                                            : activeTab ===
                                                              "models"
                                                            ? 3
                                                            : 4
                                                    }
                                                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                                >
                                                    No {activeTab} found. Click
                                                    "Add{" "}
                                                    {getTabTitle().slice(0, -1)}
                                                    " to create one.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {getCurrentPagination()?.links && (
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Showing {getCurrentPagination().from} to {getCurrentPagination().to} of{" "}
                                        {getCurrentPagination().total} results
                                    </div>
                                    <div className="flex gap-1">
                                        {getCurrentPagination().links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (link.url) {
                                                        const url = new URL(link.url);
                                                        const page = url.searchParams.get("page");
                                                        router.get(
                                                            route("attributes.index"),
                                                            { page: page },
                                                            {
                                                                preserveState: true,
                                                                preserveScroll: true,
                                                            }
                                                        );
                                                    }
                                                }}
                                                disabled={!link.url}
                                                className={`px-3 py-2 text-sm rounded ${
                                                    link.active
                                                        ? "bg-indigo-500 text-white"
                                                        : link.url
                                                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                        : "text-gray-400 cursor-not-allowed"
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <Modal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Add New {getTabTitle().slice(0, -1)}
                    </h3>

                    <form onSubmit={handleSubmitAdd} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="name" value="Name" />
                            <TextInput
                                id="name"
                                type="text"
                                className="mt-1 block w-full"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                required
                                placeholder={`Enter ${activeTab.slice(
                                    0,
                                    -1
                                )} name`}
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>

                        {(activeTab === "models" || activeTab === "colors") && (
                            <div>
                                <InputLabel htmlFor="brand_id" value="Brand" />
                                <select
                                    id="brand_id"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={formData.brand_id}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            brand_id: e.target.value,
                                            model_id: "", // Reset model when brand changes
                                        });
                                    }}
                                    required
                                >
                                    <option value="">Select Brand</option>
                                    {allBrands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.brand_id}
                                    className="mt-2"
                                />
                            </div>
                        )}

                        {activeTab === "colors" && (
                            <div>
                                <InputLabel htmlFor="model_id" value="Model" />
                                <select
                                    id="model_id"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={formData.model_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            model_id: e.target.value,
                                        })
                                    }
                                    required
                                    disabled={!formData.brand_id}
                                >
                                    <option value="">
                                        {!formData.brand_id
                                            ? "Select Brand First"
                                            : "Select Model"}
                                    </option>
                                    {formData.brand_id &&
                                        getFilteredModels(
                                            formData.brand_id
                                        ).map((model) => (
                                            <option
                                                key={model.id}
                                                value={model.id}
                                            >
                                                {model.name}
                                            </option>
                                        ))}
                                </select>
                                <InputError
                                    message={errors.model_id}
                                    className="mt-2"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={isLoading}>
                                {isLoading
                                    ? "Adding..."
                                    : `Add ${getTabTitle().slice(0, -1)}`}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Edit {getTabTitle().slice(0, -1)}
                    </h3>

                    <form onSubmit={handleSubmitEdit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="edit_name" value="Name" />
                            <TextInput
                                id="edit_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                required
                                placeholder={`Enter ${activeTab.slice(
                                    0,
                                    -1
                                )} name`}
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>

                        {(activeTab === "models" || activeTab === "colors") && (
                            <div>
                                <InputLabel
                                    htmlFor="edit_brand_id"
                                    value="Brand"
                                />
                                <select
                                    id="edit_brand_id"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={formData.brand_id}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            brand_id: e.target.value,
                                            model_id:
                                                activeTab === "colors"
                                                    ? ""
                                                    : formData.model_id,
                                        });
                                    }}
                                    required
                                >
                                    <option value="">Select Brand</option>
                                    {allBrands.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.brand_id}
                                    className="mt-2"
                                />
                            </div>
                        )}

                        {activeTab === "colors" && (
                            <div>
                                <InputLabel
                                    htmlFor="edit_model_id"
                                    value="Model"
                                />
                                <select
                                    id="edit_model_id"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={formData.model_id}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            model_id: e.target.value,
                                        })
                                    }
                                    required
                                    disabled={!formData.brand_id}
                                >
                                    <option value="">
                                        {!formData.brand_id
                                            ? "Select Brand First"
                                            : "Select Model"}
                                    </option>
                                    {formData.brand_id &&
                                        getFilteredModels(
                                            formData.brand_id
                                        ).map((model) => (
                                            <option
                                                key={model.id}
                                                value={model.id}
                                            >
                                                {model.name}
                                            </option>
                                        ))}
                                </select>
                                <InputError
                                    message={errors.model_id}
                                    className="mt-2"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={isLoading}>
                                {isLoading
                                    ? "Updating..."
                                    : `Update ${getTabTitle().slice(0, -1)}`}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center mb-6">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg
                                className="h-6 w-6 text-red-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Delete {getTabTitle().slice(0, -1)}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                This action cannot be undone
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Are you sure you want to delete "
                            {selectedItem?.name}"?
                            {activeTab === "brands" &&
                                " This will also delete all associated models and colors."}
                            {activeTab === "models" &&
                                " This will also delete all associated colors."}
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <SecondaryButton
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton
                            onClick={handleSubmitDelete}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? "Deleting..."
                                : `Delete ${getTabTitle().slice(0, -1)}`}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
