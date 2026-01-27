import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Star, Ticket, Plus, MapPin, ExternalLink, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getLavaderos, findNearestLaundry, calculateDistance } from '../api/locations';
import { useNavigate } from 'react-router-dom';

import botMapa from '../assets/bot_mapa2.png';
import suscribiteBtn from '../assets/suscribite.png';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [nearestLaundry, setNearestLaundry] = useState(null);
    const [distance, setDistance] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        // Geolocalización Legacy Logic
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const lavaderos = await getLavaderos();
                    const pos = { lat: position.coords.latitude, lon: position.coords.longitude };

                    const nearest = findNearestLaundry(pos, lavaderos);
                    if (nearest) {
                        const dist = calculateDistance(pos, { lat: nearest.latitud, lon: nearest.longitud });
                        setNearestLaundry(nearest);
                        setDistance(dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(1) + ' km');
                    }
                } catch (e) {
                    console.error("Error fetching locations", e);
                }
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
    }, []);

    // Handlers for Legacy External Links
    const openCredits = () => {
        window.open(`https://www.aquaexpress.com.ar/aqua4d/aqua_maps_compra_mp1.html?mail=${user.email}&nombre=${user.name}`, '_system');
    };

    const openLocations = () => {
        window.open(`https://www.aquaexpress.com.ar/aqua4d/aqua_maps3.html?platform=browser`, '_system');
    };

    const openSubscription = () => {
        window.open(`https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/checkout.html?email=${user.email}`, '_system');
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-24 relative">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hola, {user.name}!</h1>
                    <p className="text-white/80">Bienvenido a AquaExpress</p>
                </div>
                <button onClick={() => setShowLogoutModal(true)} className="h-10 w-10 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full cursor-pointer flex items-center justify-center text-gray-400 transition-colors" title="Cerrar sesión">
                    <LogOut className="h-5 w-5" />
                </button>
            </header>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-primary to-secondary p-5 rounded-3xl text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-white/80 text-sm font-medium mb-1">Saldo Disponible</p>
                        <h2 className="text-3xl font-bold tracking-tight">${user.credit || '0.00'}</h2>
                        <Button onClick={() => navigate('/billetera')} variant="secondary" size="sm" className="mt-4 bg-white/20 border-0 text-white hover:bg-white/30 backdrop-blur-sm">
                            <Plus className="h-4 w-4 mr-1" /> Cargar
                        </Button>
                    </div>
                    <CreditCard className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 rotate-12" />
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-500 text-sm font-medium mb-1">Puntos acumulados</p>
                        <h2 className="text-3xl font-bold text-gray-900">{user.points || '0'}</h2>
                    </div>
                    <Star className="absolute -bottom-4 -right-4 h-32 w-32 text-yellow-400/20 rotate-12" />
                </div>
            </div>



            {/* Accesos Rápidos */}
            <div>
                <h3 className="font-bold text-white mb-4 text-lg">Accesos Rápidos</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div onClick={() => navigate('/cupones')} className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="mx-auto h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                            <Ticket className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Cupones</p>
                    </div>

                    <div onClick={openCredits} className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="mx-auto h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Créditos</p>
                    </div>

                    <div onClick={openLocations} className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="mx-auto h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Mapas</p>
                    </div>

                    <div onClick={() => alert("Beneficios próximamente")} className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="mx-auto h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                            <Star className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Beneficios</p>
                    </div>
                </div>
            </div>

            {/* Aqua Club Subscription Image Button */}
            <div onClick={openSubscription} className="cursor-pointer hover:opacity-95 transition-all transform active:scale-98 max-w-sm mx-auto">
                <img src={suscribiteBtn} alt="Suscribite a Aqua Club" className="w-full h-auto rounded-2xl shadow-lg" />
            </div>

            {/* Lavadero Cercano (Legacy Feature) */}
            {nearestLaundry && (
                <div className="shadow-xl rounded-2xl overflow-hidden max-w-sm mx-auto">
                    <div className="bg-gray-900 p-4 text-white flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-full animate-pulse">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Estás cerca</p>
                                <p className="font-bold">{nearestLaundry.nombre}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold font-display">{distance}</span>
                        </div>
                    </div>
                    {/* Sección "Pegada" - Botón Mapas (Imagen) */}
                    <div
                        onClick={openLocations}
                        className="w-full cursor-pointer hover:opacity-95 transition-opacity bg-gray-900 border-t border-gray-800"
                    >
                        <img src={botMapa} alt="Ver todas las sucursales" className="w-full h-auto object-cover" />
                    </div>
                </div>
            )}


            {/* Modal Logout */}
            {
                showLogoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-6 shadow-2xl text-center">
                            <div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
                                <LogOut className="h-8 w-8 text-red-500 ml-1" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">Cerrar Sesión</h3>
                                <p className="text-gray-500">¿Estás seguro que deseas salir de tu cuenta?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancelar</Button>
                                <Button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white border-transparent">Sí, Salir</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
