// ==========================================================================
// ARCHIVO: src/components/gate-control/GateControlDashboard/GateControlDashboard.tsx
// ==========================================================================
import React, { useState } from 'react';
import type { RegistroContenedor, UbicacionPatio } from '../../../types';
import { GateControlVoucher } from '../GateControlVoucher/GateControlVoucher';
import { PatioMap } from '../../PatioMap/PatioMap';

interface DashboardProps {
  registros: RegistroContenedor[];
  onAgregarRegistro: (nuevo: RegistroContenedor) => Promise<void>;
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
  
  const [usarGruaHorquilla, setUsarGruaHorquilla] = useState(false);
  const [usarReachStacker, setUsarReachStacker] = useState(false);
  const [usarRampas, setUsarRampas] = useState(false);
  const [voucherSeleccionado, setVoucherSeleccionado] = useState<RegistroContenedor | null>(null);
  
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [fondoVerMapa, setFondoVerMapa] = useState<number>(1);

  const [bloqueAsignado, setBloqueAsignado] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [bayAsignado, setBayAsignado] = useState<number>(1);
  const [posicionAsignada, setPosicionAsignada] = useState<number>(1);
  const [pisoAsignado, setPisoAsignado] = useState<number>(1);
  const [filaFondoAsignada, setFilaFondoAsignada] = useState<number>(1);

  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{
    bloque: 'A' | 'B' | 'C' | 'D';
    bay: number;
    posicion: number;
    piso: number;
  } | null>(null);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorServidor(null);

    if (!contenedor || !patente || !cliente) {
      alert("Por favor rellene los campos críticos: Contenedor, Patente y Cliente.");
      return;
    }

