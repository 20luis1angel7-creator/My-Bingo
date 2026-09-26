# Bingo Web

MVP de bingo individual de 75 bolas. La pantalla principal (`/`) presenta el producto; **Comenzar** abre la partida en `/jugar`.

## Qué funciona

- Varios cartones de 5 × 5 con 24 números únicos y centro libre, distribuidos en filas compactas.
- Columnas B (1–15), I (16–30), N (31–45), G (46–60) y O (61–75).
- Ingreso manual y lectura de cartones desde una imagen o una foto, con revisión antes de guardar.
- Marcado y desmarcado manual al pulsar cada número del cartón.
- Aviso de bingo al completar una fila, columna o diagonal con tus marcas. Puedes seguir marcando y corregirlas después.
- Añadir cartones por foto, manualmente o al azar sin reemplazar los existentes; borrar cada uno con su papelera.
- Guardado automático de todos los cartones y de sus marcas independientes en el mismo navegador.
- Navegación y menú móvil funcionales; diseño responsive.

## Cómo jugar

1. Abre la página principal y pulsa **Comenzar**.
2. Se recuperan tus cartones guardados; en la primera visita se genera uno aleatorio.
3. Añade más cartones desde una foto, con **Añadir cartón manual** o **Añadir aleatorio**. Pulsa sus números para marcarlos o desmarcarlos; el centro siempre está marcado.
4. Completa una fila, columna o diagonal para hacer bingo.
5. Para borrar un cartón, pulsa la papelera de su esquina superior derecha. Los demás se conservan.

## Instalación y comandos

Requisitos: Node.js 20.9 o superior, npm 10 o superior y Git.

```bash
cd bingo-web
npm install
npm run dev
```

Abre <http://localhost:3000>. No se requieren cuentas ni variables de entorno. El OCR descarga su motor y el modelo de reconocimiento por internet al utilizarlo; las fotos se procesan en el navegador.

| Comando                | Uso                                                                          |
| ---------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`          | Desarrollo con Turbopack.                                                    |
| `npm run build`        | Compilación de producción.                                                   |
| `npm start`            | Servir la compilación.                                                       |
| `npm run lint`         | ESLint.                                                                      |
| `npm run typecheck`    | Comprobar TypeScript.                                                        |
| `npm test`             | Pruebas del motor: cartones, patrones, marcado y validación de datos.        |
| `npm run test:ocr`     | Prueba OCR real con cartones de ejemplo generados, inclinados y con sombras. |
| `npm run format`       | Aplicar Prettier.                                                            |
| `npm run format:check` | Comprobar formato.                                                           |

`npm ci` instala las versiones del archivo de bloqueo. Las pruebas compilan el motor en `.test-build/`, una carpeta ignorada por Git. `npm run test:ocr` descarga el modelo de inglés la primera vez y compara los 24 números de cada cartón, incluido el segundo de una foto con dos cartones. Usa imágenes sintéticas que reproducen el formato de los ejemplos; no sustituye la validación con fotografías originales. El modelo y las imágenes de prueba quedan en `.test-build/photos/`.

## Tecnologías y estructura

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Lucide React, ESLint y Prettier. Tesseract.js se carga bajo demanda para reconocer los números de las imágenes.

```text
src/
├── app/                     # Presentación / y partida /jugar
├── components/
│   ├── home/                # Secciones informativas
│   ├── layout/              # Marca, navegación y pie
│   └── ui/                  # Componentes shadcn/ui
├── features/
│   ├── game/
│   │   ├── engine.ts        # Generación, marcado, patrones y validación
│   │   ├── use-bingo.ts     # Estado y persistencia local
│   │   └── components/     # Pantalla y cartón interactivo
│   ├── cards/              # Reservada
│   ├── scanner/            # Reservada
│   ├── settings/           # Reservada
│   └── statistics/         # Reservada
├── lib/                     # Utilidades y navegación
└── types/                   # Reservada
public/                      # Recursos locales
 tests/                      # Pruebas del motor
```

El alias `@/*` apunta a `src/*`. Los colores compartidos están en `src/app/globals.css`.

## Datos y límites del MVP

Se conserva la colección de cartones en `localStorage`, con la clave `bingo-web-game-v1`. Los datos recuperados se validan antes de utilizarlos. El formato actual (versión 3) asigna un identificador a cada cartón y mantiene sus marcas por separado. Las partidas anteriores se migran conservando sus números y marcas. Si se borran todos los cartones, la colección vacía también se conserva al recargar. Si el navegador bloquea el almacenamiento, se muestra un aviso y se puede seguir jugando durante la sesión. Borrar los datos del navegador elimina la partida; no hay sincronización ni coordinación entre pestañas.

Este MVP es un cartón interactivo para acompañar una partida externa. No extrae ni canta números. No incluye apuestas, multijugador, autenticación, backend ni base de datos. En `/jugar`, **Subir imagen**, situado a la izquierda de **Añadir cartón manual**, acepta fotos de hasta 20 MB. La selección abre una ventana flotante compacta para ajustar la cuadrícula; puedes cerrarla con la cruz o Escape. Al terminar la lectura, la ventana se cierra y aparecen las casillas para revisarlas. El lector busca paneles de casillas claras rodeados de un marco oscuro y permite elegir un cartón cuando encuentra varios en la misma foto. Comprueba el contorno y pulsa **Leer este cartón**. Si no se detecta o el contorno está desplazado, usa **Marcar cuatro esquinas**: superior izquierda, superior derecha, inferior derecha e inferior izquierda de la cuadrícula de números, excluyendo BINGO y el borde exterior. También puedes arrastrar las esquinas o moverlas con las flechas del teclado.

La selección se endereza mediante corrección de perspectiva antes de reconocer los números. El centro impreso como «.es» se considera libre. Las casillas pendientes se vuelven a leer con distintos contrastes, escalas y modos de reconocimiento. Revisa los números antes de **Guardar cartón**, que añade el nuevo cartón sin reemplazar los anteriores. Los números tapados o borrosos pueden requerir corrección manual.
