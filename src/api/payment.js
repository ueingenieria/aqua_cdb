export const buyCreditsWithBalance = async ({ email, amount, quantity, laundryId }) => {
    try {
        const body = new URLSearchParams();
        body.append('accion', '58');
        body.append('email', email);
        body.append('a_cobrar', amount);
        body.append('cant_cred', quantity);
        body.append('id_lavadero', laundryId);

        const response = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Error en la solicitud');
        }

        const data = await response.json();
        // Legacy response: { status: "ok", msg: "..." } or { status: "error", msg: "..." }
        if (data.status === 'ok') {
            return { success: true, message: data.msg };
        } else {
            return { success: false, message: data.msg };
        }

    } catch (error) {
        console.error('Error buying credits:', error);
        return { success: false, message: error.message };
    }
};

export const initiateExternalCreditPurchase = async ({ email, name, amount, quantity, laundryId }) => {
    try {
        const body = new URLSearchParams();
        // Legacy params: a_cobrar, email, nombre, cant_cred, valido_en
        body.append('a_cobrar', amount);
        body.append('email', email);
        body.append('nombre', name);
        body.append('cant_cred', quantity);
        body.append('valido_en', laundryId);

        const response = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/compra_cred.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (!response.ok) throw new Error('Error connecting to payment gateway');

        const url = await response.text();

        // Validation similar to legacy
        if (url && url.match(/^(http|https):\/\/[a-z0-9\.-]+\.[a-z]{2,4}/gi)) {
            return { success: true, url: url };
        } else {
            return { success: false, message: 'Respuesta inválida del servidor de pagos' };
        }

    } catch (error) {
        console.error('Error initiating external purchase:', error);
        return { success: false, message: error.message };
    }
};
