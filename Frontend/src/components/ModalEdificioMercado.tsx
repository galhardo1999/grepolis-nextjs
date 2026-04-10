"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { TipoRecurso, TAXAS_MERCADO } from '@/lib/config';

// ============================================================
// MERCADO — Sistema de Troca de Recursos
// UX-05: Funcionalidade real para o edifício Mercado
// ============================================================

interface ModalEdificioMercadoProps {
  nivelMercado: number;
  recursos: { madeira: number; pedra: number; prata: number; recursosMaximos: number };
  aoTrocar: (de: TipoRecurso, para: TipoRecurso, quantidade: number) => { sucesso: boolean; motivo?: string };
  mostrarToast?: (msg: React.ReactNode, tipo?: 'sucesso' | 'erro' | 'info' | 'aviso', icone?: React.ReactNode) => void;
}

const ICONE_RECURSO: Record<TipoRecurso, string> = {
  madeira: '/icones/icone_madeira.png',
  pedra: '/icones/icone_pedra.png',
  prata: '/icones/icone_prata.png'
};

const NOME_RECURSO: Record<TipoRecurso, string> = {
  madeira: 'Madeira',
  pedra: 'Pedra',
  prata: 'Prata'
};

const TIPOS_RECURSO: TipoRecurso[] = ['madeira', 'pedra', 'prata'];

