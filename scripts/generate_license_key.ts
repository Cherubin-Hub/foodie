import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const APP_CODE = process.env.APP_CODE || 'FOODIE_POS';
const APP_SECRET = process.env.APP_SECRET || 'foodie_master_secret_2026_x99_secure';
const VALID_DURATIONS = ['7D', '14D', '30D', '90D', '264D', 'LIFE'] as const;

type DurationTier = typeof VALID_DURATIONS[number];

export function generateLicenseKey(duration: string, nonce: string): string {
  const normDuration = duration.toUpperCase().trim();
  const normNonce = nonce.toUpperCase().trim();

  if (!VALID_DURATIONS.includes(normDuration as DurationTier)) {
    throw new Error(`Invalid duration tier "${duration}". Supported tiers: ${VALID_DURATIONS.join(', ')}`);
  }

  if (normNonce.length !== 6) {
    throw new Error(`Invalid nonce "${nonce}". Nonce must be a 6-character alphanumeric string.`);
  }

  const rawData = `${APP_CODE}:${normDuration}:${normNonce}`;
  const hmacSignature = crypto
    .createHmac('sha256', APP_SECRET)
    .update(rawData)
    .digest('hex')
    .substring(0, 12)
    .toUpperCase();

  return `LIC-${APP_CODE}-${normDuration}-${normNonce}-${hmacSignature}`;
}

// CLI Execution Support
const isDirectExecution = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/generate_license_key.ts');

if (isDirectExecution) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
========================================================================
FOODIE POS - OFFLINE CRYPTOGRAPHIC LICENSE GENERATOR CLI
========================================================================
Usage:
  npx tsx scripts/generate_license_key.ts <DURATION> <NONCE>
  npx tsx scripts/generate_license_key.ts --all <NONCE>

Examples:
  npx tsx scripts/generate_license_key.ts 30D A9F3K2
  npx tsx scripts/generate_license_key.ts LIFE A9F3K2
  npx tsx scripts/generate_license_key.ts --all A9F3K2

Supported Tiers:
  7D   - 7 Days Trial
  14D  - 14 Days Evaluation
  30D  - 30 Days Monthly
  90D  - 90 Days Quarterly
  264D - 264 Days Annual Term
  LIFE - Lifetime Activation (9999-12-31)
========================================================================
`);
} else if (args[0] === '--all' && args[1]) {
  const nonce = args[1].toUpperCase().trim();
  console.log(`\nGenerating all activation tiers for Nonce [${nonce}]...\n`);
  console.table(
    VALID_DURATIONS.map(tier => ({
      Tier: tier,
      'License Key': generateLicenseKey(tier, nonce)
    }))
  );
} else if (args.length >= 2) {
  const [duration, nonce] = args;
  try {
    const key = generateLicenseKey(duration, nonce);
    console.log(`\nGenerated License Key for [${duration.toUpperCase()}] on Nonce [${nonce.toUpperCase()}]:`);
    console.log(`\x1b[32m%s\x1b[0m\n`, key);
  } catch (err) {
    console.error(`\x1b[31mError:\x1b[0m`, err instanceof Error ? err.message : err);
  }
}
}