    setGuardando(true);

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
      id: "", 
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
      servicioDesc: `INGRESO ${tipo} ${estadoCarga}`,
      valorAlmacenaje,
      sobreEstadia: 0,
      desconsolidado: valorGrua,
      consolidado: valorReachStacker,
      rampaManejo: valorRampas,
      iva,
      total,
      estadoPago: 'PAGADO',
      digitador: usuarioNombre,
      estadoFlujo: 'EN_ESPERA_GATE'
    };

    try {
      await onAgregarRegistro(nuevoRegistro);
      setContenedor(''); setCliente(''); setRutCliente(''); setPatente('');
      setConductor(''); setRutConductor(''); setGuia(''); setTransportista('');
      setUsarGruaHorquilla(false); setUsarReachStacker(false); setUsarRampas(false);
    } catch (error: any) {
      setErrorServidor(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleAsignarRetiro = async (reg: RegistroContenedor) => {
    if (!reg) return;
    try {
      const respuesta = await fetch(`http://localhost:5000/api/contenedores/${reg.id}/cambiar-estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'EN_ESPERA_MAQUINISTA' })
      });
      if (!respuesta.ok) throw new Error('No se pudo enviar la orden de retiro');
      alert(`⚠️ Orden de retiro enviada por radiofrecuencia para la unidad: ${reg.contenedor}`);
    } catch (error) {
      alert("Error de red al despachar la orden de retiro");
    }
  };

    const handleFinalizarYValidarRetiro = async (idContenedor: string): Promise<RegistroContenedor | null> => {
    const cOrig = registros.find(r => r.id === idContenedor);
    if (!cOrig) return null;

    // DETECCIÓN FIJADA: Si el estado operativo de origen en la base de datos es 'EN_ESPERA_MAQUINISTA'
    // o incluye la palabra RETIRO, es un despacho. Si nació de un formulario de ingreso, es una ENTRADA.
    const esDespachoSalida = cOrig.estadoFlujo === 'EN_ESPERA_MAQUINISTA' || cOrig.servicioDesc.toUpperCase().includes('RETIRO');

    let nuevoIva = Number(cOrig.iva || 0);
    let nuevoTotal = Number(cOrig.total || 0);
    let cobroSobreestadiaTotal = 0;
    const fechaHoy = new Date();

    if (esDespachoSalida) {
      // SÓLO SI ES SALIDA: Calculamos sobreestadías contables protegiendo contra fallas de casteo de fecha
      try {
        const limpiaFecha = cOrig.fechaIngreso.replace(/(\d{2})\/(\d{2})\/(\d{4}).*/, '\$3-\$2-\$1');
        const fechaIng = new Date(limpiaFecha);
        const diferenciaMs = fechaHoy.getTime() - (isNaN(fechaIng.getTime()) ? fechaHoy.getTime() : fechaIng.getTime());
        const diasTranscurridos = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24)) || 0;
        const diasSobreestadia = diasTranscurridos > 1 ? diasTranscurridos - 1 : 0;
        cobroSobreestadiaTotal = diasSobreestadia * 2500;

        const nuevoSubtotal = Number(cOrig.valorAlmacenaje || 0) + Number(cOrig.desconsolidado || 0) + Number(cOrig.consolidado || 0) + Number(cOrig.rampaManejo || 0) + cobroSobreestadiaTotal;
        nuevoIva = Math.round(nuevoSubtotal * 0.19);
        nuevoTotal = nuevoSubtotal + nuevoIva;
      } catch (e) {
        console.error("Error calculando sobreestadía, aplicando valores base:", e);
      }
    }

    // Aseguramos de forma matemática que JAMÁS viaje un NaN al motor relacional MySQL
    const regMod = {
      ...cOrig,
      estadoFlujo: esDespachoSalida ? 'COMPLETADO' : 'EN_PATIO',
      fechaSalida: esDespachoSalida ? fechaHoy.toLocaleString('es-CL') : undefined,
      sobreEstadia: cobroSobreestadiaTotal,
      iva: isNaN(nuevoIva) ? 0 : nuevoIva,
      total: isNaN(nuevoTotal) ? 0 : nuevoTotal
    };

    try {
      const respuesta = await fetch(`http://localhost:5000/api/contenedores/${idContenedor}/finalizar-salida`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regMod, esDespacho: esDespachoSalida })
      });
      
      if (!respuesta.ok) throw new Error("Fallo en la respuesta del servidor");
      const resData = await respuesta.json();

      // 📢 ALERTAS CORPORATIVAS Y ELOCUENTES EN ESPAÑOL
      if (resData.message === "INGRESO_ALMACENADO_BD") {
        alert(`📥 [Serracor System]: Registro completado. La unidad ${cOrig.contenedor} ha sido ingresada y resguardada con éxito en la Base de Datos. Coordenadas fijadas en el plano de patio.`);
      } else {
        alert(`📤 [Serracor System]: Operación visada. Despacho de salida autorizado para el contenedor ${cOrig.contenedor}. Slot y celda física liberados con éxito en la matriz.`);
      }

      return regMod;
    } catch (error) {
      alert("❌ Error crítico: No se pudo procesar la visación en el servidor de base de datos.");
      return null;
    }
  };



  const handleSeleccionarSlotVacio = (bloque: 'A'|'B'|'C'|'D', bay: number, posicion: number, piso: number, fondo: number) => {
    setBloqueAsignado(bloque); setBayAsignado(bay); setPosicionAsignada(posicion); setPisoAsignado(piso); setFilaFondoAsignada(fondo);
  };

  return (
    <div className="layout-contenedor" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
      
      {/* COLUMNA IZQUIERDA: FORMULARIO */}
      <div className="card-industrial">
        <h3 style={{ fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: '0 0 16px 0' }}>
          📝 Registrar Movimiento
        </h3>

        {errorServidor && (
          <div className="alert-error-industrial" style={{ marginBottom: '12px', color: '#ef4444' }}>
            ⚠️ {errorServidor}
          </div>
        )}

        <form onSubmit={handleGuardar} className="form-grid-2" style={{ fontSize: '12px' }}>
          <div className="form-group-full">
            <label className="label-professional">CONTENEDOR (SIGLA)</label>
            <input type="text" value={contenedor} onChange={e => setContenedor(e.target.value)} disabled={guardando} placeholder="Ej: MRKU2342428" className="input-professional" style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">TIPO CONTENEDOR</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} disabled={guardando} className="input-professional">
              <option value="DRY 40">40" DRY</option>
              <option value="DRY 20">20" DRY</option>
              <option value="REEFER 40">40" REEFER</option>
              <option value="REEFER 20">20" REEFER</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label-professional">ESTADO CARGA</label>
            <select value={estadoCarga} onChange={e => setEstadoCarga(e.target.value)} disabled={guardando} className="input-professional" style={{ color: 'var(--accent-yellow)' }}>
              <option value="FULL">FULL ($20.000)</option>
              <option value="VACIO">VACÍO ($10.000)</option>
            </select>
          </div>

                    {/* ASIGNACIÓN DE LA MATRIZ DE PATIO (5D) */}
          <div className="form-group-full" style={{ backgroundColor: '#020617', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginTop: '4px' }}>
            <span className="label-professional" style={{ gridColumn: 'span 5', marginBottom: '2px', color: '#3b82f6' }}>📦 Ubicación (Bloque • Bay • Pos • Piso • Fondo)</span>
            
            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>BLOQUE</label>
              <select value={bloqueAsignado} onChange={e => setBloqueAsignado(e.target.value as any)} disabled={guardando} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>BAY</label>
              <select value={bayAsignado} onChange={e => setBayAsignado(Number(e.target.value))} disabled={guardando} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>POS</label>
              <select value={posicionAsignada} onChange={e => setPosicionAsignada(Number(e.target.value))} disabled={guardando} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                {[1, 2, 3, 4].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>PISO</label>
              <select value={pisoAsignado} onChange={e => setPisoAsignado(Number(e.target.value))} disabled={guardando} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                {[1, 2, 3, 4].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '8px', fontWeight: 'bold', color: '#64748b' }}>FONDO</label>
              <select value={filaFondoAsignada} onChange={e => setFilaFondoAsignada(Number(e.target.value))} disabled={guardando} className="input-professional" style={{ padding: '4px', fontSize: '11px', width: '100%', borderColor: '#d97706' }}>
                {[1, 2, 3, 4].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label-professional">PATENTE CAMIÓN</label>
            <input type="text" value={patente} onChange={e => setPatente(e.target.value)} disabled={guardando} placeholder="KFJC73" className="input-professional" style={{ textAlign: 'center', color: '#eab308', textTransform: 'uppercase', fontWeight: 'bold' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">GUÍA / REFERENCIA</label>
            <input type="text" value={guia} onChange={e => setGuia(e.target.value)} disabled={guardando} placeholder="MIDEA 107392" className="input-professional" />
          </div>

          <div className="form-group-full">
            <label className="label-professional">CLIENTE / FACTURAR A</label>
            <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} disabled={guardando} placeholder="LOMAS LOGISTICA LIMITADA" className="input-professional" style={{ textTransform: 'uppercase' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">RUT CLIENTE</label>
            <input type="text" value={rutCliente} onChange={e => setRutCliente(e.target.value)} disabled={guardando} placeholder="76.454.768-3" className="input-professional" />
          </div>

          <div className="form-group">
            <label className="label-professional">TRANSPORTISTA</label>
            <input type="text" value={transportista} onChange={e => setTransportista(e.target.value)} disabled={guardando} placeholder="SERRACOR EIRL" className="input-professional" style={{ textTransform: 'uppercase' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">NOMBRE CONDUCTOR</label>
            <input type="text" value={conductor} onChange={e => setConductor(e.target.value)} disabled={guardando} placeholder="MARCO ARMIJOS" className="input-professional" style={{ textTransform: 'uppercase' }} />
          </div>

          <div className="form-group">
            <label className="label-professional">RUT CHOFER</label>
            <input type="text" value={rutConductor} onChange={e => setRutConductor(e.target.value)} disabled={guardando} placeholder="25.931.382-1" className="input-professional" />
          </div>

          <div className="form-group-full" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <span className="label-professional">⚙️ Servicios y Maquinaria Solicitados</span>
            <label className="checkbox-card">
              <input type="checkbox" checked={usarGruaHorquilla} onChange={e => setUsarGruaHorquilla(e.target.checked)} disabled={guardando} style={{ width: '16px', height: '16px' }} />
              <div>
                <span style={{ display: 'block', color: '#fff' }}>🚜 Operación Grúa Horquilla</span>
              </div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={usarReachStacker} onChange={e => setUsarReachStacker(e.target.checked)} disabled={guardando} style={{ width: '16px', height: '16px' }} />
              <div>
                <span style={{ display: 'block', color: '#fff' }}>🏗️ Reach Stacker (Contenedor Completo)</span>
              </div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={usarRampas} onChange={e => setUsarRampas(e.target.checked)} disabled={guardando} style={{ width: '16px', height: '16px' }} />
              <div>
                <span style={{ display: 'block', color: '#fff' }}>Reserva de Rampa Directa</span>
              </div>
            </label>
          </div>

          <button type="submit" className="btn-operativo" disabled={guardando} style={{ gridColumn: 'span 2', marginTop: '10px', width: '100%' }}>
            {guardando ? '💾 SINCRO MYSQL...' : '🖨️ Procesar Registro e Imprimir'}
          </button>
        </form>
      </div>

      {/* ==========================================================================
          📤 COLUMNA DERECHA: SECCIÓN INTERACTIVA DE PANTALLAS EN PARALELO
         ========================================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div className="card-industrial" style={{ border: '2px dashed #eab308', backgroundColor: '#090d16' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#eab308', margin: '0 0 10px 0' }}>
            📟 Terminal Móvil del Maquinista (Pantalla de Patio)
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            
            {/* Sub-Panel A: Instrucciones de Retiro */}
            <div style={{ backgroundColor: '#020617', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>📋 INSTRUCCIÓN DE RETIRO ACTIVA</span>
              {registros.filter(r => r.estadoFlujo === 'EN_ESPERA_MAQUINISTA').length === 0 ? (
                <span style={{ color: '#475569', fontSize: '11px', fontStyle: 'italic' }}>Ninguna instrucción...</span>
              ) : (
                registros.filter(r => r.estadoFlujo === 'EN_ESPERA_MAQUINISTA').map(r => (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#0f172a', padding: '8px', borderRadius: '4px', border: '1px solid #3b82f6' }}>
                    <strong style={{ fontSize: '14px', fontFamily: 'monospace', color: '#3b82f6' }}>{r.contenedor}</strong>
                    <span style={{ fontSize: '10px', color: '#cbd5e1' }}>{r.ubicacionTexto}</span>
                  </div>
                ))
              )}
            </div>
                        {/* Sub-Panel B: Alertas inteligentes con botones dinámicos de Entrada / Salida */}
            <div style={{ backgroundColor: '#020617', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                🚨 ALERTAS PARA VALIDAR EN GATE CONTROL
              </span>
              {registros.filter(r => r.estadoFlujo === 'POR_VALIDAR_GATE').length === 0 ? (
                <span style={{ color: '#475569', fontSize: '11px', fontStyle: 'italic' }}>Esperando confirmaciones...</span>
              ) : (
                registros.filter(r => r.estadoFlujo === 'POR_VALIDAR_GATE').map(r => {
                  // DETECCIÓN FIJADA: Si el estado de origen del flujo fue manipulado por una orden de retiro, es un despacho.
                  // Esto evita que lea falsamente la descripción "INGRESO" si el tarro está saliendo.
                  const esDespachoSalida = r.servicioDesc.toLowerCase().includes('retiro') || r.estadoFlujo === 'EN_ESPERA_MAQUINISTA' || r.sobreEstadia > 0;
                  
                  return (
                    <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: esDespachoSalida ? '#451a03' : '#14532d', padding: '6px 8px', borderRadius: '4px', border: esDespachoSalida ? '1px solid #b45309' : '1px solid #22c55e', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#fff' }}>
                          {r.contenedor}
                        </strong>
                        <span style={{ fontSize: '9px', color: esDespachoSalida ? '#fbd58b' : '#4ade80', fontWeight: 'bold' }}>
                          {esDespachoSalida ? '📤 RETIRO EN CURSO' : '📥 ALTA DE INVENTARIO'}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={async () => {
                          const finalizado = await handleFinalizarYValidarRetiro(r.id);
                          if (finalizado && esDespachoSalida) {
                            // Solo levanta el modal del váucher contable si es un despacho real de salida
                            setVoucherSeleccionado({ ...finalizado, esDespacho: true } as any);
                          }
                        }}
                        style={{ width: '100%', marginTop: '2px', backgroundColor: esDespachoSalida ? '#d97706' : '#22c55e', border: 'none', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
                      >
                        {esDespachoSalida ? '📤 Validar el Retiro del Contenedor' : '📥 Validar Entrada a Patio'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* CONTROLES DE CAPA DE PROFUNDIDAD DEL PATIO */}
        <div className="card-industrial" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}>🗺️ Profundidad Activa:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4].map((f) => (
              <button key={f} type="button" onClick={() => setFondoVerMapa(f)} style={{ backgroundColor: fondoVerMapa === f ? '#d97706' : '#1e293b', color: '#fff', border: '1px solid #334155', padding: '4px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                📦 Fondo {f}
              </button>
            ))}
          </div>
        </div>

        {/* MAPA DEL PATIO INTERACTIVO (MATRIZ 5D) */}
        <PatioMap
          registros={registros}
          fondoActivo={fondoVerMapa}
          onSeleccionarSlotVacio={handleSeleccionarSlotVacio}
          onSeleccionarContenedor={(reg) => {
            handleAsignarRetiro(reg);
          }}
        />

      </div>

      {/* POPUP MODAL VOUCHER IMPRESIÓN */}
      {voucherSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <GateControlVoucher datos={voucherSeleccionado} onCerrar={() => setVoucherSeleccionado(null)} />
        </div>
      )}

    </div>
  );
};
