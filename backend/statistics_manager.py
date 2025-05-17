from typing import Optional, Dict, Any
from database import get_user_statistics, update_statistics

class StatisticsManager:
    def __init__(self, db):
        self.db = db

    def get_statistics(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Получает статистику пользователя"""
        return get_user_statistics(user_id)

    def update_statistics(self, user_id: int, bet: int, win: int, is_jackpot: bool = False, combo_name: Optional[str] = None, pattern: Optional[list] = None) -> bool:
        """Обновляет статистику пользователя"""
        return update_statistics(user_id, bet, win, is_jackpot, combo_name, pattern) 