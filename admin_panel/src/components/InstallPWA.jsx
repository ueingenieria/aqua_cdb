import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-blue-600 text-white p-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-10">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Download className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold">Instalar Panel Admin</h4>
                        <p className="text-xs text-blue-100">Acceso rápido desde el inicio</p>
                    </div>
                </div>
                <button onClick={() => setShowBanner(false)} className="bg-white/10 p-1 rounded-full hover:bg-white/20">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <button
                onClick={handleInstall}
                className="w-full mt-4 bg-white text-blue-600 py-2 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
                Instalar Ahora
            </button>
        </div>
    );
}
