import process from 'node:process';
process.env.LMS_BROWSER_TEST = '1';
await import('./integration.mjs');
