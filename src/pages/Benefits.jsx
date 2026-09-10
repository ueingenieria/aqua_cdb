import clubImage from '../assets/club.png';
import ClubSubscription from '../components/club/ClubSubscription';

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
        </div>
    );
}
