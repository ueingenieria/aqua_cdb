import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { isNative } from './platform';

export async function notificationPermission() {
    if (isNative()) return (await FirebaseMessaging.checkPermissions()).receive;
    return globalThis.Notification?.permission ?? 'denied';
}

export async function nativePushToken(requestPermission = false) {
    let permission = await notificationPermission();
    if (requestPermission && permission !== 'granted') {
        permission = (await FirebaseMessaging.requestPermissions()).receive;
    }
    if (permission !== 'granted') return null;
    return (await FirebaseMessaging.getToken()).token;
}

export const onNativeMessage = (callback) => FirebaseMessaging.addListener('notificationReceived', callback);
