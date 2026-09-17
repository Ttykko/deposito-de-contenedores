import React, { useState } from 'react';
import type { RegistroContenedor, Usuario, RolUsuario } from './types';
import { GateControlDashboard } from './components/gate-control/GateControlDashboard/GateControlDashboard';
import { MaquinistaDashboard } from './components/maquinistas/MaquinistaDashboard';

// DATOS_INICIALES se mantiene igual...
const DATOS_INICIALES: RegistroContenedor[] = [ /* ... tu array original ... */ ];

export default function App() {
  const [registros, setRegistros] = useState<RegistroContenedor[]>(DATOS_INICIALES);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [nombreTurno, setNombreTurno] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario>('GATE_CONTROL');

  const handleIniciarTurno = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreTurno.trim()) return alert("Por favor, ingrese su nombre.");
    setUsuarioActual({
      id: String(Date.now()),
      nombre: nombreTurno.toUpperCase().trim(),
      rol: rolSeleccionado
    });
  };

  const handleCerrarSesion = () => {
    setUsuarioActual(null);
    setNombreTurno('');
  };

  // ESTA ES LA CLAVE: Aseguramos inmutabilidad total
  const handleConfirmarRetiroFisico = (idContenedor: string) => {
    setRegistros(prev => prev.map(r => 
      r.id === idContenedor ? { ...r, estadoFlujo: 'POR_VALIDAR_GATE' } : r
    ));
  };

  if (!usuarioActual) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div className="panel-industrial" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', textAlign: 'center' }}>SERRACOR SYSTEM</h1>
          <form onSubmit={handleIniciarTurno} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <input 
              type="text" value={nombreTurno} onChange={(e) => setNombreTurno(e.target.value)}
              placeholder="NOMBRE OPERADOR" className="input-industrial" style={{ textTransform: 'uppercase' }}
            />
            <select value={rolSeleccionado} onChange={(e) => setRolSeleccionado(e.target.value as RolUsuario)} className="input-industrial">
              <option value="GATE_CONTROL">🖥️ GATE CONTROL</option>
              <option value="MAQUINISTA">🏗️ MAQUINISTA</option>
            </select>
            <button type="submit" className="btn-operativo">🚀 INICIAR TURNO</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' }}>
      <header className="panel-industrial" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', color: '#ffffff', margin: 0 }}>SERRACOR SYSTEM</h1>
          <p style={{ fontSize: '12px', color: '#64748b' }}>Operador: <strong>{usuarioActual.nombre}</strong> | Rol: <strong>{usuarioActual.rol}</strong></p>
        </div>
        <button onClick={handleCerrarSesion} className="btn-operativo">🚪 CAMBIAR TURNO</button>
      </header>

      <main>
        {usuarioActual.rol === 'GATE_CONTROL' && (
          <GateControlDashboard
            registros={registros}
            onAgregarRegistro={(nuevo) => setRegistros(prev => [nuevo, ...prev])}
            onActualizarRegistros={(actualizados) => setRegistros(actualizados)}
            usuarioNombre={usuarioActual.nombre}
          />
        )}

        {usuarioActual.rol === 'MAQUINISTA' && (
          <MaquinistaDashboard 
            registros={registros}
            onConfirmarRetiroFisico={handleConfirmarRetiroFisico}
            maquinistaNombre={usuarioActual.nombre}
          />
        )}
      </main>
    </div>
  );
}