const TXN_URL = 'https://www.aquaexpress.com.ar/aqua4d/transacciones.php';

export const getTransaction = async (id) => {
    const body = new URLSearchParams();
    body.append('accion', '2');
    body.append('id', id);

    const response = await fetch(TXN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });

    const text = await response.text();
    const [status, extra] = text.split('#');
    return { status: status?.trim(), extra: extra?.trim() };
};

export const confirmTransaction = async (id, emailCliente, precioFinal, nombreProducto) => {
    const body = new URLSearchParams();
    body.append('accion', '4');
    body.append('id', id);
    body.append('email_cliente', emailCliente);
    if (precioFinal !== undefined) body.append('precio_final', precioFinal);
    if (nombreProducto !== undefined) body.append('nombre_producto', nombreProducto);

    const response = await fetch(TXN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });

    const text = await response.text();
    return text?.trim();
};
