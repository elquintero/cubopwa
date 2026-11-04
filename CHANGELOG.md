# CubIQ · Historial de versiones

## 1.27.0
- Motor del cubo más rápido, sin cambiar lo que se ve ni lo que hace: los giros se calculan de una sola vez, la comparación de estados ya no construye ni ordena cadenas y las pegatinas del cubo físico (facelets) se localizan con una tabla precalculada. En pruebas con el mismo código: giros ≈ 2,5× más rápidos, firma de estado ≈ 25× y lectura/escritura de facelets ≈ 200×. Se nota sobre todo al recibir cada posición del cubo Bluetooth, al guardar una resolución y en el análisis.
- El análisis de mejora (hilo en segundo plano) usa ahora el mismo motor que la interfaz, en un módulo propio (src/cube-engine.js), y deja de llevar una copia aparte. Con 240 resoluciones sintéticas, el análisis tarda 1,8 s en lugar de 3,5 s y da exactamente los mismos resultados.
- Nuevas pruebas automáticas (npm test): comparan el motor nuevo con el de la 1.26.0 en giros, firmas, facelets, clonado y «resuelto», y comprueban que la copia del motor dentro de index.html es idéntica al módulo. Se ejecutan también antes de publicar.
- Listas y pantallas: sin cambios visibles. Las pestañas ya usaban eventos delegados, iconos con carga diferida e historial paginado, así que no se tocan.

## 1.26.0
- Repetición de la resolución: ahora puedes girar el cubo arrastrando con el dedo (como en el cronómetro), también mientras se reproduce. Doble toque para centrarlo. Lo mismo en la animación de los casos de Aprender.
- Tras terminar una resolución aparece el botón «Análisis» bajo el tiempo, que abre directamente su repetición y sus consejos. Se oculta al empezar la siguiente.
- Pestañas más ágiles: Aprender y Estadísticas se pintan al instante y su contenido se genera justo después; si no ha cambiado nada desde la última visita, ya no se vuelve a generar. Al abrir una resolución, el cálculo del algoritmo recomendado se hace en segundo plano.
- Ajustes > General > «Desconectar el cubo por inactividad» (Nunca / 2 / 5 / 10 / 15 min; por defecto 5). Si no giras el cubo ni tocas la app, se desconecta para ahorrar la batería del cubo. Nunca lo hace durante una resolución.
- Estadísticas > Historial: muestra las últimas 10 resoluciones, con «Ver más» (de 10 en 10) hasta un máximo de 50 y «Ver menos».

## 1.25.1
- MoYu: se quita el círculo gris alrededor del logo; solo se ve el logo.
- GAN: se quitan los 4 puntitos de las piezas centrales.
- MoYu y GAN: el logo «IQ» por defecto es negro (un logo personalizado se muestra tal cual).

## 1.25.0
- El aspecto «Competición» pasa a llamarse «MoYu» (los usuarios que ya lo tenían elegido lo conservan).
- Nuevo aspecto del cubo «GAN»: casillas stickerless muy redondeadas hacia el centro de cada cara, separaciones algo más anchas, 4 puntitos en las esquinas de las piezas centrales y logo en azul. Paleta propia: blanco, amarillo lima, verde, azul, rojo y naranja.

## 1.24.0
- Nuevo aspecto del cubo «Competición» (Ajustes > Tema > Aspecto del cubo), inspirado en un cubo de competición stickerless: casillas de plástico a todo color con separaciones finas, esquinas casi rectas en el exterior y más redondeadas hacia el centro de cada cara, brillo suave y tapa redonda en el centro con el logo en azul claro.
- Trae su propia paleta (blanco, amarillo, verde, azul, rojo y naranja más vivos). Los colores propios y el logo personalizado siguen funcionando igual.

## 1.23.1
- Iconos de la app recomprimidos (paleta de 256 colores, sin diferencia visible): 74 KB → 28 KB en la precarga sin conexión.

## 1.23.0
- La pantalla ya no se apaga mientras estás en el cronómetro (resolviendo o practicando) ni en la prueba de reconocimiento. Se libera al salir de esas pantallas, al minimizar la app y tras 10 min sin actividad. Se puede desactivar en Ajustes > General > «Mantener la pantalla encendida».
- Estadísticas rediseñadas: tarjetas con mejor tiempo, media de 5, tendencia (últimas 10 frente a las 10 anteriores) y sesión actual frente a la anterior.
- Nueva gráfica: cuadrícula tenue, etiquetas de tiempo legibles, media de 5 como curva suave con relleno, línea de tendencia discontinua, línea de la media, marca del mejor tiempo y DNF señalados. Colores según el tema. Rango 25 / 50 / 100 / Todo; al tocar o pasar por la gráfica se ve el tiempo y la media de 5 de esa resolución.
- Nuevo bloque «Sesiones»: las últimas 5 (separadas por más de 30 min de pausa) con su media y la diferencia respecto a la anterior.

