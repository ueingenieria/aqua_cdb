/* eslint-disable no-undef */
// Revertimos a v8 porque es la configuración que mejor carga en este servidor específico
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyBtEsOetVhqyZm8mCdAl25sslP3ySKqNO8",
    authDomain: "aquapush-a8539.firebaseapp.com",
    projectId: "aquapush-a8539",
    storageBucket: "aquapush-a8539.firebasestorage.app",
    messagingSenderId: "1079314091164",
    appId: "1:1079314091164:web:e0ce32a3649e9973847159",
    measurementId: "G-0537LXH9C5"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || "AquaExpress";

    // Lógica inteligente para URL de destino:
    // 1. Obtenemos la URL que viene del backend (si hay)
    let click_action = payload.webpush?.notification?.click_action || payload.notification?.click_action || payload.data?.click_action;

    // 2. Si es la URL hardcodeada antigua (con www) o no existe, usamos el scope local.
    // Esto arregla el problema de sesión perdida si el usuario está en non-www o viceversa.
    const hardcodedUrl = 'https://www.aquaexpress.com.ar/cdb/';
    if (!click_action || click_action === hardcodedUrl) {
        click_action = self.registration.scope;
    }

    const notificationOptions = {
        body: payload.notification?.body || "",
        icon: payload.notification?.icon || '/cdb/pwa-192x192.png',
        data: {
            click_action: click_action,
            ...payload.data
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event);

    event.notification.close();

    // URL destino
    const targetUrl = event.notification.data?.click_action || self.registration.scope;

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (clientList) {
            // Intentar encontrar una ventana que coincida con la URL del scope
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // Comprobar si la URL del cliente coincide con el origen del scope
                if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no hay ventana abierta, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
