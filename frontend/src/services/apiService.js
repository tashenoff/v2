const API_URL = 'http://localhost:5000/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

export async function getBalance() {
  try {
    const res = await fetch(`${API_URL}/balance`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения баланса');
    const data = await res.json();
    return {
      balance: data.balance || 0,
      freespins: data.freespins || 0
    };
  } catch (e) {
    throw new Error('Ошибка получения баланса: ' + e.message);
  }
}

export async function getSymbols() {
  try {
    const res = await fetch(`${API_URL}/symbols`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения символов');
    return await res.json();
  } catch (e) {
    throw new Error('Ошибка получения символов: ' + e.message);
  }
}

export async function getCombinations() {
  try {
    const res = await fetch(`${API_URL}/combinations`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения комбинаций');
    return await res.json();
  } catch (e) {
    throw new Error('Ошибка получения комбинаций: ' + e.message);
  }
}

export const spin = async (bet) => {
  try {
    const response = await fetch(`${API_URL}/spin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bet })
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error during spin:', error);
    throw error;
  }
};

export async function fetchBet() {
  try {
    const res = await fetch(`${API_URL}/bet`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения ставки');
    return await res.json();
  } catch (e) {
    throw new Error('Ошибка получения ставки: ' + e.message);
  }
}

export async function updateBet(newBet) {
  try {
    const res = await fetch(`${API_URL}/bet`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bet: newBet })
    });
    if (!res.ok) throw new Error('Ошибка обновления ставки');
    return await res.json();
  } catch (e) {
    throw new Error('Ошибка обновления ставки: ' + e.message);
  }
}

export async function getJackpot() {
  try {
    const res = await fetch(`${API_URL}/jackpot`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Ошибка получения джекпота');
    const data = await res.json();
    return data.jackpot;
  } catch (e) {
    console.error('Error fetching jackpot:', e);
    return 0;
  }
} 