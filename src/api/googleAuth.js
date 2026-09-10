import axios from 'axios';

// URL del Bridge PHP. 
// IMPORTANTE: En producción esto debe apuntar a la URL real donde subas el script (ej: https://aquaexpress.com.ar/aqua4d/google_bridge.php)
// Para desarrollo local con proxy o si el PHP está en public/, usamos ruta relativa o absoluta si es externo.
// Asumimos que el usuario lo subirá al mismo servidor que aqua_4d.php
const BRIDGE_URL = 'https://www.aquaexpress.com.ar/aqua4d/google_bridge.php';

export const googleLoginBridge = async (googleToken) => {
    try {
        const response = await axios.post(BRIDGE_URL, {
            action: 'google_login',
            google_token: googleToken
        });
        return response.data;
    } catch (error) {
        console.error("Bridge Login Error:", error);
        return { success: false, msg: error.message };
    }
};

export const linkAccountBridge = async (googleToken, legacyEmail, legacyPassword) => {
    try {
        const response = await axios.post(BRIDGE_URL, {
            action: 'link_account',
            google_token: googleToken,
            legacy_email: legacyEmail,
            legacy_password: legacyPassword
        });
        return response.data;
    } catch (error) {
        console.error("Bridge Link Error:", error);
        return { success: false, msg: error.message };
    }
};

export const deleteGoogleAccountBridge = async (email) => {
    try {
        const response = await axios.post(BRIDGE_URL, {
            action: 'delete_google_account',
            email: email
        });
        return response.data;
    } catch (error) {
        console.error("Bridge Delete Error:", error);
        return { success: false, p_msg: error.message };
    }
};

export const registerGoogleUserBridge = async (googleToken, userData) => {
    try {
        const response = await axios.post(BRIDGE_URL, {
            action: 'register_google',
            google_token: googleToken,
            user_data: userData
        });
        return response.data;
    } catch (error) {
        console.error("Bridge Register Error:", error);
        return { success: false, msg: error.message };
    }
};
