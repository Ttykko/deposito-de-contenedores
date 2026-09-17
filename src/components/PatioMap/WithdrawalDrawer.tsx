import React, { useState, useMemo } from 'react';
import type { RegistroContenedor } from '../../types';
import './WithdrawalDrawer.css';

interface WithdrawalDrawerProps {
  contenedor: RegistroContenedor | null;
  onClose: () => void;
  // 🌟 CORREGIDO: Cambiamos 'codigo' por 'idContenedor' para hacer match real con el estado de App.tsx
  onConfirmarRetiro: (idContenedor: string) => void;
}

export const WithdrawalDrawer: React.FC<WithdrawalDrawerProps> = ({ contenedor, onClose, onConfirmarRetiro }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // MOTOR DE CÁLCULO LOGÍSTICO Y FINANCIERO
  const auditoriaPatio = useMemo(() => {
    if (!contenedor) return null;

    // Fecha de simulación del sistema operativa (Julio 2026)
    const fechaActual = new Date('2026-07-04');
    const fechaIngreso = new Date(contenedor.fechaIngreso);
    
    // Calcular días reales transcurridos en patio
    const diferenciaTiempo = fechaActual.getTime() - fechaIngreso.getTime();
    const diasTotalesPatio = Math.max(0, Math.floor(diferenciaTiempo / (1000 * 60 * 60 * 24)));

    // Si tu negocio define días libres antes de cobrar multa sobreEstadia
    const diasLibresBase = 5; 
    const diasExtra = Math.max(0, diasTotalesPatio - diasLibresBase);
    
    // Costo total de sobreestadía acumulada en base a tus campos
    const multaAcumulada = diasExtra * contenedor.sobreEstadia;
    const subtotalCalculado = contenedor.valorAlmacenaje + multaAcumulada + contenedor.desconsolidado + contenedor.consolidado + contenedor.rampaManejo;
    const ivaCalculado = Math.round(subtotalCalculado * 0.19);
    const totalFinal = subtotalCalculado + ivaCalculado;

    // Regla corporativa: Si el estado de pago no está visado como PAGADO, se bloquea la salida
    const requierePagoInmediato = contenedor.estadoPago.toUpperCase() !== 'PAGADO' || totalFinal > contenedor.total;

    return {
      diasTotalesPatio,
      diasExtra,
      multaAcumulada,
      totalFinal,
      requierePagoInmediato
    };
  }, [contenedor]);

  if (!contenedor || !auditoriaPatio) return null;

  const { diasTotalesPatio, diasExtra, multaAcumulada, totalFinal, requierePagoInmediato } = auditoriaPatio;

  const handleRetiroFinal = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // 🌟 CORREGIDO: Enviamos 'contenedor.id' en lugar de 'contenedor.contenedor'
      onConfirmarRetiro(contenedor.id);
      setIsProcessing(false);
    }, 1500);
  };

  const formatPesos = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="withdrawal-drawer">
        
        <div className="drawer-header">
          <div>
            <h4>Auditoría de Salida (Gate-Out)</h4>
            <p>ID Operación: #{contenedor.id}</p>
          </div>
          <button className="close-drawer-btn" onClick={onClose}>×</button>
        </div>

        <div className="drawer-body">
          {/* DETALLE UNIDAD */}
          <div className="info-preview-card">
            <span className="unit-badge">{contenedor.tipo} • {contenedor.estadoCarga}</span>
            <h2>{contenedor.contenedor.toUpperCase()}</h2>
            <p className="client-name">🏢 {contenedor.cliente}</p>
            <p className="client-rut">RUT: {contenedor.rutCliente}</p>
          </div>

          {/* CONTROL DE ESTADÍA */}
          <div className="finance-section-title">⏱️ Trazabilidad de Estadía</div>
          <div className="patio-time-stats">
            <div className="time-stat-box">
              <span>Ingreso</span>
              <strong>{contenedor.fechaIngreso}</strong>
            </div>
            <div className="time-stat-box">
              <span>Días Patio</span>
              <strong className="text-white">{diasTotalesPatio} días</strong>
            </div>
            <div className="time-stat-box">
              <span>Días Extra</span>
              <strong className={diasExtra > 0 ? "text-amber" : "text-emerald"}>+{diasExtra} días</strong>
            </div>
          </div>

          {/* LIQUIDACIÓN DE MUELLAJE */}
          <div className="finance-section-title">💰 Liquidación Contable de Patio</div>
          <div className="financial-ledger-card">
            <div className="ledger-row">
              <span>Servicio Almacenaje:</span>
              <span>{formatPesos(contenedor.valorAlmacenaje)}</span>
            </div>
            <div className="ledger-row">
              <span>Sobreestadía Acumulada:</span>
              <span className={multaAcumulada > 0 ? "text-amber" : ""}>{formatPesos(multaAcumulada)}</span>
            </div>
            <div className="ledger-row">
              <span>Servicios de Rampa/Manejo:</span>
              <span>{formatPesos(contenedor.rampaManejo)}</span>
            </div>
            <div className="ledger-row">
              <span>Consolidación / Desconsolidación:</span>
              <span>{formatPesos(contenedor.consolidado + contenedor.desconsolidado)}</span>
            </div>
            <div className="ledger-divider" />
            <div className="ledger-row total-row">
              <span>Total Liquidado (Con IVA):</span>
              <span>{formatPesos(totalFinal)}</span>
            </div>
            <div className="ledger-row payment-row">
              <span>Estado Visación Comercial:</span>
              <span className={contenedor.estadoPago.toUpperCase() === 'PAGADO' ? "text-emerald font-bold" : "text-amber font-bold"}>
                {contenedor.estadoPago.toUpperCase()}
              </span>
            </div>
          </div>

          {/* BLOQUEO LOGÍSTICO */}
          {requierePagoInmediato && (
            <div className="financial-warning-banner">
              <span className="warning-icon">⚠️</span>
              <div className="warning-text">
                <strong>DESPACHO RETENIDO EN GARITA</strong>
                <p>La unidad registra cobros pendientes o un estado comercial "PENDIENTE". Regularizar en facturación para abrir compuerta.</p>
              </div>
            </div>
          )}

          {/* DATOS DEL CAMIÓN */}
          <div className="finance-section-title">🚛 Transportista Asignado</div>
          <div className="transport-summary-box">
            <p><strong>Chofer:</strong> {contenedor.conductor} ({contenedor.rutConductor})</p>
            <p><strong>Patente Camión:</strong> <span className="cl-plate">{contenedor.patente}</span></p>
            <p><strong>Guía Despacho:</strong> {contenedor.guia}</p>
          </div>
        </div>

        {/* ACCIÓN DE DESPACHO */}
        <div className="drawer-footer">
          {requierePagoInmediato ? (
            <button type="button" className="modern-dispatch-btn btn-blocked" disabled>
              🔒 Retenido por Pendiente de Pago
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleRetiroFinal}
              disabled={isProcessing}
              className={`modern-dispatch-btn ${isProcessing ? 'loading' : ''}`}
            >
              {isProcessing ? (
                <>
                  <span className="spinner-icon">🔄</span>
                  Procesando Ticket Salida...
                </>
              ) : (
                <>
                  <span className="btn-glow-effect"></span>
                  <span className="btn-text"> Crane Despachar Unidad</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </>
  );
};