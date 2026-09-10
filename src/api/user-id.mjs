function validUserId(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const id = String(value).trim();
    return /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) ? id : null;
}

export function legacyUserId(data) {
    return validUserId(data?.p_id_cliente) ?? validUserId(data?.userid);
}

export function pushRegistrationParams(token, userId, platform) {
    const id = validUserId(userId);
    if (!id || typeof token !== 'string' || !token) return null;
    return new URLSearchParams({ accion: '82', token, id_cliente: id, platform });
}
