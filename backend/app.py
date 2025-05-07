import json
from flask import Flask, jsonify, request
import random
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Пути к JSON-файлам
SYMBOLS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'symbols.json')
COMBINATIONS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'combinations.json')
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'data', 'config.json')

# Баланс пользователя (пока в памяти)
user_balance = 1000
user_freespins = 0

# Загрузка символов и комбинаций
with open(SYMBOLS_PATH, encoding='utf-8') as f:
    SYMBOLS = json.load(f)
with open(COMBINATIONS_PATH, encoding='utf-8') as f:
    COMBINATIONS = json.load(f)
with open(CONFIG_PATH, encoding='utf-8') as f:
    CONFIG = json.load(f)

@app.route('/api/symbols')
def get_symbols():
    return jsonify(SYMBOLS)

@app.route('/api/combinations')
def get_combinations():
    return jsonify(COMBINATIONS)

@app.route('/api/balance')
def get_balance():
    return jsonify({"balance": user_balance, "freespins": user_freespins})

@app.route('/api/spin', methods=['POST'])
def spin():
    global user_balance, user_freespins
    data = request.get_json()
    bet = data.get('bet', 100)
    # Проверка баланса
    if user_balance < bet and user_freespins == 0:
        return jsonify({"error": "Недостаточно средств"}), 400
    # Списание ставки
    if user_freespins > 0:
        user_freespins -= 1
    else:
        user_balance -= bet
    # --- Always win режим ---
    if CONFIG.get("always_win"):
        win_combo = random.choice(COMBINATIONS)
        if win_combo.get("line") == "center":
            result = win_combo["pattern"]
        elif win_combo.get("anywhere"):
            result = [win_combo["pattern"][0]] * len(win_combo["pattern"])
            while len(result) < 5:
                result.append(random.choice([s['id'] for s in SYMBOLS if s['id'] != win_combo["pattern"][0]]))
        else:
            result = [random.choice([s['id'] for s in SYMBOLS]) for _ in range(5)]
    # --- win_chance режим ---
    elif CONFIG.get("win_chance", 0) > 0 and random.random() < CONFIG["win_chance"]:
        win_combo = random.choice(COMBINATIONS)
        if win_combo.get("line") == "center":
            result = win_combo["pattern"]
        elif win_combo.get("anywhere"):
            result = [win_combo["pattern"][0]] * len(win_combo["pattern"])
            while len(result) < 5:
                result.append(random.choice([s['id'] for s in SYMBOLS if s['id'] != win_combo["pattern"][0]]))
        else:
            result = [random.choice([s['id'] for s in SYMBOLS]) for _ in range(5)]
    else:
        symbols_ids = [s['id'] for s in SYMBOLS]
        result = [random.choice(symbols_ids) for _ in range(5)]
    # Проверка выигрыша (заглушка)
    payout = 0
    freespins = 0
    combo_id = None
    combo_name = None
    for combo in COMBINATIONS:
        # Пример: только для 5 подряд по центру
        if combo.get('line') == 'center' and result == combo['pattern']:
            payout = combo.get('payout', 0)
            freespins = combo.get('freespins', 0)
            combo_id = combo.get('id')
            combo_name = combo.get('name')
        if combo.get('anywhere'):
            count = sum(1 for r in result if r == combo['pattern'][0])
            if count >= len(combo['pattern']):
                payout = combo.get('payout', 0)
                freespins = combo.get('freespins', 0)
                combo_id = combo.get('id')
                combo_name = combo.get('name')
    user_balance += payout
    user_freespins += freespins
    return jsonify({
        "result": result,
        "payout": payout,
        "freespins": freespins,
        "balance": user_balance,
        "combo_id": combo_id,
        "combo_name": combo_name
    })

@app.route('/api/restart', methods=['POST'])
def restart():
    global user_balance, user_freespins
    user_balance = 1000
    user_freespins = 0
    return jsonify({"balance": user_balance, "freespins": user_freespins})

@app.route('/api/activate_freespins', methods=['POST'])
def activate_freespins():
    global user_freespins
    user_freespins += 10
    return jsonify({"freespins": user_freespins})

if __name__ == '__main__':
    app.run(debug=True) 