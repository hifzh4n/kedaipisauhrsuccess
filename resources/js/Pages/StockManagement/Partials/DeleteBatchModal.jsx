import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function DeleteBatchModal({ show, onClose, batch, onConfirm, processing }) {
    if (!batch) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Delete Batch
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this batch? This action cannot be undone.
                </p>

                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {batch.item_name}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                            Batch Number: {batch.batch_number}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                            Item ID: {batch.item_id}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                            Quantity Remaining: {batch.quantity_remaining}
                        </div>
                        <div className="mt-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                batch.quantity_remaining > 0
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                                {batch.quantity_remaining > 0 ? 'Has Stock' : 'Empty'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4">
                    <SecondaryButton onClick={onClose}>
                        Cancel
                    </SecondaryButton>

                    <DangerButton 
                        onClick={onConfirm}
                        disabled={processing || batch.quantity_remaining > 0}
                    >
                        {processing ? "Deleting..." : "Delete Batch"}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}