export const ModalEdificioMercado = React.memo(function ModalEdificioMercado({
  nivelMercado,
  recursos,
  aoTrocar,
  mostrarToast
}: ModalEdificioMercadoProps) {
  const [de, setDe] = useState<TipoRecurso>('madeira');
  const [para, setPara] = useState<TipoRecurso>('prata');
  const [quantidade, setQuantidade] = useState(0);

  const maxDisponivel = Math.floor(recursos[de]);
  // Nível do mercado melhora a taxa em 2% por nível
  const bonusMercado = 1 + (nivelMercado * 0.02);
  const taxaFinal = TAXAS_MERCADO[de][para] * bonusMercado;
  const quantidadeRecebida = Math.floor(quantidade * taxaFinal);

  const handleTrocar = () => {
    if (quantidade <= 0 || quantidade > maxDisponivel) {
      mostrarToast?.('Quantidade inválida', 'erro');
      return;
    }

    if (de === para) {
      mostrarToast?.('Não é possível trocar o mesmo recurso', 'erro');
      return;
    }

    const resultado = aoTrocar(de, para, quantidade);
    if (resultado.sucesso) {
      mostrarToast?.(
        `🏛️ Trocados ${quantidade} ${NOME_RECURSO[de]} → ${quantidadeRecebida} ${NOME_RECURSO[para]}`,
        'sucesso'
      );
      setQuantidade(0);
    } else {
      mostrarToast?.(resultado.motivo ?? 'Falha na troca', 'erro');
    }
  };

  const handleSwap = () => {
    const temp = de;
    setDe(para);
    setPara(temp);
    setQuantidade(0);
  };

  if (nivelMercado === 0) {
    return (
      <div className="mercado-container" style={{ textAlign: 'center', padding: '30px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏛️</div>
        <p style={{ color: '#8a8a8a' }}>Construa o Mercado para desbloquear a troca de recursos.</p>
      </div>
    );
  }

  return (
    <div className="mercado-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c1f38, #1a2d4a)',
        border: '1px solid #3a5a8a',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ color: '#7eb3e8', fontSize: '0.95rem' }}>
          🏛️ Mercado Nível <strong style={{ color: '#D4AF37' }}>{nivelMercado}</strong>
        </span>
        <span style={{ color: '#52b788', fontSize: '0.85rem' }}>
          Bônus: +{(nivelMercado * 2)}% na taxa
        </span>
      </div>

      {/* Swap UI */}
      <div className="mercado-swap">
        <div className="mercado-swap-header">
          {/* FROM */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '6px' }}>ENVIAR</div>
            <select
              value={de}
              onChange={e => { setDe(e.target.value as TipoRecurso); setQuantidade(0); }}
              className="mercado-resource-select"
            >
              {TIPOS_RECURSO.map(r => (
                <option key={r} value={r}>{NOME_RECURSO[r]}</option>
              ))}
            </select>
            <div style={{ marginTop: '8px', color: '#666', fontSize: '0.8rem' }}>
              Disponível: <strong style={{ color: '#D4AF37' }}>{Math.floor(recursos[de])}</strong>
            </div>
          </div>

          {/* Arrow */}
          <button
            onClick={handleSwap}
            title="Inverter"
            style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid #D4AF37',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <span className="mercado-arrow">⇄</span>
          </button>

          {/* TO */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '6px' }}>RECEBER</div>
            <select
              value={para}
              onChange={e => setPara(e.target.value as TipoRecurso)}
              className="mercado-resource-select"
            >
              {TIPOS_RECURSO.filter(r => r !== de).map(r => (
                <option key={r} value={r}>{NOME_RECURSO[r]}</option>
              ))}
            </select>
            <div style={{ marginTop: '8px', color: '#666', fontSize: '0.8rem' }}>
              Taxa: <strong style={{ color: taxaFinal >= 1 ? '#52b788' : '#ef4444' }}>
                {(taxaFinal * 100).toFixed(0)}%
              </strong>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="mercado-slider-row">
          <span style={{ color: '#888', fontSize: '0.85rem', minWidth: '20px' }}>0</span>
          <input
            type="range"
            min={0}
            max={maxDisponivel}
            step={10}
            value={quantidade}
            onChange={e => setQuantidade(parseInt(e.target.value))}
          />
          <span style={{ color: '#888', fontSize: '0.85rem', minWidth: '40px', textAlign: 'right' }}>{maxDisponivel}</span>
        </div>

        {/* Preview */}
        <div className="mercado-preview">
          <div className="mercado-preview-item">
            <div className="label">Enviar</div>
            <div className="val" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <Image src={ICONE_RECURSO[de]} alt={de} width={20} height={20} />
              -{quantidade}
            </div>
          </div>
          <div className="mercado-preview-item">
            <div className="label">Receber</div>
            <div className="val" style={{ color: '#52b788', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <Image src={ICONE_RECURSO[para]} alt={para} width={20} height={20} />
              +{quantidadeRecebida}
            </div>
          </div>
        </div>

        {/* Botão */}
        <button
          className="mercado-btn"
          disabled={quantidade <= 0 || de === para || quantidadeRecebida <= 0}
          onClick={handleTrocar}
        >
          🏛️ Trocar {quantidade} {NOME_RECURSO[de]} por {quantidadeRecebida} {NOME_RECURSO[para]}
        </button>
      </div>

      {/* Tabela de taxas */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid #2a2a3a',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <h4 style={{ color: '#D4AF37', margin: '0 0 10px', fontSize: '0.85rem' }}>📊 Tabela de Taxas</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: '#888' }}>
              <th style={{ padding: '4px 8px', textAlign: 'left' }}>De → Para</th>
              {TIPOS_RECURSO.map(t => (
                <th key={t} style={{ padding: '4px 8px', textAlign: 'center' }}>
                  <Image src={ICONE_RECURSO[t]} alt={t} width={16} height={16} style={{ verticalAlign: 'middle' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIPOS_RECURSO.map(origem => (
              <tr key={origem}>
                <td style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image src={ICONE_RECURSO[origem]} alt={origem} width={16} height={16} />
                  {NOME_RECURSO[origem]}
                </td>
                {TIPOS_RECURSO.map(destino => {
                  const taxa = TAXAS_MERCADO[origem][destino] * bonusMercado;
                  const cor = origem === destino ? '#555' : taxa >= 1 ? '#52b788' : '#f59e0b';
                  return (
                    <td key={destino} style={{ padding: '4px 8px', textAlign: 'center', color: cor, fontWeight: 600 }}>
                      {origem === destino ? '—' : `${(taxa * 100).toFixed(0)}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
