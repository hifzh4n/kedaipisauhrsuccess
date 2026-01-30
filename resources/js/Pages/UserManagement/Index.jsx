import { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import { toast } from "@/utils/toast";

// Import modals
import AddUserModal from "./Partials/AddUserModal";
import EditUserModal from "./Partials/EditUserModal";
import DeleteUserModal from "./Partials/DeleteUserModal";

export default function Index({ auth, users, filters }) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState(filters.search || "");
    const [roleFilter, setRoleFilter] = useState(filters.role || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [isLoading, setIsLoading] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({
        top: 0,
        left: 0,
    });

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

    // Auto-search and auto-filter functionality
    useEffect(() => {
        setIsLoading(true);
        const timeoutId = setTimeout(() => {
            router.get(
                route("users.index"),
                {
                    search,
                    role: roleFilter,
                    status: statusFilter,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsLoading(false),
                }
            );
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [search, roleFilter, statusFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveDropdown(null);
        };

        if (activeDropdown) {
            document.addEventListener("click", handleClickOutside);
            return () =>
                document.removeEventListener("click", handleClickOutside);
        }
    }, [activeDropdown]);

    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleDelete = (user) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
    };

    const handleMakeAdmin = (user) => {
        router.patch(
            route("users.make-admin", user.id),
            {},
            {
                // Backend will handle success/error messages via flash
                onError: (errors) => {
                    // Only show frontend toast for validation errors
                    if (errors && Object.keys(errors).length > 0) {
                        toast.error("Failed to update user role");
                    }
                },
            }
        );
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case "admin":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            case "manager":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            default:
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "inactive":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                            User Management
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Manage users, roles, and account status
                        </p>
                    </div>
                    <PrimaryButton onClick={() => setShowAddModal(true)}>
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
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Add New User
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="User Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {/* Search and Filter Section */}
                            <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <InputLabel
                                            htmlFor="search"
                                            value="Search"
                                        />
                                        <TextInput
                                            id="search"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Search by name or email..."
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            htmlFor="role"
                                            value="Role"
                                        />
                                        <select
                                            id="role"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={roleFilter}
                                            onChange={(e) =>
                                                setRoleFilter(e.target.value)
                                            }
                                        >
                                            <option value="">All Roles</option>
                                            <option value="admin">Admin</option>
                                            <option value="staff">Staff</option>
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel
                                            htmlFor="status"
                                            value="Status"
                                        />
                                        <select
                                            id="status"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={statusFilter}
                                            onChange={(e) =>
                                                setStatusFilter(e.target.value)
                                            }
                                        >
                                            <option value="">All Status</option>
                                            <option value="active">
                                                Active
                                            </option>
                                            <option value="inactive">
                                                Inactive
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Users Table */}
                            <div className="relative">
                                <div
                                    className="overflow-x-auto -mx-4 sm:mx-0"
                                    style={{
                                        overflowY: "visible",
                                        overflowX: "auto",
                                    }}
                                >
                                    <div className="inline-block min-w-full align-middle">
                                        <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-700">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Name
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Email
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Role
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Created
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {users?.data?.length > 0 ? (
                                                        users.data.map(
                                                            (user) => (
                                                                <tr
                                                                    key={
                                                                        user.id
                                                                    }
                                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                >
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                            {
                                                                                user.name
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <div className="text-sm text-gray-900 dark:text-gray-100">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span
                                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(
                                                                                user.role
                                                                            )}`}
                                                                        >
                                                                            {
                                                                                user.role
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        <span
                                                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                                                                                user.status
                                                                            )}`}
                                                                        >
                                                                            {
                                                                                user.status
                                                                            }
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                        {new Date(
                                                                            user.created_at
                                                                        ).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        <div className="relative">
                                                                            <button
                                                                                data-dropdown-trigger={
                                                                                    user.id
                                                                                }
                                                                                onClick={(
                                                                                    e
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    if (
                                                                                        activeDropdown ===
                                                                                        user.id
                                                                                    ) {
                                                                                        setActiveDropdown(
                                                                                            null
                                                                                        );
                                                                                    } else {
                                                                                        setActiveDropdown(
                                                                                            user.id
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition ease-in-out duration-150"
                                                                            >
                                                                                <svg
                                                                                    className="w-5 h-5"
                                                                                    fill="currentColor"
                                                                                    viewBox="0 0 20 20"
                                                                                >
                                                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                                </svg>
                                                                            </button>

                                                                            {activeDropdown ===
                                                                                user.id && (
                                                                                <>
                                                                                    <div
                                                                                        className="fixed inset-0 z-10"
                                                                                        onClick={() =>
                                                                                            setActiveDropdown(
                                                                                                null
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                    <div
                                                                                        className="fixed z-[9999] w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
                                                                                        style={{
                                                                                            top: `${
                                                                                                document
                                                                                                    .querySelector(
                                                                                                        `[data-dropdown-trigger="${user.id}"]`
                                                                                                    )
                                                                                                    ?.getBoundingClientRect()
                                                                                                    .bottom +
                                                                                                4
                                                                                            }px`,
                                                                                            right: `${
                                                                                                window.innerWidth -
                                                                                                document
                                                                                                    .querySelector(
                                                                                                        `[data-dropdown-trigger="${user.id}"]`
                                                                                                    )
                                                                                                    ?.getBoundingClientRect()
                                                                                                    .right
                                                                                            }px`,
                                                                                        }}
                                                                                    >
                                                                                        <div className="py-1">
                                                                                            <button
                                                                                                onClick={(
                                                                                                    e
                                                                                                ) => {
                                                                                                    e.preventDefault();
                                                                                                    e.stopPropagation();
                                                                                                    setActiveDropdown(
                                                                                                        null
                                                                                                    );
                                                                                                    handleEdit(
                                                                                                        user
                                                                                                    );
                                                                                                }}
                                                                                                className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                                                                            >
                                                                                                Edit
                                                                                            </button>
                                                                                            {user.role !==
                                                                                                "admin" && (
                                                                                                <button
                                                                                                    onClick={(
                                                                                                        e
                                                                                                    ) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        setActiveDropdown(
                                                                                                            null
                                                                                                        );
                                                                                                        handleMakeAdmin(
                                                                                                            user
                                                                                                        );
                                                                                                    }}
                                                                                                    className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out"
                                                                                                >
                                                                                                    Make
                                                                                                    Admin
                                                                                                </button>
                                                                                            )}
                                                                                            <button
                                                                                                onClick={(
                                                                                                    e
                                                                                                ) => {
                                                                                                    e.preventDefault();
                                                                                                    e.stopPropagation();
                                                                                                    setActiveDropdown(
                                                                                                        null
                                                                                                    );
                                                                                                    handleDelete(
                                                                                                        user
                                                                                                    );
                                                                                                }}
                                                                                                disabled={
                                                                                                    user.id ===
                                                                                                    auth
                                                                                                        .user
                                                                                                        .id
                                                                                                }
                                                                                                className="block w-full px-4 py-2 text-start text-sm leading-5 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                            >
                                                                                                Delete
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan="6"
                                                                className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                                                            >
                                                                No users found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pagination */}
                            {users?.links && (
                                <div className="mt-6 flex justify-between items-center">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Showing {users.from} to {users.to} of{" "}
                                        {users.total} results
                                    </div>
                                    <div className="flex gap-1">
                                        {users.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    if (link.url) {
                                                        const url = new URL(
                                                            link.url
                                                        );
                                                        const page =
                                                            url.searchParams.get(
                                                                "page"
                                                            );
                                                        router.get(
                                                            route(
                                                                "users.index"
                                                            ),
                                                            {
                                                                search: search,
                                                                role: roleFilter,
                                                                status: statusFilter,
                                                                page: page,
                                                            },
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
                                                        ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
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

            {/* Modals */}
            <AddUserModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
            />

            <EditUserModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                user={selectedUser}
            />

            <DeleteUserModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                user={selectedUser}
            />
        </AuthenticatedLayout>
    );
}
