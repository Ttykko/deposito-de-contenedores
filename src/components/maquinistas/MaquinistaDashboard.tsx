// ==========================================================================
// ARCHIVO: src/components/maquinistas/MaquinistaDashboard.tsx (Clean Architecture)
// ==========================================================================
import React from 'react';
import type { RegistroContenedor } from '../../types';
import './MaquinistaDashboard.css';

interface MaquinistaDashboardProps {
  registros: RegistroContenedor[];
  onConfirmarRetiroFisico: (idContenedor: string) => void;
  maquinistaNombre?: string;
}

export const MaquinistaDashboard: React.FC<MaquinistaDashboardProps> = ({
  registros,
  onConfirmarRetiroFisico,
  maquinistaNombre = "ROBLERO"
}) => {
  
// ==========================================================================
// 🚜 FILTROS DE TRABAJO DIARIO EN src/components/maquinistas/MaquinistaDashboard.tsx
// ==========================================================================

  // 1. FILTRO DE MANIOBRAS EN COLA ACTIVAS (Ingresos y Retiros esperando movimiento físico)
  const tareasPendientes = registros.filter(r => 
    r.estadoFlujo === 'EN_ESPERA_MAQUINISTA' || r.estadoFlujo === 'EN_ESPERA_GATE'
  );
  
  // 2. LOG DE RENDIMIENTO: Muestra de forma acumulativa lo procesado por esta grúa en su turno
  // Retiene las unidades en tránsito (POR_VALIDAR_GATE), las guardadas (EN_PATIO) y las despachadas (COMPLETADO)
  const tareasEnValidacion = registros.filter(r => 
    r.estadoFlujo === 'POR_VALIDAR_GATE' || 
    r.estadoFlujo === 'EN_PATIO' || 
    r.estadoFlujo === 'COMPLETADO'
  );

// Tomamos la primera tarea de la cola combinada como la de atención prioritaria
const tareaActual = tareasPendientes[0];

// Evaluamos dinámicamente si la instrucción actual es un ingreso de camión o un despacho de patio
const esIngreso = tareaActual && tareaActual.estadoFlujo === 'EN_ESPERA_GATE';

  return (
    <div className="maquinista-screen">
      
      <header className="maquinista-header">
        <div className="maquinista-title">
          <span>🚜</span> TERMINAL MÓVIL DE PATIO
        </div>
        <div className="status-bar">
          🟢 EN LÍNEA • {maquinistaNombre.toUpperCase()}
        </div>
      </header>

      <div className="grid-maquinista">
        
        {/* COLUMNA IZQUIERDA: ÁREA DE TRABAJO PRINCIPAL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {tareaActual ? (
            <div className={`tarea-activa-card ${esIngreso ? 'estado-ingreso' : 'estado-retiro'}`}>
              <span className={`instruccion-label ${esIngreso ? 'ingreso' : 'retiro'}`}>
                {esIngreso ? '📥 MAQUINISTA INGRESA ESTO' : '📤 LA LABOR ES DESPACHAR'}
              </span>
              
              <div className="contenedor-gigante">
                {tareaActual.contenedor}
              </div>

              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                UBICACIÓN EN MATRIZ DE PATIO (BLOQUE / BAY / PILE)
              </div>
              
              <div className={`ubicacion-badge-gigante ${esIngreso ? 'ingreso' : 'retiro'}`}>
                {tareaActual.ubicacionTexto}
              </div>

              <div style={{ textAlign: 'left', backgroundColor: '#020617', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', border: '1px solid #1e293b' }}>
                <p style={{ margin: '0 0 6px 0' }}><strong>Tipo / Medida:</strong> {tareaActual.tipo} — {tareaActual.estadoCarga}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Camión Logístico:</strong> {tareaActual.transportista} (<span style={{ color: '#eab308', fontWeight: 'bold' }}>{tareaActual.patente}</span>)</p>
                <p style={{ margin: '0' }}><strong>Conductor:</strong> {tareaActual.conductor}</p>
                
                {/* Desglose de maniobras complementarias */}
                <div className="panel-maniobras-autorizadas">
                  <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: '#3b82f6' }}>Maniobras Requeridas:</strong>
                  <ul className="lista-maniobras">
                    {tareaActual.desconsolidado > 0 && <li>🚜 Grúa Horquilla (Desconsolidación)</li>}
                    {tareaActual.consolidado > 0 && <li>🏗️ Reach Stacker (Mov. Estructural)</li>}
                    {tareaActual.rampaManejo > 0 && <li>🚛 Maniobra sobre Rampla</li>}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                className="btn-maquinista-accion"
                style={{
                  backgroundColor: esIngreso ? '#2563eb' : '#eab308',
                  color: esIngreso ? '#fff' : '#000'
                }}
                onClick={() => {
                  onConfirmarRetiroFisico(tareaActual.id);
                  if (esIngreso) {
                    alert(`¡Confirmado! El contenedor ${tareaActual.contenedor} fue posicionado físicamente en el patio.`);
                  } else {
                    alert(`¡Confirmado! El contenedor ${tareaActual.contenedor} fue cargado al camión.`);
                  }
                }}
              >
                {esIngreso ? '✅ CONFIRMAR INGRESO (APILADO)' : '🚜 OK - RETIRO CONFIRMADO (YA EN GRÚA)'}
              </button>
            </div>
          ) : (
            <div className="panel-tareas" style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed #334155' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>☕</span>
              <h2 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Sin órdenes pendientes</h2>
              <p style={{ color: '#475569', margin: 0, fontSize: '14px' }}>
                Gate Control no ha enviado nuevas instrucciones de movimiento aún. Manténgase a la escucha.
              </p>
            </div>
          )}

          {/* COLA DE TRABAJOS SECUENCIALES */}
          <div className="panel-tareas">
            <h3>📋 Próximas Maniobras en Secuencia ({tareasPendientes.length > 0 ? tareasPendientes.length - 1 : 0})</h3>
            <div className="lista-tareas-cola">
              {tareasPendientes.length <= 1 ? (
                <span style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic' }}>No hay más tareas programadas en la secuencia...</span>
              ) : (
                tareasPendientes.slice(1).map((t) => {
                  const itemEsIngreso = t.estadoFlujo === 'EN_ESPERA_GATE';
                  return (
                    <div key={t.id} className="item-tarea-cola" style={{ borderLeft: `4px solid ${itemEsIngreso ? '#2563eb' : '#fbbf24'}` }}>
                      <div>
                        <strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>{t.contenedor}</strong>
                        <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Ubicación: {t.ubicacionTexto}</span>
                      </div>
                      <span className="estado-badge pendiente">
                        {itemEsIngreso ? 'INGRESO' : 'RETIRO'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE LABORES COMPLETADAS (LOG DIARIO) */}
        <div className="panel-tareas">
          <h3>📡 Enviados a Garita (Historial de Labores)</h3>
          <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 15px 0' }}>
            Contenedores procesados por tu grúa que están en camino al portal de control o esperando validación comercial definitiva en Garita.
          </p>
          
          <div className="lista-tareas-cola">
            {tareasEnValidacion.length === 0 ? (
              <span style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic' }}>Ningún movimiento timbrado en este bloque de turno...</span>
            ) : (
              tareasEnValidacion.map(t => (
                <div key={t.id} className="item-tarea-cola status-ok">
                  <div>
                    <strong style={{ fontFamily: 'monospace', fontSize: '14px', color: '#4ade80' }}>{t.contenedor}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#a7f3d0' }}>Patente: {t.patente}</span>
                    <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>{t.ubicacionTexto}</span>
                  </div>
                  <span className="estado-badge ok-green">
                    OK PATIO
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
