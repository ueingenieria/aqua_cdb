/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyBtEsOetVhqyZm8mCdAl25sslP3ySKqNO8",
    authDomain: "aquapush-a8539.firebaseapp.com",
    projectId: "aquapush-a8539",
    storageBucket: "aquapush-a8539.firebasestorage.app",
    messagingSenderId: "1079314091164",
    appId: "1:1079314091164:web:e0ce32a3649e9973847159",
    measurementId: "G-0537LXH9C5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/logo192.png',
        data: payload.data
    }; // Customize logic here if needed

    self.registration.showNotification(notificationTitle, notificationOptions);
});
