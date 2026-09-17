// src/types/index.ts

export type TipoContenedor = 'DRY 20' | 'DRY 40' | 'REEFER 20' | 'REEFER 40' | 'OPEN TOP';
export type EstadoCarga = 'FULL' | 'VACIO' | 'EMPTY';
export type TipoMovimiento = 'INGRESO' | 'RETIRO';
export type RolUsuario = 'GATE_CONTROL' | 'MAQUINISTA';

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
  area?: string;
}

export interface UbicacionPatio {
  bloque: 'A' | 'B' | 'C' | 'D';
  bay: number;
  posicion: number;   
  piso: number;
  filaFondo: number;  // ← 🌟 NUEVA DIMENSIÓN DE PROFUNDIDAD (1-4) PARA 64 CONTENEDORES POR BAY
}

export interface RegistroContenedor {
  id: string; 
  contenedor: string;
  tipo: string; 
  estadoCarga: string; 
  cliente: string;
  rutCliente: string;
  
  // Ubicación estructurada para el mapa interactivo de 5D
  ubicacionMapa: UbicacionPatio;
  ubicacionTexto: string; // Ej: "B-A | BAY-3 | POS-2 | PISO-1 | FONDO-1"
  
  sello: string;
  rutConductor: string;
  conductor: string;
  patente: string;
  guia: string;
  transportista: string;
  fechaIngreso: string;
  fechaSalida?: string;
  servicioDesc: string; 
  valorAlmacenaje: number;
  sobreEstadia: number;
  desconsolidado: number; 
  consolidado: number;   
  rampaManejo: number;   
  iva: number;
  total: number;
  estadoPago: string; 
  digitador: string; 
  operadorPatio?: string; 
  estadoFlujo: 'EN_ESPERA_GATE' | 'APROBADO_PATIO' | 'COMPLETADO' | string; // Permitimos strings adicionales por seguridad del compilador
}