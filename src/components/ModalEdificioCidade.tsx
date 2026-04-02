import { IdEdificio, EDIFICIOS } from '@/lib/edificios';

interface ModalEdificioCidadeProps {
  edificios: Record<string, number>;
  aoClicarEdificio: (id: IdEdificio) => void;
}

export function ModalEdificioCidade({ edificios, aoClicarEdificio }: ModalEdificioCidadeProps) {
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
      
      <div className="building-slot senate" id="slot-senate" onClick={() => aoClicarEdificio('senate')}>
        {renderLabel('senate', 'Senado')}
      </div>
      
      <div className="building-slot timber-camp" id="slot-timber" onClick={() => aoClicarEdificio('timber-camp')}>
        {renderLabel('timber-camp', 'Bosque')}
      </div>
      
      <div className="building-slot quarry" id="slot-quarry" onClick={() => aoClicarEdificio('quarry')}>
        {renderLabel('quarry', 'Pedreira')}
      </div>
      
      <div className="building-slot silver-mine" id="slot-silver" onClick={() => aoClicarEdificio('silver-mine')}>
        {renderLabel('silver-mine', 'Mina de Prata')}
      </div>

      <div className="building-slot farm" id="slot-farm" onClick={() => aoClicarEdificio('farm')}>
        {renderLabel('farm', 'Quinta')}
      </div>

      <div className="building-slot warehouse" id="slot-warehouse" onClick={() => aoClicarEdificio('warehouse')}>
        {renderLabel('warehouse', 'Armazém')}
      </div>

      <div className="building-slot barracks" id="slot-barracks" onClick={() => aoClicarEdificio('barracks')}>
        {renderLabel('barracks', 'Quartel')}
      </div>

      <div className="building-slot temple" id="slot-temple" onClick={() => aoClicarEdificio('temple')}>
        {renderLabel('temple', 'Templo')}
      </div>

      <div className="building-slot market" id="slot-market" onClick={() => aoClicarEdificio('market')}>
        {renderLabel('market', 'Mercado')}
      </div>

      <div className="building-slot harbor" id="slot-harbor" onClick={() => aoClicarEdificio('harbor')}>
        {renderLabel('harbor', 'Porto')}
      </div>

      <div className="building-slot academy" id="slot-academy" onClick={() => aoClicarEdificio('academy')}>
        {renderLabel('academy', 'Academia')}
      </div>

      <div className="building-slot walls" id="slot-walls" onClick={() => aoClicarEdificio('walls')}>
        {renderLabel('walls', 'Muralha')}
      </div>

      <div className="building-slot cave" id="slot-cave" onClick={() => aoClicarEdificio('cave')}>
        {renderLabel('cave', 'Gruta')}
      </div>
    </main>
  );
}
