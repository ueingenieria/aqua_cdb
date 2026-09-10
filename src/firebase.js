import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { isNative } from './mobile/platform';
import { nativePushToken } from './mobile/push';

// La web usa su configuración de entorno; Android/iOS usan Firebase nativo.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = isNative() ? null : initializeApp(firebaseConfig);

let messaging = null;

export const getMessagingInstance = async () => {
    if (isNative()) return null;
    if (messaging) return messaging;
    try {
        const supported = await isSupported();
        if (supported) {
            messaging = getMessaging(app);
            return messaging;
        }
    } catch (e) {
        console.log("Error checking messaging support:", e);
    }
    return null;
};

// VAPID KEY REAL (DEBE COINCIDIR CON LA CONSOLA DE FIREBASE)
// Si esta llave no es la correcta, Google devolverá 401.
export const VAPID_KEY = "BPXeE6p95b0j5rtchVokFbqEyJsgpOQpHKIz77RdIvchhDLmvhKUEEUCGTw1F6fYRJlJNbrA0x03ptBYl4TUZTE";

export const requestForToken = async (requestPermission = false) => {
    if (isNative()) return nativePushToken(requestPermission);
    if (!globalThis.Notification) return null;
    if (requestPermission && Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted') return null;
    try {
        const msg = await getMessagingInstance();
        if (!msg) {
            console.log("FCM: Notificaciones push no soportadas en este navegador (ej. iOS antiguo o sin instalar).");
            return null;
        }

        if (!('serviceWorker' in navigator)) {
            console.error("FCM: SW no soportado por el navegador");
            return null;
        }

        const baseUrl = '/cdb/';
        const swPath = `${baseUrl}firebase-messaging-sw.js`;

        console.log('FCM: Registrando/Sincronizando Service Worker en:', swPath);

        // Registro explícito con scope para evitar conflictos
        const registration = await navigator.serviceWorker.register(swPath, {
            scope: baseUrl
        });

        await navigator.serviceWorker.ready;
        console.log('FCM: Service Worker listo. Scope:', registration.scope);

        // Intento de obtención de token con VAPID
        try {
            const currentToken = await getToken(msg, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                console.log('FCM: Token generado exitosamente');
                return currentToken;
            } else {
                console.warn('FCM: No se recibió token. Verifica los permisos de notificación.');
                return null;
            }
        } catch (tokenErr) {
            console.error('FCM Error en getToken (401?):', tokenErr);
            // Si es 401, informamos explícitamente sobre el tema de la VAPID Key o API Key
            if (tokenErr.message?.includes('401') || tokenErr.code === 'messaging/token-subscribe-failed') {
                console.error('FCM CRÍTICO: Error de autenticación. Revisar VAPID KEY y restricciones de API Key en Google Cloud.');
            }
            throw tokenErr;
        }
    } catch (err) {
        console.error('FCM Error Crítico en requestForToken:', err);
        throw err;
    }
};

export const onMessageListener = async () => {
    const msg = await getMessagingInstance();
    if (!msg) return new Promise(() => {}); // Promesa que no resuelve, para evitar que crasheen los listeners.

    return new Promise((resolve) => {
        onMessage(msg, (payload) => {
            resolve(payload);
        });
    });
};

export { app, messaging };
