import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPromotions, redeemPoints } from '../api/promotions';
import { Button } from '../components/ui/Button';
import { Loader2, ArrowLeft, Star, Lock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Redeem() {
    const { user, refreshBalance, subscriptionStatus } = useAuth();
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        refreshBalance();
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const data = await getPromotions();
            if (data && data.items) {
                // Sort by points needed (ascending)
                const sorted = data.items.sort((a, b) => parseInt(a.puntos_necesarios) - parseInt(b.puntos_necesarios));
                setPromotions(sorted);
            }
        } catch (error) {
            console.error("Error loading promotions", error);
            Swal.fire('Error', 'No pudimos cargar las promociones. Intentá más tarde.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (promo) => {
        // Exclusive check
        if (promo.exclusivo === "SI" && subscriptionStatus?.status !== 'authorized') {
            Swal.fire({
                title: 'Exclusivo Club Aqua',
                html: `
                    <div class="space-y-4">
                        <p>Este beneficio es exclusivo para miembros del Club.</p>
                        <p class="text-sm text-gray-500">Suscribite para acceder a descuentos y beneficios únicos.</p>
                    </div>
                `,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Ver Club',
                cancelButtonText: 'Cerrar'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/beneficios');
                }
            });
            return;
        }

        // Points check
        const userPoints = parseInt(user.points || 0);
        const promoPoints = parseInt(promo.puntos_necesarios);

        if (userPoints < promoPoints) {
            Swal.fire({
                title: 'Puntos insuficientes',
                text: `Necesitas ${promoPoints} puntos para este canje. Tenés ${userPoints}.`,
                icon: 'warning',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        // Confirmation
        const result = await Swal.fire({
            title: '¿Confirmar canje?',
            html: `Vas a canjear <b>${promoPoints} pts</b> por <br/><b>${promo.descripcion}</b>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Canjear!',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    const response = await redeemPoints(user.email, promo.id_producto);
                    return response;
                } catch (error) {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                }
            }
        });

        if (result.isConfirmed) {
            const text = typeof result.value === 'string' ? result.value : JSON.stringify(result.value);

            if (text.includes("correctamente")) {
                await refreshBalance();
                Swal.fire('¡Canje exitoso!', 'Podés ver tu cupón en la sección "Cupones".', 'success');
            } else if (text.includes("suficientes")) {
                Swal.fire('Error', 'No tenés puntos suficientes.', 'error');
            } else {
                Swal.fire('Error', 'Ocurrió un error al procesar el canje.', 'error');
            }
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 pb-24 max-w-4xl mx-auto min-h-screen animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-4 -mx-6 px-6 border-b border-gray-200/50">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="h-6 w-6 text-gray-700" />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-gray-900">Beneficios Aqua</h1>
                </div>
                <div className="w-10"></div> {/* Spacer for centering */}
            </header>

            {/* Points Summary */}
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                    <span className="text-blue-100 text-sm font-medium mb-1">Tus Puntos Acumulados</span>
                    <span className="text-4xl font-bold tracking-tight">{user.points || 0}</span>
                </div>
                <Star className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10 rotate-12" />
                <Star className="absolute top-4 left-4 h-6 w-6 text-yellow-300 animate-pulse" />
            </div>

            {/* Promotions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promotions.map((promo) => {
                    const userPoints = parseInt(user.points || 0);
                    const promoPoints = parseInt(promo.puntos_necesarios);
                    const canAfford = userPoints >= promoPoints;
                    const isExclusive = promo.exclusivo === "SI";
                    const isMember = subscriptionStatus?.status === 'authorized';
                    const isLocked = isExclusive && !isMember;

                    return (
                        <div
                            key={promo.id_producto}
                            onClick={() => handleRedeem(promo)}
                            className={`
                                relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 
                                transition-all duration-300 hover:shadow-md cursor-pointer group
                                ${!canAfford ? 'opacity-75 grayscale-[0.5]' : ''}
                            `}
                        >
                            {/* Image Aspect Ratio Container */}
                            <div className="aspect-[16/9] w-full bg-white relative overflow-hidden flex items-center justify-center p-4">
                                {promo.image ? (
                                    <img
                                        src={`data:image/png;base64,${promo.image}`}
                                        alt={promo.descripcion}
                                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Star className="h-12 w-12" />
                                    </div>
                                )}

                                {isLocked && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
                                            <Lock className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <h3 className="font-bold text-gray-900 line-clamp-2">{promo.descripcion}</h3>
                                    {isExclusive && (
                                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border border-yellow-200">
                                            Club
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5em]">{promo.nota}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className={`font-bold text-lg ${canAfford ? 'text-primary' : 'text-gray-400'}`}>
                                        {promoPoints} pts
                                    </span>
                                    {canAfford && !isLocked && (
                                        <Button size="sm" variant="outline" className="rounded-full px-4 h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white">
                                            Canjear
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {promotions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>No hay promociones disponibles en este momento.</p>
                </div>
            )}
        </div>
    );
}
