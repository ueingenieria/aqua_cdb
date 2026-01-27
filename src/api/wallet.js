import client from './client';

export const getBalance = async (email) => {
    // Legacy: accion=55 in aqua_4d.php
    try {
        const formData = new URLSearchParams();
        formData.append('accion', '55');
        formData.append('api_key', 'ojpEJmCMNjjfX0zRyrASOAWFpgOp2eGD');
        formData.append('email', email);

        const response = await client.post('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', formData);
        return response.data; // "OK#123.45#..."
    } catch (error) {
        throw error;
    }
};

export const createRechargePreference = async (email, amount, name) => {
    // Legacy: recargar.php
    // params = "importe=" + monto.value + "&email=" + email + "&nombre=" + uname;
    try {
        const formData = new URLSearchParams();
        formData.append('importe', amount);
        formData.append('email', email);
        formData.append('nombre', name || '');

        const response = await client.post('https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/recargar.php', formData);
        return response.data; // URL de MP
    } catch (error) {
        throw error;
    }
}
