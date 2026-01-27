Obtener medios de pago
curl -X GET \
    'https://api.mercadopago.com/v1/payment_methods' \
    -H 'Authorization: Bearer TEST-366679090114565-021115-000aa1eb53f8f32e450efac77a84c323-140528337'

Crear Plan
curl -X POST \
    'https://api.mercadopago.com/preapproval_plan' \
    -H 'Authorization: Bearer APP_USR-2955538941207241-060817-6bdd8acf26862f1dd775a14484eeb9d6-1139254331' \
    -H 'Content-Type: application/json' \
    -d '{
  "reason": "Yoga classes",
  "auto_recurring": {
    "frequency": 1,
    "frequency_type": "year",
    "repetitions": 12,
    "billing_day": 10,
    "billing_day_proportional": true,
    "transaction_amount": 5,
    "currency_id": "ARS"
  },
  "payment_methods_allowed": {
    "payment_types": [
      {"id":"credit_card"},{"id":"debit_card"}
    ],
    "payment_methods": [
      {}
    ]
  },
  "back_url": "https://www.yoursite.com"
}'

Actualizar plan
curl -X PUT \
    'https://api.mercadopago.com/preapproval_plan/2c938084806ff3b70180708f68200048' \
    -H 'Authorization: Bearer TEST-366679090114565-021115-000aa1eb53f8f32e450efac77a84c323-140528337' \
    -H 'Content-Type: application/json' \
    -d '{
  "payment_methods_allowed": {
    "payment_types": [
      {}
    ],
    "payment_types": [
      {"id":"credit_card"},{"id":"debit_card"}
    ]
  },
  "back_url": "https://www.yoursite.com"
}'

Crear usuario de prueba
curl -X POST \
    'https://api.mercadopago.com/users/test_user?access_token=TEST-366679090114565-021115-000aa1eb53f8f32e450efac77a84c323-140528337' \
    -H 'Authorization: Bearer TEST-366679090114565-021115-000aa1eb53f8f32e450efac77a84c323-140528337' \
    -H 'Content-Type: application/json' \
    -d '{
  "site_id": "MLA"
}'

Crear suscripcion
curl -X POST \
    'https://api.mercadopago.com/preapproval' \
    -H 'Authorization: Bearer TEST-366679090114565-021115-000aa1eb53f8f32e450efac77a84c323-140528337' \
    -H 'Content-Type: application/json' \
    -d '{
  "preapproval_plan_id": "2c938084806ff3b70180708f68200048",
  "external_reference": "YG-1234",
  "payer_email": "contacto@ueingenieria.com.ar",
  "back_url": "https://www.mercadopago.com.ar",
  "status": "pending"
}'

Usuario de prueba (cuenta mati11190)
```json
{
  "id": 1139108522,
  "nickname": "TETE1144632",
  "password": "qatest3611",
  "site_status": "active",
  "email": "test_user_37629432@testuser.com"
}
```
Usuario de prueba (cuenta uE)
```json
{
  "id": 1139166841,
  "nickname": "TESTXG3MUCD9",
  "password": "qatest3107",
  "site_status": "active",
  "email": "test_user_98425930@testuser.com"
}
```
Usuario prueba (cuenta mati1190 producción Vendedor)
```json
{
  "id": 1139254331,
  "nickname": "TESTQ7KHQTTZ",
  "password": "qatest7832",
  "site_status": "active",
  "email": "test_user_55668508@testuser.com"
}
```
Usuario prueba (cuenta mati1190 producción Comprador)
```json
{
  "id": 1139350221,
  "nickname": "TETE5256556",
  "password": "qatest8978",
  "site_status": "active",
  "email": "test_user_45738713@testuser.com"
}
```

