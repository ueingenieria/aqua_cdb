import axios from 'axios';

// cPanel — misma carpeta que qr_scan.php del tótem
const INFO_URL = 'https://www.aquaexpress.com.ar/aqua4d/cloud_totem/aspiradora_qr_info.php';
// pulsoqr-api (VPS) — endpoint de cobro de aspiradora por QR
const PAY_URL = 'https://pulsoqr.com/api/aspiradora/qr-pay';
// = Common::API_KEY del cPanel (ya en el bundle como API_KEY_TOTEM en QRScanner.jsx)
const CPANEL_API_KEY = 'A1J8or4tKOYzU1ldizQUHVPu07zEFhgd';

/**
 * Consulta precio y duración de la aspiradora SIN cobrar.
 * @param {string} deviceUid
 * @returns {Promise<{ok:boolean, device_uid:string, nombre_lavadero:string, precio:number, duracion_seg:number}>}
 */
export async function getAspiradoraInfo(deviceUid) {
    const { data } = await axios.post(INFO_URL, { device_uid: deviceUid }, {
        headers: { 'Content-Type': 'application/json', 'Api-Key': CPANEL_API_KEY },
    });
    return data;
}

/**
 * Cobra el lavado de aspiradora. pulsoqr-api orquesta idempotencia + publish MQTT.
 * @param {string} deviceUid
 * @param {string} mail
 * @param {string} idempotencyKey  UUID estable por escaneo
 * @returns {Promise<{payment_id:string, precio:number, duracion_seg:number, saldo_restante:number, status:string}>}
 */
export async function payAspiradora(deviceUid, mail, idempotencyKey) {
    if (!idempotencyKey) throw new Error('payAspiradora: idempotencyKey es requerido');
    const { data } = await axios.post(PAY_URL, { device_uid: deviceUid, mail }, {
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    });
    return data;
}
