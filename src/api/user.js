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

// Replaces legacy 'consulta_saldo'
export const getUserBalance = async (email) => {
    try {
        const body = new URLSearchParams();
        body.append('accion', '55');
        body.append('api_key', 'ojpEJmCMNjjfX0zRyrASOAWFpgOp2eGD');
        body.append('email', email);

        const response = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const text = await response.text(); // Legacy API returns text with # separator
        const parts = text.split('#');

        if (parts[0].includes('OK')) {
            return {
                credit: parts[1], // pesos
                tagLock: parts[3], // tag_lock
                tag: parts[4]     // tag_nro
            };
        } else {
            console.error('Balance check failed:', text);
            return null;
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
};

export const toggleCardLock = async (email, isLocked) => {
    // Legacy: accion=57, bloqueo=1 (lock) or 0 (unlock)
    try {
        const body = new URLSearchParams();
        body.append('accion', '57');
        body.append('email', email);
        body.append('bloqueo', isLocked ? '1' : '0');

        const response = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const text = await response.text();

        if (text.includes("OK_BLOQ")) {
            return { success: true, status: 'locked' };
        } else if (text.includes("OK_DESB")) {
            return { success: true, status: 'unlocked' };
        } else {
            return { success: false, message: 'Error en la respuesta del servidor' };
        }
    } catch (error) {
        console.error('Error toggling card lock:', error);
        return { success: false, message: error.message };
    }
};

export const linkCard = async (email, cardId) => {
    // Legacy: accion=59, mail, id_tarj
    try {
        const body = new URLSearchParams();
        body.append('accion', '59');
        body.append('mail', email);
        body.append('id_tarj', cardId);

        const response = await fetch('https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const text = await response.text();

        // Legacy Response: OK#SALDO_TARJETA#NUMERO_TAG
        if (text.includes("OK")) {
            const parts = text.split('#');
            return {
                success: true,
                cardBalance: parseInt(parts[1]) || 0,
                tagNumber: parts[2]
            };
        } else {
            return { success: false, message: 'El ID de tarjeta ingresado es inválido o ya está registrado' };
        }
    } catch (error) {
        console.error('Error linking card:', error);
        return { success: false, message: error.message };
    }
};
