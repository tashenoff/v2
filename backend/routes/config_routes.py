from flask import Blueprint, jsonify

config_routes = Blueprint('config', __name__)

def get_config():
    from app import CONFIG
    return CONFIG

def get_symbols():
    from app import SYMBOLS
    return SYMBOLS

def get_combinations():
    from app import COMBINATIONS
    return COMBINATIONS

@config_routes.route('/symbols')
def get_symbols_route():
    return jsonify(get_symbols())

@config_routes.route('/combinations')
def get_combinations_route():
    return jsonify(get_combinations())

@config_routes.route('/config')
def get_config_route():
    config = get_config()
    return jsonify({
        "background_color": config.get("background_color", "#232323"),
        "background_image": config.get("background_image", "")
    }) 