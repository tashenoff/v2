from typing import Tuple
from database import get_user_by_id, update_user_balance

class BalanceManager:
    def __init__(self, db):
        self.db = db

    def deduct_bet(self, user_id: int, bet: int) -> Tuple[bool, str]:
        """
        Списывает ставку с баланса пользователя
        Returns: (success, error_message)
        """
        user = get_user_by_id(user_id)
        if not user:
            return False, "Пользователь не найден"
            
        if user['balance'] < bet:
            return False, "Недостаточно средств"
            
        user['balance'] -= bet
        if update_user_balance(user_id, user['balance'], user['freespins']):
            return True, ""
        return False, "Ошибка обновления баланса"

    def add_win(self, user_id: int, payout: int, bet: int = 0, return_bet: bool = False) -> bool:
        """
        Добавляет выигрыш к балансу пользователя
        """
        user = get_user_by_id(user_id)
        if not user:
            return False
            
        # Добавляем выигрыш
        if payout > 0:
            user['balance'] += payout
            
        # Возвращаем ставку если нужно
        if return_bet:
            user['balance'] += bet
            
        return update_user_balance(user_id, user['balance'], user['freespins'])

    def get_balance(self, user_id: int) -> int:
        """
        Возвращает текущий баланс
        """
        user = get_user_by_id(user_id)
        return user['balance'] if user else 0

    def add_freespins(self, user_id: int, amount: int) -> bool:
        """
        Добавляет фриспины пользователю
        """
        user = get_user_by_id(user_id)
        if not user:
            return False
            
        user['freespins'] += amount
        return update_user_balance(user_id, user['balance'], user['freespins']) 