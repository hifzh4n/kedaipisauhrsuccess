import { useState } from "react";
import { useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import { toast, toastUtils } from "@/utils/toast";

export default function AddItemModal({
    show,
    onClose,
    brands,
    models,
    colors,
    onDataAdded = null, // Add callback prop to notify parent of new data
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        item_id: "",
        sku_id: "",
        barcode: "",
        item_name: "",
        brand: "",
        model: "",
        color: "",
        description: "",
        picture: null,
        cost_price: "",
        retail_price: "",
    });

    const [filteredModels, setFilteredModels] = useState([]);
    const [filteredColors, setFilteredColors] = useState([]);

    const submit = (e) => {
        e.preventDefault();

        console.log("Add Item Form Data:", data);

        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== null) {
                formData.append(key, data[key]);
                console.log(`FormData ${key}:`, data[key]);
            }
        });

        console.log("Submitting to:", route("items.store"));

        post(route("items.store"), {
            data: formData,
            forceFormData: true,
            onSuccess: (response) => {
                console.log("Add item success:", response);
                // Backend handles success message via flash
                reset();
                onClose();
            },
            onError: (errors) => {
                console.error("Add item errors:", errors);
                console.error(
                    "Add item errors details:",
                    JSON.stringify(errors, null, 2)
                );
            },
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleBrandChange = (brandName) => {
        setData("brand", brandName);
        setData("model", ""); // Reset model when brand changes
        setData("color", ""); // Reset color when brand changes

        // Filter models based on selected brand
        const brand = brands.find((b) => (b.name || b) === brandName);
        if (brand) {
            const brandId = brand.id || brand;
            const brandModels = models.filter(
                (m) => m.brand_id === brandId || m.brand === brandName
            );
            setFilteredModels(brandModels);
        } else {
            setFilteredModels([]);
        }

        // Clear filtered colors since model is reset
        setFilteredColors([]);
    };

    const handleModelChange = (modelName) => {
        setData("model", modelName);
        setData("color", ""); // Reset color when model changes

        // Filter colors based on selected brand and model
        const brand = brands.find((b) => (b.name || b) === data.brand);
        const model = models.find((m) => (m.name || m) === modelName);

        if (brand && model) {
            const brandId = brand.id || brand;
            const modelId = model.id || model;
            const modelColors = colors.filter(
                (c) =>
                    (c.brand_id === brandId || c.brand === data.brand) &&
                    (c.model_id === modelId || c.model === modelName)
            );
            setFilteredColors(modelColors);
        } else {
            setFilteredColors([]);
        }
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="4xl">
            <div className="modal-content">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Add New Item
                    </h2>
                </div>

                <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
                    <div className="modal-body px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Item ID */}
                            <div>
                                <InputLabel htmlFor="item_id" value="Item ID" />
                                <TextInput
                                    id="item_id"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.item_id}
                                    onChange={(e) =>
                                        setData("item_id", e.target.value)
                                    }
                                    required
                                    placeholder="e.g., ITM-000001"
                                />
                                <InputError
                                    message={errors.item_id}
                                    className="mt-2"
                                />
                            </div>

                            {/* SKU ID */}
                            <div>
                                <InputLabel htmlFor="sku_id" value="SKU ID" />
                                <TextInput
                                    id="sku_id"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.sku_id}
                                    onChange={(e) =>
                                        setData("sku_id", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.sku_id}
                                    className="mt-2"
                                />
                            </div>

                            {/* Barcode */}
                            <div>
                                <InputLabel htmlFor="barcode" value="Barcode" />
                                <TextInput
                                    id="barcode"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.barcode}
                                    onChange={(e) =>
                                        setData("barcode", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.barcode}
                                    className="mt-2"
                                />
                            </div>

                            {/* Item Name */}
                            <div>
                                <InputLabel
                                    htmlFor="item_name"
                                    value="Item Name"
                                />
                                <TextInput
                                    id="item_name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.item_name}
                                    onChange={(e) =>
                                        setData("item_name", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.item_name}
                                    className="mt-2"
                                />
                            </div>

                            {/* Brand */}
                            <div>
                                <InputLabel htmlFor="brand" value="Brand" />
                                <select
                                    id="brand"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.brand}
                                    onChange={(e) => handleBrandChange(e.target.value)}
                                    required
                                >
                                    <option value="">Select Brand</option>
                                    {brands.map((brand) => (
                                        <option
                                            key={brand.id || brand}
                                            value={brand.name || brand}
                                        >
                                            {brand.name || brand}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.brand}
                                    className="mt-2"
                                />
                            </div>

                            {/* Model */}
                            <div>
                                <InputLabel htmlFor="model" value="Model" />
                                <select
                                    id="model"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.model}
                                    onChange={(e) =>
                                        handleModelChange(e.target.value)
                                    }
                                    required
                                    disabled={!data.brand}
                                >
                                    <option value="">
                                        {!data.brand
                                            ? "Select Brand First"
                                            : "Select Model"}
                                    </option>
                                    {filteredModels.map((model) => (
                                        <option
                                            key={model.id || model}
                                            value={model.name || model}
                                        >
                                            {model.name || model}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.model}
                                    className="mt-2"
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <InputLabel htmlFor="color" value="Color" />
                                <select
                                    id="color"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.color}
                                    onChange={(e) =>
                                        setData("color", e.target.value)
                                    }
                                    required
                                    disabled={!data.model}
                                >
                                    <option value="">
                                        {!data.model
                                            ? "Select Model First"
                                            : "Select Color"}
                                    </option>
                                    {filteredColors.map((color) => (
                                        <option
                                            key={color.id || color}
                                            value={color.name || color}
                                        >
                                            {color.name || color}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.color}
                                    className="mt-2"
                                />
                            </div>

                            {/* Picture */}
                            <div>
                                <InputLabel
                                    htmlFor="picture"
                                    value="Item Picture"
                                />
                                <input
                                    id="picture"
                                    type="file"
                                    accept="image/*"
                                    className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={(e) =>
                                        setData("picture", e.target.files[0])
                                    }
                                />
                                <InputError
                                    message={errors.picture}
                                    className="mt-2"
                                />
                            </div>

                            {/* Cost Price */}
                            <div>
                                <InputLabel
                                    htmlFor="cost_price"
                                    value="Cost Price (RM)"
                                />
                                <TextInput
                                    id="cost_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full"
                                    value={data.cost_price}
                                    onChange={(e) =>
                                        setData("cost_price", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.cost_price}
                                    className="mt-2"
                                />
                            </div>

                            {/* Retail Price */}
                            <div>
                                <InputLabel
                                    htmlFor="retail_price"
                                    value="Retail Price (RM)"
                                />
                                <TextInput
                                    id="retail_price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="mt-1 block w-full"
                                    value={data.retail_price}
                                    onChange={(e) =>
                                        setData("retail_price", e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.retail_price}
                                    className="mt-2"
                                />
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <InputLabel
                                    htmlFor="description"
                                    value="Description"
                                />
                                <textarea
                                    id="description"
                                    rows="3"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    placeholder="Enter item description..."
                                    required
                                />
                                <InputError
                                    message={errors.description}
                                    className="mt-2"
                                />
                            </div>
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
                            <PrimaryButton disabled={processing}>
                                {processing ? "Adding..." : "Add Item"}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
