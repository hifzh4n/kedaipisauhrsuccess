import { useForm } from "@inertiajs/react";
import { useEffect } from "react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";

export default function EditUserModal({ show, onClose, user }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        first_name: "",
        last_name: "",
    });

    useEffect(() => {
        if (user) {
            setData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
            });
        }
    }, [user, setData]);

    const submit = (e) => {
        e.preventDefault();

        patch(route("users.update", user.id), {
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

    if (!user) return null;

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Edit User
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update the user's information. Email cannot be changed.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <InputLabel
                                htmlFor="edit_first_name"
                                value="First Name"
                            />

                            <TextInput
                                id="edit_first_name"
                                className="mt-1 block w-full"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData("first_name", e.target.value)
                                }
                                required
                                isFocused
                                autoComplete="given-name"
                            />

                            <InputError
                                className="mt-2"
                                message={errors.first_name}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="edit_last_name"
                                value="Last Name"
                            />

                            <TextInput
                                id="edit_last_name"
                                className="mt-1 block w-full"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData("last_name", e.target.value)
                                }
                                required
                                autoComplete="family-name"
                            />

                            <InputError
                                className="mt-2"
                                message={errors.last_name}
                            />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="edit_email" value="Email" />

                        <TextInput
                            id="edit_email"
                            type="email"
                            className="mt-1 block w-full bg-gray-50 dark:bg-gray-700"
                            value={user.email}
                            disabled
                            autoComplete="username"
                        />

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Email address cannot be changed.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <SecondaryButton onClick={handleClose}>
                            Cancel
                        </SecondaryButton>

                        <PrimaryButton disabled={processing}>
                            {processing ? "Updating..." : "Update User"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
