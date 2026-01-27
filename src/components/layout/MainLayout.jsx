import { Outlet, NavLink } from 'react-router-dom';
import { Home, Ticket, User, QrCode } from 'lucide-react';
import { clsx } from 'clsx';
import { InstallPrompt } from '../ui/InstallPrompt';

import globalBg from '../../assets/fondo.png';

export default function MainLayout() {
    return (
        <div className="min-h-screen pb-20 md:pb-0 md:pl-64 transition-all relative overflow-hidden">

            {/* Global App Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src={globalBg}
                    alt="App Background"
                    className="w-full h-full object-cover opacity-100" // Adjust opacity if needed, user implies 'this background' so likely 100%
                />
            </div>

            {/* Sidebar Desktop */}
            <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-30">
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <span className="font-bold text-xl text-primary">AquaExpress</span>
                </div>
                <nav className="p-4 space-y-1">
                    <NavItmes />
                </nav>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 md:hidden z-30 pb-safe">
                <div className="flex justify-around items-center h-16">
                    <NavItmes mobile />
                </div>
            </nav>

            <main className="min-h-screen relative z-10">
                <Outlet />
            </main>

            <InstallPrompt />
        </div>
    );
}

function NavItmes({ mobile }) {
    const items = [
        { to: "/", icon: Home, label: "Inicio" },
        { to: "/cupones", icon: Ticket, label: "Cupones" },
        { to: "/qr", icon: QrCode, label: "QR", highlight: true },
        { to: "/perfil", icon: User, label: "Perfil" },
        { to: "/billetera", icon: User, label: "Billetera" }, // Added Wallet back
    ];

    return items.map((item) => (
        <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx(
                'flex items-center transition-colors',
                mobile
                    ? 'flex-col justify-center w-full h-full space-y-1'
                    : 'gap-3 px-4 py-3 rounded-xl',
                isActive
                    ? 'text-primary ' + (mobile ? '' : 'bg-primary/5')
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
                item.highlight && mobile && 'text-primary font-bold'
            )}
        >
            <item.icon className={clsx(mobile ? 'h-6 w-6' : 'h-5 w-5', item.highlight && mobile && '-mt-6 bg-primary text-white p-2 h-12 w-12 rounded-full shadow-lg shadow-primary/30 border-4 border-gray-50')} />
            <span className={clsx("text-xs md:text-sm font-medium", item.highlight && mobile && 'mt-1')}>{item.label}</span>
        </NavLink>
    ));
}
