# Publicación de AquaExpress desde Windows

## Estado al 10 de septiembre de 2026

Se prepararon proyectos Capacitor para Android e iOS, builds independientes de la PWA, adaptadores de Google/ubicación/push/pagos y workflows manuales de GitHub Actions. Las pruebas de código y compilaciones web no sustituyen compilar con Xcode/Gradle ni probar dispositivos. Todavía no hay un APK, AAB o IPA validado, ni se subió esta actualización a las tiendas.

Verificación local completada: siete tests, build web/PWA, build móvil y validación de sus archivos, sincronización Android y copia iOS. ESLint de módulos móviles/notificaciones aprobado, workflows validados con actionlint y sintaxis de Xcode/plists comprobada. La consulta del repositorio confirmó que aún no tiene variables ni secretos de Actions configurados.

Repositorio configurado: `ueingenieria/aqua_cdb`. El directorio local tenía numerosos cambios previos sin commit; los workflows y los cambios móviles están preparados localmente. Antes de ejecutar Actions debe subirse una versión revisada de la app actual junto con estos archivos y el lockfile.

Aplicaciones existentes:

- [Google Play: Aqua Express CDB](https://play.google.com/store/apps/details?id=com.aquaexpress.cdb), identificador `com.aquaexpress.cdb`.
- [App Store: AquaExpress Club de Beneficios](https://apps.apple.com/gb/app/aquaexpress-club-de-beneficios/id1530959034), ficha `1530959034`. Confirmar su Bundle ID en App Store Connect: el respaldo Cordova usa `com.aquaexpress.cdb`.

## Antes de la primera compilación en la nube

1. Confirmar el Bundle ID de iOS y los últimos números de versión/build en ambas consolas, incluidos tracks internos y borradores. `3.4.0` es la versión propuesta, no una confirmación de que esté disponible. El número de build se ingresa manualmente en cada ejecución y debe superar el usado en Google Play; en Apple debe ser válido y no utilizado para esa versión.
2. En Firebase `aquapush-a8539`, registrar o recuperar las aplicaciones Android e iOS correctas y descargar `google-services.json` y `GoogleService-Info.plist`.
3. Configurar Google OAuth en el mismo proyecto: cliente web, cliente iOS y cliente Android con el package y SHA-1 del certificado de cada variante usada. Para Play Store también importa el certificado de **Play App Signing**, que puede diferir de la clave de subida.
4. En Apple Developer activar Push Notifications para el identificador existente y cargar la clave APNs correspondiente en Firebase. Regenerar el perfil App Store con esa capacidad.
5. Confirmar que las APIs PHP permiten solicitudes desde `https://localhost` (Android) y `capacitor://localhost` (iOS), incluidos los encabezados de autenticación y las solicitudes OPTIONS. Los Maps JavaScript APIs también deben funcionar desde estos orígenes con restricciones adecuadas. Se conserva Axios/fetch; no se desactivó CORS.

## Configuración de GitHub

Avance de firma Android: se encontró `legacy_backup/aquacdb.keystore`; el usuario verificó la contraseña del almacén. Alias `aquacdb`. Su SHA-256 `F8:27:58:E4:18:35:62:68:76:FD:63:2C:47:44:28:B4:4B:42:B4:7A:BA:A7:E0:8B:F4:C3:97:82:2E:1F:66:BD` coincide con el certificado de clave de carga mostrado en Play Console. Ya se cargaron en GitHub Actions los secretos `ANDROID_KEYSTORE_BASE64` y `ANDROID_KEY_ALIAS`. Las dos contraseñas siguen pendientes de ingreso privado por el usuario; la contraseña de la clave privada todavía no se probó. La captura de versiones muestra `30301` (3.3.1) en producción; comprobar todos los tracks antes de elegir el nuevo código.

En el repositorio: **Settings → Secrets and variables → Actions**. Guardar archivos y contraseñas en Secrets, no en el chat ni en el código.

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Variable | `VITE_GOOGLE_WEB_CLIENT_ID` | ID OAuth de tipo aplicación web usado por Google nativo |
| Variable | `VITE_GOOGLE_IOS_CLIENT_ID` | CLIENT_ID del archivo Firebase iOS |
| Variable | `IOS_BUNDLE_ID` | Bundle ID confirmado en App Store Connect |
| Variable | `IOS_TEAM_ID` | Team ID de Apple Developer |
| Secreto | `VITE_GOOGLE_MAPS_API_KEY` | Clave cliente Maps; termina incorporada en la app, no es un secreto de servidor |
| Secreto | `GOOGLE_SERVICES_JSON_BASE64` | Contenido de google-services.json codificado en Base64 |
| Secreto | `GOOGLE_SERVICE_INFO_PLIST_BASE64` | Contenido de GoogleService-Info.plist codificado en Base64 |
| Secreto | `ANDROID_KEYSTORE_BASE64` | Archivo de firma/subida existente codificado en Base64 |
| Secreto | `ANDROID_KEYSTORE_PASSWORD` | Contraseña del archivo |
| Secreto | `ANDROID_KEY_ALIAS` | Alias de la clave existente |
| Secreto | `ANDROID_KEY_PASSWORD` | Contraseña de la clave |
| Secreto | `IOS_CERTIFICATE_BASE64` | Certificado Apple Distribution .p12, incluyendo clave privada, en Base64 |
| Secreto | `IOS_CERTIFICATE_PASSWORD` | Contraseña del .p12 |
| Secreto | `IOS_PROFILE_BASE64` | Perfil App Store .mobileprovision en Base64 |
| Variable | `APP_STORE_CONNECT_KEY_ID` | Key ID de una clave API de equipo para subir builds |
| Variable | `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID de App Store Connect |
| Secreto | `APP_STORE_CONNECT_KEY_BASE64` | Clave API .p8 en Base64; se usa solo si se activa la subida a TestFlight |

Base64 no cifra. Para copiar el contenido de un archivo al portapapeles en PowerShell sin imprimirlo:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\ruta\archivo')) | Set-Clipboard
```

No generar una clave Android diferente para sustituir silenciosamente la existente: revisar primero Play App Signing y, si hace falta, el procedimiento de restablecimiento de la clave de subida. Para iOS, si no existe un .p12 recuperable, se puede generar clave privada y CSR con OpenSSL desde Windows, emitir Apple Distribution en el portal y exportar el .p12. Esto se hará con la cuenta correcta, sin revocar certificados existentes.

## Compilación y pruebas

### Windows

Node 24 y `npm ci`. Para valores locales copiar `.env.mobile.example` a `.env.mobile.local` y completar solo identificadores y claves cliente.

```powershell
npm run test:mobile
npm run build
npm run mobile:sync
```

`build` genera la web en `dist`, con base `/cdb/`. `mobile:sync` genera `dist-mobile`, sincroniza Android y copia los recursos a iOS. En Windows la resolución Swift queda expresamente a cargo de macOS, porque el plugin Firebase requiere enlaces simbólicos. No usar `cap sync ios` desde este Windows esperando validar Xcode.

Para compilar Android localmente hay que instalar Android Studio/SDK y Java 21. En esta máquina no se detectaron al preparar la migración. Puede usarse el workflow sin instalarlos.

### Android en GitHub Actions

Abrir **Actions → Android - build de prueba o actualización → Run workflow**.

- `debug`: genera APK de prueba con firma debug. No actualiza una instalación de Play firmada con otra clave; no desinstalar una app con datos importantes para forzarlo. Preferir un dispositivo de pruebas o el track interno de Play con AAB firmado.
- `release`: genera AAB firmado con la clave indicada. Descargar el artefacto y subirlo al track interno de la app existente en Play Console.

Ambas variantes exigen la configuración Firebase y Google. La release también exige todos los datos de firma. No hay publicación automática en producción.

### iOS en GitHub Actions

Abrir **Actions → iOS - compilación en Mac de la nube → Run workflow**.

- `simulator`: verifica compilación Xcode y produce una app de simulador. No se instala en el iPhone del amigo.
- `signed`: valida perfil/equipo/identificador, compila y exporta un IPA App Store. Activar `upload_testflight` para subir ese build a App Store Connect desde la Mac de la nube. Requiere los datos de la clave API.

El workflow utiliza un runner `macos-26` y exige Xcode 26 o superior. Las ejecuciones pueden consumir minutos facturables de GitHub según el plan; consultar Billing antes de ejecutarlas.

Después del procesamiento de Apple, completar las preguntas de cifrado/compliance que solicite App Store Connect y agregar el build al grupo de pruebas. Invitar al amigo como tester **externo**, con su email y su propia cuenta Apple, sin acceso al equipo de desarrollo. Apple puede exigir revisión beta antes de permitir esas pruebas. La subida no envía automáticamente la app a revisión pública ni invita testers.

## Bloqueos de publicación y verificaciones pendientes

- Firma, Firebase, OAuth y APNs todavía deben configurarse con las cuentas reales. No abrir el proyecto iOS sin un GoogleService-Info.plist válido: Firebase lo necesita al arrancar.
- **Inicio de sesión iOS:** la app ofrece Google. Antes de enviar a revisión debe resolverse el requisito 4.8 de Apple: una opción equivalente que cumpla las condiciones (habitualmente Sign in with Apple), salvo una excepción aplicable. La integración de Apple requiere verificación de tokens y asociación de usuarios en backend; no está implementada aquí ni se debe simular con un botón.
- **Push del backend:** en `legacy_backup/pages_ext/aqua_4d.php` hay dos `case 82`, uno para crear promociones y otro para guardar tokens, y también se repite `81`. El cliente actual usa `accion=82` para tokens. Hay que comparar con el archivo desplegado y resolver la colisión antes de validar push. No se cambió el protocolo de producción sin confirmar el servidor real.
- **Privacidad/eliminación:** probar eliminación efectiva con cuenta normal y Google, verificar retención y URL pública de eliminación para Google Play, y actualizar las declaraciones de datos de ambas tiendas. La ficha Apple existente declara que no recopila datos; hay que revisarla contra el comportamiento real de esta app.
- **Retorno de pagos:** el botón para cerrar el navegador y volver a AquaExpress permite refrescar el estado desde el backend. No se configuraron todavía Universal Links/App Links del dominio; requieren los archivos de asociación del sitio y los identificadores/certificados definitivos. No asumir que la URL web de retorno abrirá automáticamente la app.
- **Sesión anterior:** Cordova y Capacitor pueden usar distintos orígenes de almacenamiento. Probar una actualización sobre la versión instalada; podría requerir iniciar sesión nuevamente.
- **Revisión técnica:** las dependencias existentes y las incorporadas requieren revisar las alertas de `npm audit` antes de release; no se ejecutó `audit fix --force` ni se actualizaron paquetes ajenos a la migración a ciegas.

## Prueba con dispositivos reales

En Android y en el iPhone prestado: instalación/actualización, login con contraseña y Google, alta y eliminación de cuenta de prueba, cámara QR con permiso otorgado/denegado, ubicación precisa/aproximada/denegada, mapas, notificaciones en primer plano y segundo plano, abrir una notificación, cerrar sesión y cambiar de usuario, pago aprobado/cancelado/pendiente, retorno y actualización de saldo/suscripción, modo sin conexión, teclado y zonas seguras de pantalla. Usar usuarios y operaciones de prueba; no accionar equipos ni cobrar dinero real por una prueba automática.

Para las fichas: capturas de la versión definitiva, texto de novedades, URLs de soporte/privacidad, clasificación de contenido y credenciales de una cuenta demo que permita al revisor acceder sin operar un lavadero físico.

## Referencias

- [Capacitor: entorno de desarrollo](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Firebase Messaging: instalación nativa](https://github.com/capawesome-team/capacitor-firebase/tree/main/packages/messaging)
- [Google nativo: clientes OAuth y certificados](https://github.com/Cap-go/capacitor-social-login/blob/main/docs/setup_google.md)
- [GitHub: firma de Xcode](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications)
- [Apple: subir builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds)
- [Apple: requisitos de revisión](https://developer.apple.com/app-store/review/guidelines/)

## Candidato Android

La rama `codex/mobile-stores` compila un AAB firmado 3.4.0 (30400) al recibir cambios. No publica en Play. Confirmar que 30400 supera todos los códigos de las pistas antes de cargarlo. El workflow verifica la huella SHA-256 del certificado de subida.

Android: Firebase y secretos de firma configurados; falta comprobar el AAB y probar OAuth en un dispositivo. iOS sigue pendiente de Firebase, firma, OAuth y APNs.

El archivo `legacy_backup/aquacdb.keystore` ya estaba versionado en el repositorio público. Se retira de esta rama conservando las copias locales; esto no elimina versiones del historial. Evaluar el restablecimiento de la clave de subida desde Play Console antes de producción.