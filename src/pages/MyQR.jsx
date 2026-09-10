import { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { getUserQrCode } from '../api/subscription';
import { Loader2, RefreshCw, QrCode, Scan } from 'lucide-react';

export default function MyQR() {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const navigate = useNavigate();
    const timeoutRef = useRef(null);
    const email = localStorage.getItem("email");

    const fetchQr = async () => {
        setLoading(true);
        setError(false);
        const data = await getUserQrCode(email);
        if (data) {
            setQrData(data);
            setLoading(false);

            // Programar el próximo refresco basado en el timeout del servidor (segundos)
            const nextRefresh = (data.timeout + 1) * 1000;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(fetchQr, nextRefresh);
        } else {
            setError(true);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQr();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [email]);

    return (
        <div className="p-6 max-w-md mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center justify-center gap-3">
                    <QrCode className="h-8 w-8 text-blue-400" />
                    Mi Código QR
                </h1>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Acercalo al lector del lavadero</p>
            </div>

            <div className="bg-white rounded-[32px] p-4 shadow-2xl relative group">
                <div className="flex justify-center items-center bg-white rounded-2xl p-2 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4 text-slate-400">
                            <Loader2 className="h-10 w-10 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generando...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-4 text-red-400">
                            <p className="text-[10px] font-black uppercase tracking-widest">Error al conectar</p>
                            <Button variant="outline" size="sm" onClick={fetchQr} className="rounded-xl">Reintentar</Button>
                        </div>
                    ) : (
                        <div className="animate-in zoom-in duration-500">
                            <QRCodeCanvas
                                value={qrData.code}
                                size={280}
                                level="M"
                                includeMargin={false}
                                bgColor="#ffffff"
                                fgColor="#0f172a"
                            />
                        </div>
                    )}
                </div>

                {!loading && !error && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#0f172a] text-white rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 shadow-xl flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin-slow" />
                        Se actualiza automáticamente
                    </div>
                )}
            </div>

            <div className="space-y-4 pt-4">
                <div className="bg-white/10 backdrop-blur-sm border border-black/5 p-5 rounded-2xl shadow-sm">
                    <p className="text-slate-700 text-[10px] uppercase font-bold tracking-widest leading-relaxed">
                        Este código es de un solo uso y vence en unos segundos por tu seguridad.
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => navigate('/qr')}
                    className="w-full bg-slate-100/50 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-2xl py-6 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm"
                >
                    <Scan className="mr-2 h-4 w-4 text-blue-600" />
                    Escanear código
                </Button>


            </div>
        </div>
    );
}
