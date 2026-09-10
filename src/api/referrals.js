const API_URL = 'https://www.aquaexpress.com.ar/aqua4d/aqua_4d.php';

export const getReferralInfo = async (email) => {
    try {
        const body = new URLSearchParams();
        body.append('accion', '120');
        body.append('email', email);
        const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        return await res.json();
    } catch (error) {
        console.error('Error fetching referral info:', error);
        return null;
    }
};

export const registerReferral = async (referredEmail, referralCode) => {
    try {
        const body = new URLSearchParams();
        body.append('accion', '123');
        body.append('referred_email', referredEmail);
        body.append('referral_code', referralCode);
        const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        return await res.json();
    } catch (error) {
        console.error('Error registering referral:', error);
        return { status: 'error' };
    }
};
