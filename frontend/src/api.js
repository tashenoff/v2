const API_URL = 'http://localhost:5000/api';

export async function getBalance() {
  const res = await fetch(`${API_URL}/balance`);
  return res.json();
}

export async function getSymbols() {
  const res = await fetch(`${API_URL}/symbols`);
  return res.json();
}

export async function getCombinations() {
  const res = await fetch(`${API_URL}/combinations`);
  return res.json();
}

export async function spin(bet = 100) {
  const res = await fetch(`${API_URL}/spin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bet })
  });
  return res.json();
} 