## 1.22.4
- Aprender: los filtros de F2L (Todos, Pareja arriba, Esquina en ranura…) ya no mandan la página al inicio; la lista cambia sin mover la pantalla.

## 1.22.3
- Aprender: al cambiar de pestaña (R U, Cruz, F2L, OLL, PLL) o de subgrupo, la barra de pestañas se queda en el mismo sitio de la pantalla. Antes la página saltaba hacia arriba cuando la lista nueva era más corta.
- Entrenar: el botón principal del plan («Comenzar sesión guiada», «Ver caso recomendado»…) va ahora en el color de acento; «Elegir los casos yo mismo» queda como botón secundario discreto con icono.

## 1.22.2
- Sin conexión (wifi y datos apagados): la app ya no espera a la red al abrirse. La página se sirve directamente desde la caché del service worker y las peticiones que no responden se cortan a los pocos segundos. Tampoco se buscan actualizaciones estando sin conexión.
- Iconos de casos: los dibujos OLL muestran ahora las 12 barras laterales de forma tenue cuando no hay barra amarilla, para que no parezcan deformados. En la vista previa de Ajustes todos los dibujos tienen el mismo tamaño.
- Ajustes > Logo personalizado: «Adjuntar/Cambiar imagen» y «Quitar imagen» ya no se pegan; van separados.
- Selector de color rediseñado: área de saturación/brillo, barra de matiz, HEX, colores rápidos y botones Cancelar / Aplicar. Se cierra con Esc o tocando fuera.

## 1.22.1
- Entrenar: el botón del coach («Entrenar PLL», «Repasar casos pendientes»…) ahora empieza de verdad la sesión con tus casos. Antes elegía los casos pero volvía a la misma portada y parecía que no hacía nada. Si el cubo no está resuelto, abre el selector con los casos ya marcados.
- Entrenar: bajo ese botón hay una frase que explica qué hace. Se quita el botón duplicado «Empezar a entrenar» (solo abría el selector con F2L marcado); queda «Elegir los casos yo mismo».

## 1.21.1
- El análisis automático de mejoras OLL/PLL tras resolver se ejecuta en un Web Worker para mantener fluida la interfaz.
- Se mantiene una ruta de compatibilidad para navegadores sin soporte de Web Worker.

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

## 1.21.2 · Optimización PWA y Worker

- Corregido el análisis en Web Worker: ahora importa y ejecuta `analyze()` directamente desde el módulo, en vez de depender de una global `Insight` que no existe en el contexto Worker.
- Añadido manejo de errores de inicialización, mensajes y transferencia al Worker para evitar trabajos pendientes si el Worker falla.
- Reforzado el Service Worker: navegación offline explícita, precarga atómica, validación de solicitudes dentro del scope, exclusión de solicitudes Range y respuesta de fallback cuando no hay red.
- Conservado el despliegue estático de Vite/GitHub Pages; no se añaden dependencias ni cambios de plataforma.


## 1.21.3 · Entrenamiento guiado y navegación

- La pestaña Entrenar abre ahora una portada con diagnóstico, últimas prácticas y progreso, en lugar de mostrar directamente el catálogo de casos.
- Añadidos accesos para empezar con F2L, elegir casos o continuar desde los casos entrenados recientemente.
- El catálogo de casos queda disponible desde «Elegir casos» y tiene un botón para volver al resumen.
- Se conserva la posición de desplazamiento de las vistas al cambiar de pestaña, evitando saltos visuales al volver.
- Se desactiva la animación de entrada al cambiar entre pestañas principales para una navegación más estable.


## 1.22.0 · Entrenamiento y personalización
- Sustituido el diagnóstico duplicado en Entrenar por un plan de entrenador personal con enfoque, objetivo y llamada a la acción.
- Corregido el salto al inicio al cambiar de pestaña en Aprender; se conserva la posición de desplazamiento.
- Nuevo selector de color compacto con controles HSV, HEX y muestras rápidas.
- Añadidos interruptor de logo e imagen personalizada para el centro de la cara blanca del cubo.
- Mejorada la resolución interna de la vista previa del cubo en Ajustes.
