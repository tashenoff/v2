from typing import List, Dict, Optional

class LineChecker:
    """
    Класс для проверки выигрышных линий в слоте.
    Поддерживает проверку центральной линии и комбинаций "anywhere".
    """
    
    @staticmethod
    def check_center_line(result: List[str], pattern: List[str]) -> bool:
        """
        Проверяет точное совпадение комбинации на центральной линии
        
        Args:
            result: Список символов результата спина
            pattern: Список символов выигрышной комбинации
            
        Returns:
            bool: True если комбинация совпадает полностью
        """
        return result == pattern
    
    @staticmethod
    def check_anywhere(result: List[str], pattern: List[str]) -> bool:
        """
        Проверяет наличие нужного количества одинаковых символов в любом месте
        
        Args:
            result: Список символов результата спина
            pattern: Список символов выигрышной комбинации (используется только первый символ)
            
        Returns:
            bool: True если найдено достаточное количество символов
        """
        count = sum(1 for r in result if r == pattern[0])
        return count >= len(pattern)
    
    @classmethod
    def check_line(cls, result: List[str], pattern: List[str], line_type: str) -> bool:
        """
        Проверяет совпадение комбинации на линии заданного типа
        
        Args:
            result: Список символов результата спина
            pattern: Список символов выигрышной комбинации
            line_type: Тип линии ('center' или 'anywhere')
            
        Returns:
            bool: True если комбинация совпадает с правилами для данного типа линии
        """
        if line_type == 'center':
            return cls.check_center_line(result, pattern)
        elif line_type == 'anywhere':
            return cls.check_anywhere(result, pattern)
        return False 