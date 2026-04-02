"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { EDIFICIOS } from '@/lib/edificios';

interface ModalEdificioArmazemProps {
  recursos: { madeira: number; pedra: number; prata: number; recursosMaximos: number; };
  renda: { madeira: number; pedra: number; prata: number };
  nivelAtual: number;
}

export function ModalEdificioArmazem({ recursos, renda, nivelAtual }: ModalEdificioArmazemProps) {
  // Refresh force
  const [, setAgora] = useState(Date.now());
  useEffect(() => {
    const min = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(min);
  }, []);

  const getTempoRestante = (atual: number, rendaValor: number, max: number) => {
    if (atual >= max) return "Máxima capacidade alcançada";
    if (rendaValor <= 0) return "Nunca";
    const restante = max - atual;
    const horas = restante / rendaValor;
    const segsTotal = Math.floor(horas * 3600);
    const h = Math.floor(segsTotal / 3600);
    const m = Math.floor((segsTotal % 3600) / 60);
    const s = segsTotal % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getHorarioCheio = (atual: number, rendaValor: number, max: number) => {
    if (atual >= max) return `Máxima capacidade atingida agora`;
    if (rendaValor <= 0) return "-";
    const restante = max - atual;
    const horas = restante / rendaValor;
    const dataHora = new Date(Date.now() + horas * 3600 * 1000);
    const dia = dataHora.getDate() === new Date().getDate() ? "hoje" : "amanhã";
    return `Máxima capacidade atingida em ${dia} às ${dataHora.getHours().toString().padStart(2, '0')}:${dataHora.getMinutes().toString().padStart(2, '0')}`;
  };

  // Simulating the next level capacity logic
  const capacidadeProximoNivel = Math.floor(recursos.recursosMaximos * 1.08);

  const recursosList = [
    { icon: '/icon_wood.png', nome: 'Madeira', chave: 'madeira', amount: Math.floor(recursos.madeira), rawAmount: recursos.madeira, rend: renda.madeira, bg: '#795548', fill: '#a0522d' },
    { icon: '/icon_stone.png', nome: 'Pedra', chave: 'pedra', amount: Math.floor(recursos.pedra), rawAmount: recursos.pedra, rend: renda.pedra, bg: '#8b8b8b', fill: '#9e9e9e' },
    { icon: '/icon_silver.png', nome: 'Moedas de prata', chave: 'prata', amount: Math.floor(recursos.prata), rawAmount: recursos.prata, rend: renda.prata, bg: '#607d8b', fill: '#cfd8dc' },
  ];

  const escondidoAtual = nivelAtual * 200;
  const escondidoProximo = (nivelAtual + 1) * 200;

  return (
    <div className="armazem-container" style={{ display: 'flex', gap: '30px', marginTop: '20px', alignItems: 'flex-start', fontFamily: 'Arial, sans-serif' }}>
      <div className="armazem-bars" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {recursosList.map((r) => {
          const porc = Math.min(100, Math.max(0, (r.amount / recursos.recursosMaximos) * 100));
          return (
            <div key={r.chave} className="arm-bar-wrapper">
              <div className="arm-bar-header" style={{ display: 'flex', alignItems: 'center', background: '#ffe4b5', border: '2px solid #8b4513', borderBottom: 'none', height: '32px' }}>
                <div className="arm-icon" style={{ background: '#556b2f', padding: '0 8px', height: '100%', display: 'flex', alignItems: 'center', borderRight: '2px solid #8b4513' }}>
                  <Image src={r.icon} alt={r.nome} width={24} height={24} />
                </div>
                <div className="arm-title" style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#000', fontSize: '0.9rem' }}>
                  {r.nome} ( {r.amount} / {recursos.recursosMaximos} )
                </div>
              </div>
              <div className="arm-bar-track" style={{ height: '24px', background: '#3e2723', border: '2px solid #8b4513', position: 'relative' }}>
                <div className="arm-bar-fill" style={{ height: '100%', width: `${porc}%`, background: r.fill, transition: 'width 0.5s', borderRight: '2px solid #ffcc80', borderTop: '2px solid rgba(255,255,255,0.3)' }}></div>
                <div className="arm-time-text" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '0.85rem', textShadow: '1px 1px 2px #000' }}>
                  {r.rawAmount >= recursos.recursosMaximos ? 'Cheio' : getTempoRestante(r.rawAmount, r.rend, recursos.recursosMaximos)}
                </div>
              </div>
              <div className="arm-footer" style={{ fontSize: '0.85rem', color: '#d7ccc8', marginTop: '4px' }}>
                {getHorarioCheio(r.rawAmount, r.rend, recursos.recursosMaximos)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="armazem-stats" style={{ flex: 1, background: '#fdf5e6', border: '2px solid #8b4513', color: '#000', fontSize: '0.9rem' }}>
        <div className="arm-stats-header" style={{ background: '#1e5a96', color: '#fff', padding: '6px 10px', fontWeight: 'bold', borderBottom: '1px solid #8b4513' }}>Armazém</div>
        <div className="arm-stats-row" style={{ padding: '8px 10px', borderBottom: '1px solid #ccc' }}>
          Capacidade de armazenamento atual: {recursos.recursosMaximos} por recurso
        </div>
        <div className="arm-stats-row" style={{ padding: '8px 10px', borderBottom: '1px solid #ccc', background: '#f5deb3' }}>
          destes no esconderijo: {escondidoAtual} por recurso
        </div>
        <div className="arm-stats-row" style={{ padding: '8px 10px', borderBottom: '1px solid #ccc' }}>
          Capacidade de armazenamento no Nv. {nivelAtual + 1}: {capacidadeProximoNivel} por recurso
        </div>
        <div className="arm-stats-row" style={{ padding: '8px 10px', background: '#f5deb3' }}>
          Capacidade do esconderijo no Nv. {nivelAtual + 1}: {escondidoProximo} por recurso
        </div>
      </div>
    </div>
  );
}
