import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCoupons, validateCouponCode, redeemCoupon } from '../api/coupons';
import { CouponCard } from '../components/ui/CouponCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, TicketX, Plus, X, Copy } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { clsx } from 'clsx';

export default function Coupons() {
    const { user } = useAuth();
    const [coupons, setCoupons] = useState({ active: [], used: [] });
    const [loading, setLoading] = useState(true);

    // Manual Entry State
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState('input');
    const [manualCode, setManualCode] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [foundCoupon, setFoundCoupon] = useState(null);
    const [redeemResult, setRedeemResult] = useState(null);

    // Detail Modal State
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    const fetchCoupons = async () => {
        try {
            const data = await getCoupons(user.email);
            if (data && data.items) {
                const active = data.items.filter(c => c.usado === "NO");
                const used = data.items.filter(c => c.usado === "SI");
                setCoupons({ active, used });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.email) fetchCoupons();
    }, [user]);

    // Handlers
    const resetModal = () => {
        setShowModal(false);
        setStep('input');
        setManualCode('');
        setFoundCoupon(null);
        setRedeemResult(null);
        setActionLoading(false);
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (manualCode.length < 4) return alert("El código debe tener al menos 4 caracteres");

        setActionLoading(true);
        try {
            const coupon = await validateCouponCode(manualCode);
            if (coupon) {
                setFoundCoupon(coupon);
                setStep('confirm');
            } else {
                alert("No pudimos encontrar el cupón. Revisa el código e intenta nuevamente.");
            }
        } catch (err) {
            alert("Error al validar cupón");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRedeemConfirm = async () => {
        if (!foundCoupon) return;
        setActionLoading(true);
        try {
            const result = await redeemCoupon(user.email, foundCoupon.id_producto);
            const resText = typeof result === 'string' ? result : JSON.stringify(result);

            if (resText.includes("correctamente") || resText.includes("CORRECTAMENTE")) {
                setRedeemResult({ success: true, message: "¡Canje exitoso! Podes encontrar el cupón en 'Disponibles'" });
                setStep('result');
                fetchCoupons();
            } else if (resText.includes("suficientes") || resText.includes("SUFICIENTES")) {
                setRedeemResult({ success: false, message: "No tenés puntos suficientes para este canje." });
                setStep('result');
            } else {
                setRedeemResult({ success: false, message: "Hubo un error técnico. Intente nuevamente." });
                setStep('result');
            }

        } catch (err) {
            setRedeemResult({ success: false, message: "Error de conexión." });
            setStep('result');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 relative min-h-screen pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Mis Cupones</h1>
                    <p className="text-white/80">Administrá tus descuentos y promociones</p>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-gray-500 font-bold">
                    <TicketX className="h-6 w-6" />
                </div>
            </header>

            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-200/50 p-1">
                    {['Disponibles', 'Usados'].map((category) => (
                        <Tab
                            key={category}
                            className={({ selected }) =>
                                clsx(
                                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all',
                                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-primary focus:outline-none focus:ring-2',
                                    selected
                                        ? 'bg-white shadow text-primary'
                                        : 'text-gray-500 hover:bg-white/[0.12] hover:text-gray-900'
                                )
                            }
                        >
                            {category}
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="mt-2">
                    <Tab.Panel className={clsx('rounded-xl p-3', 'ring-white ring-opacity-60 ring-offset-2 ring-offset-primary focus:outline-none focus:ring-2')}>
                        {coupons.active.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {coupons.active.map((c, i) => (
                                    <CouponCard key={i} coupon={c} onClick={() => setSelectedCoupon(c)} />
                                ))}
                            </div>
                        )}
                    </Tab.Panel>
                    <Tab.Panel className={clsx('rounded-xl p-3', 'ring-white ring-opacity-60 ring-offset-2 ring-offset-primary focus:outline-none focus:ring-2')}>
                        {coupons.used.length === 0 ? (
                            <EmptyState message="No tenés cupones usados" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {coupons.used.map((c, i) => (
                                    <CouponCard key={i} coupon={c} used onClick={() => setSelectedCoupon(c)} />
                                ))}
                            </div>
                        )}
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

            {/* FAB Add Coupon */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-24 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-20"
            >
                <Plus className="h-8 w-8" />
            </button>

            {/* Modal Manual Entry */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Ingresar Código</h3>
                            <button onClick={resetModal}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <div className="p-6">
                            {step === 'input' && (
                                <form onSubmit={handleVerify} className="space-y-4">
                                    <Input
                                        placeholder="INGRESÁ EL CÓDIGO"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        className="text-center font-mono text-xl tracking-widest uppercase"
                                        autoFocus
                                    />
                                    <Button type="submit" className="w-full" disabled={actionLoading || manualCode.length < 3}>
                                        {actionLoading ? <Loader2 className="animate-spin" /> : 'Validar Cupón'}
                                    </Button>
                                </form>
                            )}
                            {step === 'confirm' && foundCoupon && (
                                <div className="space-y-4 text-center">
                                    <div className="bg-green-50 p-4 rounded-xl">
                                        <h4 className="font-bold text-lg text-green-800">{foundCoupon.descripcion}</h4>
                                        <p className="text-sm text-green-600 mt-1">{foundCoupon.nota}</p>
                                    </div>
                                    <p className="text-gray-600">¿Deseas agregar este cupón ahora?</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="secondary" onClick={() => setStep('input')}>Cancelar</Button>
                                        <Button onClick={handleRedeemConfirm} disabled={actionLoading}>
                                            {actionLoading ? <Loader2 className="animate-spin" /> : 'Agregar!'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {step === 'result' && redeemResult && (
                                <div className="space-y-4 text-center">
                                    <div className={`p-4 rounded-xl ${redeemResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        <p className="font-bold">{redeemResult.success ? '¡Éxito!' : 'Error'}</p>
                                        <p className="text-sm mt-1">{redeemResult.message}</p>
                                    </div>
                                    <Button onClick={resetModal} className="w-full">Cerrar</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Coupon */}
            {selectedCoupon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in zoom-in duration-200 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                        <button
                            onClick={() => setSelectedCoupon(null)}
                            className="absolute top-4 right-4 bg-gray-100 rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-8 flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                                <TicketX className="h-10 w-10" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                                    {selectedCoupon.titulo_cupon || 'Cupón'}
                                </h3>
                                <p className="text-gray-500 mt-2 text-sm">{selectedCoupon.nota || selectedCoupon.observaciones}</p>
                            </div>

                            <div className="w-full space-y-2">
                                <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Código de Canje</p>
                                <div className="bg-gray-100 p-4 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-3 group relative cursor-pointer active:scale-95 transition-transform"
                                    onClick={() => { navigator.clipboard.writeText(selectedCoupon.codigo_de_cambio); alert("Copiado!") }}
                                >
                                    <span className="text-2xl font-mono font-bold text-gray-800 tracking-widest">
                                        {selectedCoupon.codigo_de_cambio || '----'}
                                    </span>
                                    <Copy className="h-4 w-4 text-gray-400 absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-xs text-gray-400">Presentá este código en la sucursal</p>
                            </div>

                            {selectedCoupon.valido_en && (
                                <div className="bg-yellow-50 text-yellow-800 text-xs py-2 px-4 rounded-lg font-medium w-full">
                                    Válido en: {selectedCoupon.valido_en}
                                </div>
                            )}

                            {selectedCoupon.fecha_expiracion && (
                                <p className="text-xs text-gray-400">
                                    Vence el {selectedCoupon.fecha_expiracion}
                                </p>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t">
                            <Button className="w-full" onClick={() => setSelectedCoupon(null)}>
                                Entendido
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState({ message = "No tenés cupones disponibles" }) {
    // ... same as before
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="p-4 bg-gray-50 rounded-full">
                <TicketX className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">{message}</p>
        </div>
    )
}
