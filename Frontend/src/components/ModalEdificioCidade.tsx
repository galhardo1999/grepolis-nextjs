import { IdEdificio, EDIFICIOS } from '@/lib/edificios';
import React from 'react';

interface ModalEdificioCidadeProps {
  edificios: Record<string, number>;
  aoClicarEdificio: (id: IdEdificio) => void;
}

export const ModalEdificioCidade = React.memo(function ModalEdificioCidade({ edificios, aoClicarEdificio }: ModalEdificioCidadeProps) {
  const renderLabel = (id: IdEdificio, nome: string) => {
    const nivel = edificios[id] || 0;
    const max = (EDIFICIOS[id] as any).nivelMaximo;
    const textoNivel = nivel >= max ? '(NV. MAX)' : `(Nv. ${nivel})`;
    
    return (
      <div className="building-label">
        {nome} <span className="level">{textoNivel}</span>
      </div>
    );
  };

  return (
    <main id="city-view">
      <div id="city-background"></div>
      
      <div className="building-slot senado" id="slot-senado" onClick={() => aoClicarEdificio('senado')}>
        {renderLabel('senado', 'Senado')}
      </div>
      
      <div className="building-slot serraria" id="slot-serraria" onClick={() => aoClicarEdificio('serraria')}>
        {renderLabel('serraria', 'Serraria')}
      </div>
      
      <div className="building-slot pedreira" id="slot-pedreira" onClick={() => aoClicarEdificio('pedreira')}>
        {renderLabel('pedreira', 'Pedreira')}
      </div>
      
      <div className="building-slot mina-de-prata" id="slot-mina-de-prata" onClick={() => aoClicarEdificio('mina-de-prata')}>
        {renderLabel('mina-de-prata', 'Mina de Prata')}
      </div>

      <div className="building-slot fazenda" id="slot-fazenda" onClick={() => aoClicarEdificio('fazenda')}>
        {renderLabel('fazenda', 'Fazenda')}
      </div>

      <div className="building-slot armazem" id="slot-armazem" onClick={() => aoClicarEdificio('armazem')}>
        {renderLabel('armazem', 'Armazém')}
      </div>

      <div className="building-slot quartel" id="slot-quartel" onClick={() => aoClicarEdificio('quartel')}>
        {renderLabel('quartel', 'Quartel')}
      </div>

      <div className="building-slot templo" id="slot-templo" onClick={() => aoClicarEdificio('templo')}>
        {renderLabel('templo', 'Templo')}
      </div>

      <div className="building-slot mercado" id="slot-mercado" onClick={() => aoClicarEdificio('mercado')}>
        {renderLabel('mercado', 'Mercado')}
      </div>

      <div className="building-slot porto" id="slot-porto" onClick={() => aoClicarEdificio('porto')}>
        {renderLabel('porto', 'Porto')}
      </div>

      <div className="building-slot academia" id="slot-academia" onClick={() => aoClicarEdificio('academia')}>
        {renderLabel('academia', 'Academia')}
      </div>

      <div className="building-slot muralha" id="slot-muralha" onClick={() => aoClicarEdificio('muralha')}>
        {renderLabel('muralha', 'Muralha')}
      </div>

      <div className="building-slot gruta" id="slot-gruta" onClick={() => aoClicarEdificio('gruta')}>
        {renderLabel('gruta', 'Gruta')}
      </div>
    </main>
  );
});
