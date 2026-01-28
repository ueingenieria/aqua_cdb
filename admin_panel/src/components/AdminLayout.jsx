import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Newspaper, Send, LogOut, LayoutDashboard, Menu, X, Settings } from 'lucide-react';
import InstallPWA from './InstallPWA';
import Icono from '../assets/icono_md.png';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const logout = () => {
        localStorage.removeItem('admin_token');
        window.location.reload();
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex min-h-screen bg-gray-100 relative">

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-blue-600 text-white h-16 flex items-center justify-between px-4 z-20 shadow-md">
                <div className="flex items-center">
                    <img src={Icono} alt="MKD" className="h-10 w-10 mr-3 bg-white rounded-full p-1" />
                    <span className="font-bold text-lg">Marketing</span>
                </div>
                <button onClick={toggleSidebar}>
                    {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl flex flex-col transition-transform duration-300 transform
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="h-20 flex items-center px-6 border-b border-gray-100 bg-blue-600 text-white">
                    <img src={Icono} alt="MKD" className="h-12 w-12 mr-3 bg-white rounded-full p-1 border-2 border-white/20" />
                    <span className="font-bold text-lg">Marketing</span>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-2">
                    <NavLink
                        to="/noticias"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Newspaper className="h-5 w-5 mr-3" />
                        Novedades
                    </NavLink>

                    <NavLink
                        to="/push"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Send className="h-5 w-5 mr-3" />
                        Enviar Push
                    </NavLink>

                    <NavLink
                        to="/configuracion"
                        onClick={() => setIsSidebarOpen(false)}
                        className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Settings className="h-5 w-5 mr-3" />
                        Configuración
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={logout} className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut className="h-5 w-5 mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full pt-16 md:pt-0">
                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>

            <InstallPWA />
        </div>
    );
}
