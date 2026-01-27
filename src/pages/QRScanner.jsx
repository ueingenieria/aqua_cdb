import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { getLavaderos, findNearestLaundry } from '../api/locations';

export default function QRScanner() {
    const [scanResult, setScanResult] = useState(null);
    const [laundryParams, setLaundryParams] = useState({ V1: false, TORCH: false });
    const navigate = useNavigate();
    const scannerRef = useRef(null);

    useEffect(() => {
        // Calculo de parámetros de entorno al montar
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const lavaderos = await getLavaderos();
                    const pos = { lat: position.coords.latitude, lon: position.coords.longitude };
                    const nearest = findNearestLaundry(pos, lavaderos);

                    const isNight = new Date().getHours() > 19 || new Date().getHours() < 7; // Simple suncalc replacement

                    if (nearest) {
                        setLaundryParams({
                            V1: nearest.tipo_totem === 'V1',
                            TORCH: isNight
                        });
                    }
                } catch (e) { console.error(e); }
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }

        // Inicializar Scanner
        // Evitar doble inicialización en modo estricto de React
        if (scannerRef.current) return;

        const timer = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
            );
            scannerRef.current = scanner;
            scanner.render(onScanSuccess, onScanFailure);
        }, 100);

        function onScanSuccess(decodedText, decodedResult) {
            setScanResult(decodedText);

            // Construir URL final con parámetros legacy si es necesaria
            // location.replace(`qr.html?V1=${...}&TORCH=${...}&IDPROMO=${...}`);
            // Aquí alertamos para debug, pero en producción esto iría a la lógica de canje
            alert(`Código: ${decodedText}\nParams: V1=${laundryParams.V1}, TORCH=${laundryParams.TORCH}`);
        }

        function onScanFailure(error) {
            // console.warn(error);
        }

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
            }
        };
    }, []);

    return (
        <div className="p-6 max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-bold text-white">Escáner QR</h1>
            <p className="text-white/80">Escaneá el código del lavadero</p>

            <div className="bg-gray-100 rounded-3xl p-4">
                <div id="reader" className="overflow-hidden rounded-xl border-2 border-transparent"></div>
            </div>

            {scanResult && (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl font-mono break-all animate-in fade-in">
                    Resultado: <strong>{scanResult}</strong>
                </div>
            )}

            <div className="text-xs text-gray-400">
                Modo Nocturno: {laundryParams.TORCH ? 'Activo' : 'Inactivo'} | Tótem V1: {laundryParams.V1 ? 'Sí' : 'No'}
            </div>

            <Button variant="secondary" onClick={() => navigate('/')} className="w-full">Volver al Inicio</Button>
        </div>
    )
}
