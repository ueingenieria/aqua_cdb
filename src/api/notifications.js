import axios from 'axios';
import { requestForToken } from '../firebase';

export const savePushToken = async (userId = null) => {
    try {
        const token = await requestForToken();
        if (!token) return;

        const formData = new FormData();
        formData.append('accion', '80');
        formData.append('token', token);
        if (userId) {
            formData.append('id_cliente', userId);
        }
        formData.append('platform', 'web');

        const response = await axios.post('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', formData);

        if (response.data === 'OK') {
            console.log('Token push guardado correctamente');
        } else {
            console.error('Error del servidor al guardar token:', response.data);
        }

    } catch (error) {
        console.error("Error saving push token:", error);
    }
};
