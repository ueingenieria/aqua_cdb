import axios from 'axios';
import { requestForToken } from '../firebase';
import { platform } from '../mobile/platform';

export const savePushToken = async (userId = null, requestPermission = false) => {
    try {
        const token = await requestForToken(requestPermission);
        if (!token) return false;

        const params = new URLSearchParams();
        params.append('accion', '82'); // Cambiado de 80 a 82 para evitar conflicto con precios
        params.append('token', token);
        if (userId) {
            params.append('id_cliente', userId);
        }
        params.append('platform', platform());

        // Usamos axios con URLSearchParams para que PHP lo reciba correctamente en $_POST
        const response = await axios.post('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.data === 'OK') {
            console.log('Token push guardado correctamente (Acción 82)');
            return true;
        } else {
            throw new Error('No se pudieron activar las notificaciones. Intentá nuevamente.');
        }

    } catch (error) {
        console.error("Error saving push token:", error);
        throw error;
    }
};
