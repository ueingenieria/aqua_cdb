import axios from 'axios';
import client from './client';

export const getUserActivity = async (email) => {
    try {
        const formData = new FormData();
        formData.append('accion', '60');
        formData.append('email', email);

        const response = await axios.post('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', formData);

        let data = response.data;

        // Debug Log
        console.log("Activity API Response:", data);

        if (typeof data === 'string') {
            try {
                if (!data.trim()) {
                    console.warn("Activity API returned empty string");
                    return [];
                }
                // Remove any potential byte order marks or whitespace
                const cleanData = data.trim();
                // Check if it looks like JSON
                if (cleanData.startsWith('{') || cleanData.startsWith('[')) {
                    data = JSON.parse(cleanData);
                } else {
                    console.warn("Activity API returned non-JSON string:", cleanData);
                    return [];
                }
            } catch (e) {
                console.error("Failed to parse JSON string:", e, "Raw data:", data);
                return [];
            }
        }

        if (Array.isArray(data)) {
            return data;
        } else {
            // If legacy endpoint returns string "ERROR" or similar, handle it
            console.warn("Activity response is not an array:", data);
            return [];
        }

    } catch (error) {
        console.error("Error fetching activity:", error);
        return [];
    }
};
