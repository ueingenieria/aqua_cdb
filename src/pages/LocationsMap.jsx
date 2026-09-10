import { openExternal } from '../mobile/navigation';
import { getCurrentPosition } from '../mobile/geolocation';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Navigation, MapPin, Search, Filter, DollarSign, Loader2, X, Car, Sparkles } from 'lucide-react';
import { getLavaderos, calculateDistance } from '../api/locations';
import { get4DPrices, getLavaderoPesosPrice } from '../api/prices';
import { clsx } from 'clsx';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// Styles for the map container
const containerStyle = {
    width: '100%',
    height: '100dvh', // Use dynamic viewport height for mobile
    minHeight: '100vh' // Fallback
};

// Default center (Mendoza)
const defaultCenter = {
    lat: -32.89084,
    lng: -68.82717
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        }
    ]
};

export default function LocationsMap() {
    const navigate = useNavigate();
    const locationState = useLocation().state;
    const [libraries] = useState(['places', 'geometry']);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries
    });

    const [map, setMap] = useState(null);
    const [lavaderos, setLavaderos] = useState([]);

    // Check if initial location is the "default" one from Dashboard
    const isDefaultLoc = (loc) => {
        if (!loc) return true;
        const def = { lat: -32.890674, lon: -68.839440 };
        return Math.abs(loc.lat - def.lat) < 0.001 && Math.abs((loc.lng || loc.lon) - def.lon) < 0.001;
    };

    const [userLoc, setUserLoc] = useState(isDefaultLoc(locationState?.location) ? null : locationState.location);
    const [selectedLav, setSelectedLav] = useState(null);
    const [hasInitialSelection, setHasInitialSelection] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, autolavado, 4d
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [priceData, setPriceData] = useState(null);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [selectedPriceLav, setSelectedPriceLav] = useState(null);

    const carouselRef = useRef(null);
    const isProgrammaticScroll = useRef(false);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getLavaderos();
                // Filtrar duplicados por external_id
                const uniqueLavaderos = Array.from(new Map(data.map(item => [item.external_id, item])).values());
                setLavaderos(uniqueLavaderos.filter(l => l.direccion !== 'OCULTO'));

                if (!userLoc || isDefaultLoc(userLoc)) {
                    getCurrentPosition(
                        (pos) => {
                            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                            console.log("GPS Real obtenido:", newLoc);
                            setUserLoc(newLoc);
                        },
                        (err) => console.log('Location denied or timeout', err),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                }
            } catch (error) {
                console.error("Error loading lavaderos", error);
            }
        };
        fetchData();
    }, []);

    // Filter Logic
    const filteredLavaderos = useMemo(() => {
        return lavaderos.filter(l => {
            const matchesSearch = (l.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (l.direccion || '').toLowerCase().includes(searchTerm.toLowerCase());

            if (filterType === 'all') return matchesSearch;
            if (filterType === 'autolavado') return matchesSearch && !l.tipo_lavadero.includes('4D');
            if (filterType === '4d') return matchesSearch && l.tipo_lavadero.includes('4D');
            return matchesSearch;
        });
    }, [lavaderos, searchTerm, filterType]);

    // Auto-select nearest laundry when data is ready
    // Initial center on user as soon as location and map are ready
    useEffect(() => {
        if (map && userLoc && !hasInitialSelection) {
            map.panTo({ lat: userLoc.lat, lng: userLoc.lng || userLoc.lon });
            map.setZoom(15);
        }
    }, [map, userLoc, hasInitialSelection]);

    // Auto-select nearest laundry when data is ready
    useEffect(() => {
        if (lavaderos.length > 0 && userLoc && !hasInitialSelection) {
            let nearest = null;
            let minDist = Infinity;

            lavaderos.forEach(l => {
                const dist = calculateDistance(userLoc, { lat: l.latitud, lng: l.longitud });
                if (dist < minDist) {
                    minDist = dist;
                    nearest = l;
                }
            });

            if (nearest) {
                setSelectedLav(nearest);
                const index = filteredLavaderos.findIndex(l => l.external_id === nearest.external_id);

                setTimeout(() => {
                    if (carouselRef.current && index !== -1) {
                        const itemWidth = carouselRef.current.children[0]?.offsetWidth || 0;
                        const gap = 16;
                        carouselRef.current.scrollTo({
                            left: index * (itemWidth + gap),
                            behavior: 'smooth'
                        });
                    }
                }, 500);

                // Set this ONLY after we have both centered and selected
                if (map) setHasInitialSelection(true);
            }
        }
    }, [lavaderos, userLoc, hasInitialSelection, map, filteredLavaderos]);

    // Scroll Spy Logic
    useEffect(() => {
        const handleScroll = () => {
            if (isProgrammaticScroll.current) return;
            if (!carouselRef.current) return;

            const container = carouselRef.current;
            const scrollLeft = container.scrollLeft;
            const itemWidth = container.children[0]?.offsetWidth || 0;
            const gap = 16;
            const index = Math.round(scrollLeft / (itemWidth + gap));

            if (filteredLavaderos[index] && filteredLavaderos[index].external_id !== selectedLav?.external_id) {
                const lav = filteredLavaderos[index];
                setSelectedLav(lav);
                if (map) {
                    map.panTo({ lat: parseFloat(lav.latitud), lng: parseFloat(lav.longitud) });
                }
            }
        };

        const container = carouselRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [filteredLavaderos, map, selectedLav]);

    // Handle marker click
    const handleMarkerClick = (lavadero) => {
        setSelectedLav(lavadero);

        const index = filteredLavaderos.findIndex(l => l.external_id === lavadero.external_id);

        if (index !== -1 && carouselRef.current) {
            isProgrammaticScroll.current = true;
            const itemWidth = carouselRef.current.children[0]?.offsetWidth || 0;
            const gap = 16;

            carouselRef.current.scrollTo({
                left: index * (itemWidth + gap),
                behavior: 'smooth'
            });

            setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 500);
        }

        if (map) {
            const lat = parseFloat(lavadero.latitud);
            const lng = parseFloat(lavadero.longitud);
            if (!isNaN(lat) && !isNaN(lng)) {
                map.panTo({ lat, lng });
                map.setZoom(16);
            }
        }
    };

    const handleViewPrices = async (lavadero) => {
        setSelectedPriceLav(lavadero);
        setShowPriceModal(true);
        setPriceData(null);
        setLoadingPrices(true);
        try {
            if (lavadero.tipo_lavadero.includes('4D')) {
                const prices = await get4DPrices(lavadero.external_id);
                setPriceData(prices);
            } else {
                const precioPesos = await getLavaderoPesosPrice(lavadero.external_id);
                setPriceData({
                    precio: precioPesos !== null ? precioPesos : (lavadero.precio_credito || lavadero.precio),
                    isPesos: precioPesos !== null
                });
            }
        } catch (error) {
            console.error(error);
            setPriceData({ error: "No se pudieron cargar los precios." });
        } finally {
            setLoadingPrices(false);
        }
    };

    const navigateGoogleMaps = (lavadero) => {
        void openExternal(`https://www.google.com/maps/dir/?api=1&destination=${lavadero.latitud},${lavadero.longitud}`).catch(console.error);
    };

    const onLoad = React.useCallback(function callback(map) {
        setMap(map);
        if (userLoc) {
            map.panTo({ lat: userLoc.lat, lng: userLoc.lng || userLoc.lon });
            map.setZoom(15);
        }
    }, [userLoc]);

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null);
    }, []);

    if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-gray-100"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="relative h-screen w-full bg-gray-100 font-sans">
            {/* Header & Controls Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent space-y-4 pointer-events-none pb-12">

                {/* Top Row: Back & Search */}
                <div className="pointer-events-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition-colors shrink-0">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar sucursal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/95 backdrop-blur-md rounded-xl py-2.5 pl-9 pr-4 text-sm shadow-lg border-0 focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setFilterType('all')}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all border flex items-center gap-1.5 shadow-sm whitespace-nowrap",
                            filterType === 'all'
                                ? "bg-primary text-white border-primary"
                                : "bg-white/90 text-gray-600 border-white/50 hover:bg-white"
                        )}
                    >
                        <Filter className="h-3 w-3" />
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterType('autolavado')}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all border flex items-center gap-1.5 shadow-sm whitespace-nowrap",
                            filterType === 'autolavado'
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white/90 text-gray-600 border-white/50 hover:bg-white"
                        )}
                    >
                        <Car className="h-3 w-3" />
                        Autolavado
                    </button>
                    <button
                        onClick={() => setFilterType('4d')}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all border flex items-center gap-1.5 shadow-sm whitespace-nowrap",
                            filterType === '4d'
                                ? "bg-violet-600 text-white border-violet-600"
                                : "bg-white/90 text-gray-600 border-white/50 hover:bg-white"
                        )}
                    >
                        <Sparkles className="h-3 w-3" />
                        Aqua 4D
                    </button>
                </div>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={userLoc ? { lat: userLoc.lat, lng: userLoc.lng || userLoc.lon } : defaultCenter}
                zoom={13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
            >
                {/* User Mark */}
                {userLoc && (
                    <Marker
                        position={{ lat: userLoc.lat, lng: userLoc.lng || userLoc.lon }}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#4285F4",
                            fillOpacity: 1,
                            strokeColor: "white",
                            strokeWeight: 2,
                        }}
                        zIndex={999}
                    />
                )}

                {/* Filtered Markers */}
                {filteredLavaderos.map((l) => (
                    <Marker
                        key={l.external_id}
                        position={{ lat: parseFloat(l.latitud), lng: parseFloat(l.longitud) }}
                        onClick={() => handleMarkerClick(l)}
                        icon={{
                            url: l.tipo_lavadero.includes("4D")
                                ? "https://www.aquaexpress.com.ar/aqua4d/images/mapa/icon_4d.png"
                                : "https://www.aquaexpress.com.ar/aqua4d/images/mapa/icon_lav.png",
                            scaledSize: new window.google.maps.Size(selectedLav?.external_id === l.external_id ? 50 : 40, selectedLav?.external_id === l.external_id ? 50 : 40)
                        }}
                        zIndex={selectedLav?.external_id === l.external_id ? 100 : 1}
                        animation={selectedLav?.external_id === l.external_id ? window.google.maps.Animation.BOUNCE : null}
                    />
                ))}
            </GoogleMap>

            {/* Bottom Carousel */}
            <div className="absolute bottom-20 left-0 right-0 z-10 px-4">
                <div
                    ref={carouselRef}
                    className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
                >
                    {filteredLavaderos.length === 0 ? (
                        <div className="w-full bg-white/90 backdrop-blur-md p-4 rounded-xl text-center text-gray-500 text-sm shadow-lg">
                            No se encontraron sucursales con estos filtros.
                        </div>
                    ) : (
                        filteredLavaderos.map((l) => (
                            <div
                                key={l.external_id}
                                onClick={() => handleMarkerClick(l)}
                                className={clsx(
                                    "min-w-[85vw] md:min-w-[350px] bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border snap-center transition-all duration-300",
                                    selectedLav?.external_id === l.external_id
                                        ? "border-primary ring-2 ring-primary/30 transform scale-[1.02]"
                                        : "border-white/50 opacity-90 scale-95"
                                )}
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-bold text-gray-900 text-lg flex items-center">
                                            {l.nombre}
                                            {l.tipo_lavadero.includes("4D") && (
                                                <span className="ml-2 text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200 font-bold flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3" /> 4D
                                                </span>
                                            )}
                                        </h3>
                                    </div>
                                    <p className="text-gray-500 text-sm flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {l.direccion}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); navigateGoogleMaps(l); }}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 h-auto"
                                        >
                                            <Navigation className="h-3 w-3 mr-1" /> Ir
                                        </Button>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); handleViewPrices(l); }}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 h-auto"
                                        >
                                            <DollarSign className="h-3 w-3 mr-1" /> Precios
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal de Precios */}
            {showPriceModal && selectedPriceLav && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button
                            onClick={() => setShowPriceModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{selectedPriceLav.nombre}</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${selectedPriceLav.tipo_lavadero.includes('4D') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {selectedPriceLav.tipo_lavadero.includes('4D') ? 'Aqua 4D' : 'Autolavado'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {!selectedPriceLav.tipo_lavadero.includes('4D') ? (
                                // Autolavado logic (Precio Unico)
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                    {loadingPrices ? (
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                                    ) : (
                                        <>
                                            <p className="text-gray-500 text-sm mb-1">{priceData?.isPesos ? 'Valor de la Ficha' : 'Valor del Crédito'}</p>
                                            <p className="text-3xl font-bold text-blue-600">
                                                ${priceData?.precio || 'N/A'}
                                            </p>
                                        </>
                                    )}
                                </div>
                            ) : (
                                // 4D Logic (Tabla de precios)
                                <div className="space-y-3">
                                    {loadingPrices ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                            <p className="text-sm">Cargando precios...</p>
                                        </div>
                                    ) : priceData?.error ? (
                                        <div className="text-center p-4 bg-red-50 text-red-500 rounded-xl">
                                            <p>{priceData.error}</p>
                                        </div>
                                    ) : priceData ? (
                                        <>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-700">Lavado Rápido</span>
                                                <span className="font-bold text-gray-900">${priceData.lavado_rapido}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium text-gray-700">Lavado Express</span>
                                                <span className="font-bold text-gray-900">${priceData.lavado_express}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-purple-100 bg-purple-50/50">
                                                <span className="font-medium text-purple-900">Lavado Full</span>
                                                <span className="font-bold text-purple-700">${priceData.lavado_full}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-purple-200 bg-purple-100/50">
                                                <span className="font-medium text-purple-900">Lavado Extra Full</span>
                                                <span className="font-bold text-purple-700">${priceData.lavado_extra_full}</span>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <Button className="w-full" onClick={() => setShowPriceModal(false)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Locate Me Button */}
            <button
                onClick={() => {
                    if (userLoc && map) {
                        map.panTo({ lat: userLoc.lat, lng: userLoc.lng || userLoc.lon });
                        map.setZoom(15);
                    }
                }}
                className="absolute bottom-80 right-4 bg-white p-3 rounded-full shadow-lg text-gray-700 hover:text-primary z-10 active:scale-90 transition-transform"
            >
                <MapPin className="h-6 w-6" />
            </button>
        </div>
    );
}
