import clubImage from '../assets/club.png';
import ClubSubscription from '../components/club/ClubSubscription';
import { Crown, Gift, Percent } from 'lucide-react';

export default function Benefits() {
    return (
        <div className="p-6 pb-24 animate-in fade-in duration-500">
            <header className="flex items-center justify-between max-w-4xl mx-auto mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Club de Beneficios</h1>
                    <p className="text-white/80">Gestioná tu membresía y disfrutá.</p>
                </div>
                <img src={clubImage} alt="Club Aqua" className="h-16 w-auto object-contain" />
            </header>

            {/* Subscription Card Component */}
            <div className="max-w-4xl mx-auto">
                <ClubSubscription />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-800">
                    <Crown className="h-8 w-8 text-yellow-500 mb-2" />
                    <h3 className="font-bold text-lg">Status Gold</h3>
                    <p className="text-sm text-gray-500">Accedé a filas prioritarias en nuestras sucursales.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-800">
                    <Gift className="h-8 w-8 text-pink-500 mb-2" />
                    <h3 className="font-bold text-lg">Regalos Mensuales</h3>
                    <p className="text-sm text-gray-500">Sorteos exclusivos para miembros activos.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-gray-800">
                    <Percent className="h-8 w-8 text-green-500 mb-2" />
                    <h3 className="font-bold text-lg">Descuentos Extra</h3>
                    <p className="text-sm text-gray-500">50% OFF en tu lavado de cumpleaños.</p>
                </div>
            </div>
        </div>
    );
}
