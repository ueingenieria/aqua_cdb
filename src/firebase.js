import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// VAPID Key: Necesaria para solicitar permiso en navegadores modernos
// Puedes generarla en Firebase Console > Cloud Messaging > Web configuration > Generate key pair
// Si no la tienes, pon una cadena vacía o comenta la opción vapidKey abajo, pero es recomendable tenerla.
export const VAPID_KEY = "REEMPLAZAR_CON_TU_VAPID_KEY_SI_LA_TIENES";

export const requestForToken = async () => {
    try {
        const options = VAPID_KEY && VAPID_KEY.includes("REEMPLAZAR") ? undefined : { vapidKey: VAPID_KEY };
        const currentToken = await getToken(messaging, options);

        if (currentToken) {
            console.log('FCM Token:', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });

export { app, messaging };
