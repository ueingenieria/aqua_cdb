import { getCurrentPosition } from '../mobile/geolocation';
﻿import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { Button } from '../components/ui/Button';
import { getLavaderos, findNearestLaundry } from '../api/locations';
import { getTransaction, confirmTransaction } from '../api/transactions';
import { getActiveSubscriptionByEmail } from '../api/subscription';
import { getAspiradoraInfo, payAspiradora } from '../api/aspiradora';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { QrCode, CreditCard, Gift, Loader2, ShoppingBag, Crown, Zap, Gem, CheckCircle2, Wind } from 'lucide-react';

const PLAN_LABELS = { plata: 'Plata', oro: 'Oro', diamante: 'Diamante' };
const PLAN_ICONS  = { plata: Crown, oro: Zap, diamante: Gem };
const PLAN_COLORS = { plata: 'text-slate-400', oro: 'text-amber-400', diamante: 'text-blue-400' };

const TIPO_LABEL = {
    aspiradora: 'Aspirado',
    sopleteado: 'Sopleteado',
    alfombras:  'Limpia alfombras',
};

const TIPO_DISPONIBILIDAD = {
    aspiradora: 'El equipo de aspirado',
    sopleteado: 'El equipo de sopleteado',
    alfombras: 'Limpia Alfombras',
};

