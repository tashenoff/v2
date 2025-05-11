import React, { useState, useEffect, useRef } from 'react';
import './AnimatedNumber.css';

const AnimatedNumber = ({ value, duration = 1000, formatValue = (val) => val.toLocaleString('ru-RU'), className = '' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const [trend, setTrend] = useState(''); // 'increasing', 'decreasing', или ''

  useEffect(() => {
    // Если значение не изменилось, ничего не делаем
    if (value === previousValueRef.current) return;

    // Определяем тренд изменения
    if (value > previousValueRef.current) {
      setTrend('increasing');
    } else if (value < previousValueRef.current) {
      setTrend('decreasing');
    }

    // Сбрасываем тренд через некоторое время
    const trendTimeout = setTimeout(() => {
      setTrend('');
    }, duration + 200);

    // Сохраняем начальное значение для анимации
    const startValue = previousValueRef.current;
    const endValue = value;
    const difference = endValue - startValue;

    // Функция для обновления значения с анимацией
    const animateValue = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Используем функцию easeOutQuart для более плавной анимации
      const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
      const easedProgress = easeOutQuart(progress);
      
      // Вычисляем текущее значение
      const currentValue = startValue + difference * easedProgress;
      setDisplayValue(currentValue);
      
      // Продолжаем анимацию, если она не завершена
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateValue);
      } else {
        // Анимация завершена, устанавливаем точное конечное значение
        setDisplayValue(endValue);
        startTimeRef.current = null;
      }
    };
    
    // Отменяем предыдущую анимацию, если она была
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Запускаем анимацию
    animationRef.current = requestAnimationFrame(animateValue);
    
    // Обновляем предыдущее значение
    previousValueRef.current = value;
    
    // Очистка при размонтировании
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(trendTimeout);
    };
  }, [value, duration]);

  const classes = ['animated-number'];
  if (trend) classes.push(trend);
  if (className) classes.push(className);

  return <span className={classes.join(' ')}>{formatValue(Math.floor(displayValue))}</span>;
};

export default AnimatedNumber; 