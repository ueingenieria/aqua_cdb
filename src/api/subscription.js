import axios from 'axios';

// API URL (Same as other endpoints)
const API_URL = 'https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php';

export const getSubscriptionStatus = async (userId, email) => {
    try {
        const formData = new FormData();
        formData.append('accion', '101');
        formData.append('user_id', userId);
        if (email) formData.append('email', email);

        const response = await axios.post(API_URL, formData);
        console.log("API getSubscriptionStatus Response:", response.data);
        return response.data; // { status: "pending/authorized/...", ... } or { status: "not_subscribed" }
    } catch (error) {
        console.error("Error fetching subscription status:", error);
        return { status: "error" };
    }
};

export const createSubscription = async (userId, email, planId = 'plata') => {
    try {
        const formData = new FormData();
        formData.append('accion', '100');
        formData.append('user_id', userId);
        formData.append('email', email);
        formData.append('plan_id', planId);

        const response = await axios.post(API_URL, formData);
        return response.data; // { status: "OK", init_point: "..." }
    } catch (error) {
        console.error("Error creating subscription:", error);
        throw error;
    }
};

export const getSubscriptionConfig = async () => {
    try {
        const formData = new FormData();
        formData.append('accion', '102');

        const response = await axios.post(API_URL, formData);
        return response.data; // { planes: { gold: {monto, ...}, ... } }
    } catch (error) {
        console.error("Error fetching subscription config:", error);
        return null;
    }
};

export const cancelSubscription = async (preapprovalId) => {
    try {
        const formData = new FormData();
        formData.append('accion', '107');
        formData.append('preapproval_id', preapprovalId);

        const response = await axios.post(API_URL, formData);
        return response.data; // { status: "OK" } or error
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return { status: "error", message: error.message };
    }
};

// Consulta suscripción activa por email → { planId, descuento, lavados } o null
export const getActiveSubscriptionByEmail = async (email) => {
    try {
        const body = new URLSearchParams();
        body.append('accion', '62');
        body.append('email', email);

        const response = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        });

        const text = (await response.text()).trim();
        if (text === 'NONE' || text === 'ERR') return null;

        const [planId, descuento, lavados] = text.split('#');
        return { planId, descuento: parseInt(descuento) || 0, lavados: parseInt(lavados) || 0 };
    } catch {
        return null;
    }
};

export const getUserQrCode = async (email) => {
    try {
        const formData = new FormData();
        formData.append('accion', '52');
        formData.append('api_key', 'ojpEJmCMNjjfX0zRyrASOAWFpgOp2eGD');
        formData.append('email', email);

        const response = await axios.post(API_URL, formData);
        // Respuesta legacy: "cadena_qr#tiempo_segundos"
        if (typeof response.data === 'string' && response.data.includes('#')) {
            const [code, timeout] = response.data.split('#');
            return { code, timeout: parseInt(timeout) };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user QR code:", error);
        return null;
    }
};