import fs from 'fs/promises';
import path from 'path';

const LOW_FILE = path.resolve('.local-kv-strategy:low.json');
const HIGH_FILE = path.resolve('.local-kv-strategy:high.json');
const INTERVAL_MS = 10_000; // Check every 10 seconds (configurable)

let lastLow: string | null = null;
let lastHigh: string | null = null;

// Rule-based allocation function
function allocate(risk: string, trend: string): number {
  if (risk === 'high' && trend === 'uptrend') return 75;
  if (risk === 'high' && trend === 'downtrend') return 25;
  if (risk === 'low' && trend === 'uptrend') return 25;
  if (risk === 'low' && trend === 'downtrend') return 75;
  return 0; // fallback
}

async function readFileSafe(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf-8');
  } catch (e) {
    return null;
  }
}

function tryParseJSON(data: string | null): any | null {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function checkAndAct() {
  const [low, high] = await Promise.all([
    readFileSafe(LOW_FILE),
    readFileSafe(HIGH_FILE)
  ]);

  let changed = false;

  if (low && low !== lastLow) {
    const lowObj = tryParseJSON(low);
    if (lowObj) {
      const allocation = allocate(lowObj.risk, lowObj.trend);
      console.log(`🔔 Low strategy output changed! Creating new mock pool...`);
      console.log('New low strategy:', low);
      console.log(`➡️  Allocation for low risk, ${lowObj.trend}: ${allocation}%`);
    }
    lastLow = low;
    changed = true;
  }

  if (high && high !== lastHigh) {
    const highObj = tryParseJSON(high);
    if (highObj) {
      const allocation = allocate(highObj.risk, highObj.trend);
      console.log(`🔔 High strategy output changed! Creating new mock pool...`);
      console.log('New high strategy:', high);
      console.log(`➡️  Allocation for high risk, ${highObj.trend}: ${allocation}%`);
    }
    lastHigh = high;
    changed = true;
  }

  if (!changed) {
    console.log('No change detected.');
  }
}

async function main() {
  console.log('🟢 Mock Chainlink Keeper started. Watching for KV output changes...');
  // Initial read
  lastLow = await readFileSafe(LOW_FILE);
  lastHigh = await readFileSafe(HIGH_FILE);

  setInterval(checkAndAct, INTERVAL_MS);
}

main(); 