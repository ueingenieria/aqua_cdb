import { useState, useEffect, useMemo } from 'react';
import aquaVideo from '../../assets/aqua.mp4';
import splashMobileVideo from '../../assets/splash_mobile.mp4';

export const SplashScreen = ({ onComplete }) => {
    const [fadeOut, setFadeOut] = useState(false);

    // Determinar el video correcto de forma inmediata para evitar cambios de src después del montaje
    const videoSrc = useMemo(() => {
        const isMobile = window.innerWidth < 768;
        return isMobile ? splashMobileVideo : aquaVideo;
    }, []);

    const handleVideoEnd = () => {
        setFadeOut(true);
        setTimeout(onComplete, 500); // Dar tiempo a la animación de fade-out
    };

    useEffect(() => {
        // Fallback de seguridad en caso de que el video no cargue o tarde demasiado
        const timer = setTimeout(() => {
            if (!fadeOut) {
                console.log('SplashScreen fallback triggered');
                handleVideoEnd();
            }
        }, 6500); // Aumentado ligeramente para dar tiempo a la carga

        return () => clearTimeout(timer);
    }, [fadeOut]);

    return (
        <div className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            <video
                src={videoSrc}
                autoPlay
                muted
                playsInline
                webkit-playsinline="true"
                preload="auto"
                onEnded={handleVideoEnd}
                onError={handleVideoEnd} // Si falla, pasamos a la app para no bloquear
                className="w-full h-full object-cover"
            />
        </div>
    );
};
