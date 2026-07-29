const baseUrl = process.env.BACKEND_URL || 'https://backend-eight-tawny-24.vercel.app';
const apiKey = process.env.ATS_API_KEY;
const total = Number(process.env.REQUESTS || 80);
const concurrency = Number(process.env.CONCURRENCY || 8);
const query = process.env.QUERY || 'producao';

if (!apiKey) {
  console.error('Defina ATS_API_KEY para executar o teste de carga.');
  process.exit(1);
}

const latencies = [];
let failures = 0;
let cursor = 0;

await fetch(`${baseUrl}/ats/candidatos?q=${encodeURIComponent(query)}&semantica=1`, {
  headers: { 'x-api-key': apiKey },
}).catch(() => null);

async function worker() {
  while (cursor < total) {
    cursor += 1;
    const start = performance.now();
    try {
      const res = await fetch(`${baseUrl}/ats/candidatos?q=${encodeURIComponent(query)}&semantica=1`, {
        headers: { 'x-api-key': apiKey },
      });
      if (!res.ok) failures += 1;
      await res.arrayBuffer();
    } catch {
      failures += 1;
    } finally {
      latencies.push(performance.now() - start);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
latencies.sort((a, b) => a - b);
const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))] || 0;

const summary = {
  total,
  concurrency,
  failures,
  p50Ms: Math.round(pct(50)),
  p95Ms: Math.round(pct(95)),
  p99Ms: Math.round(pct(99)),
};

console.log(JSON.stringify(summary, null, 2));
if (failures > 0 || summary.p95Ms > Number(process.env.MAX_P95_MS || 2500)) {
  process.exitCode = 1;
}
