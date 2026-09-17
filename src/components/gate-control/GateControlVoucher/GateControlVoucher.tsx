// src/components/gate-control/GateControlVoucher.tsx
import React from 'react';
import type { RegistroContenedor } from '../../../types';

interface VoucherProps {
  datos: RegistroContenedor;
  onCerrar: () => void;
}

export const GateControlVoucher: React.FC<VoucherProps> = ({ datos, onCerrar }) => {
  const valorAlmacenaje = datos.valorAlmacenaje || 0;
  const maniobrasExtras = (datos.consolidado || 0) + (datos.desconsolidado || 0) + (datos.rampaManejo || 0);
  const iva = datos.iva || 0;
  const total = datos.total || 0;

  return (
    <div className="print-static" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100, boxSizing: 'border-box' }}>
      
      {/* REGLAS CSS PARA LA IMPRESIÓN TÉRMICA */}
      <style>{`
        @media print {
          .print-static {
            position: static !important;
            background-color: transparent !important;
            padding: 0 !important;
            display: block !important;
          }
          .print-hidden {
            display: none !important;
          }
          .modal-impresion-termica {
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* CAPA DE IMPRESIÓN ASOCIADA A LAS REGLAS DE MEDIA PRINT */}
      <div className="modal-impresion-termica" style={{ backgroundColor: '#ffffff', color: '#000000', borderRadius: '12px', padding: '20px', maxWidth: '320px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}>
        
        {/* PANEL DE CONTROL SUPERIOR (Oculto automáticamente en el papel o PDF) */}
        <div className="print-hidden" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
          <button type="button" onClick={onCerrar} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>
            ✕ Cerrar Vista
          </button>
          <button 
            type="button" 
            onClick={() => window.print()} 
            style={{ backgroundColor: '#2563eb', border: 'none', color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            🖨️ Generar PDF / Ticket
          </button>
        </div>

        {/* ESTRUCTURA TÉRMICA FORMAL DE SERRACOR */}
        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#000000' }}>
          
          {/* ENCABEZADO DE LA EMPRESA */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '11px', margin: '0', fontWeight: 'bold', letterSpacing: '0.5px' }}>DEPÓSITO DE CONTENEDORES</h2>
            <h1 style={{ fontSize: '16px', margin: '2px 0', fontWeight: '900', letterSpacing: '1px' }}>SERRACOR EIRL</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: 'bold' }}>CTA.CTE. # 65057295 - BANCO BCI</p>
            <p style={{ margin: '1px 0', fontSize: '10px' }}>RUT: 76.313.990-5</p>
            <p style={{ margin: '1px 0', fontSize: '10px' }}>FONO: 35-2417115</p>
          </div>

          {/* DATOS LOGÍSTICOS CRÍTICOS */}
          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
              <span>CONTENEDOR:</span> <span style={{ letterSpacing: '0.5px' }}>{datos.contenedor}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>INGRESO:</span> <span>{datos.fechaIngreso}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TIPO LOGÍSTICO:</span> <span>{datos.tipo} - {datos.estadoCarga}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span>CLIENTE:</span> <span style={{ textAlign: 'right', maxWidth: '180px', fontWeight: 'bold', textTransform: 'uppercase' }}>{datos.cliente}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RUT CLIENTE:</span> <span>{datos.rutCliente}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '2px' }}>
              <span>N° MOVIMIENTO:</span> <span>#{datos.id}</span>
            </div>
          </div>

          {/* UBICACIÓN DE COORDENADAS Y CONDUCTOR */}
          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '3px', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>SLOT PATIO:</span> <span style={{ color: '#1d4ed8' }}>{datos.ubicacionTexto}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SELLO/PREC:</span> <span>{datos.sello || 'SIN SELLO'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span>CONDUCTOR:</span> <span style={{ textAlign: 'right', maxWidth: '160px', textTransform: 'uppercase' }}>{datos.conductor}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RUT CHOFER:</span> <span>{datos.rutConductor}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>PATENTE:</span> <span style={{ border: '1px solid #000', padding: '0 4px', borderRadius: '2px' }}>{datos.patente}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TRANSP:</span> <span style={{ textTransform: 'uppercase' }}>{datos.transportista}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GUÍA REF:</span> <span style={{ textTransform: 'uppercase' }}>{datos.guia || 'SIN GUÍA'}</span>
            </div>
          </div>

          {/* DESGLOSE FINANCIERO Y COBROS */}
          <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VALOR BASE:</span> <span>$ {valorAlmacenaje.toLocaleString('es-CL')}</span>
            </div>
            {maniobrasExtras > 0 && ( 
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>MANIOBRAS EXTRAS:</span> <span>$ {maniobrasExtras.toLocaleString('es-CL')}</span>
              </div> 
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>IVA (19%):</span> <span>$ {iva.toLocaleString('es-CL')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '14px', borderTop: '1px dotted #000', paddingTop: '4px', marginTop: '4px' }}>
              <span>TOTAL NETO+IVA:</span> <span>$ {total.toLocaleString('es-CL')}</span>
            </div>
          </div>

          {/* AUDITORÍA Y FIRMAS */}
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px' }}>
              ESTADO PAGO: {datos.estadoPago}
            </div>
            <span style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase' }}>
              DIGITADOR EN TURNO: {datos.digitador}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
