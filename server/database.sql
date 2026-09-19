CREATE DATABASE IF NOT EXISTS deposito_contenedores;
USE deposito_contenedores;

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut_cliente VARCHAR(12) NOT NULL UNIQUE,
    nombre_empresa VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contenedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sigla VARCHAR(11) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL,
    estado_carga VARCHAR(10) NOT NULL,
    cliente VARCHAR(150) NOT NULL,
    rut_cliente VARCHAR(12) NOT NULL,
    sello VARCHAR(50) NULL,
    rut_conductor VARCHAR(12) NOT NULL,
    nombre_conductor VARCHAR(100) NOT NULL,
    patente_camion VARCHAR(8) NOT NULL,
    guia_referencia VARCHAR(50) NOT NULL,
    transportista VARCHAR(100) NOT NULL,
    servicio_desc VARCHAR(255) NULL,
    valor_almacenaje DECIMAL(12,2) DEFAULT 0.00,
    sobre_estadia DECIMAL(12,2) DEFAULT 0.00,
    desconsolidado DECIMAL(12,2) DEFAULT 0.00,
    consolidado DECIMAL(12,2) DEFAULT 0.00,
    rampa_manejo DECIMAL(12,2) DEFAULT 0.00,
    iva DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) DEFAULT 0.00,
    estado_pago VARCHAR(30) DEFAULT 'PAGADO',
    digitador VARCHAR(100) NOT NULL,
    estado_operativo ENUM('EN_ESPERA_GATE', 'EN_ESPERA_MAQUINISTA', 'POR_VALIDAR_GATE', 'COMPLETADO') DEFAULT 'EN_ESPERA_GATE',
    fecha_ingreso VARCHAR(50) NOT NULL,
    fecha_salida VARCHAR(50) NULL
);

CREATE TABLE IF NOT EXISTS patio_mapa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contenedor_id INT NOT NULL,
    bloque CHAR(1) NOT NULL,
    bay INT NOT NULL,
    posicion INT NOT NULL,
    piso INT NOT NULL,
    fila_fondo INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contenedor_id) REFERENCES contenedores(id) ON DELETE CASCADE,
    UNIQUE KEY posicion_unica_patio (bloque, bay, posicion, piso, fila_fondo)
);

-- Para verificar que se crearon con éxito, ejecuta:
SHOW TABLES;