export default function QRScanner() {
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [laundryParams, setLaundryParams] = useState({ V1: false, TORCH: false });
    const [confirmationData, setConfirmationData] = useState(null);
    const [txnData, setTxnData] = useState(null);       // { id, producto, precio, precioFinal, descuento }
    const [txnPaid, setTxnPaid] = useState(false);
    const [aspiradoraData, setAspiradoraData] = useState(null);   // preview: { deviceUid, lavaderoCode, nombreLavadero, precio, duracionSeg, idempotencyKey }
    const [aspiradoraPaid, setAspiradoraPaid] = useState(null);   // resultado: { precio, saldoRestante }

    const { user, subscriptionStatus, refreshBalance } = useAuth();
    const navigate = useNavigate();
    const scannerRef = useRef(null);
    const email = user?.email || localStorage.getItem("email");
    const userId = user?.id || localStorage.getItem("user_id") || "0";

    const SECRET_KEY = "4qu@3xpres5";
    const API_KEY_TOTEM = "A1J8or4tKOYzU1ldizQUHVPu07zEFhgd";
    const QR_SCAN_URL = "https://www.aquaexpress.com.ar/aqua4d/cloud_totem/qr_scan.php";

    const decryptQr = (encryptedText) => {
        try {
            if (encryptedText.length <= 64) return encryptedText;

            // 1. Preparar SECRET_KEY
            const secret = CryptoJS.SHA3(SECRET_KEY, { outputLength: 512 });
            const secretHex = secret.toString(CryptoJS.enc.Hex);

            // 2. Extraer partes
            const saltRaw = encryptedText.substring(0, 32);
            const ivRaw = encryptedText.substring(32, 64);
            const ciphertext = encryptedText.substring(64, encryptedText.length - 64);

            const salt = CryptoJS.enc.Hex.parse(saltRaw);
            const iv = CryptoJS.enc.Hex.parse(ivRaw);

            // 3. Derivar clave
            const key = CryptoJS.PBKDF2(secretHex, salt, {
                keySize: 256 / 32,
                iterations: 100,
                hasher: CryptoJS.algo.SHA1
            });

            // 4. Desencriptar
            const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            });

            const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);

            if (!decryptedData) return encryptedText;

            try {
                const parsed = JSON.parse(decryptedData);
                return typeof parsed === 'object' ? parsed : decryptedData.replace(/^"|"$/g, '');
            } catch {
                return decryptedData.replace(/^"|"$/g, '');
            }
        } catch (error) {
            console.error("Error decryptQr:", error.message);
            return encryptedText;
        }
    };

    const getTipoLabel = (tipo) => TIPO_LABEL[tipo] ?? 'Servicio';
    const getTipoDisponibilidad = (tipo) => TIPO_DISPONIBILIDAD[tipo] ?? 'El equipo';

    useEffect(() => {
        {
            getCurrentPosition(async (position) => {
                try {
                    const lavaderos = await getLavaderos();
                    const pos = { lat: position.coords.latitude, lon: position.coords.longitude };
                    const nearest = findNearestLaundry(pos, lavaderos);
                    const isNight = new Date().getHours() > 19 || new Date().getHours() < 7;

                    if (nearest) {
                        setLaundryParams({
                            V1: nearest.tipo_totem === 'V1',
                            TORCH: isNight
                        });
                    }
                } catch (e) { console.error(e); }
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }

        if (scannerRef.current) return;

        const qrCode = new Html5Qrcode("reader");
        scannerRef.current = qrCode;

        const startScanner = async () => {
            try {
                const config = { fps: 10, qrbox: { width: 250, height: 250 } };
                await qrCode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    onScanFailure
                );
            } catch (err) {
                console.error("No se pudo iniciar el escáner:", err);
            }
        };

        const timer = setTimeout(() => {
            startScanner();
        }, 300);

        async function onScanSuccess(decodedText) {
            if (loading) return;
            setLoading(true);
            setScanResult(decodedText);

            // STOP CAMERA
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                } catch (err) {
                    console.error("Error al detener cámara:", err);
                }
            }

            // �"?�"? Flujo TXN (pago de producto) �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
            if (decodedText.startsWith('TXN|')) {
                const parts = decodedText.split('|');
                if (parts.length < 4) {
                    Swal.fire({ icon: 'error', title: 'QR inválido', text: 'El código no tiene el formato correcto.' })
                        .then(() => { setLoading(false); navigate(0); });
                    return;
                }
                const [, id, producto, precio_final] = parts;
                try {
                    const [txn, sub] = await Promise.all([
                        getTransaction(id),
                        getActiveSubscriptionByEmail(email)
                    ]);

                    if (txn.status !== 'pendiente') {
                        const msg = txn.status === 'pagada'
                            ? 'Esta transacción ya fue pagada.'
                            : txn.status === 'cancelada'
                                ? 'Esta transacción fue cancelada.'
                                : 'La transacción no está disponible.';
                        Swal.fire({ icon: 'warning', title: 'No disponible', text: msg })
                            .then(() => { setLoading(false); navigate(0); });
                        return;
                    }

                    const precio = parseFloat(precio_final);
                    const descuento = sub?.descuento || 0;
                    const planId = (sub?.planId && sub.planId.trim()) || null;
                    const precioFinal = descuento > 0
                        ? parseFloat((precio * (1 - descuento / 100)).toFixed(2))
                        : precio;

                    setTxnData({ id, producto, precio, precioFinal, descuento, planId });
                    setLoading(false);
                } catch {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo verificar la transacción.' })
                        .then(() => { setLoading(false); navigate(0); });
                }
                return;
            }
            // �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

            // �"?�"? Flujo ASP (pago de aspiradora) �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
            if (decodedText.startsWith('ASP|')) {
                const plano = decryptQr(decodedText.slice(4));
                if (typeof plano !== 'string' || !plano.includes('|')) {
                    Swal.fire({ icon: 'error', title: 'QR inválido', text: 'El código no es válido.' })
                        .then(() => { setLoading(false); navigate(0); });
                    return;
                }
                const [lavaderoCode, deviceUid] = plano.split('|');
                try {
                    const info = await getAspiradoraInfo(deviceUid);
                    setAspiradoraData({
                        deviceUid,
                        lavaderoCode,
                        nombreLavadero: info.nombre_lavadero,
                        precio: info.precio,
                        duracionSeg: info.duracion_seg,
                        tipo: info.tipo,
                        idempotencyKey: crypto.randomUUID(),
                    });
                    setLoading(false);
                } catch (error) {
                    const code = error.response?.status;
                    const msg = code === 404 ? 'QR inválido o dispositivo no registrado.'
                              : code === 422 ? 'El dispositivo no tiene precio configurado.'
                              : 'No se pudo consultar el dispositivo.';
                    Swal.fire({ icon: 'error', title: 'Atención', text: msg })
                        .then(() => { setLoading(false); navigate(0); });
                }
                return;
            }
            // �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?

            try {
                const lavaderoID = decryptQr(decodedText);

                // PASO 1: Obtener Info del Escaneo (Sin Pagar)
                // Usamos JSON. El backend (aqua_4d.php) ahora tiene un polyfill para leer el input raw
                // si el wrapper no mapea 'accion' automáticamente.
                const payload = {
                    accion: '200',
                    id_lavadero: lavaderoID,
                    mail: email,
                    user_id: userId
                };

                const infoResponse = await axios.post(QR_SCAN_URL, payload, {
                    headers: {
                        "Content-Type": "application/json",
                        "Api-Key": API_KEY_TOTEM
                    }
                });
                console.log("Info Scan:", infoResponse.data);

                let responseData = infoResponse.data;

                // --- FIX: Handle string response (Legacy PHP) ---
                if (typeof responseData === 'string') {
                    try {
                        const jsonStart = responseData.indexOf('{');
                        const jsonEnd = responseData.lastIndexOf('}');
                        if (jsonStart !== -1 && jsonEnd !== -1) {
                            responseData = JSON.parse(responseData.substring(jsonStart, jsonEnd + 1));
                        }
                    } catch (e) {
                        console.error("Error parsing backend JSON string:", e);
                    }
                }
                // ------------------------------------------------

                if (responseData.status === 'ok') {
                    // Mostrar modal de confirmación
                    setConfirmationData({
                        lavaderoID: lavaderoID,
                        nombre: responseData.nombre_lavadero,
                        lavado: responseData.lavado,
                        precio: responseData.precio,
                        tipo_id: responseData.tipo_id,
                        beneficio_disponible: responseData.beneficio_disponible, // Check availablity
                        lavados_restantes: responseData.lavados_restantes
                    });
                    setLoading(false); // Stop loading to enable buttons
                } else if (responseData.status === 'none' || responseData.status === 'error' || responseData.msg) {
                    // Error soft manejado por el backend (ej: "Seleccioná un lavado", "Máquina en uso")
                    // AQUI está el mensaje que el usuario quiere ver
                    Swal.fire({
                        icon: 'warning', // Cambiado a warning para que destaque más
                        title: 'Atención',
                        text: responseData.msg || "El lavadero no está disponible en este momento.",
                        timer: 5000,
                        confirmButtonColor: '#f59e0b'
                    }).then(() => {
                        setLoading(false);
                        navigate(0); // Reload para reiniciar scanner limpio
                    });
                } else {
                    throw new Error("Respuesta inválida del servidor");
                }

            } catch (error) {
                console.error("Error en lectura QR:", error);

                // Mostrar el mensaje real del error si existe
                // El backend puede enviar 'msg', 'description' o 'error' dependiendo del caso
                const errorData = error.response?.data;
                const errorMsg = errorData?.description || errorData?.msg || errorData?.error || error.message || 'No se pudo validar el código.';

                Swal.fire({
                    icon: 'error',
                    title: 'Atención', // Cambiado de 'Error de Lectura' a 'Atención' para ser menos alarmante
                    text: errorMsg,
                    confirmButtonColor: '#ef4444'
                });

                // Si falló, redirigir al inicio para reiniciar el flujo limpiamente
                setTimeout(() => {
                    navigate('/');
                }, 4000);
            }
        }

        function onScanFailure(error) { }

        return () => {
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, [navigate, email]);

    // Función para confirmar pago TXN
    const handlePayTxn = async () => {
        setLoading(true);
        try {
            const result = await confirmTransaction(txnData.id, email, txnData.precioFinal, txnData.producto);
            if (result === 'OK') {
                await refreshBalance();
                setTxnPaid(true);
            } else if (result === 'ERR_SALDO') {
                Swal.fire({ icon: 'warning', title: 'Saldo insuficiente', text: 'No tenés saldo suficiente para realizar este pago.' });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'La transacción ya fue procesada o no es válida.' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo procesar el pago.' });
        } finally {
            setLoading(false);
        }
    };

    // Función para confirmar pago de aspiradora
    const handlePayAspiradora = async () => {
        setLoading(true);
        try {
            const res = await payAspiradora(
                aspiradoraData.deviceUid, email, aspiradoraData.idempotencyKey
            );
            const precioRespuesta = Number(res?.precio);
            const precioFallback = Number(aspiradoraData?.precio);
            const precio = Number.isFinite(precioRespuesta) ? precioRespuesta : precioFallback;
            const saldoRestanteRespuesta = Number(res?.saldo_restante);
            const saldoRestante = Number.isFinite(saldoRestanteRespuesta) ? saldoRestanteRespuesta : null;
            if (!Number.isFinite(precio)) {
                throw new Error('Respuesta inválida del pago QR');
            }
            await refreshBalance();
            setAspiradoraPaid({ precio, saldoRestante });
            setLoading(false);
        } catch (error) {
            const code = error.response?.status;
            const err  = error.response?.data?.error;
            let msg, icon = 'error';
            if (code === 402) {
                msg = 'No tenés saldo suficiente para este pago.';
                icon = 'warning';
            } else if (code === 404) {
                msg = 'QR inválido o dispositivo desactivado.';
            } else if (code === 503 && err === 'device_offline') {
                msg = `${getTipoDisponibilidad(aspiradoraData?.tipo)} no está disponible. Probá de nuevo en unos minutos.`;
                icon = 'warning';
            } else if (code === 503 && err === 'publish_failed') {
                msg = 'No se pudo iniciar el servicio. Tu saldo se devolvió, intentá de nuevo.';
                icon = 'warning';
                await refreshBalance();
            } else {
                msg = 'No se pudo procesar el pago.';
            }
            Swal.fire({ icon, title: 'Atención', text: msg });
            setLoading(false);
        }
    };

    // Función para procesar pago (Legacy Flow)
    const handlePayLegacy = async () => {
        setLoading(true);
        try {
            const data = {
                mail: email,
                id_lavadero: confirmationData.lavaderoID
            };

            // Back to Legacy Action 52 implicitly (or whatever endpoint logic handles the payment in cloud_totem/qr_scan.php if it was different)
            // USER: "al escanear un QR [antes] se hace la petición... obtenemos pago aprobado"
            // Revertimos al POST original que hacíamos antes

            // IMPORTANTE: El backend espera JSON para este endpoint según código previo
            const response = await axios.post(QR_SCAN_URL, data, {
                headers: { "Content-Type": "application/json", "Api-Key": API_KEY_TOTEM }
            });

            if (response.status === 200 || response.data.status === 'success') {
                Swal.fire({
                    icon: 'success', title: '¡Pago Exitoso!',
                    text: response.data.msg || 'Tu lavado iniciará pronto.',
                    confirmButtonText: 'Genial'
                }).then(() => navigate('/'));
            } else {
                throw new Error(response.data.description || 'Error procesando pago.');
            }
        } catch (error) {
            console.error("Error en pago:", error);
            const errorData = error.response?.data;
            const errorMsg = errorData?.description || errorData?.msg || 'Ocurrió un error al procesar el pago.';

            Swal.fire({
                icon: 'error',
                title: 'No se pudo realizar el pago',
                text: errorMsg,
                confirmButtonColor: '#ef4444'
            });
            setLoading(false);
        }
    };

    // Función para canjear beneficio
    const handleRedeemBenefit = async () => {
        setLoading(true);
        try {
            const payload = {
                accion: '201',
                id_lavadero: confirmationData.lavaderoID,
                user_id: userId,
                email: email,
                mail: email,
                tipo_lavado: confirmationData.tipo_id
            };

            const response = await axios.post(QR_SCAN_URL, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": API_KEY_TOTEM
                }
            });

            if (response.data.status === 'success') {
                Swal.fire({
                    icon: 'success', title: '¡Beneficio Canjeado!',
                    text: response.data.msg,
                    confirmButtonText: 'Disfrutalo'
                }).then(() => navigate('/'));
            } else {
                throw new Error(response.data.msg || 'No se pudo canjear.');
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Ups...', text: error.message });
            setLoading(false);
        }
    };

    // �"?�"? Render: Pago TXN exitoso �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
    if (txnPaid) {
        return (
            <div className="min-h-screen bg-[#0f172a] p-6 flex flex-col items-center justify-center space-y-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-8 w-full max-w-md text-center shadow-2xl animate-in fade-in zoom-in duration-300 space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">¡Pago exitoso!</h2>
                        <p className="text-slate-400 text-sm mt-2">{txnData.producto}</p>
                        <p className="text-3xl font-black text-green-400 mt-3">${txnData.precioFinal.toFixed(2)}</p>
                    </div>
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full bg-green-600 hover:bg-green-500 text-white rounded-2xl py-5 font-black uppercase tracking-widest border-0"
                    >
                        Volver al inicio
                    </Button>
                </div>
            </div>
        );
    }

    // �"?�"? Render: Confirmación TXN �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
    if (txnData) {
        const { precio, precioFinal, descuento, planId } = txnData;
        const isSubscribed = !!planId;
        const PlanIcon = isSubscribed ? (PLAN_ICONS[planId] || Crown) : null;
        const hayDescuento = descuento > 0;

        return (
            <div className="min-h-screen bg-[#0f172a] p-6 flex flex-col items-center justify-center space-y-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-8 w-full max-w-md text-center shadow-2xl animate-in fade-in zoom-in duration-300 space-y-6">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-8 h-8 text-blue-400" />
                    </div>

                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Confirmá el pago</p>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                            {txnData.producto}
                        </h2>
                    </div>

                    {/* Badge suscripción */}
                    {hayDescuento && (
                        <div className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-3">
                            {PlanIcon && <PlanIcon className={`w-4 h-4 ${PLAN_COLORS[planId]}`} />}
                            <span className="text-sm font-bold text-green-400">
                                Por ser{planId ? <span className={` ${PLAN_COLORS[planId]}`}> {PLAN_LABELS[planId]}</span> : ' socio'} tenés {descuento}% de descuento
                            </span>
                        </div>
                    )}

                    {/* Precio */}
                    <div className="bg-black/20 rounded-2xl p-6 border border-white/5 space-y-2">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total a pagar</p>
                        {hayDescuento && (
                            <p className="text-slate-500 text-2xl font-bold line-through">
                                ${precio.toFixed(2)}
                            </p>
                        )}
                        <p className={`text-5xl font-black ${hayDescuento ? 'text-green-400' : 'text-white'}`}>
                            ${precioFinal.toFixed(2)}
                        </p>
                        {hayDescuento && (
                            <p className="text-green-500 text-xs font-bold">
                                Ahorrás ${(precio - precioFinal).toFixed(2)}
                            </p>
                        )}
                        <p className="text-slate-500 text-xs mt-2">{email}</p>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handlePayTxn}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl py-6 font-black uppercase tracking-[0.2em] shadow-lg border-0"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (
                                <span className="flex items-center justify-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Confirmar Pago
                                </span>
                            )}
                        </Button>
                        <Button variant="text" onClick={() => navigate(0)} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest">
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // �"?�"? Render: Pago Aspiradora exitoso �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
    if (aspiradoraPaid) {
        return (
            <div className="min-h-screen bg-[#0f172a] p-6 flex flex-col items-center justify-center space-y-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-8 w-full max-w-md text-center shadow-2xl animate-in fade-in zoom-in duration-300 space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">¡Pago exitoso!</h2>
                        <p className="text-3xl font-black text-green-400 mt-3">${aspiradoraPaid.precio}</p>
                        {aspiradoraPaid.saldoRestante !== null && (
                            <p className="text-slate-400 text-sm mt-2">Saldo restante: ${aspiradoraPaid.saldoRestante}</p>
                        )}
                    </div>
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full bg-green-600 hover:bg-green-500 text-white rounded-2xl py-5 font-black uppercase tracking-widest border-0"
                    >
                        Volver al inicio
                    </Button>
                </div>
            </div>
        );
    }

    // �"?�"? Render: Confirmación Aspiradora �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
    if (aspiradoraData) {
        const { nombreLavadero, precio, duracionSeg, lavaderoCode, deviceUid, tipo } = aspiradoraData;
        const minutos = Math.max(1, Math.round(duracionSeg / 60));
        const titulo = getTipoLabel(tipo);
        return (
            <div className="min-h-screen bg-[#0f172a] p-6 flex flex-col items-center justify-center space-y-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-8 w-full max-w-md text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Wind className="w-8 h-8 text-blue-400" />
                    </div>

                    {nombreLavadero && 
                     String(nombreLavadero).toLowerCase() !== String(lavaderoCode).toLowerCase() && 
                     String(nombreLavadero).toLowerCase() !== String(deviceUid).toLowerCase() && (
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
                            {nombreLavadero}
                        </h2>
                    )}

                    <div className="bg-black/20 rounded-2xl p-6 mb-8 border border-white/5 space-y-2">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Estás por activar</p>
                        <p className="text-3xl font-black text-white uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            {titulo}
                        </p>
                        <p className="text-lg font-bold text-white/80 mt-2">${precio}</p>
                        <p className="text-slate-500 text-xs">
                            {minutos} min de {tipo === 'sopleteado' ? 'sopleteado' : tipo === 'alfombras' ? 'limpieza de alfombras' : 'aspirado'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button
                            onClick={handlePayAspiradora}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl py-6 font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 border-0"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (
                                <span className="flex items-center justify-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Pagar Ahora
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="text"
                            onClick={() => navigate(0)}
                            className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Render del Modal de Confirmación
    if (confirmationData) {
        return (
            <div className="min-h-screen bg-[#0f172a] p-6 flex flex-col items-center justify-center space-y-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[32px] p-8 w-full max-w-md text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <QrCode className="w-8 h-8 text-blue-400" />
                    </div>

                    {confirmationData.nombre && String(confirmationData.nombre).toLowerCase() !== String(confirmationData.lavaderoID).toLowerCase() && (
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
                            {confirmationData.nombre}
                        </h2>
                    )}

                    <div className="bg-black/20 rounded-2xl p-6 mb-8 border border-white/5 space-y-2">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Estás por activar</p>
                        <p className="text-3xl font-black text-white uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            {confirmationData.lavado}
                        </p>
                        <p className="text-lg font-bold text-white/80 mt-2">
                            ${confirmationData.precio}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button
                            onClick={handlePayLegacy}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl py-6 font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 border-0"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (
                                <span className="flex items-center justify-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Pagar Ahora
                                </span>
                            )}
                        </Button>

                        {/* Botón de Beneficio condicional */}
                        {confirmationData.beneficio_disponible ? (
                            <Button
                                onClick={handleRedeemBenefit}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-2xl py-6 font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-900/40 border-0"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Gift className="w-4 h-4" />
                                        Usar Beneficio
                                        {confirmationData.lavados_restantes > 0 && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md">x{confirmationData.lavados_restantes}</span>}
                                    </span>
                                )}
                            </Button>
                        ) : (
                            <div className="text-center p-2 bg-white/5 rounded-xl border border-white/5 opacity-60">
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                    No tienes beneficios disponibles
                                </p>
                            </div>
                        )}

                        <Button
                            variant="text"
                            onClick={() => navigate(0)} // Cancelar reinicia
                            className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Render del Scanner (Normal)
    return (
        <div className="p-6 max-w-md mx-auto text-center space-y-6">
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center justify-center gap-3">
                <QrCode className="h-8 w-8 text-blue-400" />
                Escáner QR
            </h1>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Escaneá el código del lavadero</p>

            <div className="bg-white/10 backdrop-blur-md rounded-[32px] p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                <div id="reader" className="overflow-hidden rounded-2xl"></div>
                {loading && (
                    <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-white text-[10px] font-black uppercase tracking-widest">Validando...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Info y Botones inferiores se mantienen igual ... */}
            <div className="py-2"></div>

            <div className="flex flex-col gap-4">
                <Button
                    variant="outline"
                    onClick={() => navigate('/qr-usuario')}
                    className="w-full bg-slate-100/50 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-2xl py-6 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm"
                >
                    <QrCode className="mr-2 h-4 w-4 text-blue-600" />
                    Mostrar mi código QR
                </Button>


            </div>
        </div>
    );
}






