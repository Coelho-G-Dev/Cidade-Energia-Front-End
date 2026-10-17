export type Bairro = { id: string; nome: string };

export type Escola = { id: string; nome: string; bairro_id: string };

export type Aparelho = {
  id: string;
  codigo: string;
  nome: string;
  potencia_w: number;
  horas_padrao: number;
  icone: string | null;
};
