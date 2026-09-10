import { Geolocation } from '@capacitor/geolocation';
import { isNative } from './platform';

// Callback contract retained for the existing map/scanner consumers.
export function getCurrentPosition(success, failure, options = {}) {
    if (isNative()) {
        void Geolocation.getCurrentPosition({ timeout: 10000, ...options }).then(success).catch(failure);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, failure, options);
    } else {
        failure?.(new Error('Este dispositivo no permite obtener la ubicación.'));
    }
}
