import client from './client';

export const get4DPrices = async (externalId) => {
    try {
        const body = new URLSearchParams();
        body.append('accion', '80');
        body.append('external_id', externalId);

        const response = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (!response.ok) {
            throw new Error('Error en la solicitud de precios');
        }

        const data = await response.json();
        return data.prices || data;
    } catch (error) {
        console.error('Error fetching 4D prices:', error);
        return { status: 'error', msg: error.message };
    }
};

// Consultar precio Autoservicio Pesos (Acción 15)
export const getLavaderoPesosPrice = async (externalId) => {
    try {
        const body = new URLSearchParams();
        body.append('accion', '15');
        body.append('lavadero', externalId);

        console.log(`[DEBUG] Consultando precio pesos para ID: ${externalId}`);
        const response = await fetch('https://www.uedesign.com.ar/aqua.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (!response.ok) {
            throw new Error('Error en la solicitud de precios (Pesos)');
        }

        const text = await response.text();
        console.log(`[DEBUG] Respuesta raw del servidor para ${externalId}: "${text}"`);

        const price = parseInt(text);

        if (!isNaN(price)) {
            return price;
        }
        return null;
    } catch (error) {
        console.error("Error fetching pesos price:", error);
        return null;
    }
};
