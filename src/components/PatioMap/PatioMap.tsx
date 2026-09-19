import React, { useState, useMemo } from 'react';
import type { RegistroContenedor } from '../../types';
import './PatioMap.css'; 

interface PatioMapProps {
  registros: RegistroContenedor[];
  onSeleccionarContenedor?: (reg: RegistroContenedor) => void;
  onSeleccionarSlotVacio?: (bloque: 'A' | 'B' | 'C' | 'D', bay: number, posicion: number, piso: number, filaFondo: number) => void;
  onSolicitarRetiro?: (contenedorCodigo: string) => void;
  onActualizarRegistros?: (actualizados: RegistroContenedor[]) => void; // Tu versión original
  fondoActivo: number; 
}
export const PatioMap: React.FC<PatioMapProps> = ({ 
  registros, 
  onSeleccionarContenedor, 
  onSeleccionarSlotVacio,
  onSolicitarRetiro,
  onActualizarRegistros, // 🌟 Desestructuramos la prop de actualización central
  fondoActivo 
}) => {
  const bloques: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const bays = Array.from({ length: 10 }, (_, i) => i + 1); 
  
  // Coordenadas internas de cada matriz de Bay
  const posicionesInternas = Array.from({ length: 4 }, (_, i) => i + 1); // Eje Horizontal X (1 a 4)
  const pisosInternos = Array.from({ length: 4 }, (_, i) => 4 - i);     // Eje Vertical Z (4 arriba, 1 abajo)
  
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');

  // Indexación O(1) Pentadimensional Corregida
  const matrizPatio5D = useMemo(() => {
    const mapa: Record<string, RegistroContenedor> = {};
    registros.forEach((r) => {
      if (r.ubicacionMapa && r.estadoFlujo !== 'COMPLETADO') {
        const pos = r.ubicacionMapa.posicion || 1; 
        const fondo = r.ubicacionMapa.filaFondo || 1; 
        const key = `${r.ubicacionMapa.bloque}-${r.ubicacionMapa.bay}-${pos}-${r.ubicacionMapa.piso}-${fondo}`;
        mapa[key] = r;
      }
    });
    return mapa;
  }, [registros]);

  // 🏗️ FUNCIÓN CORREGIDA: Cambia el flujo a 'EN_ESPERA_MAQUINISTA' en lugar de un retiro directo sin asignar
  const handleRetirarClick = () => {
    if (!terminoBusqueda.trim()) {
      alert("Por favor, ingrese el código del contenedor a retirar.");
      return;
    }
    
    const codigoBuscado = terminoBusqueda.toUpperCase().trim();
    
    // Buscamos si existe el contenedor en nuestros registros actuales
    const contenedorExiste = registros.find(r => r.contenedor.toUpperCase() === codigoBuscado);

    if (contenedorExiste) {
      if (onActualizarRegistros) {
        // Encontramos la unidad y mutamos su estado hacia la cola del maquinista
        const registrosModificados = registros.map(r => 
          r.contenedor.toUpperCase() === codigoBuscado 
            ? { ...r, estadoFlujo: 'EN_ESPERA_MAQUINISTA' as any } 
            : r
        );
        onActualizarRegistros(registrosModificados);
        alert(`Orden para el contenedor ${codigoBuscado} enviada con éxito a la terminal de Patio.`);
      } else {
        // Fallback por si acaso se sigue usando el callback antiguo en otras vistas
        onSolicitarRetiro?.(codigoBuscado);
      }
    } else {
      alert(`No se encontró ningún contenedor con el código ${codigoBuscado} en el mapa de patio.`);
    }
  };

  return (
    <div className="patio-map-wrapper">
      
      {/* PANEL SUPERIOR DE CONTROL */}
      <div className="patio-header">
        <div className="header-info">
          <h3>🏢 Panel de Alta Densidad: Matriz Patio Tridimensional (Fondo Activo: {fondoActivo})</h3>
          <p>Arquitectura corporativa de carga. Mostrando submatrices de la capa de profundidad seleccionada.</p>
        </div>

        <div className="patio-action-panel">
          <div className="search-box-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar contenedor..." 
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="patio-search-input"
            />
            {terminoBusqueda && (
              <button className="clear-search-btn" onClick={() => setTerminoBusqueda('')}>×</button>
            )}
          </div>
          
          <button type="button" onClick={handleRetirarClick} className="patio-withdrawal-btn">
            <span className="btn-icon">🏗️</span>
            Asignar Retiro
          </button>
        </div>
      </div>

      {/* VIEWPORT CON MATRIZ INDUSTRIAL DE BAHÍAS */}
      <div className="patio-viewport">
        <div className="patio-scroll-container">
          {bloques.map((bloque, idx) => {
            const esUltimo = idx === bloques.length - 1;
            
            return (
              <React.Fragment key={bloque}>
                
                {/* FILA CONTENEDORA DEL BLOQUE */}
                <div className="patio-block">
                  <div className="block-label-container">
                    <span>{bloque}</span>
                  </div>
                  
                  {/* GRID PRINCIPAL: 10 BAY HORIZONTALES */}
                  <div className="patio-grid-layout">
                    {bays.map((bay) => (
                      <div key={bay} className="patio-bay-column">
                        <span className="bay-title">BAY {bay}</span>
                        
                        {/* SUBMATRIZ BIDIMENSIONAL DE LA BAHÍA */}
                        <div className="bay-matrix-core">
                          {pisosInternos.map((piso) => (
                            <div key={piso} className="matrix-row-floor">
                              {posicionesInternas.map((posicion) => {
                                const tarroActual = matrizPatio5D[`${bloque}-${bay}-${posicion}-${piso}-${fondoActivo}`];
                                
                                const esMatchBusqueda = terminoBusqueda.trim().length > 0 && tarroActual
                                  ? tarroActual.contenedor.toUpperCase().includes(terminoBusqueda.toUpperCase())
                                  : false;

                                return (
                                  <div
                                    key={posicion}
                                    onClick={() => {
                                      if (tarroActual) {
                                        onSeleccionarContenedor?.(tarroActual);
                                        setTerminoBusqueda(tarroActual.contenedor);
                                      } else {
                                        onSeleccionarSlotVacio?.(bloque, bay, posicion, piso, fondoActivo);
                                      }
                                    }}
                                    title={`Bloque ${bloque} | Bay ${bay} | Ranura ${posicion} | Piso ${piso} | Fondo ${fondoActivo}`}
                                    className={`matrix-slot ${
                                      tarroActual 
                                        ? esMatchBusqueda 
                                          ? 'slot-occupied slot-highlighted' 
                                          : 'slot-occupied' 
                                        : 'slot-vacant'
                                    }`}
                                  >
                                    {tarroActual ? (
                                      <span className="container-micro-code">
                                        {tarroActual.contenedor.substring(0, 4).toUpperCase()}
                                      </span>
                                    ) : (
                                      <span className="coordinate-dot">·</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PASILLOS DE MANIOBRAS INTER-BLOQUES */}
                {!esUltimo && (
                  <div className="maneuver-lane">
                    <div className="lane-dash-line" />
                    <div className="lane-text">PASILLO DE TRANSFERENCIA LOGÍSTICA {idx + 1}</div>
                  </div>
                )}

              </React.Fragment>
            );
          })}
        </div>
      </div>

    </div>
  );
};