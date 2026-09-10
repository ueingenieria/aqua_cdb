import { openExternal } from '../mobile/navigation';
import { getCurrentPosition } from '../mobile/geolocation';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Navigation, MapPin, DollarSign, Loader2, CreditCard, Wallet, Search, X } from 'lucide-react';
import { getLavaderos, calculateDistance } from '../api/locations';
import { getLavaderoPesosPrice } from '../api/prices';
import { buyCreditsWithBalance, initiateExternalCreditPurchase } from '../api/payment';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { clsx } from 'clsx';
import Swal from 'sweetalert2';

// Reuse map styles and options
const containerStyle = {
    width: '100%',
    height: '100dvh', // Use dynamic viewport height for mobile
    minHeight: '100vh' // Fallback
};

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

export default function CreditsMap() {
    const navigate = useNavigate();
    const locationState = useLocation().state;
    const { user, refreshBalance } = useAuth();
    const [libraries] = useState(['places', 'geometry']);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: 'AIzaSyA88F-102I-6vf11EDKFMvn_WKOjc2eIG4',
        libraries
    });

    const [map, setMap] = useState(null);
    const [lavaderos, setLavaderos] = useState([]);

    const isDefaultLoc = (loc) => {
        if (!loc) return true;
        const def = { lat: -32.890674, lon: -68.839440 };
        return Math.abs(loc.lat - def.lat) < 0.001 && Math.abs((loc.lng || loc.lon) - def.lon) < 0.001;
    };

    const [userLoc, setUserLoc] = useState(isDefaultLoc(locationState?.location) ? null : locationState.location);
    const [selectedLav, setSelectedLav] = useState(null);
    const [hasInitialSelection, setHasInitialSelection] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [priceData, setPriceData] = useState(null);
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [selectedPriceLav, setSelectedPriceLav] = useState(null);
    const [purchaseStep, setPurchaseStep] = useState('none'); // none, quantity, payment
    const [quantity, setQuantity] = useState(1);
    const [processing, setProcessing] = useState(false);
    const carouselRef = useRef(null);
    const isProgrammaticScroll = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const allLavaderos = await getLavaderos();
                // Filtrar duplicados por external_id
                const uniqueLavaderos = Array.from(new Map(allLavaderos.map(item => [item.external_id, item])).values());
                // Filter for Autoservicio (NOT 4D) for Credits
                const creditLavaderos = uniqueLavaderos.filter(l => !l.tipo_lavadero.includes("4D") && l.direccion !== 'OCULTO');
                setLavaderos(creditLavaderos);

                if (!userLoc || isDefaultLoc(userLoc)) {
                    getCurrentPosition(
                        (pos) => {
                            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
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
            return (l.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (l.direccion || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [lavaderos, searchTerm]);

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

                setTimeout(() => {
                    if (carouselRef.current) {
                        const index = filteredLavaderos.findIndex(l => l.external_id === nearest.external_id);
                        if (index !== -1) {
                            const itemWidth = carouselRef.current.children[0]?.offsetWidth || 0;
                            const gap = 16;
                            carouselRef.current.scrollTo({
                                left: index * (itemWidth + gap),
                                behavior: 'smooth'
                            });
                        }
                    }
                }, 500);

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
            setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
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
            const precioPesos = await getLavaderoPesosPrice(lavadero.external_id);
            setPriceData({
                precio: precioPesos !== null ? precioPesos : (lavadero.precio_credito || lavadero.precio)
            });
        } catch (error) {
            console.error(error);
            setPriceData({ precio: lavadero.precio_credito || lavadero.precio });
        } finally {
            setLoadingPrices(false);
        }
    };

    const navigateGoogleMaps = (lavadero) => {
        void openExternal(`https://www.google.com/maps/dir/?api=1&destination=${lavadero.latitud},${lavadero.longitud}`).catch(console.error);
    };

    const handleBuyClick = async (lavadero) => {
        setSelectedLav(lavadero);
        setQuantity(1);
        setProcessing(true);

        try {
            const realPrice = await getLavaderoPesosPrice(lavadero.external_id);
            const updatedLav = {
                ...lavadero,
                real_price: realPrice !== null ? realPrice : (lavadero.precio_credito || lavadero.precio || 0)
            };
            setSelectedLav(updatedLav);
            setPurchaseStep('quantity');

            Swal.fire({
                title: 'Importante',
                html: "Desde acá podés comprar créditos para usar <b>sólo</b> en lavaderos autoservicio (autolavados)<br>No son válidos para lavaderos AquaExpress 4D",
                icon: 'warning',
                confirmButtonText: 'Entendido'
            });
        } catch (error) {
            console.error("Error al obtener precio para compra", error);
            Swal.fire('Error', 'No se pudo obtener el precio actualizado.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirmQuantity = () => {
        setPurchaseStep('payment');
    };

    const handlePayment = async (method) => {
        setProcessing(true);
        const pricePerCredit = parseFloat(selectedLav.real_price || selectedLav.precio_credito || selectedLav.precio || 0);
        const amount = pricePerCredit * quantity;

        if (method === 'balance') {
            const confirm = await Swal.fire({
                title: 'Confirmación',
                html: `Se descontarán <b>$${amount}</b> del saldo en tu cuenta Aqua.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar'
            });

            if (confirm.isConfirmed) {
                Swal.showLoading();
                const result = await buyCreditsWithBalance({
                    email: user.email,
                    amount: amount,
                    quantity: quantity,
                    laundryId: selectedLav.external_id
                });

                if (result.success) {
                    await refreshBalance();
                    Swal.fire('¡Listo!', result.message, 'success');
                    setPurchaseStep('none');
                } else {
                    Swal.fire('Ups!', result.message, 'error');
                }
            }
        } else if (method === 'mercadopago') {
            Swal.showLoading();
            const result = await initiateExternalCreditPurchase({
                email: user.email,
                name: user.name,
                amount: amount,
                quantity: quantity,
                laundryId: selectedLav.external_id
            });

            if (result.success) {
                await openExternal(result.url, { replacePage: true });
            } else {
                Swal.fire('Ups!', result.message, 'error');
            }
        }
        setProcessing(false);
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
        <div className="relative h-screen w-full bg-gray-100">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent space-y-4 pointer-events-none pb-12">
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
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={userLoc ? { lat: userLoc.lat, lng: userLoc.lng || userLoc.lon } : defaultCenter}
                zoom={13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
            >
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
                {filteredLavaderos.map((l, index) => (
                    <Marker
                        key={l.external_id || index}
                        position={{ lat: parseFloat(l.latitud), lng: parseFloat(l.longitud) }}
                        onClick={() => handleMarkerClick(l)}
                        icon={{
                            url: "https://www.aquaexpress.com.ar/aqua4d/images/mapa/icon_lav.png",
                            scaledSize: new window.google.maps.Size(selectedLav?.external_id === l.external_id ? 50 : 40, selectedLav?.external_id === l.external_id ? 50 : 40)
                        }}
                        zIndex={selectedLav?.external_id === l.external_id ? 100 : 1}
                        animation={selectedLav?.external_id === l.external_id ? window.google.maps.Animation.BOUNCE : null}
                    />
                ))}
            </GoogleMap>

            {/* Bottom Carousel */}
            <div className="absolute bottom-24 left-0 right-0 z-10 px-4">
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
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{l.nombre}</h3>
                                        <p className="text-gray-500 text-sm flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {l.direccion}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
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
                                    <Button
                                        onClick={(e) => { e.stopPropagation(); handleBuyClick(l); }}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 h-auto text-sm"
                                    >
                                        Comprar Créditos
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Purchase Modal Overlay */}
            {(purchaseStep === 'quantity' || purchaseStep === 'payment') && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button onClick={() => setPurchaseStep('none')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><X className="h-5 w-5" /></button>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {purchaseStep === 'quantity' ? '¿Cuántos créditos?' : '¿Cómo querés pagar?'}
                        </h2>

                        {purchaseStep === 'quantity' && (
                            <div className="space-y-6 text-center">
                                <p className="text-gray-500">Para {selectedLav?.nombre}</p>
                                <div className="flex items-center justify-center gap-6">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">-</button>
                                    <span className="text-4xl font-black text-primary">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">+</button>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-gray-500 text-sm">Total a pagar</p>
                                    <p className="text-2xl font-bold text-gray-900">${(quantity * (parseFloat(selectedLav.real_price || selectedLav.precio_credito || 0))).toFixed(2)}</p>
                                </div>
                                <Button onClick={handleConfirmQuantity} className="w-full py-3">Continuar</Button>
                            </div>
                        )}

                        {purchaseStep === 'payment' && (
                            <div className="space-y-3 mt-4">
                                <div className="text-center mb-4">
                                    <p className="text-3xl font-bold text-gray-900">${(quantity * (parseFloat(selectedLav.real_price || selectedLav.precio_credito || 0))).toFixed(2)}</p>
                                    <p className="text-gray-400 text-sm">{quantity} créditos para {selectedLav?.nombre}</p>
                                </div>

                                <button
                                    onClick={() => handlePayment('balance')}
                                    disabled={processing}
                                    className="w-full p-4 rounded-xl border-2 border-primary/10 bg-primary/5 hover:bg-primary/10 flex items-center gap-3 transition-colors"
                                >
                                    <div className="bg-primary/20 p-2 rounded-full text-primary"><Wallet className="h-6 w-6" /></div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Dinero en cuenta Aqua</p>
                                        <p className="text-xs text-gray-500">Saldo: ${user.credit}</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handlePayment('mercadopago')}
                                    disabled={processing}
                                    className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-blue-100 hover:bg-blue-50/50 flex items-center gap-3 transition-colors"
                                >
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600"><CreditCard className="h-6 w-6" /></div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Tarjeta / MercadoPago</p>
                                        <p className="text-xs text-gray-500">Débito, Crédito, Efectivo</p>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Price Modal Overlay (Only for Price Check) */}
            {showPriceModal && purchaseStep === 'none' && selectedPriceLav && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button onClick={() => setShowPriceModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><X className="h-5 w-5" /></button>
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{selectedPriceLav.nombre}</h3>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">Autolavado</span>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                            {loadingPrices ? (
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                            ) : (
                                <>
                                    <p className="text-gray-500 text-sm mb-1">Valor de la Ficha / Crédito</p>
                                    <p className="text-3xl font-bold text-blue-600">${priceData?.precio || 'N/A'}</p>
                                </>
                            )}
                        </div>
                        <Button className="w-full mt-6" onClick={() => setShowPriceModal(false)}>Cerrar</Button>
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
