import React, { useState } from 'react';
import type { RegistroContenedor, UbicacionPatio } from '../../../types';
import { GateControlVoucher } from '../GateControlVoucher/GateControlVoucher';
import { PatioMap } from '../../PatioMap/PatioMap';

interface DashboardProps {
  registros: RegistroContenedor[];
  onAgregarRegistro: (nuevo: RegistroContenedor) => void;
  onActualizarRegistros?: (actualizados: RegistroContenedor[]) => void;
  usuarioNombre: string;
}

export const GateControlDashboard: React.FC<DashboardProps> = ({ 
  registros, 
  onAgregarRegistro, 
  onActualizarRegistros, 
  usuarioNombre 
}) => {
  const [contenedor, setContenedor] = useState('');
  const [tipo, setTipo] = useState('DRY 40');
  const [estadoCarga, setEstadoCarga] = useState('FULL');
  const [cliente, setCliente] = useState('');
  const [rutCliente, setRutCliente] = useState('');
  const [patente, setPatente] = useState('');
  const [conductor, setConductor] = useState('');
  const [rutConductor, setRutConductor] = useState('');
  const [guia, setGuia] = useState('');
  const [transportista, setTransportista] = useState('');
  
  // Estados de maquinaria
  const [usarGruaHorquilla, setUsarGruaHorquilla] = useState(false);
  const [usarReachStacker, setUsarReachStacker] = useState(false);
  const [usarRampas, setUsarRampas] = useState(false);
  const [voucherSeleccionado, setVoucherSeleccionado] = useState<RegistroContenedor | null>(null);
  
  // Estado para filtrar la profundidad visible en el plano interactivo
  const [fondoVerMapa, setFondoVerMapa] = useState<number>(1);

  // Estados de posicionamiento en la Matriz de Patio de 5D
  const [bloqueAsignado, setBloqueAsignado] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [bayAsignado, setBayAsignado] = useState<number>(1);
  const [posicionAsignada, setPosicionAsignada] = useState<number>(1);
  const [pisoAsignado, setPisoAsignado] = useState<number>(1);
  const [filaFondoAsignada, setFilaFondoAsignada] = useState<number>(1);

  // Guarda la coordenada de la celda cliqueada para ver toda la pila (todos los fondos)
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{
    bloque: 'A' | 'B' | 'C' | 'D';
    bay: number;
    posicion: number;
    piso: number;
  } | null>(null);

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenedor || !patente || !cliente) {
      alert("Por favor rellene los campos críticos: Contenedor, Patente y Cliente.");
      return;
    }

    // 1. VALIDACIÓN: Evitar colisión en la celda 5D exacta
    const slotOcupado = registros.some(r =>
      r.estadoFlujo !== 'COMPLETADO' &&
      r.ubicacionMapa.bloque === bloqueAsignado &&
      r.ubicacionMapa.bay === bayAsignado &&
      r.ubicacionMapa.posicion === posicionAsignada &&
      r.ubicacionMapa.piso === pisoAsignado &&
      r.ubicacionMapa.filaFondo === filaFondoAsignada
    );

    if (slotOcupado) {
      alert(
        `El Bloque ${bloqueAsignado} - Bay ${bayAsignado} - Posición ${posicionAsignada} - Piso ${pisoAsignado} - Fondo ${filaFondoAsignada} ya está ocupado.`
      );
      return;
    }

    // 2. LEY DE GRAVEDAD: Validar soporte inferior antes de apilar a lo alto
    if (pisoAsignado > 1) {
      const tieneSoporteAbajo = registros.some(r =>
        r.estadoFlujo !== 'COMPLETADO' &&
        r.ubicacionMapa.bloque === bloqueAsignado &&
        r.ubicacionMapa.bay === bayAsignado &&
        r.ubicacionMapa.posicion === posicionAsignada &&
        r.ubicacionMapa.piso === (pisoAsignado - 1) &&
        r.ubicacionMapa.filaFondo === filaFondoAsignada
      );

      if (!tieneSoporteAbajo) {
        alert(
          `🚨 Error de Operación: No se puede asignar el Piso ${pisoAsignado} si el Piso ${pisoAsignado - 1} en la Posición ${posicionAsignada} (Fondo ${filaFondoAsignada}) está vacío.`
        );
        return;
      }
    }

    const valorAlmacenaje = estadoCarga === 'FULL' ? 20000 : 10000;
    const valorGrua = usarGruaHorquilla ? 15000 : 0;
    const valorReachStacker = usarReachStacker ? 25000 : 0;
    const valorRampas = usarRampas ? 12000 : 0;
    
    const subtotalNeto = valorAlmacenaje + valorGrua + valorReachStacker + valorRampas;
    const iva = Math.round(subtotalNeto * 0.19);
    const total = subtotalNeto + iva;
    const ahora = new Date().toLocaleString('es-CL');

    const ubicacionMapa: UbicacionPatio = {
      bloque: bloqueAsignado,
      bay: Number(bayAsignado),
      posicion: Number(posicionAsignada),
      piso: Number(pisoAsignado),
      filaFondo: Number(filaFondoAsignada)
    };

    const nuevoRegistro: RegistroContenedor = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      contenedor: contenedor.toUpperCase().trim(),
      tipo,
      estadoCarga,
      cliente: cliente.toUpperCase().trim(),
      rutCliente: rutCliente.trim(),
      ubicacionMapa,
      ubicacionTexto: `B-${bloqueAsignado} | BAY-${bayAsignado} | POS-${posicionAsignada} | PISO-${pisoAsignado} | FONDO-${filaFondoAsignada}`,
      sello: String(Math.floor(100000 + Math.random() * 900000)),
      rutConductor: rutConductor.trim(),
      conductor: conductor.toUpperCase().trim(),
      patente: patente.toUpperCase().trim(),
      guia: guia.toUpperCase().trim(),
      transportista: transportista.toUpperCase().trim(),
      fechaIngreso: ahora,
      servicioDesc: `ALMACENAJE ${tipo} ${estadoCarga}`,
      valorAlmacenaje,
      sobreEstadia: 2500,
      desconsolidado: valorGrua,
      consolidado: valorReachStacker,
      rampaManejo: valorRampas,
      iva,
      total,
      estadoPago: 'PAGADO',
      digitador: usuarioNombre,
      estadoFlujo: 'EN_ESPERA_GATE'
    };

    onAgregarRegistro(nuevoRegistro);
    setVoucherSeleccionado(nuevoRegistro);

    // Resetear formulario
    setContenedor(''); setCliente(''); setRutCliente(''); setPatente('');
    setConductor(''); setRutConductor(''); setGuia(''); setTransportista('');
    setUsarGruaHorquilla(false); setUsarReachStacker(false); setUsarRampas(false);
  };

  const handleSeleccionarSlotVacio = (
    bloque: 'A' | 'B' | 'C' | 'D', 
    bay: number, 
    posicion: number, 
    piso: number,
    fondo: number
  ) => {
    setBloqueAsignado(bloque);
    setBayAsignado(bay);
    setPosicionAsignada(posicion);
    setPisoAsignado(piso);
    setFilaFondoAsignada(fondo);
  };

  const handleAsignarRetiroAMaquinista = (idContenedor: string) => {
    if (onActualizarRegistros) {
      const mapeoActualizado = registros.map(r => 
        r.id === idContenedor ? { ...r, estadoFlujo: 'EN_ESPERA_MAQUINISTA' as any } : r
      );
      onActualizarRegistros(mapeoActualizado);
    }
  };

  const handleMaquinistaConfirmaMovimiento = (idContenedor: string) => {
    if (onActualizarRegistros) {
      const mapeoActualizado = registros.map(r => 
        r.id === idContenedor ? { ...r, estadoFlujo: 'POR_VALIDAR_GATE' as any } : r
      );
      onActualizarRegistros(mapeoActualizado);
    }
  };

  const handleFinalizarYValidarRetiro = (idContenedor: string): RegistroContenedor | null => {
    let registroModificado: RegistroContenedor | null = null;

    const procesarRetiroItem = (r: RegistroContenedor): RegistroContenedor => {
      const limpiaFecha = r.fechaIngreso.replace(/(\d{2})\/(\d{2})\/(\d{4}).*/, '$3-$2-$1');
      const fechaIng = new Date(limpiaFecha);
      const fechaHoy = new Date();
      
      const diferenciaMs = fechaHoy.getTime() - (isNaN(fechaIng.getTime()) ? fechaHoy.getTime() : fechaIng.getTime());
      const diasTranscurridos = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      
      const diasSobreestadia = diasTranscurridos > 1 ? diasTranscurridos - 1 : 0; 
      const cobroSobreestadiaTotal = diasSobreestadia * (r.sobreEstadia || 2500);
      
      const nuevoSubtotal = r.valorAlmacenaje + r.desconsolidado + r.consolidado + r.rampaManejo + cobroSobreestadiaTotal;
      const nuevoIva = Math.round(nuevoSubtotal * 0.19);
      const nuevoTotal = nuevoSubtotal + nuevoIva;

      registroModificado = { 
        ...r, 
        estadoFlujo: 'COMPLETADO',
        fechaSalida: fechaHoy.toLocaleString('es-CL'),
        sobreEstadia: cobroSobreestadiaTotal, 
        iva: nuevoIva,
        total: nuevoTotal
      };
      
      return registroModificado;
    };

    if (onActualizarRegistros) {
      const mapeoActualizado = registros.map(r => 
        r.id === idContenedor ? procesarRetiroItem(r) : r
      );
      onActualizarRegistros(mapeoActualizado);
    }

    return registroModificado;
  };

  return (
    <div className="layout-contenedor" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
      
      {/* COLUMNA IZQUIERDA: FORMULARIO */}
      <div className="card-industrial">
        <h3 style={{ fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: '0 0 16px 0' }}>
          📝 Registrar Movimiento
        </h3>
        
        <form onSubmit={handleGuardar} className="form-grid-2" style={{ fontSize: '12px' }}>
          <div className="form-group-full">
            <label className="label-professional">CONTENEDOR (SIGLA)</label>
            <input type="text" value={contenedor} onChange={e => setContenedor(e.target.value)} placeholder="Ej: MRKU2342428" className="input-professional" style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">TIPO CONTENEDOR</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="input-professional">
              <option value="DRY 40">40" DRY</option>
              <option value="DRY 20">20" DRY</option>
              <option value="REEFER 40">40" REEFER</option>
              <option value="REEFER 20">20" REEFER</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label-professional">ESTADO CARGA</label>
            <select value={estadoCarga} onChange={e => setEstadoCarga(e.target.value)} className="input-professional" style={{ color: 'var(--accent-yellow)' }}>
              <option value="FULL">FULL ($20.000)</option>
              <option value="VACIO">VACÍO ($10.000)</option>
            </select>
          </div>

          {/* ASIGNACIÓN MATRIZ DE PATIO */}
          <div className="form-group-full" style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '4px' }}>
            <span className="label-professional" style={{ gridColumn: 'span 5', marginBottom: '2px', color: '#3b82f6' }}>🎯 Ubicación (Bloque • Bay • Pos • Piso • Fondo)</span>
            
            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>BLOQUE</label>
              <select value={bloqueAsignado} onChange={e => setBloqueAsignado(e.target.value as any)} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>BAY</label>
              <select value={bayAsignado} onChange={e => setBayAsignado(Number(e.target.value))} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                {Array.from({ length: 10 }, (_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>POS</label>
              <select value={posicionAsignada} onChange={e => setPosicionAsignada(Number(e.target.value))} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                {[1, 2, 3, 4].map(p => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>PISO</label>
              <select value={pisoAsignado} onChange={e => setPisoAsignado(Number(e.target.value))} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                {[1, 2, 3, 4].map(p => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>FONDO</label>
              <select value={filaFondoAsignada} onChange={e => setFilaFondoAsignada(Number(e.target.value))} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%', borderColor: '#d97706' }}>
                {[1, 2, 3, 4].map(f => (<option key={f} value={f}>{f}</option>))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label-professional">PATENTE CAMIÓN</label>
            <input type="text" value={patente} onChange={e => setPatente(e.target.value)} placeholder="KFJC73" className="input-professional" style={{ textAlign: 'center', color: '#eab308', textTransform: 'uppercase', fontWeight: 'bold' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">GUÍA / REFERENCIA</label>
            <input type="text" value={guia} onChange={e => setGuia(e.target.value)} placeholder="MIDEA 107392" className="input-professional" />
          </div>

          <div className="form-group-full">
            <label className="label-professional">CLIENTE / FACTURAR A</label>
            <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="LOMAS LOGISTICA LIMITADA" className="input-professional" style={{ textTransform: 'uppercase' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">RUT CLIENTE</label>
            <input type="text" value={rutCliente} onChange={e => setRutCliente(e.target.value)} placeholder="76.454.768-3" className="input-professional" />
          </div>

          <div className="form-group">
            <label className="label-professional">TRANSPORTISTA</label>
            <input type="text" value={transportista} onChange={e => setTransportista(e.target.value)} placeholder="SERRACOR EIRL" className="input-professional" style={{ textTransform: 'uppercase' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">NOMBRE CONDUCTOR</label>
            <input type="text" value={conductor} onChange={e => setConductor(e.target.value)} placeholder="MARCO ARMIJOS" className="input-professional" style={{ textTransform: 'uppercase' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">RUT CHOFER</label>
            <input type="text" value={rutConductor} onChange={e => setRutConductor(e.target.value)} placeholder="25.931.382-1" className="input-professional" />
          </div>

          <div className="form-group-full" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <span className="label-professional">⚙️ Servicios y Maquinaria Solicitados</span>
            
            <label className="checkbox-card">
              <input type="checkbox" checked={usarGruaHorquilla} onChange={e => setUsarGruaHorquilla(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <div>
                <span style={{ display: 'block', color: '#fff' }}>🏗️ Operación Grúa Horquilla</span>
                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'normal' }}>Consolidado / Desconsolidado de Carga</span>
              </div>
            </label>

            <label className="checkbox-card">
              <input type="checkbox" checked={usarReachStacker} onChange={e => setUsarReachStacker(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <div>
                <span style={{ display: 'block', color: '#fff' }}>🚜 Manejo de Contenedor Completo (Reach Stacker)</span>
                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'normal' }}>Validación de movimiento físico de contenedor</span>
              </div>
            </label>

            <label className="checkbox-card">
              <input type="checkbox" checked={usarRampas} onChange={e => setUsarRampas(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <div>
                <span style={{ display: 'block', color: '#fff' }}>🚛 Maniobra sobre Rampla Directa</span>
                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'normal' }}>Carga o descarga directa de camión</span>
              </div>
            </label>
          </div>

          <button type="submit" className="btn-operativo" style={{ gridColumn: 'span 2', marginTop: '10px', width: '100%' }}>
            💾 Procesar Registro e Imprimir
          </button>
        </form>
      </div>

      {/* COLUMNA DERECHA: SECCIÓN MAQUINISTA INTEGRADA Y PLANO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* TERMINAL MÓVIL DEL MAQUINISTA */}
        <div className="card-industrial" style={{ border: '2px dashed #eab308', backgroundColor: '#090d16' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#eab308', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📟 Terminal Móvil del Maquinista (Pantalla de Patio)
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0 0 12px 0' }}>
            Sustituye la comunicación radial defectuosa. El maquinista ve aquí en tiempo real la orden enviada por Gate Control.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Sub-Panel A: Tareas Asignadas */}
            <div style={{ backgroundColor: '#020617', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>📥 INSTRUCCIÓN DE RETIRO ACTIVA</span>
              {registros.filter(r => r.estadoFlujo === 'EN_ESPERA_MAQUINISTA').length === 0 ? (
                <span style={{ color: '#475569', fontSize: '11px', fontStyle: 'italic' }}>Ninguna instrucción en cola...</span>
              ) : (
                registros.filter(r => r.estadoFlujo === 'EN_ESPERA_MAQUINISTA').map(r => (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#0f172a', padding: '8px', borderRadius: '4px', border: '1px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '14px', fontFamily: 'monospace', color: '#3b82f6' }}>{r.contenedor}</strong>
                      <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>{r.ubicacionTexto}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMaquinistaConfirmaMovimiento(r.id)}
                      style={{ backgroundColor: '#eab308', border: 'none', color: '#000', padding: '5px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🚜 Confirmar Retiro Físico
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Sub-Panel B: Notificaciones enviadas de vuelta a Gate */}
            <div style={{ backgroundColor: '#020617', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>📡 ALERTAS PARA VALIDAR EN GATE CONTROL</span>
              {registros.filter(r => r.estadoFlujo === 'POR_VALIDAR_GATE').length === 0 ? (
                <span style={{ color: '#475569', fontSize: '11px', fontStyle: 'italic' }}>Esperando confirmaciones de patio...</span>
              ) : (
                registros.filter(r => r.estadoFlujo === 'POR_VALIDAR_GATE').map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#14532d', padding: '6px 8px', borderRadius: '4px', border: '1px solid #22c55e', marginBottom: '4px' }}>
                    <div>
                      <strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#fff' }}>{r.contenedor}</strong>
                      <span style={{ display: 'block', fontSize: '9px', color: '#4ade80' }}>Retirado por maquinista</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const finalizado = handleFinalizarYValidarRetiro(r.id);
                        if (finalizado) setVoucherSeleccionado(finalizado);
                      }}
                      style={{ backgroundColor: '#22c55e', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ✅ Validar y Salida
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel de Capas para Conmutar la Profundidad del Patio */}
        <div className="card-industrial" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}>👓 Capa de Profundidad Activa en Mapa:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFondoVerMapa(f)}
                style={{
                  backgroundColor: fondoVerMapa === f ? '#d97706' : '#1e293b',
                  color: '#fff',
                  border: fondoVerMapa === f ? '1px solid #f59e0b' : '1px solid #334155',
                  padding: '4px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: fondoVerMapa === f ? '0 0 10px rgba(217, 119, 6, 0.3)' : 'none'
                }}
              >
                📦 Fondo {f}
              </button>
            ))}
          </div>
        </div>

    {/* MAPA DEL PATIO INTERACTIVO */}
        <PatioMap 
          registros={registros} 
          fondoActivo={fondoVerMapa}
          
          onActualizarRegistros={(actualizados: RegistroContenedor[]) => {
            if (onActualizarRegistros) {
              onActualizarRegistros(actualizados);
            }
          }}

          onSeleccionarContenedor={(reg: RegistroContenedor) => {
            setCeldaSeleccionada({
              bloque: reg.ubicacionMapa.bloque,
              bay: reg.ubicacionMapa.bay,
              posicion: reg.ubicacionMapa.posicion,
              piso: reg.ubicacionMapa.piso
            });
          }} 
          
          onSeleccionarSlotVacio={(bloque, bay, posicion, piso, filaFondo) => 
            handleSeleccionarSlotVacio(bloque, bay, posicion, piso, filaFondo)
          }
          
          onSolicitarRetiro={(codigoContenedor: string) => {
            const objetivo = registros.find(
              r => r.contenedor.toUpperCase() === codigoContenedor.toUpperCase() && r.estadoFlujo !== 'COMPLETADO'
            );
            if (objetivo) {
              handleAsignarRetiroAMaquinista(objetivo.id);
            }
          }}
        />
        
        {/* TABLA DE MONITOREO DE MOVIMIENTOS */}
        <div className="card-industrial">
          <h3 style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', margin: '0 0 12px 0' }}>📋 Registros Recientes</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1e293b', color: '#64748b', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px' }}>Registro</th>
                  <th style={{ padding: '8px' }}>Contenedor</th>
                  <th style={{ padding: '8px' }}>Patente</th>
                  <th style={{ padding: '8px' }}>Ubicación Completa (5D)</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Váucher</th>
                </tr>
              </thead>
              <tbody>
                {registros.filter(r => r.estadoFlujo !== 'COMPLETADO').length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>No hay registros activos en este turno.</td>
                  </tr>
                ) : (
                  registros.filter(r => r.estadoFlujo !== 'COMPLETADO').map((reg) => (
                    <tr key={reg.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>#{reg.id}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', color: '#3b82f6', fontWeight: 'bold' }}>{reg.contenedor}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ backgroundColor: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155', color: '#eab308', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {reg.patente}
                        </span>
                      </td>
                      <td style={{ padding: '8px', fontSize: '10px', fontWeight: 'bold', color: '#cbd5e1' }}>{reg.ubicacionTexto}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>${reg.total.toLocaleString('es-CL')}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => setVoucherSeleccionado(reg)} 
                          style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP VOUCHER INDIVIDUAL */}
      {voucherSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ position: 'relative', background: 'transparent' }}>
            <GateControlVoucher 
              datos={voucherSeleccionado} 
              onCerrar={() => setVoucherSeleccionado(null)} 
            />
          </div>
        </div>
      )}

      {/* MODAL DE PILA DE CELDA */}
      {celdaSeleccionada && (() => {
        const contenedoresEnPila = registros.filter(r => 
          r.estadoFlujo !== 'COMPLETADO' &&
          r.ubicacionMapa.bloque === celdaSeleccionada.bloque &&
          r.ubicacionMapa.bay === celdaSeleccionada.bay &&
          r.ubicacionMapa.posicion === celdaSeleccionada.posicion &&
          r.ubicacionMapa.piso === celdaSeleccionada.piso
        );

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ width: '460px', maxWidth: '95%', maxHeight: '80vh', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#3b82f6', textTransform: 'uppercase' }}>
                    🔍 Contenedores en esta Celda
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                    Bloque {celdaSeleccionada.bloque} • Bay {celdaSeleccionada.bay} • Pos {celdaSeleccionada.posicion} • Piso {celdaSeleccionada.piso}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => setCeldaSeleccionada(null)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕ Cerrar
                </button>
              </div>

              <div style={{ backgroundColor: '#020617', padding: '8px 12px', borderRadius: '6px', border: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#cbd5e1' }}>Váuchers vigentes en la pila:</span>
                <strong style={{ color: '#eab308' }}>{contenedoresEnPila.length} Registro(s)</strong>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {contenedoresEnPila.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No hay contenedores en esta posición.</span>
                ) : (
                  contenedoresEnPila.map((reg) => (
                    <div 
                      key={reg.id} 
                      style={{ backgroundColor: '#020617', border: '1px solid #1e293b', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <strong style={{ fontSize: '13px', fontFamily: 'monospace', color: '#3b82f6' }}>{reg.contenedor}</strong>
                        <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>Fondo: {reg.ubicacionMapa.filaFondo} • Cliente: {reg.cliente}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setVoucherSeleccionado(reg);
                          setCeldaSeleccionada(null);
                        }}
                        style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Ver Váucher
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};