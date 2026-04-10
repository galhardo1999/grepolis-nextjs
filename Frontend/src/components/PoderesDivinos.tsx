"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { DEUSES, IdDeus, PODERES_DIVINOS } from '@/lib/deuses';
import { useToast } from '@/components/ToastProvider';

interface PoderDivinoProps {
  idDeusAtual: IdDeus | null;
  favor: number;
  favorMaximo: number;
  nivelTemplo: number;
  aoSelecionarDeus: (idDeus: IdDeus) => { sucesso: boolean; motivo?: string } | void;
  aoLancarPoder: (idPoder: string) => { sucesso: boolean; motivo?: string };
}

export const PoderDivino = React.memo(function PoderDivino({ idDeusAtual, favor, favorMaximo, nivelTemplo, aoSelecionarDeus, aoLancarPoder }: PoderDivinoProps) {
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [menuPoderAberto, setMenuPoderAberto] = useState(false);
  const { mostrarToast } = useToast();
  const deusAtual = idDeusAtual ? DEUSES[idDeusAtual] : null;
  const poderes = idDeusAtual ? PODERES_DIVINOS[idDeusAtual] : [];

  const handleSelecionar = (id: IdDeus) => {
    const resp = aoSelecionarDeus(id);
    if (resp && typeof resp === 'object') {
      if (!resp.sucesso) {
        mostrarToast(resp.motivo || 'Erro ao selecionar deus', 'erro', '❌');
        return;
      }
      mostrarToast(`${DEUSES[id].nome} agora protege sua cidade!`, 'sucesso', '⚡');
    }
    setSeletorAberto(false);
  };

  const handleLancar = (idPoder: string) => {
    const resultado = aoLancarPoder(idPoder);
    if (resultado.sucesso) {
      setMenuPoderAberto(false);
    } else {
      mostrarToast(resultado.motivo || 'Erro ao lançar', 'erro', '❌');
    }
  };

  return (
    <>
      <div className="divine-powers-container">
        <div className="god-portrait-wrapper">
          <div className="portrait-frame" onClick={() => {
            if (nivelTemplo < 1) {
              mostrarToast('Construa o Templo Nv. 1 para escolher um deus!', 'aviso', '🏛️');
              return;
            }
            setSeletorAberto(true);
          }} title={deusAtual ? "Trocar de Deus" : "Selecionar Deus"}>
            <span className="alterar-label">{deusAtual ? "Alterar" : "Selecionar"}</span>
          </div>
          <Image
            src={deusAtual ? deusAtual.retrato : '/deuses/deus_vazio.png'}
            alt={deusAtual ? deusAtual.nome : 'Sem Deus'}
            width={110}
            height={110}
            className="portrait-img"
            style={{ opacity: deusAtual ? 1 : 0.5, filter: deusAtual ? 'none' : 'grayscale(1)' }}
          />
          <div className="favor-meter" onClick={() => deusAtual && setMenuPoderAberto(!menuPoderAberto)} title="Poderes Divinos" style={{ cursor: deusAtual ? 'pointer' : 'not-allowed' }}>
            <span className="bolt-icon">⚡</span>
            <span className="value">{Math.floor(favor)}</span>
          </div>

          {menuPoderAberto && deusAtual && (
            <div className="powers-popover">
              <h3>Poderes de {deusAtual.nome}</h3>
              <div className="powers-list">
                {poderes.map((p) => {
                  const possuiFavor = favor >= p.custo;
                  return (
                    <div key={p.id} className={`power-item ${!possuiFavor ? 'disabled' : ''}`}>
                      <div className="power-icon">{p.icone}</div>
                      <div className="power-info">
                        <div className="power-header">
                          <span className="power-name">{p.nome}</span>
                          <span className="power-cost">⚡ {p.custo}</span>
                        </div>
                        <p className="power-desc">{p.descricao}</p>
                        <button 
                          className="cast-btn" 
                          disabled={!possuiFavor}
                          onClick={() => handleLancar(p.id)}
                        >
                          Lançar Poder
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {seletorAberto && (
        <div className="god-selector-overlay" onClick={() => setSeletorAberto(false)}>
          <div className="god-grid" onClick={(e) => e.stopPropagation()}>
            {(Object.keys(DEUSES) as IdDeus[]).map((id) => {
              const deus = DEUSES[id];
              return (
                <div
                  key={id}
                  className={`god-card ${id === idDeusAtual ? 'active' : ''}`}
                  onClick={() => handleSelecionar(id)}
                >
                  <Image src={deus.retrato} alt={deus.nome} width={100} height={100} />
                  <h4>{deus.nome}</h4>
                  <p>{deus.descricao}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
});
