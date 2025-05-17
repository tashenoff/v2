from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

@dataclass
class LineResult:
    line_id: int
    line_name: str
    is_win: bool
    symbols: List[str]
    multiplier: float

class LineChecker:
    """
    Класс для проверки выигрышных линий в слоте.
    Поддерживает проверку центральной линии и комбинаций "anywhere".
    """
    
    def __init__(self, lines_config: Dict):
        self.lines = lines_config['lines']
    
    def convert_to_matrix(self, result: List[str]) -> List[List[str]]:
        """Преобразует список символов в матрицу 3x5"""
        if len(result) == 5:  # Если передана только одна линия
            return [
                ['*', '*', '*', '*', '*'],
                result,
                ['*', '*', '*', '*', '*']
            ]
        elif len(result) == 15:  # Если передана вся матрица
            matrix = [['*'] * 5 for _ in range(3)]
            for i, symbol in enumerate(result):
                x = i // 3  # Номер столбца
                y = i % 3   # Номер строки
                matrix[y][x] = symbol
            return matrix
        raise ValueError("Неверный формат результата")

    def get_line_symbols(self, matrix: List[List[str]], positions: List[List[int]]) -> List[str]:
        """
        Получает символы для конкретной линии
        Args:
            matrix: Матрица символов 3x5
            positions: Список позиций в формате [x, y]
        Returns:
            List[str]: Список символов на линии
        """
        return [matrix[y][x] for x, y in positions]

    def check_pattern_match(self, line_symbols: List[str], pattern: List[str]) -> bool:
        """Проверяет совпадение паттерна с символами на линии"""
        if len(line_symbols) != len(pattern):
            return False
            
        for sym, pat in zip(line_symbols, pattern):
            if pat != '*' and sym != pat and sym != 'wild':  # Добавляем проверку на wild
                return False
        return True

    def check_line(self, result: List[str], pattern: List[str], line_id: Optional[int] = None) -> List[LineResult]:
        """
        Проверяет совпадение комбинации на указанной линии
        
        Args:
            result: Список символов результата спина
            pattern: Список символов выигрышной комбинации
            line_id: ID линии для проверки. None для проверки всех линий
            
        Returns:
            List[LineResult]: Список результатов проверки по каждой линии
        """
        matrix = self.convert_to_matrix(result)
        
        # Если line_id не указан, проверяем все линии
        if line_id is None:
            results = []
            for line in self.lines:
                line_symbols = self.get_line_symbols(matrix, line['positions'])
                is_win = self.check_pattern_match(line_symbols, pattern)
                
                results.append(LineResult(
                    line_id=line['id'],
                    line_name=line['name'],
                    is_win=is_win,
                    symbols=line_symbols,
                    multiplier=line['multiplier'] if is_win else 0.0
                ))
            return results
            
        # Если указан конкретный line_id, проверяем только эту линию
        for line in self.lines:
            if line['id'] == line_id:
                line_symbols = self.get_line_symbols(matrix, line['positions'])
                is_win = self.check_pattern_match(line_symbols, pattern)
                
                return [LineResult(
                    line_id=line['id'],
                    line_name=line['name'],
                    is_win=is_win,
                    symbols=line_symbols,
                    multiplier=line['multiplier'] if is_win else 0.0
                )]
                
        # Если линия не найдена, возвращаем пустой результат
        return []

    def check_anywhere(self, result: List[str], pattern: List[str]) -> List[LineResult]:
        """
        Проверяет комбинацию anywhere с учетом всех символов паттерна
        """
        # Создаем словарь для подсчета символов в результате
        result_counts = {}
        for symbol in result:
            result_counts[symbol] = result_counts.get(symbol, 0) + 1
            
        # Создаем словарь для подсчета требуемых символов в паттерне
        pattern_counts = {}
        for symbol in pattern:
            if symbol != '*':  # Игнорируем wildcard в паттерне
                pattern_counts[symbol] = pattern_counts.get(symbol, 0) + 1
        
        # Проверяем, достаточно ли каждого символа в результате
        is_win = True
        for symbol, required_count in pattern_counts.items():
            actual_count = result_counts.get(symbol, 0)
            if actual_count < required_count:
                is_win = False
                break
                
        return [LineResult(
            line_id=0,
            line_name="Anywhere",
            is_win=is_win,
            symbols=result,
            multiplier=1.0 if is_win else 0.0
        )] 