import sqlite3
from sqlite3 import Error
import json
from datetime import datetime
import os

# Загружаем конфигурацию
config_path = os.path.join(os.path.dirname(__file__), 'data', 'config.json')
with open(config_path, encoding='utf-8') as f:
    CONFIG = json.load(f)

def get_db():
    try:
        conn = sqlite3.connect('database.sqlite')
        conn.row_factory = sqlite3.Row
        return conn
    except Error as e:
        print(f"Error connecting to database: {e}")
        return None

def init_db():
    print("Initializing database...")
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            
            # Создаем таблицу пользователей
            print("Creating users table...")
            c.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    balance INTEGER,
                    freespins INTEGER DEFAULT 0,
                    bet INTEGER DEFAULT 10000,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Создаем таблицу статистики
            print("Creating statistics table...")
            c.execute('''
                CREATE TABLE IF NOT EXISTS statistics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    spins_count INTEGER DEFAULT 0,
                    total_wins INTEGER DEFAULT 0,
                    total_bets INTEGER DEFAULT 0,
                    biggest_win INTEGER DEFAULT 0,
                    jackpot_wins INTEGER DEFAULT 0,
                    last_spin TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')

            # Создаем таблицу истории игр
            print("Creating game_history table...")
            c.execute('''
                CREATE TABLE IF NOT EXISTS game_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    bet INTEGER NOT NULL,
                    win INTEGER NOT NULL,
                    pattern TEXT NOT NULL,
                    combo_name TEXT,
                    is_jackpot BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')

            # Создаем таблицу для джекпота
            print("Creating jackpot table...")
            c.execute('''
                CREATE TABLE IF NOT EXISTS jackpot (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    amount INTEGER NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            # Инициализируем джекпот, если таблица пустая
            c.execute('SELECT amount FROM jackpot WHERE id = 1')
            if not c.fetchone():
                initial_jackpot = CONFIG.get('initial_jackpot', 5000)
                c.execute('INSERT INTO jackpot (id, amount) VALUES (1, ?)', (initial_jackpot,))

            conn.commit()
            print("Database initialized successfully!")
        except Error as e:
            print(f"Error creating tables: {e}")
        finally:
            conn.close()
    else:
        print("Error: Could not establish database connection")

def create_user(username, hashed_password):
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            # Получаем начальный баланс из конфигурации
            initial_balance = CONFIG.get('initial_balance', 1000)
            
            c.execute('INSERT INTO users (username, password, balance) VALUES (?, ?, ?)',
                     (username, hashed_password, initial_balance))
            user_id = c.lastrowid
            
            # Создаем запись в статистике для нового пользователя
            c.execute('INSERT INTO statistics (user_id) VALUES (?)', (user_id,))
            
            conn.commit()
            return user_id
        except Error as e:
            print(f"Error creating user: {e}")
            return None
        finally:
            conn.close()

def get_user_by_username(username):
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE username = ?', (username,))
            row = c.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    return None

def get_user_by_id(user_id):
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            row = c.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    return None

def update_user_balance(user_id, new_balance, new_freespins):
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            c.execute('''
                UPDATE users 
                SET balance = ?, freespins = ? 
                WHERE id = ?''', (new_balance, new_freespins, user_id))
            conn.commit()
            return True
        except Error as e:
            print(f"Error updating balance: {e}")
            return False
        finally:
            conn.close()

def update_statistics(user_id, bet, win, is_jackpot=False, combo_name=None, pattern=None):
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            
            # Обновляем статистику
            c.execute('''
                UPDATE statistics 
                SET spins_count = spins_count + 1,
                    total_bets = total_bets + ?,
                    total_wins = total_wins + ?,
                    biggest_win = CASE WHEN ? > biggest_win THEN ? ELSE biggest_win END,
                    jackpot_wins = jackpot_wins + ?,
                    last_spin = CURRENT_TIMESTAMP
                WHERE user_id = ?
            ''', (bet, win, win, win, 1 if is_jackpot else 0, user_id))

            # Записываем историю игры
            if pattern:
                pattern_json = json.dumps(pattern)
                c.execute('''
                    INSERT INTO game_history 
                    (user_id, bet, win, pattern, combo_name, is_jackpot)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (user_id, bet, win, pattern_json, combo_name, is_jackpot))

            conn.commit()
            return True
        except Error as e:
            print(f"Error updating statistics: {e}")
            return False
        finally:
            conn.close()

def get_user_statistics(user_id):
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            c.execute('''
                SELECT * FROM statistics 
                WHERE user_id = ?
            ''', (user_id,))
            row = c.fetchone()
            stats = dict(row) if row else None
            
            # Получаем последний выигрыш
            c.execute('''
                SELECT bet, win as amount, combo_name, created_at as timestamp
                FROM game_history 
                WHERE user_id = ? AND win > 0
                ORDER BY created_at DESC 
                LIMIT 1
            ''', (user_id,))
            last_win = c.fetchone()
            
            # Получаем текущую ставку из таблицы users
            c.execute('''
                SELECT bet as amount, created_at as timestamp
                FROM users 
                WHERE id = ?
            ''', (user_id,))
            current_bet = c.fetchone()
            
            if stats:
                stats['last_win'] = dict(last_win) if last_win else None
                stats['last_bet'] = dict(current_bet) if current_bet else None
            
            return stats
        finally:
            conn.close()
    return None

def get_jackpot():
    """Получить текущее значение джекпота"""
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            c.execute('SELECT amount FROM jackpot WHERE id = 1')
            result = c.fetchone()
            return result['amount'] if result else CONFIG.get('initial_jackpot', 5000)
        finally:
            conn.close()
    return CONFIG.get('initial_jackpot', 5000)

def update_jackpot(amount):
    """Обновить значение джекпота"""
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            c.execute('''
                UPDATE jackpot 
                SET amount = ?, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = 1
            ''', (amount,))
            conn.commit()
            return True
        except Error as e:
            print(f"Error updating jackpot: {e}")
            return False
        finally:
            conn.close()
    return False

def update_user_bet(user_id, bet):
    """Обновляет ставку пользователя"""
    conn = get_db()
    if conn is not None:
        try:
            c = conn.cursor()
            c.execute('''
                UPDATE users 
                SET bet = ?
                WHERE id = ?
            ''', (bet, user_id))
            conn.commit()
            return True
        except Error as e:
            print(f"Error updating user bet: {e}")
            return False
        finally:
            conn.close()
    return False

# Инициализация базы данных при импорте модуля
init_db() 