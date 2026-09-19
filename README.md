# 🚜 SERRACOR SYSTEM — Plataforma de Control Logístico y Depósito de Contenedores 5D

Serracor System es un ecosistema de software industrial de nivel **Premium / Senior** desarrollado para la administración, control de inventario y optimización física en tiempo real de terminales y depósitos de contenedores de alta densidad. 

El sistema elimina las ineficiencias de la comunicación radial tradicional mediante una arquitectura orientada a eventos bidireccionales, gestionando de forma matemática una matriz tridimensional de patio con restricciones físicas automatizadas.

---

## 📸 Demostración Visual de la Suite (Tiempo Real)

Para visualizar la sincronización asíncrona de milisegundos y la respuesta del plano tridimensional del depósito, la suite se despliega de la siguiente manera en estaciones de trabajo divididas:

### 🖥️ Interfaz Unificada en Pantalla Dividida
La garita de control (Gate Control) despacha y recibe datos al mismo tiempo que la terminal móvil de patio procesa los contenedores sobre el motor MySQL.

![Pantalla Dividida - Serracor System](https://githubusercontent.com)

### 📊 Comparativa de Operaciones Dinámicas

| Estación Garita (Gate Control) | Estación Grúa (Terminal Móvil de Patio) |
| :---: | :---: |
| **Visación de Alertas de Ingreso / Salida** | **Órdenes de Trabajo y Log Diario** |
| ![Alertas de Garita](https://githubusercontent.com) | ![Pantalla del Maquinista](https://githubusercontent.com) |

---

## 🚀 Arquitectura Tecnológica (Stack Premium)

*   **Frontend:** React 19 (TypeScript) + Vite 8. El compilador y tipado estricto garantizan cero mutaciones de datos en los flujos críticos.
*   **Estilos Industriales:** CSS Nativo + Tailwind CSS v4 con Grid Adaptativo. Diseño optimizado con contrastes severos de alta visibilidad para pantallas montadas en cabinas de grúas pesadas.
*   **Backend REST API:** Node.js + Express. Arquitectura desacoplada, escalable y modular.
*   **Tiempo Real Nativo:** WebSockets mediante **Socket.io**. Comunicación bidireccional y propagación de eventos en un rango menor a los 50 milisegundos.
*   **Base de Datos Relacional:** MySQL 9.6.0 (Community Server). Gestión de concurrencia mediante transacciones y llaves compuestas únicas.

---

## 🛡️ Reglas de Negocio e Inteligencia de Patio Implementadas

El sistema no delega la responsabilidad al operador; el motor de base de datos y el backend controlan la física del patio de forma atómica:

1.  **Restricción de Anticolisión de Slots (Matriz 5D):** A través de llaves únicas compuestas (`UNIQUE KEY`) sobre las coordenadas `[bloque, bay, posicion, piso, fila_fondo]`, es matemáticamente imposible que el sistema intente asignar o superponer dos contenedores en la misma coordenada física tridimensional y de profundidad.
2.  **Validación de la Ley de Gravedad de Apilamiento:** Al intentar posicionar un contenedor en un piso superior (Piso > 1), el backend inicia una transacción controlada (`conn.beginTransaction`). Consulta el slot inmediatamente inferior (Piso - 1) en esa misma vertical; si el slot de soporte físico está vacío, la transacción se aborta (`conn.rollback`) y devuelve un código de estado `422 (Unprocessable Entity)`, impidiendo un colapso en el patio.
3.  **Flujos de Trabajo Inteligentes y Discriminación Operativa:**
    *   **📥 Ingresos:** Las unidades nacen en la Garita, viajan instantáneamente a la grúa como una tarjeta azul destacada (`MAQUINISTA INGRESA ESTO`). Al ser posicionadas, el maquinista presiona **OK** y la alerta cambia en Garita a `Validar Entrada a Patio`.
    *   **📤 Despachos:** Al pulsar sobre una unidad activa en el mapa, Garita despacha un retiro en caliente. La grúa la recibe en color naranja (`LA LABOR ES DESPACHAR`). Al cargarlo al camión, presiona **OK** y la Garita recibe la alerta `Validar Salida de Patio` para liquidar el váucher térmico y calcular tarifas o sobreestadías basadas en la fecha de ingreso.

---

## 📂 Estructura del Workspace

```text
DEPOSITO DE CONTENEDORES/
├── docs/
│   └── capturas/         # Screenshots del sistema para documentación del repositorio
├── server/
│   ├── .env              # Variables de entorno secretas (Ignoradas en Git por seguridad)
│   ├── index.js          # Servidor maestro Express + HTTP + Socket.io (CommonJS)
│   └── database.sql      # Script de inicialización de la BD relacional MySQL 9
├── src/
│   ├── components/
│   │   ├── gate-control/  # Formularios comerciales, váuchers térmicos y alertas
│   │   ├── maquinistas/   # Terminal móvil adaptativa de patio (Roblero / Tyko)
│   │   └── PatioMap/      # Renderizado interactivo de la matriz por capas de profundidad
│   ├── types/
│   │   └── index.ts      # Tipados e Interfaces estrictas de TypeScript
│   ├── App.tsx           # Componente raíz con orquestación de estados y cliente Socket.io
│   ├── index.css         # Identidad visual industrial y paleta de colores unificada
│   └── main.tsx          # Punto de entrada de React
├── package.json          # Configuración raíz con dependencias en paralelo y Concurrently
└── vite.config.ts        # Configuración del empaquetador Vite
```

---

## 🔧 Instalación y Puesta en Marcha (Local Deployment)

### 1. Requisitos Previos
*   Node.js (Versión LTS recomendada)
*   MySQL Server (Versión 9.x o superior) con una cuenta configurada (Ej: usuario `root` y clave `root123`).

### 2. Configuración de la Base de Datos
Accede a tu CLI de MySQL o Workbench y ejecuta los comandos contenidos en `server/database.sql`:
```sql
CREATE DATABASE IF NOT EXISTS deposito_contenedores;
USE deposito_contenedores;
-- (Ejecutar las estructuras de tablas clientes, contenedores y patio_mapa)
```

Si tu cuenta `root` en MySQL 9 requiere refrescar el protocolo de encriptación de contraseñas de Sockets, ejecuta en el monitor:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'tu_clave';
FLUSH PRIVILEGES;
```

### 3. Configuración de Seguridad de Entorno (.env)
Crea un archivo llamado `.env` dentro de la carpeta `server/` y define los parámetros del terminal local:
```ini
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root123
DB_NAME=deposito_contenedores
FRONTEND_URL=http://localhost:5173
```

### 4. Instalación de Módulos del Sistema
Párate en la raíz del proyecto y ejecuta la instalación del Frontend y del Gestor de Procesos en Paralelo:
```bash
npm install
npm install concurrently --save-dev
npm install socket.io-client
```

Luego entra a la carpeta del servidor e instala los drivers relacionales y HTTP:
```bash
cd server
npm init -y
npm install express mysql2 cors socket.io dotenv
```

---

## 🚀 Ejecución del Sistema en un Solo Paso (Premium Dev Automation)

Gracias a la integración del paquete `concurrently` en los scripts del archivo de configuración raíz, **no necesitas abrir múltiples terminales a mano**. Ejecuta el siguiente comando en la raíz del proyecto:

```bash
npm start
```

### ¿Qué ocurre bajo el capó al ejecutar este comando?
1.  Se enciende el servidor REST y el Servidor de WebSockets de Node.js en el puerto **`5000`**, autenticándose contra MySQL de forma segura mediante las variables de entorno.
2.  En paralelo, se levanta el entorno de desarrollo y la suite de compilación de Vite en el puerto **`5173`**.
3.  La aplicación queda lista para pruebas divididas: puedes abrir una pestaña estándar y una de incógnito en Chrome (`http://localhost:5173`), iniciar sesión con roles distintos (Garita y Maquinista) y ver los movimientos viajar por los sockets en tiempo real nativo.

---
Generado con estándares de desarrollo limpio de software por **Serracor Engineering**. 🛠️
