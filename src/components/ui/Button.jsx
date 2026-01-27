import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ className, variant = 'primary', size = 'default', children, ...props }) {
    const variants = {
        primary: 'bg-primary hover:bg-sky-600 text-white shadow-lg shadow-primary/30',
        secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
        outline: 'border-2 border-primary text-primary hover:bg-primary/5',
        ghost: 'hover:bg-gray-100 text-gray-700',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
    };

    const sizes = {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10 p-2 flex items-center justify-center',
    };

    return (
        <button
            className={twMerge(
                'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
