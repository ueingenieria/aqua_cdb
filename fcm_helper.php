<?php

class FCMHelper {

    private static function base64UrlEncode($text) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
    }

    public static function getAccessToken($jsonKeyPath) {
        if (!file_exists($jsonKeyPath)) {
            return false;
        }

        $authConfig = json_decode(file_get_contents($jsonKeyPath), true);

        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $now = time();
        $payload = [
            'iss' => $authConfig['client_email'],
            'sub' => $authConfig['client_email'],
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging'
        ];

        $jwtHeader = self::base64UrlEncode(json_encode($header));
        $jwtPayload = self::base64UrlEncode(json_encode($payload));

        $data = "$jwtHeader.$jwtPayload";
        $signature = '';

        if (!openssl_sign($data, $signature, $authConfig['private_key'], 'SHA256')) {
            return false;
        }

        $jwtSignature = self::base64UrlEncode($signature);
        $jwt = "$data.$jwtSignature";

        // Request Access Token
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);

        $jsonResp = json_decode($response, true);
        
        return isset($jsonResp['access_token']) ? $jsonResp['access_token'] : false;
    }

    public static function sendToAll($conexion, $jsonKeyPath, $title, $body) {
        // 1. Get Project ID from JSON
        if (!file_exists($jsonKeyPath)) return "ERROR: JSON Key not found";
        $authConfig = json_decode(file_get_contents($jsonKeyPath), true);
        $projectId = $authConfig['project_id'];

        // 2. Get Access Token
        $accessToken = self::getAccessToken($jsonKeyPath);
        if (!$accessToken) return "ERROR: Could not generate Access Token";

        // 3. Get User Tokens from DB
        $query = "SELECT DISTINCT token FROM push_tokens";
        $resp = mysqli_query($conexion, $query);
        $tokens = array();
        while($row = mysqli_fetch_assoc($resp)) {
            $tokens[] = $row['token'];
        }

        if (count($tokens) === 0) return "No tokens found";

        // 4. Send in Batches (HTTP v1 sends individually, so we loop)
        // Optimization: Use curl_multi for parallel sending if list is large, 
        // but for now simple loop is fine for MVP.
        
        $url = "https://fcm.googleapis.com/v1/projects/$projectId/messages:send";
        $headers = [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ];

        $successCount = 0;
        $failCount = 0;

        foreach ($tokens as $token) {
            $payload = [
                'message' => [
                    'token' => $token,
                    'notification' => [
                        'title' => $title,
                        'body' => $body
                    ],
                    'webpush' => [
                        'headers' => [
                            'Urgency' => 'high'
                        ],
                        'notification' => [
                            'icon' => '/logo192.png',
                            'click_action' => 'https://www.aquaexpress.com.ar'
                        ]
                    ]
                ]
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode == 200) {
                $successCount++;
            } else {
                $failCount++;
                // Handle invalid tokens (404/400) -> Delete from DB to clean up
                $resData = json_decode($result, true);
                if (isset($resData['error']['details'][0]['errorCode']) && 
                   ($resData['error']['details'][0]['errorCode'] == 'UNREGISTERED')) {
                    mysqli_query($conexion, "DELETE FROM push_tokens WHERE token = '$token'");
                }
            }
        }

        return "Sent: $successCount | Failed: $failCount";
    }
}
?>
