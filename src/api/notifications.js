import axios from 'axios';
import { requestForToken } from '../firebase';
import { platform } from '../mobile/platform';
import { legacyUserId, pushRegistrationParams } from './user-id.mjs';

export const savePushToken = async (userId = null, requestPermission = false) => {
    try {
        if (!legacyUserId({ p_id_cliente: userId })) return false;
        const token = await requestForToken(requestPermission);
        if (!token) return false;

        const params = pushRegistrationParams(token, userId, platform());
        if (!params) return false;

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
