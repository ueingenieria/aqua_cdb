import axios from 'axios';

// URL del script de contacto (debe estar en el mismo server que aqua_4d.php)
const CONTACT_API_URL = 'https://www.aquaexpress.com.ar/aqua4d/contact_form.php';

export const sendSupportRequest = async (formData) => {
    try {
        const response = await axios.post(CONTACT_API_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Support API Error:", error);
        return { success: false, msg: "Error de conexión" };
    }
};
