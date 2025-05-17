import json
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import secrets
from database import get_db
from player_state import PlayerState
from statistics_manager import StatisticsManager
from combination_manager import CombinationManager
from routes.auth_routes import auth_routes
from routes.game_routes import game_routes
from routes.stats_routes import stats_routes
from routes.config_routes import config_routes
from line_checker import LineChecker

# Пути к JSON-файлам
SYMBOLS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'symbols.json')
COMBINATIONS_PATH = os.path.join(os.path.dirname(__file__), 'data', 'combinations.json')
CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'data', 'config.json')
LINES_PATH = os.path.join(os.path.dirname(__file__), 'data', 'lines.json')

# Загрузка символов и комбинаций
with open(SYMBOLS_PATH, encoding='utf-8') as f:
    SYMBOLS = json.load(f)
with open(COMBINATIONS_PATH, encoding='utf-8') as f:
    COMBINATIONS = json.load(f)
with open(CONFIG_PATH, encoding='utf-8') as f:
    CONFIG = json.load(f)
with open(LINES_PATH, encoding='utf-8') as f:
    LINES_CONFIG = json.load(f)

# Экспортируемые переменные для использования в других модулях
__all__ = ['SYMBOLS', 'COMBINATIONS', 'CONFIG', 'LINES_CONFIG', 'bets', 'bet_multipliers']

bets = CONFIG.get('bets', [10000])
bet_multipliers = CONFIG.get('bet_multipliers', [1])

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Конфигурация JWT
    app.config['JWT_SECRET_KEY'] = secrets.token_hex(32)
    jwt = JWTManager(app)

    # Инициализация менеджеров
    db = get_db()
    app.player_state = PlayerState(db)
    app.statistics_manager = StatisticsManager(db)
    
    # Объединяем конфигурацию с линиями
    config_with_lines = {**CONFIG, 'lines': LINES_CONFIG['lines']}
    app.combination_manager = CombinationManager(COMBINATIONS, config_with_lines)
    app.line_checker = LineChecker(LINES_CONFIG)

    # Регистрация Blueprint'ов
    app.register_blueprint(auth_routes, url_prefix='/api')
    app.register_blueprint(game_routes, url_prefix='/api')
    app.register_blueprint(stats_routes, url_prefix='/api')
    app.register_blueprint(config_routes, url_prefix='/api')

    return app

# Создание приложения
app = create_app()

if __name__ == '__main__':
    app.run(debug=True) 