"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface EventoAtivo {
  id: string;
  tipo: string;
  nome: string;
  descricao: string;
  tempoFim: number;
  tempoRestanteMinutos: number;
}

interface BannerEventoProps {
  evento: EventoAtivo;
  aoFechar: () => void;
}

const BannerEventoIndividual = React.memo(function BannerEventoIndividual({ evento, aoFechar }: BannerEventoProps) {
  const [tempoRestante, setTempoRestante] = useState(evento.tempoRestanteMinutos);

  useEffect(() => {
    const timer = setInterval(() => {
      const restante = Math.max(0, (evento.tempoFim - Date.now()) / 60000);
      setTempoRestante(restante);
      if (restante <= 0) {
        aoFechar();
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [evento.tempoFim, aoFechar]);

  // Se expirou, nao renderiza mais
  if (tempoRestante <= 0) return null;

  let minutos = Math.floor(tempoRestante);
  let segundos = Math.floor((tempoRestante - minutos) * 60);
  let textoTempo: string;
  if (minutos >= 60) {
    const horas = Math.floor(minutos / 60);
    minutos = minutos % 60;
    textoTempo = `${horas}h ${minutos}m`;
  } else {
    textoTempo = `${minutos}m ${segundos.toString().padStart(2, '0')}s`;
  }

  const corGradiente = (() => {
    switch (evento.tipo) {
      case 'invasao-barbara': return 'linear-gradient(135deg, rgba(120,20,20,0.95), rgba(80,15,15,0.9))';
      case 'bencao-zeus': return 'linear-gradient(135deg, rgba(60,40,20,0.95), rgba(40,30,10,0.9))';
      case 'bencao-poseidon': return 'linear-gradient(135deg, rgba(10,40,80,0.95), rgba(15,30,60,0.9))';
      case 'comercio-vantajoso': return 'linear-gradient(135deg, rgba(40,50,10,0.95), rgba(25,35,10,0.9))';
      case 'praga-atena': return 'linear-gradient(135deg, rgba(60,20,80,0.95), rgba(40,15,50,0.9))';
      case 'chuva-recursos': return 'linear-gradient(135deg, rgba(30,50,30,0.95), rgba(20,40,20,0.9))';
      case 'festival-olimpico': return 'linear-gradient(135deg, rgba(50,40,10,0.95), rgba(40,30,10,0.9))';
      default: return 'linear-gradient(135deg, rgba(30,30,60,0.95), rgba(20,20,40,0.9))';
    }
  })();

  const corBorda = (() => {
    switch (evento.tipo) {
      case 'invasao-barbara': return '#f87171';
      case 'bencao-zeus': return '#fbbf24';
      case 'bencao-poseidon': return '#60a5fa';
      case 'comercio-vantajoso': return '#4ade80';
      case 'praga-atena': return '#c084fc';
      case 'chuva-recursos': return '#34d399';
      case 'festival-olimpico': return '#fbbf24';
      default: return '#D4AF37';
    }
  })();

  const icone = evento.nome.split(' ')[0];
  const nomeSemIcone = evento.nome.replace(/^[^\s]+\s/, '');

  return (
    <div style={{
      background: corGradiente,
      border: `2px solid ${corBorda}`,
      borderRadius: '8px',
      padding: '8px 14px',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: `0 4px 20px ${corBorda}33`,
      animation: 'slideInDown 0.4s ease-out',
      maxWidth: '500px',
    }}>
      <div style={{ fontSize: '1.6rem', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))', flexShrink: 0 }}>
        {icone}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: corBorda, fontSize: '0.95rem', letterSpacing: '0.5px' }}>
          {nomeSemIcone}
        </div>
        <div style={{ color: '#ccc', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {evento.descricao}
        </div>
      </div>
      <div style={{
        flexShrink: 0,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        color: corBorda,
        fontFamily: 'var(--font-mono)',
      }}>
        {textoTempo}
      </div>
      <button
        onClick={aoFechar}
        style={{
          background: 'none',
          border: 'none',
          color: '#999',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '0 0 0 6px',
          lineHeight: 1,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
        title="Dispensar"
      >
        ×
      </button>
    </div>
  );
});

export const BannerEventos = React.memo(function BannerEventos() {
  const [eventos, setEventos] = useState<EventoAtivo[]>([]);
  const [dispensados, setDispensados] = useState<Set<string>>(new Set());

  const fetchEventos = useCallback(async () => {
    try {
      const res = await fetch('/api/game/eventos');
      if (res.ok) {
        const data = await res.json();
        // Filtrar eventos expulsos pelo usuario
        const idsDispensadosTempo = new Set<string>();
        const agora = Date.now();
        for (const id of dispensados) {
          // Re-aparece apos 5 min
          const [_, timestamp] = id.split(':');
          if (agora - Number(timestamp) > 5 * 60 * 1000) idsDispensadosTempo.add(id);
        }
        if (idsDispensadosTempo.size > 0) {
          const novaLista = new Set(dispensados);
          idsDispensadosTempo.forEach(i => novaLista.delete(i));
          setDispensados(novaLista);
        }
        const ativos = (data.eventos || []).filter(
          (e: EventoAtivo) => !dispensados.has(e.id) && e.tempoRestanteMinutos > 0
        );
        setEventos(ativos);
      }
    } catch { /* silencioso */ }
  }, [dispensados]);

  useEffect(() => {
    fetchEventos();
    const timer = setInterval(fetchEventos, 30000);
    return () => clearInterval(timer);
  }, [fetchEventos]);

  const dispensarEvento = useCallback((id: string) => {
    setDispensados(prev => new Set(prev).add(`${id}:${Date.now()}`));
    setEventos(prev => prev.filter(e => e.id !== id));
  }, []);

  if (eventos.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '60px', // abaixo da BarraSuperior
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center',
      pointerEvents: 'none',
    }}>
      {eventos.map(evento => (
        <div key={evento.id} style={{ pointerEvents: 'auto' }}>
          <BannerEventoIndividual evento={evento} aoFechar={() => dispensarEvento(evento.id)} />
        </div>
      ))}
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});
