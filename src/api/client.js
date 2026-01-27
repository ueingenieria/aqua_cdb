import axios from 'axios';

// El servidor rechazó la conexión HTTPS. Revertimos a HTTP para pruebas locales.
// NOTA: Para producción PWA, este servidor DEBE soportar HTTPS o usar un proxy.
const API_BASE_URL = 'http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    },
});

export default client;
