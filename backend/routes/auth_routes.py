from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
import hashlib
from database import get_user_by_username, create_user

auth_routes = Blueprint('auth', __name__)

def hash_password(password):
    """Хеширует пароль с использованием SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(stored_password, provided_password):
    """Проверяет соответствие пароля хешу"""
    return stored_password == hash_password(provided_password)

@auth_routes.route('/auth/register', methods=['POST'])
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

@auth_routes.route('/auth/login', methods=['POST'])
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