import { getToken } from './services/auth';

const API_URL = 'http://localhost:5000/api';

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export async function getBalance() {
  const res = await fetch(`${API_URL}/balance`, {
    headers: headers()
  });
  if (!res.ok) {
    throw new Error('Ошибка при получении баланса');
  }
  return res.json();
}

export async function getSymbols() {
  const res = await fetch(`${API_URL}/symbols`);
  if (!res.ok) {
    throw new Error('Ошибка при получении символов');
  }
  return res.json();
}

export async function getCombinations() {
  const res = await fetch(`${API_URL}/combinations`);
  if (!res.ok) {
    throw new Error('Ошибка при получении комбинаций');
  }
  return res.json();
}

export async function spin(bet = 100) {
  const res = await fetch(`${API_URL}/spin`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ bet })
  });
  if (!res.ok) {
    throw new Error('Ошибка при вращении');
  }
  return res.json();
}

export async function getStatistics() {
  const res = await fetch(`${API_URL}/statistics`, {
    headers: headers()
  });
  if (!res.ok) {
    throw new Error('Ошибка при получении статистики');
  }
  return res.json();
} 