import { Link } from "@inertiajs/react";

export default function NavLink({
    active = false,
    className = "",
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none " +
                (active
                    ? "border-primary-400 dark:border-primary-600 text-secondary-900 dark:text-secondary-100 focus:border-primary-700 "
                    : "border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-700 focus:text-secondary-700 dark:focus:text-secondary-300 focus:border-secondary-300 dark:focus:border-secondary-700 ") +
                className
            }
        >
            {children}
        </Link>
    );
}
