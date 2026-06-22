const crypto = require('crypto');

/**
 * Script para generar initData válido para testing
 * Uso: node generate-init-data.js [bot_token]
 * 
 * Ejemplo:
 *   node generate-init-data.js "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
 */

const BOT_TOKEN = process.argv[2] || process.env.TELEGRAM_BOT_TOKEN_PARENT || '1234567890:TEST_TOKEN_FOR_DEVELOPMENT';

const TEST_USER = {
  id: 123456789,
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  language_code: 'es',
  allows_write_to_pm: true
};

function generateInitData(user, botToken, startParam = null) {
  const now = Math.floor(Date.now() / 1000);
  
  const params = new URLSearchParams();
  params.set('user', JSON.stringify(user));
  params.set('auth_date', now.toString());
  
  if (startParam) {
    params.set('start_param', startParam);
  }
  
  // Ordenar y construir data_check_string
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Generar secret key: HMAC-SHA256("WebAppData", botToken)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  // Generar hash: HMAC-SHA256(secretKey, dataCheckString)
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  params.set('hash', hash);
  
  return params.toString();
}

function generateUrlEncodedInitData(user, botToken, startParam = null) {
  const plain = generateInitData(user, botToken, startParam);
  return encodeURIComponent(plain);
}

// Generar initData
const initData = generateInitData(TEST_USER, BOT_TOKEN);
const initDataEncoded = generateUrlEncodedInitData(TEST_USER, BOT_TOKEN);

console.log('\n=== Vendy Test InitData ===\n');
console.log('Bot Token:', BOT_TOKEN.slice(0, 20) + '...');
console.log('\n--- Plain initData (for testing) ---');
console.log(initData);
console.log('\n--- URL-encoded initData (for Bruno/Postman) ---');
console.log(initDataEncoded);
console.log('\n--- Copy to Bruno environment ---');
console.log(`initData: ${initDataEncoded}`);
console.log('\n--- For curl ---');
console.log(`-H "X-Telegram-Init-Data: ${initData}"`);

// Generar con start_param (para referral)
const initDataReferral = generateInitData(TEST_USER, BOT_TOKEN, 'ref_123456');
console.log('\n--- With start_param (referral) ---');
console.log(initDataReferral);

console.log('\n===========================\n');
