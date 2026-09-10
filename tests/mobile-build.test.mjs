import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as plist from 'plist';

const root = fileURLToPath(new URL('../', import.meta.url));
function fixture(t) {
    const path = mkdtempSync(join(tmpdir(), 'aqua-mobile-test-'));
    t.after(() => {
        assert.ok(resolve(path).startsWith(resolve(tmpdir()) + '\\aqua-mobile-test-') || resolve(path).startsWith(resolve(tmpdir()) + '/aqua-mobile-test-'));
        rmSync(path, { recursive: true });
    });
    return path;
}
function run(script, cwd, args = [], env = {}) {
    return spawnSync(process.execPath, [join(root, 'scripts', script), ...args], { cwd, encoding: 'utf8', env });
}

test('mobile artifact validator fails if a server file is copied into a nested directory', t => {
    const cwd = fixture(t);
    mkdirSync(join(cwd, 'dist-mobile/assets'), { recursive: true });
    writeFileSync(join(cwd, 'dist-mobile/index.html'), '<script src="/assets/app.js"></script>');
    writeFileSync(join(cwd, 'dist-mobile/assets/app.js'), 'console.log("app")');
    assert.equal(run('verify-mobile.mjs', cwd).status, 0);
    writeFileSync(join(cwd, 'dist-mobile/assets/backend.php'), '<?php echo "not a client asset";');
    assert.notEqual(run('verify-mobile.mjs', cwd).status, 0);
});

test('mobile artifact validator rejects web base paths', t => {
    const cwd = fixture(t);
    mkdirSync(join(cwd, 'dist-mobile'));
    writeFileSync(join(cwd, 'dist-mobile/index.html'), '<script src="/cdb/assets/app.js"></script>');
    assert.notEqual(run('verify-mobile.mjs', cwd).status, 0);
});

test('CI refuses missing config and another Android app, then writes valid Firebase config', t => {
    const cwd = fixture(t);
    writeFileSync(join(cwd, 'capacitor.config.json'), JSON.stringify({ appId: 'com.aquaexpress.cdb' }));
    assert.notEqual(run('prepare-mobile-ci.mjs', cwd, ['android']).status, 0);
    const firebase = id => Buffer.from(JSON.stringify({ client: [{ client_info: { android_client_info: { package_name: id } } }] })).toString('base64');
    const env = { VITE_GOOGLE_MAPS_API_KEY: 'test-maps', VITE_GOOGLE_WEB_CLIENT_ID: 'test-client', APP_VERSION: '3.4.0', APP_BUILD_NUMBER: '400', GOOGLE_SERVICES_JSON_BASE64: firebase('com.other.app') };
    assert.notEqual(run('prepare-mobile-ci.mjs', cwd, ['android'], env).status, 0);
    env.GOOGLE_SERVICES_JSON_BASE64 = firebase('com.aquaexpress.cdb');
    assert.equal(run('prepare-mobile-ci.mjs', cwd, ['android'], env).status, 0);
    assert.equal(JSON.parse(readFileSync(join(cwd, 'android/app/google-services.json'))).client[0].client_info.android_client_info.package_name, 'com.aquaexpress.cdb');
    env.APP_BUILD_NUMBER = '0';
    assert.notEqual(run('prepare-mobile-ci.mjs', cwd, ['android'], env).status, 0);
});

test('iOS configuration rejects an unrelated app and installs the matching Google callback', t => {
    const cwd = fixture(t);
    mkdirSync(join(cwd, 'ios/App/App'), { recursive: true });
    writeFileSync(join(cwd, 'capacitor.config.json'), JSON.stringify({ appId: 'com.aquaexpress.cdb' }));
    const infoPath = join(cwd, 'ios/App/App/Info.plist');
    writeFileSync(infoPath, plist.build({ CFBundleDisplayName: 'AquaExpress' }));
    writeFileSync(join(cwd, 'ios/App/App/GoogleService-Info.plist'), plist.build({
        BUNDLE_ID: 'com.aquaexpress.cdb', CLIENT_ID: '123.apps.googleusercontent.com', REVERSED_CLIENT_ID: 'com.googleusercontent.apps.123',
    }));
    const env = { IOS_BUNDLE_ID: 'com.other.app', VITE_GOOGLE_IOS_CLIENT_ID: '123.apps.googleusercontent.com' };
    assert.notEqual(run('configure-ios.mjs', cwd, [], env).status, 0);
    env.IOS_BUNDLE_ID = 'com.aquaexpress.cdb';
    assert.equal(run('configure-ios.mjs', cwd, [], env).status, 0);
    const info = plist.parse(readFileSync(infoPath, 'utf8'));
    assert.equal(info.CFBundleDisplayName, 'AquaExpress');
    assert.deepEqual(info.CFBundleURLTypes, [{ CFBundleURLSchemes: ['com.googleusercontent.apps.123'] }]);
});
