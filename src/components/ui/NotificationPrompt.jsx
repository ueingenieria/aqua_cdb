import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { notificationPermission } from '../../mobile/push';

export default function NotificationPrompt({ onEnable }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Solo mostrar si el navegador soporta notificaciones y el permiso no ha sido decidido (default)
        // Si ya está 'granted' o 'denied', no molestamos con este prompt flotante.
        // (Si está denied, el banner del Dashboard se encarga de explicar cómo desbloquear)
        let cancelled = false;
        let timer;
        notificationPermission().then(permission => {
          if (!cancelled && ['default', 'prompt', 'prompt-with-rationale'].includes(permission)) {
            // Un pequeño delay para no ser tan agresivo apenas carga el DOM
            timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
          }
        }).catch(console.error);
        return () => { cancelled = true; clearTimeout(timer); };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed top-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-top duration-500">
            <div className="bg-white/95 backdrop-blur text-gray-800 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 border border-blue-100 ring-1 ring-black/5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                            <Bell className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-gray-900">Activar Notificaciones</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Recibí alertas, descuentos y novedades.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex gap-2 mt-1">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                        Ahora no
                    </button>
                    <button
                        onClick={() => {
                            onEnable();
                            setIsVisible(false);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
                    >
                        Activar
                    </button>
                </div>
            </div>
        </div>
    );
}
