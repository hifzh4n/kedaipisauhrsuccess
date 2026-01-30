import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";
import { Toaster } from "sonner";

export default function Guest({ children }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-6 sm:py-0 bg-secondary-50 dark:bg-secondary-900">
            <div>
                <Link href="/">
                    <ApplicationLogo className="w-20 h-20 fill-current text-gray-500" />
                </Link>
            </div>

            <div className="w-full sm:max-w-md mt-6 px-6 py-4 bg-white dark:bg-secondary-800 shadow-md overflow-hidden sm:rounded-lg">
                {children}
            </div>
            <Toaster
                position="bottom-left"
                richColors
                closeButton={false}
                duration={4000}
                toastOptions={{
                    style: {
                        background: "rgb(255 255 255)", // White background for light mode
                        color: "rgb(17 24 39)", // Gray-900 text for light mode
                        border: "1px solid rgb(229 231 235)", // Gray-200 border for light mode
                        fontFamily: "Poppins, sans-serif",
                    },
                    className: "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600", // Dark mode classes
                }}
            />
        </div>
    );
}
