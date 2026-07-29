import { createHash } from 'crypto';

const DIMENSIONS = 1536;

function normalizar(vetor: number[]) {
  const norma = Math.sqrt(vetor.reduce((acc, valor) => acc + valor * valor, 0)) || 1;
  return vetor.map((valor) => Number((valor / norma).toFixed(6)));
}

function embeddingDeterministico(texto: string) {
  const vetor = Array.from({ length: DIMENSIONS }, () => 0);
  const termos = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  termos.forEach((termo) => {
    const hash = createHash('sha256').update(termo).digest();
    const indice = hash.readUInt16BE(0) % DIMENSIONS;
    const sinal = hash[2] % 2 === 0 ? 1 : -1;
    vetor[indice] += sinal;
  });

  return normalizar(vetor);
}

export async function gerarEmbedding(texto: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.EMBEDDING_PROVIDER !== 'openai') {
    return embeddingDeterministico(texto);
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      input: texto,
      dimensions: DIMENSIONS,
    }),
  });

  if (!res.ok) return embeddingDeterministico(texto);
  const body = await res.json();
  return normalizar(body.data?.[0]?.embedding ?? embeddingDeterministico(texto));
}

export function vetorPg(vetor: number[]) {
  return `[${vetor.join(',')}]`;
}
