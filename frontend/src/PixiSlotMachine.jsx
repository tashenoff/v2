import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

// Константы
const SPIN_DURATION_BASE = 1800;
const SPIN_DELAY_PER_REEL = 150;
const FINAL_ANIMATION_DURATION = 400;
const SPIN_SPEED = 25;
const EXTRA_DISTANCE = 2; // В единицах cellSize
const TEXTURE_BUFFER_SIZE = 20;
const BLUR_INTENSITY = 2; // Интенсивность размытия при вращении (уменьшена с 4 до 2)

// Вспомогательные функции
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Компонент слот-машины на PIXI.js
 */
const PixiSlotMachine = ({ symbols, result = [], cellSize, onSpinComplete }) => {
  // Рефы
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const reelsRef = useRef([]);
  const symbolsTexturesRef = useRef({});
  const emojisTexturesRef = useRef({});
  const loadingRef = useRef(false);

  /**
   * Создание текстуры из emoji
   */
  const createEmojiTexture = (emoji, app) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = cellSize;
    canvas.height = cellSize;
    
    ctx.font = `${cellSize * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
    
    return PIXI.Texture.from(canvas);
  };

  /**
   * Предварительная загрузка изображения
   */
  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  /**
   * Загрузка текстур всех символов
   */
  const loadTextures = async (app) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    console.log('Starting texture loading for symbols:', symbols);
    
    // Очищаем предыдущие текстуры
    symbolsTexturesRef.current = {};
    emojisTexturesRef.current = {};
    
    for (const symbol of symbols) {
      try {
        await loadSymbolTexture(symbol, app);
      } catch (error) {
        console.error(`Error processing symbol ${symbol.id}:`, error);
        emojisTexturesRef.current[symbol.id] = createEmojiTexture(symbol.emoji, app);
      }
    }
    
    console.log('Final textures loaded:', {
      images: Object.keys(symbolsTexturesRef.current).map(id => ({
        id,
        valid: symbolsTexturesRef.current[id].valid
      })),
      emojis: Object.keys(emojisTexturesRef.current)
    });

    loadingRef.current = false;
    return true;
  };
  
  /**
   * Загрузка текстуры одного символа
   */
  const loadSymbolTexture = async (symbol, app) => {
    if (symbol.image) {
      console.log(`Trying to load texture for ${symbol.id} from /assets/${symbol.image}`);
      try {
        // Сначала предварительно загружаем изображение
        const img = await preloadImage(`/assets/${symbol.image}`);
        console.log(`Image preloaded for ${symbol.id}, size: ${img.width}x${img.height}`);
        
        // Затем создаем текстуру
        const texture = await PIXI.Texture.from(`/assets/${symbol.image}`);
        
        // Включаем кэширование текстуры
        PIXI.Texture.addToCache(texture, `symbol_${symbol.id}`);
        
        // Оптимизация текстуры для быстрого рендеринга
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.LINEAR;
        texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.POW2;
        
        await texture.baseTexture.resource.load();
        
        if (texture && texture.baseTexture && texture.baseTexture.valid) {
          symbolsTexturesRef.current[symbol.id] = texture;
          console.log(`✅ Successfully loaded texture for ${symbol.id}`);
        } else {
          throw new Error('Invalid texture after loading');
        }
      } catch (error) {
        console.error(`❌ Failed to load texture for ${symbol.id}:`, error);
        console.log(`Creating emoji texture for ${symbol.id} as fallback`);
        emojisTexturesRef.current[symbol.id] = createEmojiTexture(symbol.emoji, app);
      }
    } else {
      console.log(`No image specified for ${symbol.id}, using emoji`);
      emojisTexturesRef.current[symbol.id] = createEmojiTexture(symbol.emoji, app);
    }
  };

  /**
   * Получение текстуры для символа
   */
  const getSymbolTexture = (symbolId) => {
    const imageTexture = symbolsTexturesRef.current[symbolId];
    if (imageTexture && imageTexture.baseTexture && imageTexture.baseTexture.valid) {
      return imageTexture;
    }
    const emojiTexture = emojisTexturesRef.current[symbolId];
    if (!emojiTexture) {
      console.error(`No texture found for symbol ${symbolId}`);
    }
    return emojiTexture;
  };

  /**
   * Получение случайного символа
   */
  const getRandomSymbolId = () => {
    const availableSymbols = symbols.filter(s => s.id !== '*');
    return availableSymbols[Math.floor(Math.random() * availableSymbols.length)]?.id;
  };

  /**
   * Создание барабанов
   */
  const createReels = () => {
    const app = appRef.current;
    if (!app) {
      console.error('PIXI Application not initialized');
      return;
    }

    reelsRef.current.forEach(reel => reel.destroy());
    reelsRef.current = [];

    for (let i = 0; i < 5; i++) {
      const reel = new PIXI.Container();
      reel.x = i * cellSize;
      
      // Создаем контейнер для символов
      const symbolsContainer = new PIXI.Container();
      reel.addChild(symbolsContainer);

      for (let j = 0; j < 10; j++) {
        const randomSymbolId = getRandomSymbolId();
        const texture = getSymbolTexture(randomSymbolId);
        
        if (!texture) {
          console.error(`No texture available for symbol ${randomSymbolId}`);
          continue;
        }

        const symbol = new PIXI.Sprite(texture);
        symbol.width = cellSize * 0.9;
        symbol.height = cellSize * 0.9;
        symbol.x = cellSize * 0.05;
        symbol.y = (j - 3) * cellSize + cellSize * 0.05;
        symbolsContainer.addChild(symbol);
      }

      app.stage.getChildAt(0).addChild(reel);
      reelsRef.current.push(symbolsContainer);
    }
  };

  /**
   * Преобразование результата в матрицу символов
   */
  const createResultMatrix = (finalSymbols) => {
    if (finalSymbols.length === 15) {
      return [0, 1, 2, 3, 4].map(i => finalSymbols.slice(i*3, i*3+3));
    } else {
      return [0, 1, 2, 3, 4].map(i => [
        getRandomSymbolId(),
        finalSymbols[i],
        getRandomSymbolId()
      ]);
    }
  };

  /**
   * Создание буфера текстур для анимации
   */
  const createTextureBuffer = () => {
    return Array(TEXTURE_BUFFER_SIZE).fill(null).map(() => {
      const randomSymbolId = getRandomSymbolId();
      return getSymbolTexture(randomSymbolId);
    });
  };

  /**
   * Анимация вращения всех барабанов
   */
  const spinReels = async (finalSymbols) => {
    const reels = reelsRef.current;
    if (!reels.length) return;

    const resultMatrix = createResultMatrix(finalSymbols);
    const promises = reels.map((reel, i) => spinSingleReel(reel, i, resultMatrix[i]));

    await Promise.all(promises);
    // Вызываем callback после завершения анимации всех барабанов
    onSpinComplete?.();
  };

  /**
   * Анимация вращения одного барабана
   */
  const spinSingleReel = (reel, reelIndex, finalSymbols) => {
    return new Promise(resolve => {
      setTimeout(() => {
        const spinDuration = SPIN_DURATION_BASE + reelIndex * SPIN_DELAY_PER_REEL;
        const ticker = new PIXI.Ticker();
        // Устанавливаем максимальный FPS для плавности
        ticker.maxFPS = 60;
        let elapsed = 0;
        
        // Создаем и применяем фильтр размытия
        const blurFilter = new PIXI.BlurFilter();
        blurFilter.blur = 0;
        blurFilter.quality = 1;
        reel.filters = [blurFilter];
        
        // Создание буфера текстур для плавной анимации
        const textureBuffer = createTextureBuffer();
        let bufferIndex = 0;

        const updateTextureBuffer = () => {
          const randomSymbolId = getRandomSymbolId();
          textureBuffer[bufferIndex] = getSymbolTexture(randomSymbolId);
          bufferIndex = (bufferIndex + 1) % textureBuffer.length;
        };

        const getNextTexture = () => {
          const texture = textureBuffer[bufferIndex];
          updateTextureBuffer();
          return texture;
        };

        // Вращение барабана
        ticker.add(() => {
          elapsed += ticker.deltaMS;
          
          // Управляем интенсивностью размытия
          const progress = elapsed / spinDuration;
          if (progress < 0.2) {
            // Нарастание размытия
            blurFilter.blur = BLUR_INTENSITY * (progress / 0.2);
          } else if (progress > 0.8) {
            // Уменьшение размытия
            blurFilter.blur = BLUR_INTENSITY * (1 - (progress - 0.8) / 0.2);
          } else {
            // Максимальное размытие
            blurFilter.blur = BLUR_INTENSITY;
          }
          
          reel.children.forEach((symbol) => {
            // Адаптируем скорость к deltaTime для консистентности при разных FPS
            symbol.y += SPIN_SPEED * (ticker.deltaMS / 16.67);

            if (symbol.y >= cellSize * 4) {
              symbol.y = -cellSize * 2;
              symbol.texture = getNextTexture();
            }
          });

          // Если вращение завершено, останавливаем барабан
          if (elapsed >= spinDuration) {
            ticker.destroy();
            // Убираем фильтр размытия перед остановкой
            reel.filters = null;
            animateReelStop(reel, finalSymbols).then(resolve);
          }
        });

        ticker.start();
      }, reelIndex * SPIN_DELAY_PER_REEL);
    });
  };

  /**
   * Анимация остановки барабана
   */
  const animateReelStop = (reel, finalSymbols) => {
    return new Promise(resolveColumn => {
      const sortedSymbols = [...reel.children].sort((a, b) => a.y - b.y);

      // Устанавливаем текстуры для всех символов в колонке
      for (let j = 0; j < 3; j++) {
        const targetSymbol = sortedSymbols[j + 3];
        if (targetSymbol) {
          const texture = getSymbolTexture(finalSymbols[j]);
          if (texture) {
            targetSymbol.texture = texture;
          }
        }
      }

      // Анимация группы символов при остановке
      const startTime = Date.now();
      const extraDistance = cellSize * EXTRA_DISTANCE;
      
      // Начальное положение всей колонки (немного ниже)
      sortedSymbols.forEach(symbol => {
        symbol.y += extraDistance;
      });

      const animTicker = new PIXI.Ticker();
      // Устанавливаем максимальный FPS для плавности
      animTicker.maxFPS = 60;
      animTicker.add(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / FINAL_ANIMATION_DURATION, 1);
        
        // Используем более плавную функцию easing
        const smoothEasing = progress => {
          // Комбинация cubic и elastic для более реалистичной инерции
          const elasticFactor = Math.sin(progress * Math.PI * 2) * Math.pow(1 - progress, 2) * 0.1;
          return easeOut(progress) + elasticFactor;
        };
        
        const currentOffset = extraDistance * (1 - smoothEasing(progress));
        
        // Двигаем все символы в колонке вместе
        sortedSymbols.forEach((symbol, j) => {
          const finalY = (j - 3) * cellSize + cellSize * 0.05;
          symbol.y = finalY + currentOffset;
        });
        
        if (progress >= 1) {
          animTicker.destroy();
          resolveColumn();
        }
      });
      
      animTicker.start();
    });
  };

  /**
   * Инициализация PIXI приложения
   */
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new PIXI.Application({
      width: cellSize * 5,
      height: cellSize * 3,
      backgroundColor: 0x0c0659,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      powerPreference: 'high-performance',
      useContextAlpha: false,
      legacy: false
    });

    canvasRef.current.appendChild(app.view);
    appRef.current = app;

    app.view.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.log('WebGL контекст потерян, восстанавливаем...');
      setTimeout(() => {
        appRef.current.renderer.gl.getExtension('WEBGL_lose_context').restoreContext();
      }, 100);
    }, false);

    // Создаем основной контейнер для всех элементов
    const mainContainer = new PIXI.Container();
    mainContainer.width = cellSize * 5;
    mainContainer.height = cellSize * 3;
    app.stage.addChild(mainContainer);

    // Создаем контейнер для барабанов
    const reelsContainer = new PIXI.Container();
    reelsContainer.width = cellSize * 5;
    reelsContainer.height = cellSize * 3;
    mainContainer.addChild(reelsContainer);

    // Создаем контейнер для разделителей
    const dividersContainer = new PIXI.Container();
    mainContainer.addChild(dividersContainer);

    // Создаем контейнер для альфа-маски колонок
    const columnOverlayContainer = new PIXI.Container();
    columnOverlayContainer.width = cellSize * 5;
    columnOverlayContainer.height = cellSize * 3;
    mainContainer.addChild(columnOverlayContainer);

    // Создаем фон для колонок
    const createColumnOverlay = () => {
      // Загружаем текстуру фона колонки
      const columnTexture = PIXI.Texture.from('/assets/col.png');
      
      // Создаем спрайты для каждой колонки
      for (let i = 0; i < 5; i++) {
        const columnOverlay = new PIXI.Sprite(columnTexture);
        columnOverlay.width = cellSize;
        columnOverlay.height = cellSize * 3;
        columnOverlay.x = i * cellSize;
        columnOverlay.y = 0;
        columnOverlay.alpha = 1;
        app.stage.addChild(columnOverlay); // Добавляем прямо в stage
      }
    };

    // Создаем разделители между барабанами
    const createDividers = () => {
      for (let i = 1; i < 5; i++) {
        const divider = new PIXI.Graphics();
        divider.beginFill(0x000000);
        divider.drawRect(i * cellSize - 1, 0, 2, cellSize * 3);
        divider.endFill();
        dividersContainer.addChild(divider);
      }
    };

    // Создаем маску для контейнера барабанов
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(0, 0, cellSize * 5, cellSize * 3);
    mask.endFill();
    reelsContainer.mask = mask;
    app.stage.addChild(mask);

    // Загружаем текстуры и создаем элементы
    loadTextures(app).then(() => {
      createReels();
      createDividers();
      // Создаем колонки в самом конце
      setTimeout(() => createColumnOverlay(), 100);
    });

    return () => {
      app.destroy(true);
      appRef.current = null;
    };
  }, []);

  /**
   * Запуск вращения при изменении результата
   */
  useEffect(() => {
    if (result.length) {
      spinReels(result);
    }
  }, [result]);

  return (
    <div ref={canvasRef} style={{ borderRadius: '12px', overflow: 'hidden' }} />
  );
};

export default PixiSlotMachine; 