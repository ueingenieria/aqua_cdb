import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createSubscription, cancelSubscription, getSubscriptionConfig } from '../../api/subscription';
import { Loader2, Crown, CheckCircle, CreditCard, AlertTriangle, Zap, Gem, CalendarClock } from 'lucide-react';
import { Button } from '../ui/Button';
import Swal from 'sweetalert2';
import { openExternal } from '../../mobile/navigation';

const SUBSCRIPTION_PLANS = [
    {
        id: 'plata',
        name: 'Plata',
        price: '1500',
        description: 'Entrada al club con beneficios esenciales.',
        features: [],
        color: 'from-slate-400 to-slate-600',
        icon: Crown,
        textColor: 'text-slate-700',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-300'
    },
    {
        id: 'oro',
        name: 'Oro',
        price: '3500',
        description: 'Para nuestros clientes más fieles.',
        features: [],
        color: 'from-amber-400 to-amber-600',
        icon: Zap,
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        popular: true
    },
    {
        id: 'diamante',
        name: 'Diamante',
        price: '7000',
        description: 'El estatus VIP absoluto para nuestros mejores clientes.',
        features: [],
        color: 'from-blue-500 to-indigo-700',
        icon: Gem,
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
    }
];

export default function ClubSubscription({ hideIfSubscribed = false }) {
    const { user, subscriptionStatus: globalStatus, refreshSubscriptionStatus } = useAuth();
    const [loadingAction, setLoadingAction] = useState(null);
    const [dynamicPlans, setDynamicPlans] = useState(SUBSCRIPTION_PLANS);

    useEffect(() => {
        const loadConfig = async () => {
            const config = await getSubscriptionConfig();
            if (config && config.planes) {
                const updatedPlans = SUBSCRIPTION_PLANS.map(plan => {
                    const dynamicData = config.planes[plan.id];
                    if (dynamicData) {
                        const lavados = parseInt(dynamicData.lavados_gratis) || 0;
                        const features = [
                            `${lavados} Lavado${lavados !== 1 ? 's' : ''} de cortesía/mes`,
                        ];
                        if (parseInt(dynamicData.descuento_cosmetica) > 0)
                            features.push(`Descuento del ${dynamicData.descuento_cosmetica}% en cosmética`);
                        if (dynamicData.beneficios)
                            dynamicData.beneficios.split('\n').map(b => b.trim()).filter(Boolean).forEach(b => features.push(b));
                        return {
                            ...plan,
                            price: dynamicData.monto,
                            lavados_gratis: dynamicData.lavados_gratis,
                            active: dynamicData.activo !== false,
                            features
                        };
                    }
                    return plan;
                }).filter(plan => plan.active !== false);
                setDynamicPlans(updatedPlans);
            }
        };
        loadConfig();
    }, []);

    const status = globalStatus?.status || 'loading';
    const currentSubId = globalStatus?.preapproval_id;
    const currentLevel = globalStatus?.plan_id || 'plata';

    const handleSubscribe = async (planId) => {
        if (!user) {
            Swal.fire('Atención', 'Debes iniciar sesión para suscribirte', 'info');
            return;
        }

        setLoadingAction(planId);
        try {
            const res = await createSubscription(user.id, user.email, planId);
            if (res.status === 'OK' && res.init_point) {
                await openExternal(res.init_point, { replacePage: true });
            } else {
                Swal.fire('Error', 'No se pudo generar el link de pago', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión', 'error');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleCancel = async () => {
        if (!currentSubId) return;

        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Perderás todos tus beneficios VIP inmediatamente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar'
        });

        if (result.isConfirmed) {
            setLoadingAction('cancel');
            try {
                const res = await cancelSubscription(currentSubId);
                if (res.status === 'OK') {
                    await Swal.fire('Cancelada', 'Tu suscripción ha sido dada de baja.', 'success');
                    refreshSubscriptionStatus();
                } else {
                    Swal.fire('Error', 'No se pudo cancelar. Intenta más tarde.', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Error de conexión', 'error');
            } finally {
                setLoadingAction(null);
            }
        }
    };

    if (status === 'loading') return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-500 h-10 w-10" /></div>;

    if (status === 'authorized') {
        if (hideIfSubscribed) return null;
        const plan = dynamicPlans.find(p => p.id === currentLevel) || dynamicPlans[0] || SUBSCRIPTION_PLANS[0];
        const Icon = plan.icon;
        const descuento = plan.features?.find(f => f.includes('%'))?.match(/(\d+)%/)?.[1] || null;
        const nextPayment = globalStatus?.next_payment_date
            ? new Date(globalStatus.next_payment_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
            : null;

        return (
            <div className={`bg-gradient-to-br ${plan.color} rounded-[2rem] p-10 text-white shadow-2xl mb-12 relative overflow-hidden group border border-white/10`}>
                <div className="absolute top-0 right-0 -mt-16 -mr-16 bg-white/10 rounded-full h-80 w-80 blur-[80px] group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="bg-white/15 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center">
                        <Icon className="h-14 w-14 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.3em] bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full w-fit mx-auto md:mx-0 border border-white/10">Socio VIP Activo</span>
                            <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">NIVEL {plan.name}</h3>
                        </div>
                        <p className="text-white/70 text-lg font-medium tracking-tight">Disfrutando de la experiencia premium en AquaExpress.</p>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-center justify-center gap-4">
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <Zap className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black">{globalStatus?.lavados_disponibles || 0}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-white">Lavados de cortesía</div>
                                    <div className="text-[8px] opacity-70 text-white mt-0.5">Canjeables solo escaneando QR con la App</div>
                                </div>
                            </div>
                            {descuento && (
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-center justify-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-xl">
                                        <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black">{descuento}%</div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 text-white">Descuento cosmética</div>
                                        <div className="text-[8px] opacity-70 text-white mt-0.5">Solo pagando con billetera Aqua</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {nextPayment && (
                            <div className="mt-4 flex items-center gap-3 bg-white/5 rounded-2xl px-5 py-3 border border-white/10 w-fit mx-auto md:mx-0">
                                <CalendarClock className="h-4 w-4 text-white/50 shrink-0" />
                                <div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">Próxima renovación</div>
                                    <div className="text-sm font-black text-white/80">{nextPayment}</div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 p-3 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Condiciones de uso de beneficios</p>
                            <ul className="space-y-1">
                                <li className="text-[10px] text-white/50 flex items-start gap-2 leading-tight">
                                    <span className="text-white/30 mt-0.5 shrink-0">→</span>
                                    Los lavados de cortesía son exclusivos de la App y se canjean solo pagando con QR desde la App.
                                </li>
                                <li className="text-[10px] text-white/50 flex items-start gap-2 leading-tight">
                                    <span className="text-white/30 mt-0.5 shrink-0">→</span>
                                    Los descuentos aplican solo al pagar con dinero en cuenta (billetera Aqua) desde la App.
                                </li>
                            </ul>
                        </div>

                        {currentSubId && (
                            <button
                                onClick={handleCancel}
                                disabled={loadingAction === 'cancel'}
                                className="mt-6 text-xs text-white/40 hover:text-white/80 transition-all flex items-center gap-1.5 mx-auto md:mx-0 group/cancel"
                            >
                                <AlertTriangle className="h-3.5 w-3.5 opacity-50 group-hover/cancel:opacity-100" />
                                <span className="underline underline-offset-4 decoration-white/20 group-hover/cancel:decoration-white/50">{loadingAction === 'cancel' ? 'Procesando baja...' : 'Cancelar mi suscripción'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-16 mb-20">
            <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-5xl font-black text-white drop-shadow-lg tracking-tighter leading-tight">Elegí tu nivel en el Club</h2>
                <p className="text-blue-50 text-lg font-medium tracking-tight max-w-xl mx-auto drop-shadow-md">Unite a la comunidad AquaExpress y llevá el cuidado de tu auto al nivel que te merecés.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {dynamicPlans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                        <div key={plan.id} className={`relative flex flex-col bg-white rounded-[2.5rem] p-1.5 border transition-all duration-700 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-3 ${plan.popular ? 'border-blue-500/30 shadow-2xl scale-[1.03] z-10' : 'border-slate-100 shadow-xl'}`}>
                            {plan.popular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[9px] font-black uppercase tracking-[0.25em] px-6 py-2 rounded-full shadow-2xl z-20 border border-white/10">
                                    ¡MÁS ELEGIDO!
                                </div>
                            )}

                            <div className={`flex-1 p-8 rounded-[calc(2.5rem-6px)] ${plan.bgColor} flex flex-col relative overflow-hidden`}>
                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className={`p-5 rounded-[1.5rem] bg-gradient-to-br ${plan.color} text-white shadow-2xl transform transition-transform group-hover:rotate-6`}>
                                        <Icon size={32} />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">${Math.floor(plan.price)}</div>
                                        <div className="text-[10px] uppercase font-extrabold text-slate-400 mt-1 tracking-widest">por mes</div>
                                    </div>
                                </div>

                                <h3 className={`text-3xl font-black italic mb-4 ${plan.textColor} uppercase tracking-tighter leading-none`}>{plan.name}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium italic opacity-80">{plan.description}</p>

                                <ul className="space-y-4 mb-6 flex-1 relative z-10">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-[13px] font-bold text-slate-600 tracking-tight">
                                            <div className={`h-1.5 w-1.5 rounded-full ${plan.textColor} opacity-40 shadow-sm`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mb-6 p-3 rounded-xl bg-black/5 border border-slate-200">
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Condiciones de uso</p>
                                    <ul className="space-y-1.5">
                                        <li className="text-[10px] text-slate-500 flex items-start gap-1.5 leading-tight">
                                            <span className="text-slate-400 mt-0.5 shrink-0">→</span>
                                            Lavados de cortesía: canjeables solo escaneando QR con la App.
                                        </li>
                                        <li className="text-[10px] text-slate-500 flex items-start gap-1.5 leading-tight">
                                            <span className="text-slate-400 mt-0.5 shrink-0">→</span>
                                            Descuentos: aplican solo al pagar con billetera Aqua desde la App.
                                        </li>
                                        <li className="text-[10px] text-slate-500 flex items-start gap-1.5 leading-tight">
                                            <span className="text-slate-400 mt-0.5 shrink-0">→</span>
                                            {plan.id === 'plata'
                                                ? 'Los lavados no usados al renovar se pierden.'
                                                : 'Al renovar, el 50% de los lavados no usados se acreditan al nuevo período.'}
                                        </li>
                                    </ul>
                                </div>

                                <Button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={loadingAction !== null}
                                    className={`w-full py-5 rounded-[1.25rem] font-bold uppercase tracking-[0.15em] transition-all transform active:scale-95 text-xs ${plan.popular
                                        ? 'bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-2xl shadow-slate-200'
                                        : `bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 shadow-sm`
                                        }`}
                                >
                                    {loadingAction === plan.id ? <Loader2 className="animate-spin h-5 w-5 mx-auto opacity-50" /> : `Ser ${plan.name}`}
                                </Button>

                                <div className="mt-6 flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-60">
                                    <CreditCard className="h-3 w-3 mr-2" /> Seguridad Mercado Pago
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
