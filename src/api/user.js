import client from './client';

export const modifyUser = async (email, name, surname, dni) => {
    // Legacy: modify_user/
    try {
        const response = await client.put('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/modify_user/', null, {
            headers: {
                'p_nombre': name,
                'p_apellido': surname,
                'p_dni': dni,
                'p_login': email,
                'Content-type': 'text/html'
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteUser = async (email, password) => {
    try {
        const response = await client.post('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/delete_user/', null, {
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
                'p_login': email,
                'p_password': password
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const registerUser = async (name, surname, email, password) => {
    // Legacy: registeruser/
    try {
        const response = await client.post('http://turnos.aquaexpress.com.ar/aquaxp/vial/aquaapp/registeruser/', null, {
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
                'p_nombre': name,
                'p_apellido': surname,
                'p_login': email.toLowerCase(),
                'p_password': password
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
