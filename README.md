# 🗺️ Sistema Integrado de Control de Patio y Gestión de Contenedores
## ⚠️ Estado del Proyecto & RoadMap (En Desarrollo)
Este sistema se encuentra actualmente en **fase de desarrollo activo**. Aunque las funciones principales de registro, persistencia de contenedores y generación de tickets térmicos son 100% operativas, se está trabajando activamente en la optimización de los siguientes módulos:
* [ ] Corrección de detalles visuales en el renderizado de la matriz tridimensional.
* [ ] Optimización de la interactividad bidireccional entre las celdas libres y los selectores del formulario.
* [ ] Refactorización de la persistencia de estados locales.


Este proyecto consiste en una aplicación web interactiva de nivel empresarial desarrollada con **React, TypeScript y Tailwind CSS**, diseñada especialmente para optimizar, validar y auditar los flujos logísticos en un terminal o depósito de contenedores de alta densidad. Permite registrar ingresos de carga, controlar servicios y maniobras mecánicas complementarias, además de visualizar e interactuar en tiempo real con la distribución física tridimensional y secuencial de la matriz de apilamiento en el patio logístico.

---

## 🚀 Características Principales

### 1. 📝 Registro Operativo e Inteligencia Tarifaria
* **Formulario Industrial Optimizado**: Captura ágil de datos críticos con formateo automático en mayúsculas (`Sigla del Contenedor`, `Tipo`, `Patente`, `Guía de Referencia`).
* **Ficha de Trazabilidad**: Registro exhaustivo de datos del cliente, transportista asignado e identificación completa del conductor (Nombre y RUT Chileno validable).
* **Desglose de Servicios Auxiliares**: Tarificación automatizada según el estado de la carga (`FULL` / `VACÍO`) y adición dinámica de costes operativos por maquinaria pesada (Grúa Horquilla, Reach Stacker y maniobras de rampa).

### 2. 🗺️ Plano Satelital Interactivo con Matriz de Patio 5D
* **Disposición Geométrica Profesional**: Visualización modular dividida por bloques independientes (A, B, C, D) interconectados por pasillos de maniobra realistas y zonas de transferencia para grúas.
* **Control de Capas Multidimensional (5D)**: Incorporación de una barra de control visual para conmutar la profundidad del patio (`Fila Fondo` del 1 al 4). El mapa se redefine dinámicamente para aislar y mostrar únicamente las unidades correspondientes a la capa seleccionada.
* **Interactividad Bidireccional Automatizada**: 
  * Al pulsar sobre un slot ocupado, se despliega instantáneamente el historial y la información de la carga.
  * Al hacer clic sobre cualquier celda libre (**Slot Disponible**), las coordenadas completas de posicionamiento (`Bloque`, `Bay`, `Posición`, `Piso`, `Fila Fondo`) se transmiten e inyectan automáticamente en los selectores del formulario de ingreso.

### 3. 🖨️ Módulo de Impresión Térmica de Vales de Entrada
* **Liquidación de Servicios**: Integración de un componente de comprobante formal (`Voucher`) que calcula automáticamente los subtotales netos, cobros de almacenamiento, sobreestadías y desgloses impositivos (IVA del 19%).
* **Optimización Nativa de Papel**: Capa CSS configurada mediante `@media print` que oculta de forma estricta los controles de la interfaz digital, formateando el contenido para impresión directa en rollos de ticket térmico o generación limpia de documentos PDF de estándar industrial.

---

## 📋 Reglas de Negocio y Seguridad Operativa Implementadas

* **Validación de Slots Anticolisión**: El sistema restringe la asignación de posiciones duplicadas en la matriz 5D. Ningún contenedor puede ser ingresado en una coordenada tridimensional exacta (`Bloque`, `Bay`, `Posición`, `Piso`, `Fila Fondo`) que ya se encuentre ocupada por otra unidad activa en el turno.
* **Física de Apilamiento (Ley de Gravedad)**: Restricción crítica de seguridad en patio que impide el apilamiento de contenedores flotantes. El sistema rechaza cualquier registro en un nivel superior (`Piso 2, 3 o 4`) si la coordenada inmediatamente inferior (`Piso - 1`) en esa misma vertical y profundidad no posee un contenedor válido que sirva de soporte físico.

---

## 🛠️ Tecnologías Utilizadas

* **React (v18+)** - Arquitectura basada en componentes reutilizables y estados reactivos sincronizados de alta velocidad.
* **TypeScript** - Tipado estático estricto para garantizar la robustez, integridad de datos y evitar excepciones en tiempo de ejecución durante la manipulación de arreglos logísticos.
* **Tailwind CSS** - Framework enfocado en utilidades para una interfaz de usuario industrial, de alto contraste y adaptada a monitores de terminales operativos.
* **Diseño Grid & Flexbox Avanzado** - Renderizado de la matriz matemática del plano para el correcto ordenamiento secuencial de los bloques en el navegador.

---

## 📁 Estructura del Módulo Unificado

Todos los componentes de este flujo operativo se encuentran centralizados para facilitar su escalabilidad y mantenimiento:

* **`GateControlDashboard.tsx`** - Controlador maestro encargado de la lógica de negocio, validaciones de apilamiento, administración de formularios y la tabla histórica de movimientos recientes.
* **`PatioMap.tsx`** - La rejilla visual interactiva que representa la infraestructura del patio, pasillos de grúas y slots de almacenamiento.
* **`GateControlVoucher.tsx`** - Vista del ticket térmico con sus estilos de impresión configurados en CSS puro.

---

## 📦 Instrucciones de Instalación y Despliegue Operativo

Para la puesta en marcha del sistema en entornos locales o de producción, ejecute secuencialmente los siguientes comandos en la consola de la estación de trabajo:

### 1. Inicialización e instalación de dependencias del proyecto:
```bash
npm install
```

### 2. Ejecutar la aplicación en el entorno de desarrollo local:
```bash
npm run dev
```

### 3. Compilar el proyecto optimizado para producción:
```bash
npm run build
```
