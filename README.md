# Bingo Web

MVP de bingo individual de 75 bolas. La pantalla principal (`/`) presenta el producto; **Comenzar** abre la partida en `/jugar`.

## Qué funciona

- Cartón aleatorio de 5 × 5 con 24 números únicos y centro libre.
- Columnas B (1–15), I (16–30), N (31–45), G (46–60) y O (61–75).
- Ingreso manual y lectura de cartones desde una imagen o una foto, con revisión antes de guardar.
- Marcado y desmarcado manual al pulsar cada número del cartón.
- Aviso de bingo al completar una fila, columna o diagonal con tus marcas. Puedes seguir marcando y corregirlas después.
- Nueva partida con cartón nuevo y confirmación para evitar pérdida accidental.
- Guardado automático y recuperación del progreso en el mismo navegador.
- Navegación y menú móvil funcionales; diseño responsive.

## Cómo jugar

1. Abre la página principal y pulsa **Comenzar**.
2. Se genera tu cartón, o se recupera la última partida guardada.
3. Pulsa los números del cartón conforme los escuches en tu partida. Pulsa otra vez para desmarcarlos; el centro siempre está marcado.
4. Completa una fila, columna o diagonal para hacer bingo.
5. Pulsa **Nueva partida** y confirma para volver a jugar.

## Instalación y comandos

Requisitos: Node.js 20.9 o superior, npm 10 o superior y Git.

```bash
cd bingo-web
npm install
npm run dev
```

Abre <http://localhost:3000>. No se requieren cuentas ni variables de entorno. El OCR descarga su motor y el modelo de reconocimiento por internet al utilizarlo; las fotos se procesan en el navegador.

| Comando                | Uso                                                                   |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Desarrollo con Turbopack.                                             |
| `npm run build`        | Compilación de producción.                                            |
| `npm start`            | Servir la compilación.                                                |
| `npm run lint`         | ESLint.                                                               |
| `npm run typecheck`    | Comprobar TypeScript.                                                 |
| `npm test`             | Pruebas del motor: cartones, patrones, marcado y validación de datos. |
| `npm run format`       | Aplicar Prettier.                                                     |
| `npm run format:check` | Comprobar formato.                                                    |

`npm ci` instala las versiones del archivo de bloqueo. Las pruebas compilan el motor en `.test-build/`, una carpeta ignorada por Git.

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

Se conserva una única partida en `localStorage`, con la clave `bingo-web-game-v1`. Los datos recuperados se validan antes de utilizarlos. El formato actual (versión 2) usa marcas manuales y migra las partidas anteriores conservando el cartón y sus coincidencias. Si el navegador bloquea el almacenamiento, se muestra un aviso y se puede seguir jugando durante la sesión. Borrar los datos del navegador elimina la partida; no hay sincronización ni coordinación entre pestañas.

Este MVP es un cartón interactivo para acompañar una partida externa. No extrae ni canta números. No incluye apuestas, multijugador, autenticación, backend ni base de datos. En `/jugar`, **Subir imagen** y **Tomar foto** permiten escanear un solo cartón de 75 bolas por imagen (hasta 20 MB). La cámara se abre en móviles compatibles; otros navegadores pueden mostrar el selector de archivos. Usa una foto frontal, nítida y bien iluminada: el OCR puede equivocarse y siempre debes revisar los números antes de **Guardar y jugar**, que reemplaza el cartón actual. El lector detecta los bordes y reconoce cada casilla por separado, amplía imágenes pequeñas y compensa inclinaciones leves. Las lecturas con baja confianza quedan vacías para revisarlas; los fondos ilustrados, la perspectiva fuerte o los números tapados pueden requerir corrección manual. Si no se localiza la cuadrícula, recorta la imagen alrededor del cartón o ingrésalo manualmente.
