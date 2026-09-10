import test from 'node:test';
import assert from 'node:assert/strict';
import { getAppRoute, externalUrl } from '../src/mobile/urls.js';

test('return links preserve route and referral query without accepting foreign hosts', () => {
    assert.equal(getAppRoute('https://aquaexpress.com.ar/cdb/register?ref=AMIGO'), '/register?ref=AMIGO');
    assert.equal(getAppRoute('https://www.aquaexpress.com.ar/cdb/billetera'), '/billetera');
    assert.equal(getAppRoute('https://evil.example/cdb/billetera'), null);
    assert.equal(getAppRoute('https://aquaexpress.com.ar.evil.example/cdb/'), null);
    assert.equal(getAppRoute('https://aquaexpress.com.ar/admin_panel/'), null);
    assert.equal(getAppRoute('https://aquaexpress.com.ar/cdb//evil.example'), null);
    assert.equal(getAppRoute('broken'), null);
});

test('payment and external URLs reject script protocols and cleartext navigation', () => {
    assert.equal(externalUrl('https://www.mercadopago.com.ar/checkout?pref_id=abc'), 'https://www.mercadopago.com.ar/checkout?pref_id=abc');
    assert.throws(() => externalUrl('javascript:alert(1)'));
    assert.throws(() => externalUrl('http://example.com'));
    assert.throws(() => externalUrl('https://user:pass@example.com'));
    assert.throws(() => externalUrl('/login'));
});

test('existing Mercado Pago app links remain usable', () => {
    assert.equal(externalUrl('mpshare://checkout?pref_id=abc'), 'mpshare://checkout?pref_id=abc');
});
