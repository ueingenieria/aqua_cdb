import test from 'node:test';
import assert from 'node:assert/strict';
import { legacyUserId, pushRegistrationParams } from '../src/api/user-id.mjs';

test('login accepts the legacy userid field and preserves p_id_cliente precedence', () => {
    assert.equal(legacyUserId({ userid: 42 }), '42');
    assert.equal(legacyUserId({ p_id_cliente: '17', userid: 42 }), '17');
    assert.equal(legacyUserId({ p_id_cliente: 0, userid: 42 }), '42');
    assert.equal(legacyUserId({}), null);
});

test('push registration never submits an absent, zero, or malformed user ID', () => {
    for (const id of [undefined, null, 0, '0', '', 'undefined', 'google_mock', -1, 1.5, '7 OR 1=1']) {
        assert.equal(pushRegistrationParams('test-token', id, 'android'), null);
    }
    assert.equal(pushRegistrationParams('', 42, 'android'), null);
    const params = pushRegistrationParams('test-token', 42, 'android');
    assert.deepEqual(Object.fromEntries(params), {
        accion: '82', token: 'test-token', id_cliente: '42', platform: 'android',
    });
});
