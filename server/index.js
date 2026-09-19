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
// 📥 ENDPOINT POST: REGISTRAR UN CONTENEDOR NUEVO (Ley de Gravedad Inteligente)
// ==========================================================================
app.post('/api/contenedores', async (req, res) => {
  const n = req.body;
  const { ubicacionMapa } = n;
  if (!ubicacionMapa) return res.status(400).json({ message: "Ubicación requerida." });
  
  // Extraemos las coordenadas de la matriz 5D enviadas por el plano
  let { bloque, bay, posicion, piso, filaFondo } = ubicacionMapa;
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();

    // 1. CONTROL DE ANTICOLISIÓN: Validamos si el slot exacto ya está ocupado físicamente
    const [slots] = await conn.query(
      'SELECT id FROM patio_mapa WHERE bloque=? AND bay=? AND posicion=? AND piso=? AND fila_fondo=?', 
      [bloque, bay, posicion, piso, filaFondo]
    );
    if (slots.length > 0) {
      conn.release();
      return res.status(409).json({ message: "¡Conflicto de patio! El slot seleccionado ya está ocupado." });
    }

    // 2. LEY DE GRAVEDAD INTELIGENTE (Auto-ajustable ante despachos previos)
    if (piso > 1) {
      const [soporte] = await conn.query(
        'SELECT id FROM patio_mapa WHERE bloque=? AND bay=? AND posicion=? AND piso=? AND fila_fondo=?', 
        [bloque, bay, posicion, piso - 1, filaFondo]
      );
      
      // REGLA DE NEGOCIO PREMIUM: Si el piso inferior está vacío porque la columna fue despachada,
      // el sistema reajusta dinámicamente la coordenada al Piso 1 para asentar la base en el suelo.
      if (soporte.length === 0) {
        piso = 1; 
        n.ubicacionMapa.piso = 1;
        n.ubicacionTexto = `B-${bloque} | BAY-${bay} | POS-${posicion} | PISO-1 | FONDO-${filaFondo}`;
      }
    }

    // 3. INSERCIÓN DE LA UNIDAD LOGÍSTICA EN MYSQL
       // Fragmento corregido dentro del app.post en server/index.js:
    const q = `INSERT INTO contenedores (sigla, tipo, estado_carga, cliente, rut_cliente, sello, rut_conductor, nombre_conductor, patente_camion, guia_referencia, transportista, servicio_desc, valor_almacenaje, sobre_estadia, desconsolidado, consolidado, rampa_manejo, iva, total, estado_pago, digitador, estado_operativo, fecha_ingreso) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'EN_ESPERA_GATE', ?)`;
    
    const [resC] = await conn.query(q, [
      n.contenedor, n.tipo, n.estadoCarga, n.cliente, n.rutCliente, n.sello, 
      n.rutConductor, n.conductor, n.patente, n.guia, n.transportista, 
      n.servicioDesc, n.valorAlmacenaje, n.sobreEstadia, n.desconsolidado, n.consolidado, 
      n.rampaManejo, n.iva, n.total, n.estadoPago, n.digitador, n.fechaIngreso
    ]);

    // 4. PERSISTENCIA EN EL MAPA INTERACTIVO TRIDIMENSIONAL
    await conn.query(
      'INSERT INTO patio_mapa (contenedor_id, bloque, bay, posicion, piso, fila_fondo) VALUES (?,?,?,?,?,?)', 
      [resC.insertId, bloque, bay, posicion, piso, filaFondo]
    );

    await conn.commit();
    conn.release();

    // 📢 TRANSMISIÓN BROADCAST AL INSTANTE PARA SINCRO EN TIEMPO REAL
    req.io.emit('patio_actualizado');

    // Retornamos el objeto exacto adaptado al filtro del frontend
    res.status(201).json({ ...n, id: String(resC.insertId), estadoFlujo: 'EN_ESPERA_GATE' });

  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error("❌ Error interno en registro de patio:", error.message);
    res.status(500).json({ message: error.message });
  }
});


// ==========================================================================
// 🔄 ENDPOINT PUT: FLUJO DE ÓRDENES Y AUDITORÍA DE PATIO (Sincronización instantánea)
// ==========================================================================
// 🔄 ENDPOINT PUT: CAMBIAR ESTADO DE LA ORDEN (Ingresos y Despachos en Patio)
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
// 🖨️ ENDPOINT PUT: VISACIÓN FINAL DE INGRESOS Y RETIROS DESDE GARITA (FIJADO)
// ==========================================================================
app.put('/api/contenedores/:id/finalizar-salida', async (req, res) => {
  const { id } = req.params;
  const r = req.body; 
  
  try {
    // Forzamos numéricos puros para el motor relacional de MySQL
    const ivaSeguro = Number(r.iva || 0);
    const totalSeguro = Number(r.total || 0);
    const sobreEstadiaSegura = Number(r.sobreEstadia || 0);
    const fechaSalidaSegura = r.fechaSalida || new Date().toLocaleString('es-CL');

    if (r.esDespacho) {
      // 📤 CASO RETIRO: El contenedor se va. Actualiza a COMPLETADO y libera el slot físico.
      const queryRetiro = `
        UPDATE contenedores 
        SET estado_operativo = 'COMPLETADO', 
            fecha_salida = ?, 
            sobre_estadia = ?, 
            iva = ?, 
            total = ? 
        WHERE id = ?
      `;
      await pool.query(queryRetiro, [fechaSalidaSegura, sobreEstadiaSegura, ivaSeguro, totalSeguro, id]);
      await pool.query('DELETE FROM patio_mapa WHERE contenedor_id = ?', [id]);
      
      req.io.emit('patio_actualizado');
      return res.json({ success: true, message: "RETIRO_CONFIRMADO_OK" });
    } else {
      // 📥 CASO INGRESO: El contenedor llegó. Se fija como 'EN_PATIO' (Ya aceptado por el ALTER ENUM)
      const queryIngreso = `
        UPDATE contenedores 
        SET estado_operativo = 'EN_PATIO', 
            iva = ?, 
            total = ? 
        WHERE id = ?
      `;
      await pool.query(queryIngreso, [ivaSeguro, totalSeguro, id]);
      
      req.io.emit('patio_actualizado');
      return res.json({ success: true, message: "INGRESO_ALMACENADO_BD" });
    }
  } catch (error) {
    console.error("❌ ERROR CRÍTICO EN FINALIZE MYSQL:", error.message);
    res.status(500).json({ message: error.message });
  }
});






const PUERTO = 5000;
// IMPORTANTE: server.listen para activar Socket.io en conjunto con las rutas HTTP
server.listen(PUERTO, () => console.log(`🚀 Servidor de Serracor System con WebSockets corriendo en puerto ${PUERTO}`));
