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

# Загрузка символов и комбинаций
with open(SYMBOLS_PATH, encoding='utf-8') as f:
    SYMBOLS = json.load(f)
with open(COMBINATIONS_PATH, encoding='utf-8') as f:
    COMBINATIONS = json.load(f)
with open(CONFIG_PATH, encoding='utf-8') as f:
    CONFIG = json.load(f)

bets = CONFIG.get('bets', [10000])
bet_multipliers = CONFIG.get('bet_multipliers', [1])
# Баланс пользователя (пока в памяти)
user_balance = CONFIG.get('initial_balance', 1000)
user_freespins = 0
# Ставка пользователя (по умолчанию минимальная из bets)
user_bet = min(bets) if bets else 100

# Джекпот (в памяти)
jackpot = CONFIG.get('initial_jackpot', 5000)

@app.route('/api/symbols')
def get_symbols():
    return jsonify(SYMBOLS)

@app.route('/api/combinations')
def get_combinations():
    return jsonify(COMBINATIONS)

@app.route('/api/balance')
def get_balance():
    return jsonify({"balance": user_balance, "freespins": user_freespins})

@app.route('/api/bet', methods=['GET'])
def get_bet():
    global user_bet
    return jsonify({"bet": user_bet})

@app.route('/api/bet', methods=['POST'])
def set_bet():
    global user_bet
    data = request.get_json()
    bet = data.get('bet')
    if not isinstance(bet, int) or bet <= 0:
        return jsonify({"error": "Некорректная ставка"}), 400
    user_bet = bet
    return jsonify({"bet": user_bet})

@app.route('/api/spin', methods=['POST'])
def spin():
    global user_balance, user_freespins, user_bet, jackpot
    data = request.get_json()
    bet = data.get('bet', user_bet)
    min_bet = 10000  # минимальная ставка, можно вынести в конфиг при необходимости
    # Проверка баланса
    if user_balance < bet and user_freespins == 0:
        return jsonify({"error": "Недостаточно средств"}), 400
    # Списание ставки
    used_freespin = False
    if user_freespins > 0:
        user_freespins -= 1
        used_freespin = True
    else:
        user_balance -= bet
        # Увеличиваем джекпот на 1% от ставки
        jackpot += int(bet * 0.01)
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
    # Проверка выигрыша (с учётом джекпота)
    payout = 0
    freespins = 0
    combo_id = None
    combo_name = None
    jackpot_win = False
    for combo in COMBINATIONS:
        # Джекпот-комбинация
        if combo.get('jackpot') and combo.get('line') == 'center' and result == combo['pattern']:
            payout = jackpot
            jackpot = CONFIG.get('initial_jackpot', 5000)
            combo_id = combo.get('id')
            combo_name = combo.get('name')
            jackpot_win = True
        # Обычные комбинации
        if combo.get('line') == 'center' and result == combo['pattern']:
            base_payout = combo.get('payout', 0)
            try:
                idx = bets.index(bet)
                multiplier = bet_multipliers[idx]
            except ValueError:
                multiplier = 1
            payout = base_payout * multiplier
            freespins = combo.get('freespins', 0)
            combo_id = combo.get('id')
            combo_name = combo.get('name')
        if combo.get('anywhere'):
            count = sum(1 for r in result if r == combo['pattern'][0])
            if count >= len(combo['pattern']):
                base_payout = combo.get('payout', 0)
                try:
                    idx = bets.index(bet)
                    multiplier = bet_multipliers[idx]
                except ValueError:
                    multiplier = 1
                payout = base_payout * multiplier
                freespins = combo.get('freespins', 0)
                combo_id = combo.get('id')
                combo_name = combo.get('name')
    # Возврат ставки и выплата выигрыша
    if jackpot_win and not used_freespin:
        user_balance += (payout + bet)
        print(f"JACKPOT! payout={payout}, jackpot={jackpot}, bet={bet}, user_balance={user_balance}, jackpot_win={jackpot_win}")
    elif used_freespin:
        if payout > 0:
            user_balance += payout
    else:
        if payout > 0 or freespins > 0:
            user_balance += bet
        if payout > 0:
            user_balance += payout
    user_freespins += freespins
    return jsonify({
        "result": result,
        "payout": payout,
        "freespins": freespins,
        "balance": user_balance,
        "combo_id": combo_id,
        "combo_name": combo_name,
        "jackpot_win": jackpot_win
    })

@app.route('/api/restart', methods=['POST'])
def restart():
    global user_balance, user_freespins
    user_balance = CONFIG.get('initial_balance', 1000)
    user_freespins = 0
    return jsonify({"balance": user_balance, "freespins": user_freespins})

@app.route('/api/activate_freespins', methods=['POST'])
def activate_freespins():
    global user_freespins
    user_freespins += 10
    return jsonify({"freespins": user_freespins})

@app.route('/api/jackpot', methods=['GET'])
def get_jackpot():
    global jackpot
    return jsonify({"jackpot": jackpot})

@app.route('/api/jackpot', methods=['POST'])
def set_jackpot():
    global jackpot
    data = request.get_json()
    value = data.get('jackpot')
    if not isinstance(value, int) or value < 0:
        return jsonify({"error": "Некорректное значение джекпота"}), 400
    jackpot = value
    return jsonify({"jackpot": jackpot})

if __name__ == '__main__':
    app.run(debug=True) 