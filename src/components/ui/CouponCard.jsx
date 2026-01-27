import { clsx } from 'clsx';
import { Calendar, MapPin } from 'lucide-react';

export function CouponCard({ coupon, used = false, onClick }) {
    // Parsing legacy data
    const isFreeWash = coupon.tipo_cupon === "SUS";
    const description = isFreeWash
        ? (coupon.observaciones?.split("#")[0] + " Gratis!")
        : coupon.nota;

    return (
        <div
            onClick={onClick}
            className={clsx(
                "relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer group",
                used
                    ? "bg-gray-100 border-gray-200 opacity-80"
                    : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20",
                isFreeWash && !used && "bg-gradient-to-br from-white to-sky-50 border-sky-100"
            )}
        >
            <div className="p-5 flex flex-col h-full justify-between gap-4">
                <div className="space-y-2">
                    <h3 className={clsx("font-bold text-lg", used ? "text-gray-600" : "text-gray-900")}>
                        {coupon.titulo_cupon}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                    {coupon.valido_en && (
                        <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            <span className="truncate">{coupon.valido_en}</span>
                        </div>
                    )}
                    <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>
                            {used ? `Usado: ${coupon.fecha_uso}` : `Vence: ${coupon.fecha_expiracion}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Decorative Circle */}
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        </div>
    );
}
