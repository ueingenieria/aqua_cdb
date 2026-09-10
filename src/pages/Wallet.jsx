import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createRechargePreference } from '../api/wallet';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, CreditCard, Award } from 'lucide-react';
import cardBg from '../assets/card_bg_final.png';
import { openExternal } from '../mobile/navigation';

export default function Wallet() {
    const { user, subscriptionStatus } = useAuth();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);



    const handleRecharge = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await createRechargePreference(user.email, amount, user.name);

            let url = "";
            if (typeof result === 'string') url = result;
            else if (result.init_point) url = result.init_point;

            if (url && (url.startsWith('http') || url.startsWith('mpshare'))) {
                await openExternal(url, { replacePage: true });
            } else {
                alert("Error al iniciar pago: Respuesta inválida");
            }

        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Billetera Virtual</h1>
                    <p className="text-white/80">Recargá saldo para usar en lavaderos</p>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-gray-500 font-bold">
                    <CreditCard className="h-6 w-6" />
                </div>
            </header>

            {/* Tarjeta Personalizada con Imagen de Fondo */}
            <div
                className="relative h-56 w-full max-w-sm mx-auto rounded-xl shadow-2xl overflow-hidden transition-all hover:scale-[1.02] duration-300 transform-gpu"
                style={{
                    backgroundImage: `url(${cardBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                }}
            >
                {/* Overlay eliminado para mayor claridad del diseño limpio */}

                <div className="relative z-10 p-6 flex flex-col justify-between h-full font-sans">

                    {/* Sección Superior: Saldo (Sobre fondo Azul/Celeste) */}
                    <div className="mt-0">
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-0 opacity-90"
                            style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>
                            Saldo Actual
                        </p>
                        <h2 className="text-5xl font-black tracking-tighter text-white"
                            style={{
                                textShadow: '2px 2px 0px #0e7490, 4px 4px 0px rgba(0,0,0,0.2)',
                                WebkitTextStroke: '1px rgba(255,255,255,0.2)'
                            }}>
                            ${user.credit || '0.00'}
                        </h2>
                    </div>

                    {/* Sección Inferior: Datos del Usuario (Sobre fondo Blanco) */}
                    <div className="flex flex-col justify-end h-full mb-1">
                        <div>
                            <p className="font-mono text-sm tracking-widest uppercase text-gray-800 font-bold truncate max-w-[250px] mb-0.5">
                                {user.name} {user.surname}
                            </p>
                            <p className="font-mono text-xs tracking-[0.15em] text-gray-500 font-medium">
                                {user.tag && user.tag !== '-' ? user.tag : '•••• •••• •••• ••••'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Info Badge in Wallet */}
            {subscriptionStatus?.status === 'authorized' && (
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-xl border border-orange-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-500/10 p-2 rounded-full text-orange-600">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Beneficio Club Aqua</p>
                            <p className="text-sm font-medium text-orange-900">Tenés <strong>{subscriptionStatus.lavados_disponibles} lavados</strong> gratis.</p>
                            <p className="text-[10px] text-orange-600 mt-0.5">Solo pagando con la App a través del QR</p>
                        </div>
                    </div>
                </div>
            )}



            {/* Sección Recarga con Mejor Contraste */}
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50">
                <h3 className="font-bold text-gray-800 text-lg mb-4">Recargar Saldo</h3>
                <form onSubmit={handleRecharge} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-600">Monto a cargar</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500 font-bold text-lg">$</span>
                            <Input
                                type="number"
                                min="100"
                                step="100"
                                placeholder="1000"
                                className="pl-8 h-12 text-lg font-medium border-gray-200 focus:border-primary focus:ring-primary/20 bg-gray-50/50"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={loading || !amount}>
                        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Ir a Pagar
                    </Button>
                </form>
            </div>
        </div>
    )
}
