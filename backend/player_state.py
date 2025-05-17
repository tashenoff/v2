from typing import Tuple, Optional
from dataclasses import dataclass
from database import get_user_by_id, update_user_balance

@dataclass
class OperationResult:
    success: bool
    error: str = ""
    data: Optional[dict] = None

class PlayerState:
    def __init__(self, db):
        self.db = db

    def validate_operation(self, user_id: int) -> Tuple[bool, Optional[dict], str]:
        """Базовая валидация для операций с пользователем"""
        user = get_user_by_id(user_id)
        if not user:
            return False, None, "Пользователь не найден"
        return True, user, ""

    def execute_operation(self, user_id: int, balance: int, freespins: int) -> bool:
        """Выполняет обновление состояния пользователя"""
        return update_user_balance(user_id, balance, freespins)

    def get_state(self, user_id: int) -> dict:
        """Возвращает текущее состояние пользователя"""
        user = get_user_by_id(user_id)
        if not user:
            return {"balance": 0, "freespins": 0}
        return {
            "balance": user["balance"],
            "freespins": user["freespins"]
        }

    def get_balance(self, user_id: int) -> int:
        """Возвращает текущий баланс пользователя"""
        user = get_user_by_id(user_id)
        return user["balance"] if user else 0

    def get_freespins(self, user_id: int) -> int:
        """Возвращает количество фриспинов пользователя"""
        user = get_user_by_id(user_id)
        return user["freespins"] if user else 0

    def has_freespins(self, user_id: int) -> bool:
        """Проверяет наличие фриспинов у пользователя"""
        user = get_user_by_id(user_id)
        return user is not None and user["freespins"] > 0

    def deduct_bet(self, user_id: int, bet: int) -> Tuple[bool, str]:
        """Списывает ставку с баланса пользователя"""
        valid, user, error = self.validate_operation(user_id)
        if not valid:
            return False, error

        if user["balance"] < bet:
            return False, "Недостаточно средств"

        user["balance"] -= bet
        if self.execute_operation(user_id, user["balance"], user["freespins"]):
            return True, ""
        return False, "Ошибка обновления баланса"

    def add_win(self, user_id: int, payout: int, bet: int = 0, return_bet: bool = False) -> bool:
        """Добавляет выигрыш к балансу пользователя"""
        valid, user, error = self.validate_operation(user_id)
        if not valid:
            return False

        if payout > 0:
            user["balance"] += payout

        if return_bet:
            user["balance"] += bet

        return self.execute_operation(user_id, user["balance"], user["freespins"])

    def use_freespin(self, user_id: int) -> Tuple[bool, str]:
        """Использует один фриспин"""
        valid, user, error = self.validate_operation(user_id)
        if not valid:
            return False, error

        if user["freespins"] <= 0:
            return False, "Нет доступных фриспинов"

        user["freespins"] -= 1
        if self.execute_operation(user_id, user["balance"], user["freespins"]):
            return True, ""
        return False, "Ошибка обновления фриспинов"

    def add_freespins(self, user_id: int, amount: int) -> bool:
        """Добавляет фриспины пользователю"""
        valid, user, error = self.validate_operation(user_id)
        if not valid:
            return False

        user["freespins"] += amount
        return self.execute_operation(user_id, user["balance"], user["freespins"])

    def reset_state(self, user_id: int, initial_balance: int = 1000) -> Tuple[bool, dict]:
        """Сбрасывает состояние пользователя к начальным значениям"""
        valid, user, error = self.validate_operation(user_id)
        if not valid:
            return False, {"error": error}

        if self.execute_operation(user_id, initial_balance, 0):
            return True, {
                "balance": initial_balance,
                "freespins": 0
            }
        return False, {"error": "Ошибка сброса состояния"} 