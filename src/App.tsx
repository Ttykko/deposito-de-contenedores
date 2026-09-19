import React, { useState, useEffect } from 'react';
import type { RegistroContenedor, Usuario, RolUsuario } from './types';
import { GateControlDashboard } from './components/gate-control/GateControlDashboard/GateControlDashboard';
import { MaquinistaDashboard } from './components/maquinistas/MaquinistaDashboard';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api/contenedores';

export default function App() {
  const [registros, setRegistros] = useState<RegistroContenedor[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [nombreTurno, setNombreTurno] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario>('GATE_CONTROL');
  const [cargando, setCargando] = useState<boolean>(true);

  async function cargarDatos() {
    try {
      const respuesta = await fetch(API_URL);
      if (!respuesta.ok) throw new Error('Error al conectar con el servidor');
      const datos: RegistroContenedor[] = await respuesta.json();
      setRegistros(datos);
    } catch (error) {
      console.error("Error cargando registros de MySQL:", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    const socket = io('http://localhost:5000');
    socket.on('patio_actualizado', () => {
      cargarDatos();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

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

  const handleConfirmarRetiroFisico = async (idContenedor: string) => {
    try {
      const respuesta = await fetch(`${API_URL}/${idContenedor}/cambiar-estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'POR_VALIDAR_GATE' })
      });
      if (!respuesta.ok) throw new Error('No se pudo actualizar en el servidor');
    } catch (error) {
      console.error(error);
      alert("Error: No se pudo guardar el retiro en la base de datos.");
    }
  };

  const handleAgregarRegistro = async (nuevo: RegistroContenedor) => {
    try {
      const respuesta = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      });
      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        throw new Error(errorData.message || 'Error al guardar contenedor');
      }
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white p-4">
        <h2 className="text-xl font-bold tracking-wider animate-pulse">CONECTANDO A SERRACOR SYSTEM PREMIUM...</h2>
      </div>
    );
  }

  if (!usuarioActual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] p-4">
        <div className="card-industrial w-full max-w-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight mb-6">SERRACOR SYSTEM</h1>
          <form onSubmit={handleIniciarTurno} className="flex flex-col gap-4">
            <input 
              type="text" 
              value={nombreTurno} 
              onChange={(e) => setNombreTurno(e.target.value)} 
              placeholder="NOMBRE OPERADOR" 
              className="input-professional text-center" 
              style={{ textTransform: 'uppercase' }} 
            />
            <select 
              value={rolSeleccionado} 
              onChange={(e) => setRolSeleccionado(e.target.value as RolUsuario)}
              className="input-professional"
            >
              <option value="GATE_CONTROL">🖥️ GATE CONTROL</option>
              <option value="MAQUINISTA">🏗️ MAQUINISTA</option>
            </select>
            <button type="submit" className="btn-operativo w-full py-3 font-bold mt-2">🚀 INICIAR TURNO</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] p-3 sm:p-4 gap-4">
      <header className="card-industrial flex flex-col sm:flex-row gap-4 justify-between items-center p-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-black text-white tracking-wide">SERRACOR SYSTEM</h1>
          <p className="text-xs text-[#64748b] mt-1">
            Operador: <strong className="text-white">{usuarioActual.nombre}</strong> | Rol: <strong className="text-blue-400">{usuarioActual.rol}</strong>
          </p>
        </div>
        <button onClick={handleCerrarSesion} className="btn-operativo w-full sm:w-auto px-6 py-2 text-xs font-bold">
          🚪 CAMBIAR TURNO
        </button>
      </header>
      <main className="w-full flex-grow">
        {usuarioActual.rol === 'GATE_CONTROL' && (
          <GateControlDashboard 
            registros={registros} 
            onAgregarRegistro={handleAgregarRegistro} 
            onActualizarRegistros={(act) => setRegistros(act)} 
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

