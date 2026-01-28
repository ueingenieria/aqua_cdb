import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Calendar, ChevronRight } from 'lucide-react';
import { getNews } from '../api/news';

export default function News() {
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await getNews();
                setNews(data);

                // Mark as read in localStorage
                if (data.length > 0) {
                    const latestId = data[0].id; // Assuming ID is incremental or date based
                    localStorage.setItem('last_read_news_id', latestId);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' }).format(date);
    };

    return (
        <div className="min-h-screen pb-safe-bottom">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 pt-safe-top">
                <div className="flex items-center p-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="h-6 w-6 text-gray-700" />
                    </button>
                    <h1 className="ml-2 text-xl font-bold text-gray-900">Novedades</h1>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Cargando novedades...</div>
                ) : news.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4">
                            <Bell className="h-8 w-8" />
                        </div>
                        <p className="text-gray-500 font-medium">No hay novedades por ahora</p>
                    </div>
                ) : (
                    news.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedNews(item)}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform cursor-pointer"
                        >
                            {item.imagen_url && (
                                <div className="h-32 w-full overflow-hidden">
                                    <img src={item.imagen_url} alt={item.titulo} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        Novedad
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(item.fecha_publicacion)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{item.titulo}</h3>
                                {item.subtitulo && <p className="text-sm text-gray-600 mb-2 font-medium">{item.subtitulo}</p>}
                                <p className="text-sm text-gray-500 line-clamp-2">{item.cuerpo || item.descripcion}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {selectedNews && (
                <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
                    <div className="relative h-64 w-full bg-gray-900 shrink-0">
                        {selectedNews.imagen_url ? (
                            <img src={selectedNews.imagen_url} alt={selectedNews.titulo} className="w-full h-full object-cover opacity-80" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
                                <Bell className="h-20 w-20 text-white/20" />
                            </div>
                        )}
                        <button
                            onClick={() => setSelectedNews(null)}
                            className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/30 pt-safe-top-forced"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 -mt-6 bg-white rounded-t-3xl relative">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {formatDate(selectedNews.fecha_publicacion)}
                        </span>

                        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">{selectedNews.titulo}</h2>
                        {selectedNews.subtitulo && (
                            <p className="text-lg text-gray-600 font-medium mb-6">{selectedNews.subtitulo}</p>
                        )}

                        <div className="prose prose-blue text-gray-600">
                            {/* Simple rendering of text/paragraphs */}
                            {selectedNews.cuerpo ? selectedNews.cuerpo.split('\n').map((p, i) => (
                                <p key={i} className="mb-4">{p}</p>
                            )) : (
                                <p>{selectedNews.descripcion}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
