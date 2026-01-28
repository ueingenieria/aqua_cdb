import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Navigation, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { getLavaderos } from '../api/locations';

// Styles for the map container
const containerStyle = {
    width: '100%',
    height: '100vh'
};

// Default center (Mendoza)
const defaultCenter = {
    lat: -32.89084,
    lng: -68.82717
};

// Map options to mimic legacy look (disable UI clutter)
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
    const locationState = useLocation().state; // Receive location from Dashboard
    const [libraries] = useState(['places', 'geometry']);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // Clave desde .env
        libraries
    });

    const [map, setMap] = useState(null);
    const [lavaderos, setLavaderos] = useState([]);
    const [userLoc, setUserLoc] = useState(locationState?.location || null);
    const [selectedLav, setSelectedLav] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const carouselRef = useRef(null);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getLavaderos();
                setLavaderos(data);

                // If we didn't get location from state, try to fetch it now
                if (!userLoc) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        (err) => console.log('Location denied', err),
                        { enableHighAccuracy: true }
                    );
                }
            } catch (error) {
                console.error("Error loading lavaderos", error);
            }
        };
        fetchData();
    }, []);

    // Sync map center when selection changes
    useEffect(() => {
        if (selectedLav && map) {
            map.panTo({ lat: parseFloat(selectedLav.latitud), lng: parseFloat(selectedLav.longitud) });
            map.setZoom(16);
        }
    }, [selectedLav, map]);

    // Handle marker click
    const handleMarkerClick = (lavadero, index) => {
        setSelectedLav(lavadero);
        setSelectedIndex(index);

        // Scroll carousel
        if (carouselRef.current) {
            const itemWidth = carouselRef.current.children[0]?.offsetWidth || 0;
            const gap = 16; // 1rem approx
            carouselRef.current.scrollTo({
                left: index * (itemWidth + gap),
                behavior: 'smooth'
            });
        }
    };

    // Handle Carousel Scroll (Manual selection)
    // Simplified: Just tapping on card selects it. Real scroll-spy is complex for this timeframe.
    const handleCardClick = (lavadero, index) => {
        handleMarkerClick(lavadero, index);
    };

    const onLoad = React.useCallback(function callback(map) {
        setMap(map);
        if (userLoc) {
            map.panTo({ lat: userLoc.lat, lng: userLoc.lng || userLoc.lon }); // Handle legacy lon vs lng mix
            map.setZoom(14);
        }
    }, [userLoc]);

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null);
    }, []);

    if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-gray-100"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="relative h-screen w-full bg-gray-100">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <div className="pointer-events-auto flex items-center">
                    <button onClick={() => navigate(-1)} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="ml-4 text-white font-bold text-lg drop-shadow-md">Sucursales</h1>
                </div>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={userLoc ? { lat: userLoc.lat, lng: userLoc.lng || userLoc.lon } : defaultCenter} // Compat with legacy obj
                zoom={13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
            >
                {/* User Location Marker */}
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

                {/* Laundry Markers */}
                {lavaderos.map((l, index) => (
                    <Marker
                        key={l.external_id || index}
                        position={{ lat: parseFloat(l.latitud), lng: parseFloat(l.longitud) }}
                        onClick={() => handleMarkerClick(l, index)}
                        icon={{
                            url: l.tipo_lavadero.includes("4D")
                                ? "https://www.aquaexpress.com.ar/aqua4d/images/mapa/icon_4d.png"
                                : "https://www.aquaexpress.com.ar/aqua4d/images/mapa/icon_lav.png",
                            scaledSize: new window.google.maps.Size(40, 40)
                        }}
                        animation={selectedLav?.external_id === l.external_id ? window.google.maps.Animation.BOUNCE : null}
                    />
                ))}
            </GoogleMap>

            {/* Bottom Carousel */}
            <div className="absolute bottom-6 left-0 right-0 z-10 px-4">
                <div
                    ref={carouselRef}
                    className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
                >
                    {lavaderos.map((l, index) => (
                        <div
                            key={index}
                            onClick={() => handleCardClick(l, index)}
                            className={`min-w-[85vw] md:min-w-[350px] bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border snap-center transition-all duration-300 ${selectedLav?.external_id === l.external_id ? 'border-primary ring-2 ring-primary/30 transform scale-[1.02]' : 'border-white/50'}`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center">
                                        {l.nombre}
                                        {l.tipo_lavadero.includes("4D") && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-bold">4D</span>}
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1 flex items-start gap-1">
                                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                                        {l.direccion}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${l.latitud},${l.longitud}`, '_system');
                                    }}
                                    className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                                >
                                    <Navigation className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Locate Me Button */}
            <button
                onClick={() => {
                    if (userLoc && map) {
                        map.panTo({ lat: userLoc.lat, lng: userLoc.lng || userLoc.lon });
                        map.setZoom(15);
                    }
                }}
                className="absolute bottom-48 right-4 bg-white p-3 rounded-full shadow-lg text-gray-700 hover:text-primary z-10"
            >
                <MapPin className="h-6 w-6" />
            </button>
        </div>
    );
}
