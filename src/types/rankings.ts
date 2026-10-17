export type TipoRanking = "bairros" | "escolas";

export type ItemRanking = {
  id: string;
  nome: string;
  bairroId?: string;
  pontos: number;
  participantes: number;
  posicao: number;
};

export type TipoPontoMapa = "solar" | "coleta" | "acao";

export type PontoMapa = {
  id: string;
  nome: string;
  tipo: TipoPontoMapa;
  latitude: number;
  longitude: number;
  descricao: string;
};
