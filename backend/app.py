import json
from flask import Flask, jsonify, request
import random
import os
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import hashlib
import secrets
from database import (
    get_user_by_username, create_user, update_user_balance,
    update_statistics, get_user_statistics, get_user_by_id,
    get_jackpot, update_jackpot, update_user_bet
)

app = Flask(__name__)
CORS(app)

# Конфигурация JWT
app.config['JWT_SECRET_KEY'] = secrets.token_hex(32)  # Генерируем безопасный ключ
jwt = JWTManager(app)

def hash_password(password):
    """Хеширует пароль с использованием SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(stored_password, provided_password):
    """Проверяет соответствие пароля хешу"""
    return stored_password == hash_password(provided_password)

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

# Новые эндпоинты для авторизации
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    print(f"Registering user: {username}")
    
    if not username or not password:
        return jsonify({"error": "Необходимо указать имя пользователя и пароль"}), 400
    
    if get_user_by_username(username):
        return jsonify({"error": "Пользователь с таким именем уже существует"}), 400
    
    hashed_password = hash_password(password)
    user_id = create_user(username, hashed_password)
    print(f"Created user with id: {user_id}")
    
    if user_id:
        access_token = create_access_token(identity=user_id)
        return jsonify({
            "message": "Пользователь успешно зарегистрирован",
            "access_token": access_token
        }), 201
    return jsonify({"error": "Ошибка при создании пользователя"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = get_user_by_username(username)
    if user and verify_password(user['password'], password):
        access_token = create_access_token(identity=user['id'])
        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "balance": user['balance'],
                "freespins": user['freespins']
            }
        })
    return jsonify({"error": "Неверное имя пользователя или пароль"}), 401

# Обновленные эндпоинты с авторизацией
@app.route('/api/balance')
@jwt_required()
def get_balance():
    user_id = get_jwt_identity()
    print(f"Getting balance for user_id: {user_id}")
    user = get_user_by_id(user_id)
    print(f"User data: {user}")
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    return jsonify({
        "balance": user['balance'],
        "freespins": user['freespins']
    })

@app.route('/api/statistics')
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    stats = get_user_statistics(user_id)
    if stats:
        return jsonify(stats)
    return jsonify({"error": "Статистика не найдена"}), 404

@app.route('/api/spin', methods=['POST'])
@jwt_required()
def spin():
    # Получаем текущее значение джекпота из базы данных
    current_jackpot = get_jackpot()
    
    user_id = get_jwt_identity()
    print(f"Spin request from user_id: {user_id}")
    user = get_user_by_id(user_id)
    print(f"User data: {user}")
    
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404

    data = request.get_json()
    bet = data.get('bet', min(bets) if bets else 100000)

    # ИНИЦИАЛИЗАЦИЯ переменных
    payout = 0
    freespins = 0
    combo_id = None
    combo_name = None
    jackpot_win = False
    jackpot_before = current_jackpot
    result = []  # Инициализируем result пустым списком

    # Проверка баланса
    if user['balance'] < bet and user['freespins'] == 0:
        return jsonify({"error": "Недостаточно средств"}), 400

    # Списание ставки
    used_freespin = False
    if user['freespins'] > 0:
        user['freespins'] -= 1
        used_freespin = True
    else:
        user['balance'] -= bet

    # --- Джекпот шанс из конфига ---
    jackpot_chance = CONFIG.get('jackpot_chance', 0.01)
    jackpot_combo = next((c for c in COMBINATIONS if c.get('jackpot')), None)
    if jackpot_combo and random.random() < jackpot_chance:
        result = jackpot_combo['pattern']
        payout = jackpot_before
        # Сбрасываем джекпот на начальное значение
        update_jackpot(CONFIG.get('initial_jackpot', 5000))
        combo_id = jackpot_combo.get('id')
        combo_name = jackpot_combo.get('name')
        jackpot_win = True
        
        if not used_freespin:
            user['balance'] += payout
            user['balance'] += bet
        
        # Обновляем статистику
        update_statistics(
            user_id, bet, payout,
            is_jackpot=True,
            combo_name=combo_name,
            pattern=result
        )
        
        # Обновляем баланс пользователя
        update_user_balance(user_id, user['balance'], user['freespins'])
        
        return jsonify({
            "result": result,
            "payout": payout,
            "freespins": freespins,
            "balance": user['balance'],
            "combo_id": combo_id,
            "combo_name": combo_name,
            "jackpot_win": jackpot_win
        })

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

    # Проверка выигрыша
    for combo in COMBINATIONS:
        if combo.get('line') == 'center' and result == combo['pattern']:
            # Проверяем, является ли это комбинацией джекпота
            if combo.get('jackpot'):
                payout = current_jackpot
                combo_id = combo.get('id')
                combo_name = combo.get('name')
                jackpot_win = True
                # Сбрасываем джекпот на начальное значение
                update_jackpot(CONFIG.get('initial_jackpot', 5000))
            else:
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

    # Обновление баланса и фриспинов
    if used_freespin:
        if payout > 0:
            user['balance'] += payout
    else:
        if payout > 0 or freespins > 0:
            user['balance'] += bet
        if payout > 0:
            user['balance'] += payout
    
    user['freespins'] += freespins
    
    # Увеличиваем джекпот на 1% от ставки
    if not used_freespin:
        new_jackpot = current_jackpot + int(bet * 0.01)
        update_jackpot(new_jackpot)

    # Обновляем статистику
    update_statistics(
        user_id, bet, payout,
        is_jackpot=False,
        combo_name=combo_name,
        pattern=result
    )
    
    # Обновляем баланс пользователя
    update_user_balance(user_id, user['balance'], user['freespins'])

    return jsonify({
        "result": result,
        "payout": payout,
        "freespins": freespins,
        "balance": user['balance'],
        "combo_id": combo_id,
        "combo_name": combo_name,
        "jackpot_win": jackpot_win
    })

@app.route('/api/symbols')
def get_symbols():
    return jsonify(SYMBOLS)

@app.route('/api/combinations')
def get_combinations():
    return jsonify(COMBINATIONS)

@app.route('/api/bet', methods=['GET'])
@jwt_required()
def get_bet():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    return jsonify({"bet": user.get('bet', min(bets) if bets else 100000)})

@app.route('/api/bet', methods=['POST'])
@jwt_required()
def set_bet():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
        
    data = request.get_json()
    bet = data.get('bet')
    if not isinstance(bet, int) or bet <= 0:
        return jsonify({"error": "Некорректная ставка"}), 400
        
    # Проверяем, что ставка входит в список разрешенных ставок
    if bet not in bets:
        return jsonify({"error": "Недопустимая ставка"}), 400
        
    # Обновляем ставку пользователя
    update_user_bet(user_id, bet)
    return jsonify({"bet": bet})

@app.route('/api/restart', methods=['POST'])
def restart():
    global user_balance, user_freespins
    user_balance = CONFIG.get('initial_balance', 1000)
    user_freespins = 0
    return jsonify({"balance": user_balance, "freespins": user_freespins})

@app.route('/api/activate_freespins', methods=['POST'])
@jwt_required()
def activate_freespins():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404
    
    user['freespins'] += 10
    update_user_balance(user_id, user['balance'], user['freespins'])
    
    return jsonify({
        "balance": user['balance'],
        "freespins": user['freespins']
    })

@app.route('/api/jackpot', methods=['GET'])
def get_jackpot_value():
    current_jackpot = get_jackpot()
    return jsonify({"jackpot": current_jackpot})

@app.route('/api/jackpot', methods=['POST'])
def set_jackpot_value():
    data = request.get_json()
    value = data.get('jackpot')
    if not isinstance(value, int) or value < 0:
        return jsonify({"error": "Некорректное значение джекпота"}), 400
    if update_jackpot(value):
        return jsonify({"jackpot": value})
    return jsonify({"error": "Ошибка при обновлении джекпота"}), 500

@app.route('/api/config')
def get_config():
    return jsonify({
        "background_color": CONFIG.get("background_color", "#232323"),
        "background_image": CONFIG.get("background_image", "")
    })

if __name__ == '__main__':
    app.run(debug=True) 