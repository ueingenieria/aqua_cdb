import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyBtEsOetVhqyZm8mCdAl25sslP3ySKqNO8",
    authDomain: "aquapush-a8539.firebaseapp.com",
    projectId: "aquapush-a8539",
    storageBucket: "aquapush-a8539.firebasestorage.app",
    messagingSenderId: "1079314091164",
    appId: "1:1079314091164:web:e0ce32a3649e9973847159",
    measurementId: "G-0537LXH9C5"
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
