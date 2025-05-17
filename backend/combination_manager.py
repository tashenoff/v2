from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from line_checker import LineChecker

@dataclass
class WinResult:
    payout: int
    combo_id: Optional[str]
    combo_name: Optional[str]
    freespins_won: int
    is_jackpot: bool
    pattern: List[str]

class CombinationManager:
    def __init__(self, combinations: List[Dict], config: Dict):
        self.combinations = combinations
        self.config = config
        self.line_checker = LineChecker()
        
    def calculate_multiplier(self, bet: int, bets_list: List[int]) -> float:
        """Вычисляет множитель выплаты на основе ставки"""
        try:
            idx = bets_list.index(bet)
            return self.config.get('bet_multipliers', [1])[idx]
        except (ValueError, IndexError):
            return 1
            
    def check_center_line(self, result: List[str], combo: Dict, bet: int, 
                         bets_list: List[int], current_jackpot: int) -> Optional[WinResult]:
        """Проверяет выигрышную комбинацию по центральной линии"""
        if combo.get('line') == 'center' and self.line_checker.check_line(result, combo['pattern'], 'center'):
            if combo.get('jackpot'):
                return WinResult(
                    payout=current_jackpot,
                    combo_id=combo.get('id'),
                    combo_name=combo.get('name'),
                    freespins_won=combo.get('freespins', 0),
                    is_jackpot=True,
                    pattern=result
                )
            else:
                base_payout = combo.get('payout', 0)
                multiplier = self.calculate_multiplier(bet, bets_list)
                return WinResult(
                    payout=int(base_payout * multiplier),
                    combo_id=combo.get('id'),
                    combo_name=combo.get('name'),
                    freespins_won=combo.get('freespins', 0),
                    is_jackpot=False,
                    pattern=result
                )
        return None

    def check_anywhere(self, result: List[str], combo: Dict, bet: int, 
                      bets_list: List[int]) -> Optional[WinResult]:
        """Проверяет выигрышную комбинацию в любом месте"""
        if combo.get('anywhere') and self.line_checker.check_line(result, combo['pattern'], 'anywhere'):
            base_payout = combo.get('payout', 0)
            multiplier = self.calculate_multiplier(bet, bets_list)
            return WinResult(
                payout=int(base_payout * multiplier),
                combo_id=combo.get('id'),
                combo_name=combo.get('name'),
                freespins_won=combo.get('freespins', 0),
                is_jackpot=False,
                pattern=result
            )
        return None

    def check_win(self, result: List[str], bet: int, bets_list: List[int], 
                  current_jackpot: int) -> WinResult:
        """Проверяет результат на выигрышные комбинации"""
        best_win = WinResult(0, None, None, 0, False, result)
        
        for combo in self.combinations:
            # Проверяем центральную линию
            center_win = self.check_center_line(
                result, combo, bet, bets_list, current_jackpot
            )
            if center_win and center_win.payout > best_win.payout:
                best_win = center_win
                if best_win.is_jackpot:
                    return best_win
            
            # Проверяем комбинации в любом месте
            anywhere_win = self.check_anywhere(result, combo, bet, bets_list)
            if anywhere_win and anywhere_win.payout > best_win.payout:
                best_win = anywhere_win
                
        return best_win 