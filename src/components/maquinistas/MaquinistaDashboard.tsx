import React from 'react';
import type { RegistroContenedor } from '../../types';
import './MaquinistaDashboard.css';

interface MaquinistaDashboardProps {
  registros: RegistroContenedor[];
  // Callback para cambiar el estado a 'POR_VALIDAR_GATE'
  onConfirmarRetiroFisico: (idContenedor: string) => void;
  maquinistaNombre?: string;
}

export const MaquinistaDashboard: React.FC<MaquinistaDashboardProps> = ({
  registros,
  onConfirmarRetiroFisico,
  maquinistaNombre = "OPERADOR GRÚA 01"
}) => {
  
  // 1. Filtramos tareas asignadas al patio esperando acción física (Insensible a mayúsculas/minúsculas)
 const tareasPendientes = registros.filter(r => 
  r.estadoFlujo === 'EN_ESPERA_MAQUINISTA'
);
  
  // 2. Filtramos las ya movidas esperando confirmación del digitador en la Garita
  const tareasEnValidacion = registros.filter(r => 
  r.estadoFlujo === 'POR_VALIDAR_GATE'
);

  // Tomamos el primer contenedor en la cola de tareas pendientes como el prioritario
  const tareaActual = tareasPendientes[0];

  return (
    <div className="maquinista-screen">
      
      {/* CABECERA DE LA TERMINAL DE PATIO */}
      <header className="maquinista-header">
        <div className="maquinista-title">
          <span>🚜</span> TERMINAL MÓVIL DE PATIO
        </div>
        <div className="status-bar">
          🟢 EN LÍNEA • {maquinistaNombre}
        </div>
      </header>

      <div className="grid-maquinista">
        
        {/* COLUMNA IZQUIERDA: ÁREA DE TRABAJO PRINCIPAL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {tareaActual ? (
            <div className="tarea-activa-card">
              <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🚨 INSTRUCCIÓN DE RETIRO ASIGNADA POR RADIO DIGITAL
              </span>
              
              <div className="contenedor-gigante">
                {tareaActual.contenedor}
              </div>

              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                UBICACIÓN EN MATRIZ DE PATIO (BLOQUE / BAY / PILE)
              </div>
              <div className="ubicacion-badge-gigante">
                {tareaActual.ubicacionTexto}
              </div>

              <div style={{ textAlign: 'left', backgroundColor: '#020617', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', border: '1px solid #1e293b' }}>
                <p style={{ margin: '0 0 6px 0' }}><strong>Tipo:</strong> {tareaActual.tipo} — {tareaActual.estadoCarga}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Camión Destino:</strong> {tareaActual.transportista} (<span style={{ color: '#eab308' }}>{tareaActual.patente}</span>)</p>
                <p style={{ margin: '0' }}><strong>Conductor:</strong> {tareaActual.conductor}</p>
              </div>

              <button
                type="button"
                className="btn-maquinista-accion"
                onClick={() => {
                  onConfirmarRetiroFisico(tareaActual.id);
                  alert(`¡Confirmado! El contenedor ${tareaActual.contenedor} fue retirado de la pila y cargado al camión. Esperando validación final en Gate Control.`);
                }}
              >
                🛠️ CONFIRMAR RETIRO (YA EN GRÚA)
              </button>
            </div>
          ) : (
            <div className="panel-tareas" style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed #334155' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>☕</span>
              <h2 style={{ margin: '0 0 10px 0', color: '#64748b' }}>Sin órdenes pendientes</h2>
              <p style={{ color: '#475569', margin: 0, fontSize: '14px' }}>
                Gate Control no ha enviado nuevas instrucciones de retiro aún. Manténgase a la escucha.
              </p>
            </div>
          )}

          {/* COLA DE SIGUIENTES TRABAJOS */}
          <div className="panel-tareas">
            <h3>📥 Próximos retiros en cola ({tareasPendientes.length > 0 ? tareasPendientes.length - 1 : 0})</h3>
            <div className="lista-tareas-cola">
              {tareasPendientes.length <= 1 ? (
                <span style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic' }}>No hay más tareas programadas en secuencia...</span>
              ) : (
                tareasPendientes.slice(1).map((t, index) => (
                  <div key={t.id} className="item-tarea-cola">
                    <div>
                      <strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>{t.contenedor}</strong>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Posición: {t.ubicacionTexto}</span>
                    </div>
                    <span className="estado-badge pendiente">PROX {index + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: MONITOREO DE ALERTAS EN CAMINO A PORTAL */}
        <div className="panel-tareas">
          <h3>📡 Enviados a Garita (Esperando Validación de Salida)</h3>
          <p style={{ color: '#64748b', fontSize: '11px', margin: '0 0 15px 0' }}>
            Contenedores que ya sacaste de la pila física y están en camino a la báscula/puerta de control.
          </p>
          
          <div className="lista-tareas-cola">
            {tareasEnValidacion.length === 0 ? (
              <span style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic' }}>Ningún contenedor en tránsito al portal...</span>
            ) : (
              tareasEnValidacion.map(t => (
                <div key={t.id} className="item-tarea-cola" style={{ borderColor: '#16a34a', backgroundColor: '#022c22' }}>
                  <div>
                    <strong style={{ fontFamily: 'monospace', fontSize: '14px', color: '#4ade80' }}>{t.contenedor}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#a7f3d0' }}>Patente: {t.patente}</span>
                  </div>
                  <span className="estado-badge espera" style={{ backgroundColor: '#15803d', color: '#fff' }}>
                    EN GARITA
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