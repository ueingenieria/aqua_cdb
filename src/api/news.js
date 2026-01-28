import axios from 'axios';
import client from './client';

export const getNews = async () => {
    try {
        const formData = new FormData();
        formData.append('accion', '70');

        // Use absolute URL as established for other endpoints
        const response = await axios.post('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', formData);

        // Handle potential string response (same as activity)
        let data = response.data;
        if (typeof data === 'string') {
            try {
                const cleanData = data.trim();
                if (cleanData.startsWith('{') || cleanData.startsWith('[')) {
                    data = JSON.parse(cleanData);
                } else {
                    return [];
                }
            } catch (e) {
                console.error("Failed to parse News JSON:", e);
                return [];
            }
        }

        if (Array.isArray(data)) {
            return data;
        }
        return [];

    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
};
