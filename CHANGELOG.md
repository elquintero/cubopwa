# CubIQ · Historial de versiones

## 1.5.0
- Nueva estructura de app: las pantallas ya no son pop-ups. En móvil hay barra inferior (cronómetro, aprender, entrenar, estadísticas, ajustes) y en escritorio los iconos van en la cabecera. Las pantallas tienen tamaño fijo, sin barras de scroll visibles y la X de cerrar siempre en la cabecera.
- Aprender (birrete): pestañas «R U», Cruz, F2L, OLL y PLL con todos los casos y su progreso (3 niveles: guiado, de memoria, dominado). Bloque «Recomendado» con los casos detectados en tus resoluciones, el que dejaste a medias y el siguiente del camino.
- Ficha de cada caso: dibujo grande del patrón, animación 3D con reproductor (paso a paso, velocidad, «1 · Caso» y «2 · Solución»), algoritmo con el giro actual subrayado, ocultar algoritmo y lista de algoritmos alternativos con «Recomendado» y estrella para elegir el tuyo (solo los verificados con el simulador).
- Practicar con mi cubo: el cubo te marca cómo crear el caso y hacerlo. 3 repeticiones sin fallos suben de nivel; en el nivel «de memoria» el algoritmo se oculta. Aquí el tiempo pasa a segundo plano.
- Entrenar (diana): elige varios casos, al azar o en orden, con tiempo. Botón para elegir los casos que ya has empezado a aprender.
- Repetición de la resolución: detecta los casos de F2L (los 8 básicos), OLL y PLL. Las fases con caso llevan un punto azul; al tocarlas puedes verlo, aprenderlo o entrenarlo.
- Nuevo icono de la app: cuadrícula 3×3 más moderna, con fondo transparente (y versiones con fondo para móvil: maskable y Apple). El icono de Ajustes ahora es la rueda dentada.
- Iconos de pareja F2L rehechos (dos mitades separadas por una línea oscura). Iconos finos en lugar de textos en la barra de herramientas, el historial y los botones. «¡Start!» y el botón de saltar scramble, más pequeños.

## 1.4.1
- Vuelve la pantalla de práctica con varios casos a la vez: botón propio (diana) en la cabecera y tres pestañas F2L · OLL · PLL, cada una con su contador de casos elegidos.
- En OLL y PLL, atajos para los grupos de 2 pasos (cruz amarilla y esquinas; esquinas y aristas). Se pueden mezclar casos de las tres pestañas en una misma sesión.
- El birrete sigue abriendo «Aprender CFOP».

## 1.4.0
- Aprender CFOP: cruz, F2L, OLL y PLL, cada fase con su imagen y 3 reglas claras. Nueva lección «Leer los giros» (qué significan R, R', R2, r, M, x…), también desde el botón «?» del entrenamiento.
- Entrenamiento por grupos fundamentales: F2L básico (8 casos), OLL en 2 pasos (cruz amarilla y esquinas), PLL en 2 pasos (esquinas y aristas), y OLL / PLL completos. Selección manual de casos.
- El entrenamiento marca en verde lo que haces bien y en naranja los errores, tanto al preparar el caso como al resolverlo, con una sola frase que dice qué deshacer.
- El ojo muestra u oculta el algoritmo (oculto: puntos que se ponen verdes para practicar de memoria).
- Verificado con el simulador: los 8 casos de F2L solo rompen una ranura y mantienen la cruz; los 7 OCLL dejan las 4 aristas orientadas.

## 1.3.0
- Modo entrenamiento OLL/PLL: catálogo visual de 57 + 21 casos, selección múltiple, repeticiones al azar (más peso a los lentos), récords por caso.
- El ejercicio se hace con AMARILLO arriba y VERDE de frente: el cubo virtual se muestra igual, la app prepara el caso con giros en esa posición y dibuja un cubo de ayuda.
- Iconos de PLL con flechas de permutación; iconos de OLL sin letras.
- Detalle de cada resolución: repetición con control de velocidad, barra de fases en color, tarjetas por fase (cruz, 4 F2L, OLL, PLL) con pausa/giros/TPS, y consejos visuales.
- Análisis: la pausa de reconocimiento se mide aparte; el ahorro se estima con la velocidad real del usuario o un mínimo de 5 giros/s (OLL) y 6 (PLL), ajustable en TPS_ALG.
- Na sustituido por una versión de 14 giros (equivalente, verificada con simulador).
- Nuevo icono de la app y logotipo en la cabecera.

## 1.2.1
- Guía de calibración visual: cubo animado que muestra cada giro con una flecha, indicador de pasos y medidor en vivo del ángulo.
- El botón Siguiente solo se activa cuando el giro detectado es correcto.

## 1.2.0
- Análisis de cada resolución (F2L, OLL, PLL): detecta el caso y estima cuántos segundos podrías ahorrar con el algoritmo de un solo paso.
- Alerta instantánea con botón "Aprender" y "Descartar" (también con gestos del cubo: R4 / L4).
- Modo ejercicio: prepara el caso por ti, muestra el algoritmo y cuenta tus repeticiones y tiempos.
- Nuevo ajuste "Análisis y consejos".
- 57 casos OLL y 21 PLL, verificados con un simulador independiente.
- Nuevo estilo moderno: tipografía redondeada y degradado en el ¡Start!. Logotipo CubIQ en la cabecera.
- Gesto U4 para centrar el giroscopio.

## 1.1.0
- Giroscopio opcional (Ajustes): el cubo virtual se orienta como el real, con suavizado.
- Calibración guiada de ejes (3 giros) y botón para centrar la orientación.
- Aviso si el cubo no envía datos de giroscopio.

## 1.0.0
- Primera versión.
- Conexión Bluetooth con cubos MoYu (MoYu32) y vista 3D en tiempo real con giros animados.
- Scramble con seguimiento: verde (bien), amarillo (medio giro), naranja (error) y pista para deshacer.
- Timer con inicio automático al primer giro, parada al resolver y modo manual.
- Inspección de 15 s opcional (+2 / DNF).
- Estadísticas: single, ao5, ao12, ao50, ao100, TPS, gráfica e historial.
- Ajustes: inspección, inicio automático, animación de éxito y dispositivos guardados.
- PWA instalable. Interfaz minimalista.
