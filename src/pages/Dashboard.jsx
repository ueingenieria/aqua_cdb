import { openExternal } from '../mobile/navigation';
import { getCurrentPosition } from '../mobile/geolocation';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Star, Ticket, Plus, MapPin, ExternalLink, LogOut, Clock, Award, Mail, Bell, Loader2, Share2 } from 'lucide-react';
import clubLogo from '../assets/club.png';
import { Button } from '../components/ui/Button';
import { savePushToken } from '../api/notifications';
import Swal from 'sweetalert2';
import { getLavaderos, findNearestLaundry, calculateDistance } from '../api/locations';
import { useNavigate } from 'react-router-dom';

import NotificationPrompt from '../components/ui/NotificationPrompt';
import { notificationPermission } from '../mobile/push';
import { isNative } from '../mobile/platform';
import botMapa from '../assets/bot_mapa2.png';

const PLAN_NAMES = { plata: 'Plata', oro: 'Oro', diamante: 'Diamante' };
const PLAN_GRADIENTS = {
    plata:    'from-slate-600 to-slate-800',
    oro:      'from-amber-500 to-orange-600',
    diamante: 'from-sky-500 to-blue-700',
};

function LavadosCard({ subscriptionStatus, onPress }) {
    const isActive = subscriptionStatus?.status === 'authorized';
    const planId = subscriptionStatus?.plan_id || 'plata';
    const planName = PLAN_NAMES[planId] || 'Club';
    const gradient = PLAN_GRADIENTS[planId] || PLAN_GRADIENTS.plata;
    const lavados = Number(subscriptionStatus?.lavados_disponibles ?? 0);

    if (isActive) {
        return (
            <button
                onClick={onPress}
                className={`w-full bg-gradient-to-r ${gradient} p-5 rounded-3xl shadow-lg text-white text-left flex items-center justify-between active:scale-[0.98] transition-all`}
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <Star className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">
                            Club {planName} — Lavados disponibles
                        </p>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-black tracking-tighter leading-none">{lavados}</span>
                            <span className="text-white/60 text-sm font-semibold mb-1">
                                lavado{lavados !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <p className="text-white/50 text-[10px] font-medium mt-1">Solo pagando con la App a través del QR</p>
                    </div>
                </div>
                <span className="text-white/40 text-2xl font-black">›</span>
            </button>
        );
    }

    return (
        <button
            onClick={onPress}
            className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-500 to-amber-400 p-5 rounded-3xl shadow-xl shadow-orange-500/40 text-white text-left flex items-center justify-between active:scale-[0.98] transition-all"
        >
            {/* Destellos decorativos */}
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-0 left-1/3 h-16 w-32 rounded-full bg-amber-300/20 blur-lg" />

            <div className="flex items-center gap-4 relative z-10">
                <img src={clubLogo} alt="Club de Beneficios" className="h-16 w-16 object-contain drop-shadow-lg" />
                <div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-0.5">¡Unite ahora!</p>
                    <p className="text-base font-black leading-tight">Suscribite y obtené<br />lavados gratis</p>
                </div>
            </div>
            <span className="relative z-10 bg-white/20 rounded-full h-8 w-8 flex items-center justify-center text-white font-black text-lg">›</span>
        </button>
    );
}

export default function Dashboard() {
    const { user, logout, refreshBalance, subscriptionStatus, refreshSubscriptionStatus } = useAuth();
    const navigate = useNavigate();
    const [nearestLaundry, setNearestLaundry] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [hasUnreadNews, setHasUnreadNews] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(
        'Notification' in window && Notification.permission === 'granted'
    );

    useEffect(() => {
        refreshBalance();
        checkUnreadNews();
        refreshSubscriptionStatus();

        if ('Notification' in window && Notification.permission === 'granted') {
            setNotificationsEnabled(true);
        }
        void notificationPermission().then(permission => setNotificationsEnabled(permission === 'granted')).catch(console.error);
    }, []);

    // ... (rest of the code)



    const checkUnreadNews = async () => {
        try {
            // Import dynamically or assume imported
            const { getNews } = await import('../api/news');
            const news = await getNews();
            if (news && news.length > 0) {
                const latestId = news[0].id;
                const lastReadId = localStorage.getItem('last_read_news_id');

                // If never read or new ID is greater than last read
                if (!lastReadId || parseInt(latestId) > parseInt(lastReadId)) {
                    setHasUnreadNews(true);
                }
            }
        } catch (err) {
            console.error("Error checking news", err);
        }
    };


    const handleEnableNotifications = async () => {
        try {
            // Si ya están garantizadas, solo informamos y cerramos
            if (await notificationPermission() === 'granted') {
                const saved = await savePushToken(user.id);
                if (!saved) throw new Error('No se pudieron activar las notificaciones.');
                setNotificationsEnabled(true);
                Swal.fire({
                    title: '¡Ya activadas!',
                    text: 'Ya tienes las notificaciones activadas correctamente.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                return;
            }

            Swal.showLoading();
            const saved = await savePushToken(user.id, true);
            if (!saved) throw new Error('No se concedió permiso para recibir notificaciones.');

            setNotificationsEnabled(true);

            Swal.fire({
                title: '¡Activadas!',
                text: 'Las notificaciones push han sido configuradas correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error detallado de notificaciones:', error);
            if (isNative()) {
                await Swal.fire('Notificaciones', 'No se pudieron activar. Revisá el permiso de notificaciones de AquaExpress en Ajustes e intentá nuevamente.', 'info');
                return;
            }

            // Capturar error 401 específico de autenticación/credenciales
            const isAuthError = error.message?.includes('401') ||
                error.code === 'messaging/token-subscribe-failed' ||
                error.message?.includes('credential') ||
                error.message?.includes('authentication');

            if (error.message?.includes('permission-blocked') || globalThis.Notification?.permission === 'denied') {
                Swal.fire({
                    title: 'Permisos Bloqueados',
                    html: `
                        <div style="text-align: left;">
                            <p>Las notificaciones están bloqueadas en tu navegador. Para activarlas:</p>
                            <ol>
                                <li>Haz clic en el icono del <b>candado 🔒</b> junto a la URL.</li>
                                <li>Busca <b>"Notificaciones"</b> y cámbialo a <b>"Permitir"</b>.</li>
                                <li>Recarga la página.</li>
                            </ol>
                        </div>
                    `,
                    icon: 'warning'
                });
            } else if (isAuthError) {
                Swal.fire({
                    title: 'Error de Autenticación (401)',
                    html: `
                        <div style="text-align: left; font-size: 0.9em;">
                            <p style="color: #ef4444; font-weight: bold;">Google rechazó la conexión (401).</p>
                            <p>Esto suele pasar por una de estas 2 razones:</p>
                            <ol>
                                <li><b>API Key Restringida:</b> La llave en Google Cloud tiene restricciones de dominio que bloquean la App.</li>
                                <li><b>API Deshabilitada:</b> Falta activar la API "Firebase Installations" en Google Cloud Console.</li>
                            </ol>
                            <hr style="margin: 10px 0;"/>
                            <p style="font-size: 0.8em; color: #666;">
                                <b>Reporte para soporte:</b><br/>
                                Proyecto: aquapush-a8539<br/>
                                Sender: 1079314091164
                            </p>
                        </div>
                    `,
                    icon: 'error',
                    showCancelButton: true,
                    confirmButtonText: 'Ver Diagnóstico Técnico',
                    cancelButtonText: 'Borrar Datos y Reintentar',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                }).then((result) => {
                    if (result.isConfirmed) {
                        runTechnicalDiagnosis();
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        handleHardReset();
                    }
                });
            } else {
                Swal.fire('Error', 'No se pudieron activar las notificaciones. Intenta nuevamente más tarde.', 'error');
            }
        }
    };

    const handleHardReset = async () => {
        try {
            Swal.showLoading();
            // Desregistrar Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    await reg.unregister();
                }
            }
            // Borrar Bases de Datos de Firebase (IndexedDB)
            const databases = ['firebase-messaging-database', 'firebase-installations-database'];
            for (const dbName of databases) {
                await new Promise((resolve) => {
                    const request = indexedDB.deleteDatabase(dbName);
                    request.onsuccess = resolve;
                    request.onerror = resolve;
                });
            }
            // Recargar para aplicar cambios
            window.location.reload();
        } catch (e) {
            console.error(e);
            window.location.reload();
        }
    };

    const runTechnicalDiagnosis = () => {
        const swStatus = 'serviceWorker' in navigator ? 'Soportado' : 'NO Soportado';
        const configKeys = {
            apiKey: 'AIzaSyBtEsOetVhqyZm8mCdAl25sslP3ySKqNO8',
            senderId: '1079314091164',
            appId: '1:1079314091164:web:e0ce32a3649e9973847159'
        };

        Swal.fire({
            title: 'Diagnóstico Técnico',
            html: `
                <div style="text-align: left; font-family: monospace; font-size: 0.75em; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p><b>SW:</b> ${swStatus}</p>
                    <p><b>Scope:</b> ${window.location.origin}/cdb/</p>
                    <p><b>API Key:</b> ${configKeys.apiKey.substring(0, 10)}...${configKeys.apiKey.substring(configKeys.apiKey.length - 5)}</p>
                    <p><b>Sender ID:</b> ${configKeys.senderId}</p>
                    <p><b>VAPID:</b> BIUuZbGioj...Fpl49s_NdF-k</p>
                    <hr style="margin: 5px 0;"/>
                    <p style="color: blue;">URL Error detectada: fcmregistrations (401)</p>
                </div>
                <p style="font-size: 0.8em; margin-top: 10px;">Enviá una captura de esto al soporte técnico.</p>
            `,
            icon: 'info'
        });
    };

    useEffect(() => {
        // Geolocalización Legacy Logic
        {
            getCurrentPosition(async (position) => {
                try {
                    const lavaderos = await getLavaderos();
                    const pos = { lat: position.coords.latitude, lon: position.coords.longitude };
                    setUserLocation(pos);

                    const nearest = findNearestLaundry(pos, lavaderos);
                    if (nearest) {
                        const dist = calculateDistance(pos, { lat: nearest.latitud, lon: nearest.longitud });
                        setNearestLaundry(nearest);
                        setDistance(dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(1) + ' km');
                    }
                } catch (e) {
                    console.error("Error fetching locations", e);
                }
            }, (err) => {
                console.error(err);
                // Default location (Mendoza) on error
                setUserLocation({ lat: -32.890674, lon: -68.839440 });
            }, { enableHighAccuracy: true });
        }
    }, []);

    // Handlers for Legacy External Links
    const openCredits = () => {
        const lat = userLocation?.lat || -32.890674;
        const lon = userLocation?.lon || -68.839440;
        navigate('/creditos-mapa', { state: { location: { lat, lon } } });
    };

    const openLocations = () => {
        const lat = userLocation?.lat || -32.890674;
        const lon = userLocation?.lon || -68.839440;
        navigate('/mapa', { state: { location: { lat, lon } } });
    };



    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-24 relative">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hola, {user.name}!</h1>
                    <p className="text-white/80">Bienvenido a AquaExpress</p>
                </div>
            </header>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-primary to-secondary p-5 rounded-3xl text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-white/80 text-sm font-medium mb-1">Saldo Disponible</p>
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold tracking-tight">${user.credit || '0.00'}</h2>
                            <Button
                                onClick={() => navigate('/billetera')}
                                className="bg-gradient-to-r from-blue-600 to-blue-800 border-0 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-900 active:scale-95 transition-all text-sm font-bold px-4 py-2 h-auto w-36 justify-center"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                CARGAR
                            </Button>
                        </div>
                    </div>
                    <CreditCard className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 rotate-12" />
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-500 text-sm font-medium mb-1">Puntos acumulados</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Star className="h-6 w-6 text-orange-500 fill-orange-500" />
                                <h2 className="text-3xl font-bold text-gray-900">{user.points || '0'}</h2>
                            </div>
                            <Button
                                onClick={() => navigate('/canje')}
                                className="bg-gradient-to-r from-orange-400 to-orange-600 border-0 text-white shadow-md hover:shadow-lg hover:from-orange-500 hover:to-orange-700 active:scale-95 transition-all text-sm font-bold px-4 py-2 h-auto w-36 justify-center"
                            >
                                <Ticket className="h-4 w-4 mr-2" />
                                CANJEAR
                            </Button>
                        </div>
                    </div>
                    <Star className="absolute -bottom-4 -right-4 h-32 w-32 text-yellow-400/20 rotate-12" />
                </div>
            </div >



            {/* Accesos Rápidos */}
            < div >
                <h3 className="font-bold text-white mb-4 text-lg drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">Accesos Rápidos</h3>
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
                        <p className="text-sm font-medium text-gray-700">Autolavado</p>
                    </div>

                    <div onClick={openLocations} className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="mx-auto h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Lavaderos</p>
                    </div>

                    <div onClick={() => navigate('/actividad')} className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="mx-auto h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Actividad</p>
                    </div>

                    <div onClick={() => navigate('/novedades')} className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer relative">
                        {hasUnreadNews && (
                            <span className="absolute top-3 right-3 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                        <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center transition-colors ${hasUnreadNews ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
                            <Mail className={`h-6 w-6 ${hasUnreadNews ? 'animate-pulse' : ''}`} />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Novedades</p>
                    </div>

                    <div onClick={() => navigate('/beneficios')} className="bg-white p-4 rounded-2xl border border-gray-100 text-center space-y-2 hover:shadow-md transition-shadow cursor-pointer relative">
                        {subscriptionStatus?.status === 'authorized' ? (
                            <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                                {subscriptionStatus.lavados_disponibles || 0} DISP.
                            </span>
                        ) : (
                            <span className="absolute top-3 right-3 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                            </span>
                        )}
                        <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center transition-colors ${subscriptionStatus?.status === 'authorized' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                            <Award className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Club Aqua</p>
                    </div>
                </div>
            </div >



            {/* Notification Activation Block */}
            {/* Notification Activation Block based on permission */}
            {
                !notificationsEnabled && (
                    <div className="bg-white/90 backdrop-blur-sm p-5 rounded-3xl border border-blue-100 flex flex-col gap-3 shadow-md">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500/10 p-3 rounded-full text-blue-600">
                                <Bell className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">Mantenete al tanto</p>
                                <p className="text-[13px] text-gray-500 leading-tight">Activa las notificaciones para recibir beneficios y novedades</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full text-sm font-bold border-blue-200 text-blue-700 hover:bg-blue-50 h-11 rounded-xl shadow-sm shadow-blue-500/10"
                            onClick={handleEnableNotifications}
                        >
                            Activar Notificaciones Push
                        </Button>
                    </div>
                )
            }

            {/* Lavadero Cercano (Enhanced Feature) */}
            <div className="shadow-xl rounded-2xl overflow-hidden w-full animate-in fade-in duration-700">
                <div className="bg-gray-900 p-4 text-white flex items-center justify-between relative z-10 min-h-[80px]">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-gradient-to-br from-primary to-secondary rounded-full ${!nearestLaundry ? 'animate-pulse' : ''}`}>
                            <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Estás cerca</p>
                            {!nearestLaundry ? (
                                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Consultando ubicación...
                                </p>
                            ) : (
                                <p className="font-bold">{nearestLaundry.nombre}</p>
                            )}
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                        {nearestLaundry && (
                            <>
                                <span className="text-2xl font-bold font-display">{distance}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Abrir navegación (Google Maps intenta abrir app nativa en móviles)
                                        const url = `https://www.google.com/maps/dir/?api=1&destination=${nearestLaundry.latitud},${nearestLaundry.longitud}`;
                                        void openExternal(url).catch(console.error);
                                    }}
                                    className="flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-full transition-colors font-bold uppercase tracking-wider"
                                >
                                    <ExternalLink className="h-3 w-3" /> IR AHORA
                                </button>
                            </>
                        )}
                    </div>
                </div>

            </div>



            {/* Prompt Automático de Notificaciones */}
            <NotificationPrompt onEnable={handleEnableNotifications} />

            {/* Tarjeta Lavados Disponibles */}
            <LavadosCard subscriptionStatus={subscriptionStatus} onPress={() => navigate('/beneficios')} />

            {/* Club de Referidos */}
            <button
                onClick={() => navigate('/referidos')}
                className="w-full flex items-center justify-between bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black py-5 px-6 rounded-3xl shadow-lg shadow-green-500/20 hover:from-green-600 hover:to-emerald-700 transition-all active:scale-[0.98]"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2.5 rounded-2xl">
                        <Share2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-black uppercase tracking-wider">Club de Referidos</div>
                        <div className="text-xs text-white/70 font-medium">Invitá amigos y ganá lavados gratis</div>
                    </div>
                </div>
                <div className="text-white/50 text-xl font-black">›</div>
            </button>

        </div>
    )
}