Objeto Preapproval (al buscar por id)
```php
object(MercadoPago\Preapproval)#15 (23) {
  ["id":protected]=>
  string(32) "2c938084813ff7c60181455e88770266"
  ["payer_id":protected]=>
  int(1139350221)
  ["payer_email":protected]=>
  string(0) ""
  ["back_url":protected]=>
  string(64) "https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/new_sub.html"
  ["collector_id":protected]=>
  int(1139254331)
  ["application_id":protected]=>
  int(2955538941207241)
  ["status":protected]=>
  string(10) "authorized"
  ["auto_recurring":protected]=>
  object(stdClass)#67 (10) {
    ["frequency"]=>
    int(1)
    ["frequency_type"]=>
    string(6) "months"
    ["transaction_amount"]=>
    int(5)
    ["currency_id"]=>
    string(3) "ARS"
    ["start_date"]=>
    string(29) "2022-06-08T18:10:32.181-04:00"
    ["end_date"]=>
    string(29) "2023-06-08T18:10:32.181-04:00"
    ["billing_day"]=>
    int(10)
    ["billing_day_proportional"]=>
    bool(true)
    ["has_billing_day"]=>
    bool(true)
    ["free_trial"]=>
    NULL
  }
  ["init_point":protected]=>
  string(101) "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=2c938084813ff7c60181455e88770266"
  ["sandbox_init_point":protected]=>
  NULL
  ["reason":protected]=>
  string(21) "Prueba TUser Vendedor"
  ["external_reference":protected]=>
  string(5) "frula"
  ["date_created":protected]=>
  string(29) "2022-06-08T18:10:32.179-04:00"
  ["last_modified":protected]=>
  string(29) "2022-06-10T16:48:02.865-04:00"
  ["preapproval_plan_id":protected]=>
  string(32) "2c938084813ff7c60181455322fa0258"
  ["payment_method_id":protected]=>
  string(13) "account_money"
  ["card_id":protected]=>
  string(10) "9121660110"
  ["_last":protected]=>
  object(MercadoPago\Preapproval)#21 (23) {
    ["id":protected]=>
    string(32) "2c938084813ff7c60181455e88770266"
    ["payer_id":protected]=>
    int(1139350221)
    ["payer_email":protected]=>
    string(0) ""
    ["back_url":protected]=>
    string(64) "https://www.aquaexpress.com.ar/aqua4d/aqua_pagos_mp/new_sub.html"
    ["collector_id":protected]=>
    int(1139254331)
    ["application_id":protected]=>
    int(2955538941207241)
    ["status":protected]=>
    string(10) "authorized"
    ["auto_recurring":protected]=>
    object(stdClass)#67 (10) {
      ["frequency"]=>
      int(1)
      ["frequency_type"]=>
      string(6) "months"
      ["transaction_amount"]=>
      int(5)
      ["currency_id"]=>
      string(3) "ARS"
      ["start_date"]=>
      string(29) "2022-06-08T18:10:32.181-04:00"
      ["end_date"]=>
      string(29) "2023-06-08T18:10:32.181-04:00"
      ["billing_day"]=>
      int(10)
      ["billing_day_proportional"]=>
      bool(true)
      ["has_billing_day"]=>
      bool(true)
      ["free_trial"]=>
      NULL
    }
    ["init_point":protected]=>
    string(101) "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=2c938084813ff7c60181455e88770266"
    ["sandbox_init_point":protected]=>
    NULL
    ["reason":protected]=>
    string(21) "Prueba TUser Vendedor"
    ["external_reference":protected]=>
    string(5) "frula"
    ["date_created":protected]=>
    string(29) "2022-06-08T18:10:32.179-04:00"
    ["last_modified":protected]=>
    string(29) "2022-06-10T16:48:02.865-04:00"
    ["preapproval_plan_id":protected]=>
    string(32) "2c938084813ff7c60181455322fa0258"
    ["payment_method_id":protected]=>
    string(13) "account_money"
    ["card_id":protected]=>
    string(10) "9121660110"
    ["_last":protected]=>
    NULL
    ["error":protected]=>
    NULL
    ["_pagination_params":protected]=>
    NULL
    ["_empty":protected]=>
    bool(false)
    ["summarized"]=>
    object(stdClass)#46 (8) {
      ["quotas"]=>
      int(12)
      ["charged_quantity"]=>
      NULL
      ["pending_charge_quantity"]=>
      int(12)
      ["charged_amount"]=>
      NULL
      ["pending_charge_amount"]=>
      int(60)
      ["semaphore"]=>
      string(6) "yellow"
      ["last_charged_date"]=>
      NULL
      ["last_charged_amount"]=>
      NULL
    }
    ["next_payment_date"]=>
    string(29) "2022-07-10T18:10:32.000-04:00"
  }
  ["error":protected]=>
  NULL
  ["_pagination_params":protected]=>
  NULL
  ["_empty":protected]=>
  bool(false)
  ["summarized"]=>
  object(stdClass)#46 (8) {
    ["quotas"]=>
    int(12)
    ["charged_quantity"]=>
    NULL
    ["pending_charge_quantity"]=>
    int(12)
    ["charged_amount"]=>
    NULL
    ["pending_charge_amount"]=>
    int(60)
    ["semaphore"]=>
    string(6) "yellow"
    ["last_charged_date"]=>
    NULL
    ["last_charged_amount"]=>
    NULL
  }
  ["next_payment_date"]=>
  string(29) "2022-07-10T18:10:32.000-04:00"
}
```

