import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setSupportsPWA(true);
            setPromptInstall(e);
        };

        // Check if launched in standalone (already installed)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => setIsInstalled(true));

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const onClick = (evt) => {
        evt.preventDefault();
        if (!promptInstall) {
            return;
        }
        promptInstall.prompt();
        promptInstall.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                setSupportsPWA(false);
            }
        });
    };

    if (!supportsPWA || isInstalled) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="bg-gray-900/95 backdrop-blur text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-xl">
                        <Download className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Instalar App</h3>
                        <p className="text-xs text-gray-400">Acceso rápido y notificaciones</p>
                    </div>
                </div>
                <button
                    onClick={onClick}
                    className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                    Instalar
                </button>
                <button onClick={() => setSupportsPWA(false)} className="absolute -top-2 -right-2 bg-gray-500 rounded-full p-1 text-white shadow-sm">
                    <X className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
