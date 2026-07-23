const fs = require('fs');
const path = require('path');

const commit = String(process.env.VERCEL_GIT_COMMIT_SHA || '').trim();
const version = commit ? commit.slice(0, 12) : new Date().toISOString().replace(/[-:.TZ]/g, '');
const payload = {
  version,
  builtAt: new Date().toISOString(),
};

const versionOutput = path.join(__dirname, '..', 'src', 'version.json');
fs.writeFileSync(versionOutput, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const analyticsId = String(process.env.GA_MEASUREMENT_ID || 'G-REPLACE_ME').trim();
const analyticsOutput = path.join(__dirname, '..', 'src', 'app', 'config', 'analytics.config.ts');
fs.writeFileSync(
  analyticsOutput,
  `// Generated at build time from GA_MEASUREMENT_ID.\nexport const GA_MEASUREMENT_ID = ${JSON.stringify(analyticsId)};\n`,
  'utf8',
);

console.log(`Generated build version ${version}`);
console.log(`Google Analytics: ${analyticsId === 'G-REPLACE_ME' ? 'disabled (GA_MEASUREMENT_ID not set)' : analyticsId}`);
