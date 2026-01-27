import client from './client';

export const getCoupons = async (email) => {
    // Legacy: cupones/ GET
    try {
        const response = await client.get('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/cupones/', {
            headers: { 'p_login': email }
        });
        console.log("getCoupons Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching coupons", error);
        return { items: [] };
    }
};

export const validateCouponCode = async (code) => {
    // Legacy: productos_ocultos/ GET
    // Devuelve todos los productos ocultos, luego filtramos en el cliente por código en 'nota'
    try {
        const response = await client.get('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/productos_ocultos/');
        const items = response.data.items || [];

        // Legacy Logic:
        // var code = item.nota.split('(')[1]
        // code = code.split(')')[0]
        // return code == codigo

        const found = items.find(item => {
            if (!item.nota) return false;
            const parts = item.nota.split('(');
            if (parts.length < 2) return false;
            const itemCode = parts[1].split(')')[0];
            return itemCode.toUpperCase() === code.toUpperCase();
        });

        return found; // Retorna el objeto del cupón si existe, o undefined
    } catch (error) {
        throw error;
    }
};

export const redeemCoupon = async (email, productId) => {
    // Legacy: puntos/ PUT
    try {
        const response = await client.put('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/puntos/', null, {
            headers: {
                'Content-Type': 'text/plain', // Legacy usaba text/plain
                'p_login': email,
                'p_producto': productId
            }
        });
        return response.data; // Texto plano o JSON
    } catch (error) {
        throw error;
    }
};
