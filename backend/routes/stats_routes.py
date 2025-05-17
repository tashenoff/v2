from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

stats_routes = Blueprint('stats', __name__)

def get_statistics_manager():
    return current_app.statistics_manager

@stats_routes.route('/statistics')
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    stats = get_statistics_manager().get_statistics(user_id)
    if stats:
        return jsonify(stats)
    return jsonify({"error": "Статистика не найдена"}), 404 