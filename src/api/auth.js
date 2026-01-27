import client from './client';

export const loginUser = async (email, password) => {
    try {
        // La API legacy espera credenciales en los headers
        const response = await client.post('/login/', null, {
            headers: {
                'p_login': email,
                'p_password': password
            }
        });
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await client.put('/forgotpassword/', null, {
            headers: {
                'p_login': email
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const changePassword = async (email, oldPassword, newPassword, newPasswordAgain) => {
    try {
        const response = await client.put('/change_password/', null, {
            headers: {
                'p_login': email,
                'p_oldpassword': oldPassword,
                'p_newpassword': newPassword,
                'p_newpassword_again': newPasswordAgain
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
