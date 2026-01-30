import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import DatabaseBackupForm from './Partials/DatabaseBackupForm';
import { Head } from '@inertiajs/react';

export default function Edit({ auth, mustVerifyEmail, status, databaseBackups = [] }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<div><h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Profile</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your personal information and account settings</p></div>}
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <DatabaseBackupForm 
                            databaseBackups={databaseBackups || []} 
                            className="max-w-4xl" 
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
