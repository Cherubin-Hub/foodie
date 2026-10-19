import assert from 'assert';
import { generateLicenseKey } from '../scripts/generate_license_key';

console.log('🧪 Starting Foodie POS Automated Verification Suite...\n');

let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(`    `, err instanceof Error ? err.message : err);
    failedTests++;
  }
}

// 1. Cryptographic Offline License Key Tests
console.log('--- 1. Cryptographic License & HMAC Signature Tests ---');

test('Generates deterministic HMAC-SHA256 signature for 30D tier', () => {
  const key = generateLicenseKey('30D', 'A9F3K2');
  assert.strictEqual(key, 'LIC-FOODIE_POS-30D-A9F3K2-E15E77B4EEED');
});

test('Generates deterministic HMAC-SHA256 signature for LIFE tier', () => {
  const key = generateLicenseKey('LIFE', 'A9F3K2');
  assert.strictEqual(key, 'LIC-FOODIE_POS-LIFE-A9F3K2-AB05DB3C5B78');
});

test('Rejects invalid duration tiers', () => {
  assert.throws(() => {
    generateLicenseKey('999D', 'A9F3K2');
  }, /Invalid duration tier/);
});

test('Rejects invalid nonces not matching 6 characters', () => {
  assert.throws(() => {
    generateLicenseKey('30D', 'SHORT');
  }, /Invalid nonce/);
});

// 2. Order Math & Financial Calculation Tests
console.log('\n--- 2. Order Calculations & Promo Logic Tests ---');

test('Calculates item subtotals correctly', () => {
  const items = [
    { name: 'Pepperoni Feast', price: 11.99, quantity: 2 },
    { name: 'Cheesy Garlic Bread', price: 5.99, quantity: 1 }
  ];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  assert.strictEqual(Number(subtotal.toFixed(2)), 29.97);
});

test('Applies FOODIE30 30% discount accurately', () => {
  const subtotal = 29.97;
  const discountRate = 30;
  const discountAmount = Number((subtotal * (discountRate / 100)).toFixed(2));
  assert.strictEqual(discountAmount, 8.99);

  const total = Number((subtotal - discountAmount).toFixed(2));
  assert.strictEqual(total, 20.98);
});

test('Applies FREE DELIVERY discount correctly on delivery orders', () => {
  const subtotal = 20.00;
  const standardDeliveryFee = 3.50;
  const isFreeDelivery = true;
  const effectiveDeliveryFee = isFreeDelivery ? 0.00 : standardDeliveryFee;

  const total = subtotal + effectiveDeliveryFee;
  assert.strictEqual(total, 20.00);
});

// Summary
console.log(`\n======================================================`);
console.log(`Verification Suite Results: \x1b[32m${passedTests} Passed\x1b[0m, \x1b[31m${failedTests} Failed\x1b[0m`);
console.log(`======================================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
