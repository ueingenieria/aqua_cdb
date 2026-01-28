import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Ticket, Calendar, Search, Smartphone, CreditCard } from 'lucide-react';
import { getUserActivity } from '../api/activity';

export default function Activity() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [filter, setFilter] = useState('todos'); // todos, ingresos, egresos
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            if (user?.email) {
                try {
                    setLoading(true);
                    const data = await getUserActivity(user.email);
                    // The backend now returns a normalized structure:
                    // { id, type, title, amount, date, method, detail }
                    setActivity(data);
                } catch (error) {
                    console.error("Failed to load activity", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchActivity();
    }, [user]);

    const filteredActivity = activity.filter(item => {
        if (filter === 'todos') return true;
        if (filter === 'ingresos') return item.amount > 0;
        if (filter === 'egresos') return item.amount < 0;
        return true;
    });

    const getIcon = (item) => {
        if (item.method === 'QR') return <Smartphone className="h-6 w-6 text-blue-600" />;
        if (item.method === 'RFID') return <CreditCard className="h-6 w-6 text-orange-600" />;
        return <ArrowUpRight className="h-6 w-6 text-red-600" />;
    };

    const getColorClass = (item) => {
        if (item.amount > 0) return 'bg-green-50 border-green-100';
        return 'bg-gray-50 border-gray-200';
    };

    const getAmountColor = (amount) => {
        if (amount > 0) return 'text-green-600';
        return 'text-red-600';
    };

    return (
        <div className="min-h-screen pb-safe-bottom">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 pt-safe-top">
                <div className="flex items-center p-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-700" />
                    </button>
                    <h1 className="ml-2 text-xl font-bold text-gray-900">Actividad</h1>
                </div>

                {/* Filters */}
                <div className="flex px-4 pb-4 gap-2 overflow-x-auto scrollbar-hide">
                    {['todos', 'ingresos', 'egresos'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f
                                ? 'bg-primary text-white shadow-md shadow-primary/30'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10">
                        <p className="text-gray-400">Cargando movimientos...</p>
                    </div>
                ) : filteredActivity.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No se encontraron movimientos.</p>
                    </div>
                ) : (
                    filteredActivity.map((item) => (
                        <div key={item.id} className={`p-4 rounded-2xl border flex items-center gap-4 ${getColorClass(item)} transition-all hover:scale-[1.01] active:scale-[0.99]`}>
                            <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                                {getIcon(item)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 truncate">{item.title}</h3>
                                    <span className={`font-bold ${getAmountColor(item.amount)}`}>
                                        {item.amount > 0 ? '+' : ''}{item.amount}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    {item.date} • {item.method}
                                </p>
                                {(item.detail) && (
                                    <p className="text-xs text-gray-400 mt-0.5 truncate uppercase">
                                        {item.detail}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
}
