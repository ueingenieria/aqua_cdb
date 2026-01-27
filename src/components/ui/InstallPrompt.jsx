import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './Button';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShow(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShow(false);
        }
        setDeferredPrompt(null);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:right-4 md:left-auto md:w-96 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <Download className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Instalá la App</h3>
                        <p className="text-sm text-gray-500">Accedé más rápido desde tu inicio</p>
                    </div>
                </div>
                <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                </button>
            </div>
            <Button onClick={handleInstall} className="w-full mt-4">
                Instalar AquaExpress
            </Button>
        </div>
    );
}
