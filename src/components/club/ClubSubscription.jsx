import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSubscriptionStatus, createSubscription } from '../../api/subscription';
import { Loader2, Crown, CheckCircle, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import Swal from 'sweetalert2';

export default function ClubSubscription({ hideIfSubscribed = false }) {
    const { user, subscriptionStatus: globalStatus, refreshSubscriptionStatus } = useAuth();
    const [status, setStatus] = useState(globalStatus || 'loading'); // loading, not_subscribed, pending, authorized, paused, cancelled
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        setStatus(globalStatus);
    }, [globalStatus]);

    useEffect(() => {
        if (globalStatus === 'loading' && user) {
            refreshSubscriptionStatus();
        }
    }, [user, globalStatus]);

    const handleSubscribe = async () => {

        setLoadingAction(true);
        try {
            const res = await createSubscription(user.id, user.email);
            if (res.status === 'OK' && res.init_point) {
                // Redirect to Mercado Pago
                window.location.href = res.init_point;
            } else {
                Swal.fire('Error', 'No se pudo generar el link de pago', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    if (status === 'loading') return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    if (status === 'authorized') {
        if (hideIfSubscribed) return null;

        return (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/10 rounded-full h-32 w-32 blur-2xl"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white/20 p-3 rounded-full">
                        <Crown className="h-8 w-8 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">¡Sos Socio del Club!</h3>
                        <p className="text-blue-100 text-sm">Disfrutá de todos los descuentos exclusivos.</p>
                    </div>
                </div>
            </div>
        );
    }


    // Default: Not subscribed or pending/cancelled
    return (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full hidden md:block">
                        <Crown className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Unite al Club AquaExpress <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500 md:hidden" />
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Conseguí descuentos exclusivos y lavados gratis todos los meses.</p>

                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-bold flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" /> Sin contratos
                            </span>
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-md font-bold flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" /> Cancelá cuando quieras
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col items-center gap-2">
                    <div className="text-center md:text-right mb-2">
                        <span className="text-3xl font-bold text-gray-900">$100</span>
                        <span className="text-gray-500 text-sm">/mes</span>
                    </div>
                    <Button
                        onClick={handleSubscribe}
                        disabled={loadingAction}
                        className="w-full md:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200"
                    >
                        {loadingAction ? <Loader2 className="animate-spin h-5 w-5" /> : 'Suscribirme Ahora'}
                    </Button>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                        <CreditCard className="h-3 w-3 mr-1" /> Procesado por Mercado Pago
                    </div>
                </div>
            </div>
        </div>
    );
}
