from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from line_checker import LineChecker, LineResult
from enum import Enum

class WinLevel(Enum):
    NORMAL = "normal"
    MEDIUM = "medium"
    BIG = "big"
    MEGA = "mega"
    SUPER = "super"

WIN_LEVEL_MULTIPLIERS = {
    WinLevel.NORMAL: 1,
    WinLevel.MEDIUM: 2,
    WinLevel.BIG: 3,
    WinLevel.MEGA: 5,
    WinLevel.SUPER: 10
}

@dataclass
class WinResult:
    payout: int
    combo_id: Optional[str]
    combo_name: Optional[str]
    freespins_won: int
    is_jackpot: bool
    pattern: List[str]
    winning_lines: List[LineResult]
    win_level: WinLevel = WinLevel.NORMAL  # Добавляем уровень выигрыша со значением по умолчанию

class CombinationManager:
    def __init__(self, combinations: List[Dict], config: Dict):
        self.combinations = combinations
        self.config = config
        # Создаем конфигурацию для LineChecker
        from app import LINES_CONFIG
        self.line_checker = LineChecker(LINES_CONFIG)
        
    def calculate_multiplier(self, bet: int, bets_list: List[int]) -> float:
        """Вычисляет множитель выплаты на основе ставки"""
        try:
            idx = bets_list.index(bet)
            return self.config.get('bet_multipliers', [1])[idx]
        except (ValueError, IndexError):
            return 1
            
    def check_combination(self, result: List[str], combo: Dict, bet: int, 
                         bets_list: List[int], current_jackpot: int) -> Optional[WinResult]:
        """Проверяет выигрышную комбинацию"""
        # Определяем тип проверки
        if combo.get('anywhere'):
            line_results = self.line_checker.check_anywhere(result, combo['pattern'])
            print(f"Проверяем комбинацию '{combo.get('name')}' в любом месте")
        else:
            # Проверяем конкретную линию по её ID
            line_id = combo.get('line_id')
            line_name = next((line['name'] for line in self.config.get('lines', []) if line['id'] == line_id), 'Неизвестная линия')
            print(f"Проверяем комбинацию '{combo.get('name')}' на линии {line_name} (ID: {line_id})")
            line_results = self.line_checker.check_line(result, combo['pattern'], line_id)
        
        # Находим выигрышные линии
        winning_lines = [lr for lr in line_results if lr.is_win]
        
        if not winning_lines:
            return None
            
        # Рассчитываем выплату с учетом множителей линий
        total_multiplier = sum(lr.multiplier for lr in winning_lines)
        bet_multiplier = self.calculate_multiplier(bet, bets_list)
        
        # Получаем имя комбинации
        combo_name = combo.get('name', 'Unknown Combination')
        combo_id = combo.get('id', 'unknown_id')
        
        # Формируем информацию о выигрышных линиях
        winning_lines_info = []
        for lr in winning_lines:
            line_info = next((line for line in self.config.get('lines', []) if line['id'] == lr.line_id), None)
            if line_info:
                winning_lines_info.append(f"{line_info['name']} (x{lr.multiplier})")
        
        winning_lines_str = ', '.join(winning_lines_info) if winning_lines_info else 'Anywhere'
        print(f"Найдена выигрышная комбинация: {combo_name} (ID: {combo_id}) на линиях: {winning_lines_str}")
        
        if combo.get('jackpot'):
            return WinResult(
                payout=current_jackpot,
                combo_id=combo_id,
                combo_name=combo_name,
                freespins_won=combo.get('freespins', 0),
                is_jackpot=True,
                pattern=result,
                winning_lines=winning_lines,
                win_level=WinLevel.SUPER  # Джекпот всегда SUPER уровень
            )
        else:
            base_payout = combo.get('payout', 0)
            final_payout = int(base_payout * bet_multiplier * total_multiplier)
            
            # Определяем уровень выигрыша на основе базовой выплаты
            win_level = WinLevel.NORMAL
            if base_payout >= 5000:
                win_level = WinLevel.SUPER
            elif base_payout >= 2000:
                win_level = WinLevel.MEGA
            elif base_payout >= 1000:
                win_level = WinLevel.BIG
            elif base_payout >= 500:
                win_level = WinLevel.MEDIUM
                
            # Применяем множитель уровня выигрыша
            final_payout = int(final_payout * WIN_LEVEL_MULTIPLIERS[win_level])
            
            return WinResult(
                payout=final_payout,
                combo_id=combo_id,
                combo_name=combo_name,
                freespins_won=combo.get('freespins', 0),
                is_jackpot=False,
                pattern=result,
                winning_lines=winning_lines,
                win_level=win_level
            )

    def check_win(self, result: List[str], bet: int, bets_list: List[int], 
                  current_jackpot: int) -> WinResult:
        """Проверяет результат на выигрышные комбинации"""
        # Инициализируем начальный результат с пустым именем комбинации
        best_win = WinResult(
            payout=0,
            combo_id="no_win",
            combo_name="No Win",
            freespins_won=0,
            is_jackpot=False,
            pattern=result,
            winning_lines=[]
        )
        
        print(f"Проверяем комбинации для результата: {result}")
        
        for combo in self.combinations:
            win = self.check_combination(result, combo, bet, bets_list, current_jackpot)
            if win and win.payout > best_win.payout:
                best_win = win
                # Формируем информацию о выигрышных линиях для лучшего выигрыша
                winning_lines_info = []
                for lr in best_win.winning_lines:
                    line_info = next((line for line in self.config.get('lines', []) if line['id'] == lr.line_id), None)
                    if line_info:
                        winning_lines_info.append(f"{line_info['name']} (x{lr.multiplier})")
                winning_lines_str = ', '.join(winning_lines_info) if winning_lines_info else 'Anywhere'
                print(f"Новый лучший выигрыш: {win.combo_name} с выплатой {win.payout} на линиях: {winning_lines_str}")
                if best_win.is_jackpot:
                    return best_win
                
        # Формируем финальную информацию о выигрышных линиях
        if best_win.winning_lines:
            winning_lines_info = []
            for lr in best_win.winning_lines:
                line_info = next((line for line in self.config.get('lines', []) if line['id'] == lr.line_id), None)
                if line_info:
                    winning_lines_info.append(f"{line_info['name']} (x{lr.multiplier})")
            winning_lines_str = ', '.join(winning_lines_info) if winning_lines_info else 'Anywhere'
            print(f"Финальный результат: {best_win.combo_name} с выплатой {best_win.payout} на линиях: {winning_lines_str}")
        else:
            print(f"Финальный результат: Нет выигрыша")
            
        return best_win 