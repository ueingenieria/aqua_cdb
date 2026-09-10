import client from './client';

export const getPromotions = async () => {
    try {
        const response = await client.get('/productos/', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching promotions:", error);
        throw error;
    }
};

export const redeemPoints = async (email, productId) => {
    try {
        // legacy uses PUT with custom headers and text/plain
        const response = await client.put('/puntos/', null, {
            headers: {
                'Content-Type': 'text/plain',
                'p_login': email,
                'p_producto': productId
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error redeeming points:", error);
        throw error;
    }
};
