// ==========================================================================
// ARCHIVO: server/index.js (Backend Node + Express + Socket.io Premium)
// ==========================================================================
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const http = require('http'); // Necesario para envolver Express con WebSockets
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

// Creamos el servidor HTTP nativo
const server = http.createServer(app);

// Inicializamos el servidor de Sockets de alta velocidad
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL de tu React con Vite
    methods: ["GET", "POST", "PUT"]
  }
});

// CONFIGURACIÓN DE CONEXIÓN A TU BASE DE DATOS MYSQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root123', 
  database: 'deposito_contenedores',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Escucha activa de terminales portuarias conectadas
io.on('connection', (socket) => {
  console.log(`🔌 Dispositivo logístico en línea conectado: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log('❌ Dispositivo fuera de frecuencia radio');
  });
});

// Middleware para inyectar los WebSockets en tus llamadas HTTP normales
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 🏢 ENDPOINT GET: LEER TODO EL PATIO ACTUALIZADO
app.get('/api/contenedores', async (req, res) => {
  try {
    const query = `
      SELECT c.*, p.bloque, p.bay, p.posicion, p.piso, p.fila_fondo
      FROM contenedores c
      LEFT JOIN patio_mapa p ON c.id = p.contenedor_id
      ORDER BY c.id DESC
    `;
    const [rows] = await pool.query(query);
    
    if (!rows || rows.length === 0) return res.json([]);
    
    const m = rows.map(row => ({
      id: String(row.id),
      contenedor: row.sigla || "", 
      tipo: row.tipo || "DRY 40",
      estadoCarga: row.estado_carga || "FULL",
      cliente: row.cliente || "",
      rutCliente: row.rut_cliente || "",
      sello: row.sello || "",
      rutConductor: row.rut_conductor || "",
      conductor: row.nombre_conductor || "",
      patente: row.patente_camion || "",
      guia: row.guia_referencia || "",
      transportista: row.transportista || "",
      servicioDesc: row.servicio_desc || "",
      valorAlmacenaje: Number(row.valor_almacenaje || 0),
      sobreEstadia: Number(row.sobre_estadia || 0),
      desconsolidado: Number(row.desconsolidado || 0),
      consolidado: Number(row.consolidado || 0),
      rampaManejo: Number(row.rampa_manejo || 0),
      iva: Number(row.iva || 0),
      total: Number(row.total || 0),
      estadoPago: row.estado_pago || "PAGADO",
      digitador: row.digitador || "",
      estadoFlujo: row.estado_operativo || "EN_ESPERA_GATE",
      ubicacionMapa: row.bloque ? {
        bloque: row.bloque,
        bay: Number(row.bay),
        posicion: Number(row.posicion),
        piso: Number(row.piso),
        filaFondo: Number(row.fila_fondo)
      } : null,
      ubicacionTexto: row.bloque ? `B-${row.bloque} | BAY-${row.bay} | POS-${row.posicion} | PISO-${row.piso} | FONDO-${row.fila_fondo}` : "",
      fechaIngreso: row.fecha_ingreso || new Date().toLocaleString('es-CL'),
      fechaSalida: row.fecha_salida || undefined
    }));
    
    res.json(m);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================================================
// 📥 ENDPOINT POST: REGISTRAR UN CONTENEDOR NUEVO (SINCRONIZACIÓN ATÓMICA)
// ==========================================================================
app.post('/api/contenedores', async (req, res) => {
  const n = req.body;
  const { ubicacionMapa } = n;
  if (!ubicacionMapa) return res.status(400).json({ message: "Ubicación requerida." });
  
  let { bloque, bay, posicion, piso, filaFondo } = ubicacionMapa;
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();

    // 1. CONTROL DE ANTICOLISIÓN: Validamos si la celda 5D ya está ocupada
    const [slots] = await conn.query(
      'SELECT id FROM patio_mapa WHERE bloque=? AND bay=? AND posicion=? AND piso=? AND fila_fondo=?', 
      [bloque, bay, posicion, piso, filaFondo]
    );
    if (slots.length > 0) {
      conn.release();
      return res.status(409).json({ message: "¡Conflicto! El slot seleccionado ya está ocupado físicamente." });
    }

    // 2. LEY DE GRAVEDAD LOGÍSTICA
    if (piso > 1) {
      const [soporte] = await conn.query(
        'SELECT id FROM patio_mapa WHERE bloque=? AND bay=? AND posicion=? AND piso=? AND fila_fondo=?', 
        [bloque, bay, posicion, piso - 1, filaFondo]
      );
      if (soporte.length === 0) {
        piso = 1; 
        n.ubicacionMapa.piso = 1;
        n.ubicacionTexto = `B-${bloque} | BAY-${bay} | POS-${posicion} | PISO-1 | FONDO-${filaFondo}`;
      }
    }

    // 3. INSERCIÓN TOTALMENTE ALINEADA (23 Columnas = 23 Parámetros exactos)
    const q = `
      INSERT INTO contenedores (
        sigla, tipo, estado_carga, cliente, rut_cliente, 
        sello, rut_conductor, nombre_conductor, patente_camion, guia_referencia, 
        transportista, servicio_desc, valor_almacenaje, sobre_estadia, desconsolidado, 
        consolidado, rampa_manejo, iva, total, estado_pago, 
        digitador, estado_operativo, fecha_ingreso
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EN_ESPERA_GATE', ?)
    `;
    
    const [resC] = await conn.query(q, [
      n.contenedor,
      n.tipo,
      n.estadoCarga,
      n.cliente,
      n.rutCliente,
      n.sello,
      n.rutConductor,
      n.conductor,
      n.patente,
      n.guia,
      n.transportista,
      n.servicioDesc,
      Number(n.valorAlmacenaje || 0),
      Number(n.sobreEstadia || 0),
      Number(n.desconsolidado || 0),
      Number(n.consolidado || 0),
      Number(n.rampaManejo || 0),
      Number(n.iva || 0),
      Number(n.total || 0),
      n.estadoPago || 'PAGADO',
      n.digitador,
      n.fechaIngreso
    ]);

    // 4. PERSISTENCIA RELACIONAL EN EL MAPA INTERACTIVO
    await conn.query(
      'INSERT INTO patio_mapa (contenedor_id, bloque, bay, posicion, piso, fila_fondo) VALUES (?, ?, ?, ?, ?, ?)', 
      [resC.insertId, bloque, bay, posicion, piso, filaFondo]
    );

    await conn.commit();
    conn.release();
    
    // Transmisión inmediata de eventos por Sockets
    req.io.emit('patio_actualizado');
    
    res.status(201).json({ ...n, id: String(resC.insertId), estadoFlujo: 'EN_ESPERA_GATE' });
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("❌ ERROR CRÍTICO EN POST CONTENEDORES:", error.message);
    res.status(500).json({ message: error.message });
  }
});


// ==========================================================================
// 🔄 ENDPOINT PUT: FLUJO DE ÓRDENES Y AUDITORÍA DE PATIO (Sincronización instantánea)
// ==========================================================================
app.put('/api/contenedores/:id/cambiar-estado', async (req, res) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;
  try {
    // Sincroniza de forma estricta los flujos para que el maquinista siempre lea las órdenes activas
    await pool.query('UPDATE contenedores SET estado_operativo = ? WHERE id = ?', [nuevoEstado, id]);
    
    // 📢 Transmisión inmediata por WebSockets a todo el terminal
    req.io.emit('patio_actualizado');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================================================
// 📥 ENDPOINT POST: REGISTRAR UN CONTENEDOR NUEVO (Sincronizado)
// ==========================================================================
app.post('/api/contenedores', async (req, res) => {
  const n = req.body;
  const { ubicacionMapa } = n;
  if (!ubicacionMapa) return res.status(400).json({ message: "Ubicación requerida." });
  
  let { bloque, bay, posicion, piso, filaFondo } = ubicacionMapa;
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();

    // 1. ANTICOLISIÓN: Validamos si el slot exacto ya está ocupado físicamente
    const [slots] = await conn.query(
      'SELECT id FROM patio_mapa WHERE bloque=? AND bay=? AND posicion=? AND piso=? AND fila_fondo=?', 
      [bloque, bay, posicion, piso, filaFondo]
    );
    if (slots.length > 0) {
      conn.release();
      return res.status(409).json({ message: "¡Conflicto de patio! El slot seleccionado ya está ocupado." });
    }

    // 2. LEY DE GRAVEDAD INTELIGNETE
    if (piso > 1) {
      const [soporte] = await conn.query(
        'SELECT id FROM patio_mapa WHERE bloque=? AND bay=? AND posicion=? AND piso=? AND fila_fondo=?', 
        [bloque, bay, posicion, piso - 1, filaFondo]
      );
      if (soporte.length === 0) {
        piso = 1; 
        n.ubicacionMapa.piso = 1;
        n.ubicacionTexto = `B-${bloque} | BAY-${bay} | POS-${posicion} | PISO-1 | FONDO-${filaFondo}`;
      }
    }

    // 3. INSERCIÓN ATÓMICA CON PARÁMETROS ORDENADOS SEGÚN TU TABLA MYSQL
    const q = `
      INSERT INTO contenedores (
        sigla, tipo, estado_carga, cliente, rut_cliente, 
        sello, rut_conductor, nombre_conductor, patente_camion, guia_referencia, 
        transportista, servicio_desc, valor_almacenaje, sobre_estadia, desconsolidado, 
        consolidado, rampa_manejo, iva, total, estado_pago, 
        digitador, estado_operativo, fecha_ingreso
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'EN_ESPERA_GATE', ?)
    `;
    
    const [resC] = await conn.query(q, [
      n.contenedor,             // sigla (Ej: MSKU1234567)
      n.tipo,                   // tipo
      n.estadoCarga,            // estado_carga
      n.cliente,                // cliente
      n.rutCliente,             // rut_cliente
      n.sello,                  // sello
      n.rutConductor,           // rut_conductor
      n.conductor,              // nombre_conductor
      n.patente,                // patente_camion
      n.guia,                   // guia_referencia
      n.transportista,          // transportista
      n.servicioDesc,           // servicio_desc
      Number(n.valorAlmacenaje || 0),
      Number(n.sobreEstadia || 0),
      Number(n.desconsolidado || 0),
      Number(n.consolidado || 0),
      Number(n.rampaManejo || 0),
      Number(n.iva || 0),
      Number(n.total || 0),
      n.estadoPago || 'PAGADO',
      n.digitador,
      n.fechaIngreso            // fecha_ingreso
    ]);

    // 4. PERSISTENCIA EN EL MAPA INTERACTIVO TRIDIMENSIONAL
    await conn.query(
      'INSERT INTO patio_mapa (contenedor_id, bloque, bay, posicion, piso, fila_fondo) VALUES (?,?,?,?,?,?)', 
      [resC.insertId, bloque, bay, posicion, piso, filaFondo]
    );

    await conn.commit();
    conn.release();

    // 📢 TRANSMISIÓN BROADCAST AL INSTANTE POR WEBSOCKETS
    req.io.emit('patio_actualizado');

    res.status(201).json({ ...n, id: String(resC.insertId), estadoFlujo: 'EN_ESPERA_GATE' });

  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("❌ ERROR INTERNO EN POST CONTENEDORES:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================================================
// 🖨️ ENDPOINT PUT MASTER ALIAS: RECEPTOR DE ENTRADAS Y SALIDAS (BLINDADO SERRACOR)
// ==========================================================================
app.put(['/api/contenedores/:id/finalizar-salida', '/api/contenedor/:id/finalizar-salida'], async (req, res) => {
  const { id } = req.params;
  const r = req.body;
  
  try {
    // Sanitización y casteo forzado de tipos numéricos DECIMAL para MySQL 9
    const idSeguro = Number(id);
    const ivaSeguro = Number(r.iva || 0);
    const totalSeguro = Number(r.total || 0);
    const sobreEstadiaSegura = Number(r.sobreEstadia || 0);
    const fechaSalidaSegura = r.fechaSalida || new Date().toLocaleString('es-CL');

    if (r.esDespacho) {
      // 📤 CASO DESPACHO / RETIRO: El contenedor se va en el camión
      const queryRetiro = `
        UPDATE contenedores 
        SET estado_operativo = 'COMPLETADO', 
            fecha_salida = ?, 
            sobre_estadia = ?, 
            iva = ?, 
            total = ? 
        WHERE id = ?
      `;
      await pool.query(queryRetiro, [fechaSalidaSegura, sobreEstadiaSegura, ivaSeguro, totalSeguro, idSeguro]);
      await pool.query('DELETE FROM patio_mapa WHERE contenedor_id = ?', [idSeguro]);
         } else {
      // 📥 CASO INGRESO / ALTA EN PATIO DEFINITIVA
      const queryIngreso = `
        UPDATE contenedores 
        SET estado_operativo = ?, 
            iva = ?, 
            total = ? 
        WHERE id = ?
      `;
      // Cambiamos a 'COMPLETADO' para que el contenedor desaparezca de la lista de alertas
      // y la grúa del maquinista registre la labor como finalizada en su turno.
      await pool.query(queryIngreso, ['COMPLETADO', ivaSeguro, totalSeguro, idSeguro]);
    }



    
    // Transmisión inmediata por WebSockets para redibujar el plano en las grúas
    if (req.io) {
      req.io.emit('patio_actualizado');
    } else if (io) {
      io.emit('patio_actualizado');
    }
    
    return res.json({ success: true, message: "INGRESO_ALMACENADO_BD" });
  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN FINALIZE RELACIONAL:", error.message);
    res.status(500).json({ message: error.message });
  }
});








const PUERTO = 5000;
// IMPORTANTE: server.listen para activar Socket.io en conjunto con las rutas HTTP
server.listen(PUERTO, () => console.log(`🚀 Servidor de Serracor System con WebSockets corriendo en puerto ${PUERTO}`));
