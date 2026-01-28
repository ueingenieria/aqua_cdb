import axios from 'axios';

// API URL (Same as other endpoints)
const API_URL = 'https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php';

export const getSubscriptionStatus = async (userId) => {
    try {
        const formData = new FormData();
        formData.append('accion', '101');
        formData.append('user_id', userId);

        const response = await axios.post(API_URL, formData);
        return response.data; // { status: "pending/authorized/...", ... } or { status: "not_subscribed" }
    } catch (error) {
        console.error("Error fetching subscription status:", error);
        return { status: "error" };
    }
};

export const createSubscription = async (userId, email) => {
    try {
        const formData = new FormData();
        formData.append('accion', '100');
        formData.append('user_id', userId);
        formData.append('email', email);

        const response = await axios.post(API_URL, formData);
        return response.data; // { status: "OK", init_point: "..." }
    } catch (error) {
        console.error("Error creating subscription:", error);
        throw error;
    }
};
