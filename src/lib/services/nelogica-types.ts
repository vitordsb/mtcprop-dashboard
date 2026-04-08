export interface NelogicaBaseResponse {
  status: string;
  msg: string;
  [key: string]: unknown;
}

export interface NelogicaModernResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
}

export interface NelogicaClientStatusResponse extends NelogicaBaseResponse {
  cpf_cnpj: string;
  produtos: string | null;
  nUsuarioID: string | null;
  nEnderecoID: string | null;
}

export interface NelogicaSignedPointResponse extends NelogicaBaseResponse {
  activationCode?: string;
}

export interface NelogicaValidClientResponse {
  documento?: string;
  document?: string;
  email: string | null;
  executeLoginAllowed: "true" | "false";
  usePreviousEmail: "true" | "false";
}

export type NelogicaSuitabilityProfile = 1 | 2 | 3 | 5; // 1 = Agressivo, 2 = Moderado, 3 = Conservador, 5 = Vencido

export interface NelogicaPrefixBatchItem {
  contaID: string;
  bolsa: 'B' | 'F';
  prefix: string;
  margin?: number;
  qtdPerOrder?: number;
  longQtdPosition?: number;
  shortQtdPosition?: number;
}

export interface NelogicaBrokerAccount {
  contaID: string;
  nomeTitular: string;
  bSoftDolar?: string;
  dtAtualizacao?: string;
  plataforma?: string;
  dtInicioPlataforma?: string;
}

export interface NelogicaFinancialResultItem {
  strContaID: string;
  dtResultado: string;
  fResultadoFinanceiro: string;
  bPosicaoAberto?: string;
}
