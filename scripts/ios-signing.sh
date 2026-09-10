#!/usr/bin/env bash
set -euo pipefail

# Run only on the ephemeral macOS runner. Never enable shell tracing here.
for key in IOS_CERTIFICATE_BASE64 IOS_CERTIFICATE_PASSWORD IOS_PROFILE_BASE64 IOS_TEAM_ID IOS_BUNDLE_ID; do
  if [ -z "${!key:-}" ]; then echo "Falta configurar $key" >&2; exit 1; fi
done
printf '%s' "$IOS_CERTIFICATE_BASE64" | base64 --decode > "$RUNNER_TEMP/aqua-distribution.p12"
printf '%s' "$IOS_PROFILE_BASE64" | base64 --decode > "$RUNNER_TEMP/aqua.mobileprovision"
security cms -D -i "$RUNNER_TEMP/aqua.mobileprovision" > "$RUNNER_TEMP/profile.plist"

python3 <<'PY'
import os, plistlib, pathlib, datetime
temp = pathlib.Path(os.environ['RUNNER_TEMP'])
profile = plistlib.loads((temp / 'profile.plist').read_bytes())
team, bundle = os.environ['IOS_TEAM_ID'], os.environ['IOS_BUNDLE_ID']
if team not in profile['TeamIdentifier']:
    raise SystemExit('El perfil pertenece a otro equipo de Apple.')
identifier = profile['Entitlements']['application-identifier']
# Older accounts may have an App ID prefix different from their Team ID.
prefix = profile['ApplicationIdentifierPrefix'][0]
if identifier != prefix + '.' + bundle:
    raise SystemExit('El perfil no corresponde al Bundle ID confirmado.')
if profile.get('ProvisionedDevices') or profile.get('ProvisionsAllDevices') or profile['Entitlements'].get('get-task-allow'):
    raise SystemExit('Se requiere un perfil de distribución App Store, no desarrollo, Ad Hoc o Enterprise.')
if profile['Entitlements'].get('aps-environment') != 'production':
    raise SystemExit('Activá Push Notifications y regenerá el perfil de App Store.')
if profile['ExpirationDate'] <= datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None):
    raise SystemExit('El perfil de distribución está vencido.')
uuid = profile['UUID']
import uuid as uuid_module
uuid_module.UUID(uuid)
directory = pathlib.Path.home() / 'Library/MobileDevice/Provisioning Profiles'
directory.mkdir(parents=True, exist_ok=True)
(directory / (uuid + '.mobileprovision')).write_bytes((temp / 'aqua.mobileprovision').read_bytes())
with open(os.environ['GITHUB_ENV'], 'a') as output:
    output.write('IOS_PROFILE_UUID=' + uuid + '\n')
options = {'method': 'app-store-connect', 'destination': 'export', 'teamID': team,
           'signingStyle': 'manual', 'signingCertificate': 'Apple Distribution',
           'provisioningProfiles': {bundle: uuid}, 'manageAppVersionAndBuildNumber': False}
(temp / 'ExportOptions.plist').write_bytes(plistlib.dumps(options))
PY

keychain="$RUNNER_TEMP/aqua-signing.keychain-db"
password=$(openssl rand -hex 32)
echo "::add-mask::$password"
security create-keychain -p "$password" "$keychain"
security set-keychain-settings -lut 21600 "$keychain"
security unlock-keychain -p "$password" "$keychain"
security import "$RUNNER_TEMP/aqua-distribution.p12" -P "$IOS_CERTIFICATE_PASSWORD" -A -t cert -f pkcs12 -k "$keychain"
security set-key-partition-list -S apple-tool:,apple:,codesign: -k "$password" "$keychain"
security list-keychains -d user -s "$keychain" "$HOME/Library/Keychains/login.keychain-db"
