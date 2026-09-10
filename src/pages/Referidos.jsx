import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReferralInfo } from '../api/referrals';
import { Share2, Copy, CheckCircle, Clock, Gift, AlertCircle, Loader2, Info, X } from 'lucide-react';

export default function Referidos() {
    const { user, subscriptionStatus } = useAuth();
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState(null);

    const tooltips = {
        referidos: 'Personas que se registraron con tu código y ya activaron su suscripción al Club.',
        pendientes: 'Ya se registraron con tu código pero todavía no activaron su suscripción al Club.',
        bonus: 'Lavados gratis que ganaste. Se acreditan automáticamente al activar tu suscripción.',
    };

    const toggleTooltip = (key) => setActiveTooltip(prev => prev === key ? null : key);

    useEffect(() => {
        if (!user?.email) return;
        getReferralInfo(user.email).then(data => {
            if (data?.status === 'OK') setInfo(data);
            setLoading(false);
        });
    }, [user]);

    const getShareLink = () =>
        `https://aquaexpress.com.ar/cdb/register?ref=${info?.referral_code}`;

    const handleCopy = () => {
        if (!info?.referral_code) return;
        navigator.clipboard.writeText(getShareLink());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        if (!info?.referral_code) return;
        const url = getShareLink();
        const text = `¡Unite al Club AquaExpress y conseguís beneficios exclusivos! Registrate con mi link 👇`;
        if (navigator.share) {
            navigator.share({ title: 'AquaExpress Club', text, url });
        } else {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin h-10 w-10 text-white/50" />
        </div>
    );

    const referidosPorLavado = info?.referidos_por_lavado || 1;
    const progreso = info?.progreso || 0;
    const completados = info?.completed || 0;
    const pendientes = info?.pending || 0;
    const bonusLavados = info?.bonus_lavados || 0;
    const isSubscribed = subscriptionStatus?.status === 'authorized';

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto pb-24">
            <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">Club de Referidos</h1>

            {/* Código */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Tu código personal</p>
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4">
                        <span className="font-mono text-2xl font-black text-[#0f172a] tracking-widest">
                            {info?.referral_code || '—'}
                        </span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all active:scale-95"
                    >
                        {copied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-slate-500" />}
                    </button>
                </div>
                <button
                    onClick={handleShare}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-[0.98]"
                >
                    <Share2 className="h-4 w-4" />
                    Compartir código
                </button>
            </div>

            {/* Progreso */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Próximo lavado gratis</p>
                    <Gift className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-black text-[#0f172a] tracking-tighter">{progreso}</span>
                    <span className="text-2xl font-black text-slate-300 mb-1">/ {referidosPorLavado}</span>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-4">
                    {progreso === 0 && completados === 0
                        ? `Necesitás ${referidosPorLavado} referido${referidosPorLavado !== 1 ? 's' : ''} para tu primer lavado gratis`
                        : progreso === 0
                            ? `¡Acabás de conseguir un lavado! Seguí sumando referidos`
                            : `Te falta${referidosPorLavado - progreso !== 1 ? 'n' : ''} ${referidosPorLavado - progreso} referido${referidosPorLavado - progreso !== 1 ? 's' : ''} para el próximo lavado gratis`}
                </p>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${referidosPorLavado > 0 ? (progreso / referidosPorLavado) * 100 : 0}%` }}
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                        { key: 'referidos', icon: <CheckCircle className="h-4 w-4 text-green-500" />, value: completados, label: 'Referidos', bg: 'bg-green-50', num: 'text-green-700', lbl: 'text-green-500' },
                        { key: 'pendientes', icon: <Clock className="h-4 w-4 text-amber-500" />, value: pendientes, label: 'Pendientes', bg: 'bg-amber-50', num: 'text-amber-700', lbl: 'text-amber-500' },
                        { key: 'bonus', icon: <Gift className="h-4 w-4 text-blue-500" />, value: bonusLavados, label: 'Bonus', bg: 'bg-blue-50', num: 'text-blue-700', lbl: 'text-blue-500' },
                    ].map(({ key, icon, value, label, bg, num, lbl }) => (
                        <div key={key} className={`${bg} rounded-2xl p-4 text-center relative`}>
                            <button
                                onClick={() => toggleTooltip(key)}
                                className="absolute top-2 right-2 opacity-40 hover:opacity-80 transition-opacity"
                            >
                                {activeTooltip === key ? <X className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                            </button>
                            {activeTooltip === key ? (
                                <p className="text-[9px] text-slate-600 leading-tight text-left mt-1">{tooltips[key]}</p>
                            ) : (
                                <>
                                    <div className="mx-auto mb-1">{icon}</div>
                                    <div className={`text-xl font-black ${num}`}>{value}</div>
                                    <div className={`text-[9px] font-bold ${lbl} uppercase tracking-wider`}>{label}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Disclaimer si tiene bonus pero no está suscripto */}
            {bonusLavados > 0 && !isSubscribed && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 font-medium">
                        Tenés <strong>{bonusLavados} lavado{bonusLavados !== 1 ? 's' : ''} bonus</strong> acumulado{bonusLavados !== 1 ? 's' : ''} por referidos.
                        Se acreditarán automáticamente cuando actives tu suscripción.
                    </p>
                </div>
            )}

            {/* Cómo funciona */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">¿Cómo funciona?</p>
                <div className="space-y-4">
                    {[
                        { n: '1', text: 'Compartí tu código con amigos o familiares' },
                        { n: '2', text: 'Ellos se registran en la app usando tu código' },
                        { n: '3', text: `Cuando se suscriban al Club, se suma 1 referido completado` },
                        { n: '4', text: `Cada ${referidosPorLavado} referido${referidosPorLavado !== 1 ? 's' : ''} completado${referidosPorLavado !== 1 ? 's' : ''} ganás 1 lavado gratis` },
                    ].map(({ n, text }) => (
                        <div key={n} className="flex items-start gap-4">
                            <div className="w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-black text-white">{n}</span>
                            </div>
                            <p className="text-sm text-slate-600 font-medium">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* Disclaimer condiciones */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Los beneficios del Club de Referidos están disponibles exclusivamente para miembros con suscripción activa.
                    {!isSubscribed && ' Los lavados acumulados se acreditarán automáticamente al momento de activar tu suscripción.'}
                </p>
            </div>
        </div>
    );
}
