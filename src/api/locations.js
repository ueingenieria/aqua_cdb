import client from './client';

export const getLavaderos = async () => {
    try {
        const response = await client.get('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/list_lavaderos/');
        // Legacy filter: l.direccion != 'OCULTO'
        if (response.data && response.data.items) {
            return response.data.items.filter(l => l.direccion !== 'OCULTO');
        }
        return [];
    } catch (error) {
        throw error;
    }
};

// Utils from legacy logued.js
export const calculateDistance = (posActual, posLavadero) => {
    const R = 6371; // Radio de la Tierra en Km
    const degToRad = (deg) => deg * (Math.PI / 180);

    const deltaLat = degToRad(posLavadero.lat - posActual.lat);
    const deltaLon = degToRad(posLavadero.lon - posActual.lon);

    const a = Math.pow(Math.sin(deltaLat / 2), 2);
    const b = (Math.cos(degToRad(posActual.lat)) * Math.cos(degToRad(posLavadero.lat)) * Math.pow((deltaLon / 2), 2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - (a + b)));
    const res = R * c;

    return res;
};

export const findNearestLaundry = (position, lavaderos) => {
    if (!lavaderos || lavaderos.length === 0) return null;

    let minDistance = Infinity;
    let nearest = null;

    lavaderos.forEach(l => {
        // Legacy calculation was modulo based, but haversine (calculateDistance) is better. 
        // Logic in legacy lavaderoCercano used simple euclidian dist squared (modulo function). 
        // We will stick to the better one or emulate legacy if strictly requested.
        // Legacy: ((lat1-lat2)^2 + (lon1-lon2)^2)
        const distSq = Math.pow(position.lat - l.latitud, 2) + Math.pow(position.lon - l.longitud, 2);
        if (distSq < minDistance) {
            minDistance = distSq;
            nearest = l;
        }
    });
    return nearest;
};
