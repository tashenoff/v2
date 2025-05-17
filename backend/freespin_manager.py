from typing import Tuple
from database import get_user_by_id, update_user_balance

class FreespinManager:
    def __init__(self, db):
        self.db = db

    def has_freespins(self, user_id: int) -> bool:
        """Проверяет, есть ли у пользователя фриспины"""
        user = get_user_by_id(user_id)
        return user is not None and user['freespins'] > 0

    def use_freespin(self, user_id: int) -> Tuple[bool, str]:
        """
        Использует один фриспин
        Returns: (success, error_message)
        """
        user = get_user_by_id(user_id)
        if not user:
            return False, "Пользователь не найден"
            
        if user['freespins'] <= 0:
            return False, "Нет доступных фриспинов"
            
        user['freespins'] -= 1
        if update_user_balance(user_id, user['balance'], user['freespins']):
            return True, ""
        return False, "Ошибка обновления фриспинов"

    def add_freespins(self, user_id: int, amount: int) -> bool:
        """Добавляет фриспины пользователю"""
        user = get_user_by_id(user_id)
        if not user:
            return False
            
        user['freespins'] += amount
        return update_user_balance(user_id, user['balance'], user['freespins'])

    def get_freespins(self, user_id: int) -> int:
        """Возвращает количество фриспинов пользователя"""
        user = get_user_by_id(user_id)
        return user['freespins'] if user else 0 