Objeto authorized_payment (al buscar por id)
```php
object(MercadoPago\AuthorizedPayment)#15 (22) {
  ["id":protected]=>
  int(6153799770)
  ["preapproval_id":protected]=>
  string(32) "2c938084813ff7c60181455e88770266"
  ["type":protected]=>
  string(9) "recurring"
  ["status":protected]=>
  string(9) "scheduled"
  ["date_created":protected]=>
  string(29) "2022-06-10T21:20:07.000-03:00"
  ["last_modified":protected]=>
  string(29) "2022-06-13T09:03:18.000-03:00"
  ["transaction_amount":protected]=>
  float(5)
  ["currency_id":protected]=>
  string(3) "ARS"
  ["reason":protected]=>
  string(21) "Prueba TUser Vendedor"
  ["external_reference":protected]=>
  string(5) "frula"
  ["payment":protected]=>
  object(MercadoPago\Payment)#67 (83) {
    ["id":protected]=>
    int(23138464140)
    ["acquirer":protected]=>
    NULL
    ["acquirer_reconciliation":protected]=>
    NULL
    ["site_id":protected]=>
    NULL
    ["sponsor_id":protected]=>
    NULL
    ["operation_type":protected]=>
    NULL
    ["order_id":protected]=>
    NULL
    ["order":protected]=>
    NULL
    ["binary_mode":protected]=>
    NULL
    ["external_reference":protected]=>
    NULL
    ["status":protected]=>
    string(8) "rejected"
    ["status_detail":protected]=>
    string(18) "insufficient_money"
    ["store_id":protected]=>
    NULL
    ["taxes_amount":protected]=>
    NULL
    ["payment_type":protected]=>
    NULL
    ["date_created":protected]=>
    NULL
    ["last_modified":protected]=>
    NULL
    ["live_mode":protected]=>
    NULL
    ["date_last_updated":protected]=>
    NULL
    ["date_of_expiration":protected]=>
    NULL
    ["deduction_schema":protected]=>
    NULL
    ["date_approved":protected]=>
    NULL
    ["money_release_date":protected]=>
    NULL
    ["money_release_schema":protected]=>
    NULL
    ["currency_id":protected]=>
    NULL
    ["transaction_amount":protected]=>
    NULL
    ["transaction_amount_refunded":protected]=>
    NULL
    ["shipping_cost":protected]=>
    NULL
    ["total_paid_amount":protected]=>
    NULL
    ["finance_charge":protected]=>
    NULL
    ["net_received_amount":protected]=>
    NULL
    ["marketplace":protected]=>
    NULL
    ["marketplace_fee":protected]=>
    NULL
    ["reason":protected]=>
    NULL
    ["payer":protected]=>
    NULL
    ["collector":protected]=>
    NULL
    ["collector_id":protected]=>
    NULL
    ["counter_currency":protected]=>
    NULL
    ["payment_method_id":protected]=>
    NULL
    ["payment_type_id":protected]=>
    NULL
    ["pos_id":protected]=>
    NULL
    ["transaction_details":protected]=>
    NULL
    ["fee_details":protected]=>
    NULL
    ["differential_pricing_id":protected]=>
    NULL
    ["application_fee":protected]=>
    NULL
    ["authorization_code":protected]=>
    NULL
    ["capture":protected]=>
    NULL
    ["captured":protected]=>
    NULL
    ["card":protected]=>
    NULL
    ["call_for_authorize_id":protected]=>
    NULL
    ["statement_descriptor":protected]=>
    NULL
    ["refunds":protected]=>
    NULL
    ["shipping_amount":protected]=>
    NULL
    ["additional_info":protected]=>
    NULL
    ["campaign_id":protected]=>
    NULL
    ["coupon_amount":protected]=>
    NULL
    ["installments":protected]=>
    NULL
    ["token":protected]=>
    NULL
    ["description":protected]=>
    NULL
    ["notification_url":protected]=>
    NULL
    ["issuer_id":protected]=>
    NULL
    ["processing_mode":protected]=>
    NULL
    ["merchant_account_id":protected]=>
    NULL
    ["merchant_number":protected]=>
    NULL
    ["metadata":protected]=>
    NULL
    ["callback_url":protected]=>
    NULL
    ["amount_refunded":protected]=>
    NULL
    ["coupon_code":protected]=>
    NULL
    ["barcode":protected]=>
    NULL
    ["marketplace_owner":protected]=>
    NULL
    ["integrator_id":protected]=>
    NULL
    ["corporation_id":protected]=>
    NULL
    ["platform_id":protected]=>
    NULL
    ["charges_details":protected]=>
    NULL
    ["taxes":protected]=>
    NULL
    ["net_amount":protected]=>
    NULL
    ["point_of_interaction":protected]=>
    NULL
    ["payment_method_option_id":protected]=>
    NULL
    ["merchant_services":protected]=>
    NULL
    ["_last":protected]=>
    NULL
    ["error":protected]=>
    NULL
    ["_pagination_params":protected]=>
    NULL
    ["_empty":protected]=>
    bool(false)
  }
  ["rejection_code":protected]=>
  string(18) "insufficient_money"
  ["retry_attempt":protected]=>
  string(1) "4"
  ["next_retry_date":protected]=>
  string(29) "2022-07-10T19:10:32.000-03:00"
  ["last_retry_date":protected]=>
  NULL
  ["expire_date":protected]=>
  NULL
  ["debit_date":protected]=>
  string(29) "2022-06-10T20:00:56.000-03:00"
  ["coupon_code":protected]=>
  NULL
  ["_last":protected]=>
  object(MercadoPago\AuthorizedPayment)#194 (22) {
    ["id":protected]=>
    int(6153799770)
    ["preapproval_id":protected]=>
    string(32) "2c938084813ff7c60181455e88770266"
    ["type":protected]=>
    string(9) "recurring"
    ["status":protected]=>
    string(9) "scheduled"
    ["date_created":protected]=>
    string(29) "2022-06-10T21:20:07.000-03:00"
    ["last_modified":protected]=>
    string(29) "2022-06-13T09:03:18.000-03:00"
    ["transaction_amount":protected]=>
    float(5)
    ["currency_id":protected]=>
    string(3) "ARS"
    ["reason":protected]=>
    string(21) "Prueba TUser Vendedor"
    ["external_reference":protected]=>
    string(5) "frula"
    ["payment":protected]=>
    object(MercadoPago\Payment)#67 (83) {
      ["id":protected]=>
      int(23138464140)
      ["acquirer":protected]=>
      NULL
      ["acquirer_reconciliation":protected]=>
      NULL
      ["site_id":protected]=>
      NULL
      ["sponsor_id":protected]=>
      NULL
      ["operation_type":protected]=>
      NULL
      ["order_id":protected]=>
      NULL
      ["order":protected]=>
      NULL
      ["binary_mode":protected]=>
      NULL
      ["external_reference":protected]=>
      NULL
      ["status":protected]=>
      string(8) "rejected"
      ["status_detail":protected]=>
      string(18) "insufficient_money"
      ["store_id":protected]=>
      NULL
      ["taxes_amount":protected]=>
      NULL
      ["payment_type":protected]=>
      NULL
      ["date_created":protected]=>
      NULL
      ["last_modified":protected]=>
      NULL
      ["live_mode":protected]=>
      NULL
      ["date_last_updated":protected]=>
      NULL
      ["date_of_expiration":protected]=>
      NULL
      ["deduction_schema":protected]=>
      NULL
      ["date_approved":protected]=>
      NULL
      ["money_release_date":protected]=>
      NULL
      ["money_release_schema":protected]=>
      NULL
      ["currency_id":protected]=>
      NULL
      ["transaction_amount":protected]=>
      NULL
      ["transaction_amount_refunded":protected]=>
      NULL
      ["shipping_cost":protected]=>
      NULL
      ["total_paid_amount":protected]=>
      NULL
      ["finance_charge":protected]=>
      NULL
      ["net_received_amount":protected]=>
      NULL
      ["marketplace":protected]=>
      NULL
      ["marketplace_fee":protected]=>
      NULL
      ["reason":protected]=>
      NULL
      ["payer":protected]=>
      NULL
      ["collector":protected]=>
      NULL
      ["collector_id":protected]=>
      NULL
      ["counter_currency":protected]=>
      NULL
      ["payment_method_id":protected]=>
      NULL
      ["payment_type_id":protected]=>
      NULL
      ["pos_id":protected]=>
      NULL
      ["transaction_details":protected]=>
      NULL
      ["fee_details":protected]=>
      NULL
      ["differential_pricing_id":protected]=>
      NULL
      ["application_fee":protected]=>
      NULL
      ["authorization_code":protected]=>
      NULL
      ["capture":protected]=>
      NULL
      ["captured":protected]=>
      NULL
      ["card":protected]=>
      NULL
      ["call_for_authorize_id":protected]=>
      NULL
      ["statement_descriptor":protected]=>
      NULL
      ["refunds":protected]=>
      NULL
      ["shipping_amount":protected]=>
      NULL
      ["additional_info":protected]=>
      NULL
      ["campaign_id":protected]=>
      NULL
      ["coupon_amount":protected]=>
      NULL
      ["installments":protected]=>
      NULL
      ["token":protected]=>
      NULL
      ["description":protected]=>
      NULL
      ["notification_url":protected]=>
      NULL
      ["issuer_id":protected]=>
      NULL
      ["processing_mode":protected]=>
      NULL
      ["merchant_account_id":protected]=>
      NULL
      ["merchant_number":protected]=>
      NULL
      ["metadata":protected]=>
      NULL
      ["callback_url":protected]=>
      NULL
      ["amount_refunded":protected]=>
      NULL
      ["coupon_code":protected]=>
      NULL
      ["barcode":protected]=>
      NULL
      ["marketplace_owner":protected]=>
      NULL
      ["integrator_id":protected]=>
      NULL
      ["corporation_id":protected]=>
      NULL
      ["platform_id":protected]=>
      NULL
      ["charges_details":protected]=>
      NULL
      ["taxes":protected]=>
      NULL
      ["net_amount":protected]=>
      NULL
      ["point_of_interaction":protected]=>
      NULL
      ["payment_method_option_id":protected]=>
      NULL
      ["merchant_services":protected]=>
      NULL
      ["_last":protected]=>
      NULL
      ["error":protected]=>
      NULL
      ["_pagination_params":protected]=>
      NULL
      ["_empty":protected]=>
      bool(false)
    }
    ["rejection_code":protected]=>
    string(18) "insufficient_money"
    ["retry_attempt":protected]=>
    string(1) "4"
    ["next_retry_date":protected]=>
    string(29) "2022-07-10T19:10:32.000-03:00"
    ["last_retry_date":protected]=>
    NULL
    ["expire_date":protected]=>
    NULL
    ["debit_date":protected]=>
    string(29) "2022-06-10T20:00:56.000-03:00"
    ["coupon_code":protected]=>
    NULL
    ["_last":protected]=>
    NULL
    ["error":protected]=>
    NULL
    ["_pagination_params":protected]=>
    NULL
    ["_empty":protected]=>
    bool(false)
  }
  ["error":protected]=>
  NULL
  ["_pagination_params":protected]=>
  NULL
  ["_empty":protected]=>
  bool(false)
}
```