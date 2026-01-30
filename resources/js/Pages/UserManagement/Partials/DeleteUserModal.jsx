import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function DeleteUserModal({ show, onClose, user }) {
    const { delete: destroy, processing } = useForm();

    const submit = (e) => {
        e.preventDefault();

        destroy(route('users.destroy', user.id), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    if (!user) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Delete User
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this user? This action cannot be undone.
                </p>

                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                            {user.email}
                        </div>
                        <div className="mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                                {user.role}
                            </span>
                            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.status === 'active'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {user.status}
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="mt-6">
                    <div className="flex items-center justify-end gap-4">
                        <SecondaryButton onClick={onClose}>
                            Cancel
                        </SecondaryButton>

                        <DangerButton disabled={processing}>
                            {processing ? "Deleting..." : "Delete User"}
                        </DangerButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
