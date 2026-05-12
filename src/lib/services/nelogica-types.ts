// ─────────────────────────────────────────────────────────────
// Tipos base compartilhados (autenticação, legacy broker)
// ─────────────────────────────────────────────────────────────

export interface NelogicaBaseResponse {
  status: string;
  msg: string;
  [key: string]: unknown;
}

/**
 * Resposta padrão dos endpoints da API Mesa Proprietária.
 * Usada por prop_trading_user_subscription e prop_trading_cancel_user_subscription.
 */
export interface PropTradingModernResponse {
  success: boolean;
  code: number;
  message: string;
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

export type NelogicaSuitabilityProfile = 1 | 2 | 3 | 5; // 1=Agressivo, 2=Moderado, 3=Conservador, 5=Vencido

export interface NelogicaPrefixBatchItem {
  contaID: string;
  bolsa: "B" | "F";
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

// ─────────────────────────────────────────────────────────────
// API Mesa Proprietária (APICadastroMesasProp)
// Endpoints: prop_trading_*
// ─────────────────────────────────────────────────────────────

/**
 * Item retornado pelo endpoint prop_trading_list_user_subscription.
 *
 * Representa uma subconta de trader ativa na mesa proprietária.
 * - `account`      → conta master da mesa (ex: conta da MTCprop na Nelogica)
 * - `subAccount`   → subconta do trader ligada à conta master
 * - `document`     → CPF/CNPJ do trader
 */
export interface PropTradingSubscription {
  /** CPF ou CNPJ do trader */
  document: string;
  /** Nome do produto (ex: "Profit Plus") */
  product: string;
  /** Código de ativação da licença */
  activationCode: string;
  /** ID do plano contratado */
  subscriptionPlanId: string;
  /** Nome do plano contratado (ex: "SoftDolar Plus") */
  subscriptionPlanName: string;
  /** Data de criação da subconta — "YYYY-MM-DD HH:mm:ss" */
  createdAt: string;
  /** Número da conta master (da mesa proprietária) */
  account: string;
  /** Nome do titular da conta master */
  accountHolder: string;
  /** Número da subconta do trader */
  subAccount: string;
  /** Nome do titular da subconta (trader) */
  subAccountHolder: string;
}

/**
 * Parâmetros para cadastrar uma subconta de teste (trader).
 * Endpoint: prop_trading_user_subscription
 */
export interface PropTradingCreateParams {
  /** CPF ou CNPJ do trader */
  document: string;
  /** Tipo de pessoa: 0=PJ, 1=PF */
  naturalPerson?: 0 | 1;
  /** Tipo de occupação: 1=Profissional, 2=Não profissional (padrão) */
  occupationType?: 1 | 2;
  /** Tipo de documento: 1=CPF, 2=CNPJ */
  documentType?: 1 | 2;
  firstName: string;
  lastName: string;
  /** Data de nascimento: "YYYY-MM-DD" */
  dateOfBirth?: string;
  /** Gênero: 1=Masculino (padrão), 0=Feminino */
  gender?: 0 | 1;
  email: string;
  phoneNumber?: string;
  cellPhoneNumber?: string;
  businessPhoneNumber?: string;
  zipCode?: string;
  state?: string;
  city?: string;
  district?: string;
  street?: string;
  number?: string;
  complement?: string;
  /** Sigla do país com 3 letras. Ex: "BRA" */
  country?: string;
  /** Nome do perfil de risco da subconta */
  subAccountRiskPlanName?: string;
  /** ID do plano a contratar (obrigatório) */
  subscriptionPlanId: number;
  /**
   * Número da conta (subconta) a ser criada.
   * Nós geramos/atribuímos esse número e salvamos como nelogicaContaID.
   */
  testAccount: string;
  /** Token de autenticação da corretora */
  authenticationCode: string;
}

/**
 * Parâmetros para cancelar uma subconta de trader.
 * Endpoint: prop_trading_cancel_user_subscription
 */
export interface PropTradingCancelParams {
  document: string;
  subscriptionPlanId: number;
  /** Número da conta master da mesa */
  account: string;
  /**
   * Número da subconta do trader.
   * Se omitido, cancela TODAS as subcontas vinculadas à conta master.
   */
  testAccount?: string;
  authenticationCode: string;
}

/**
 * Parâmetros para listar subcontas de traders.
 * Endpoint: prop_trading_list_user_subscription
 */
export interface PropTradingListParams {
  /** Filtrar por CPF/CNPJ (opcional) */
  document?: string;
  /** Filtrar por ID de plano (opcional) */
  subscriptionPlanId?: number;
  /** Filtrar por conta master (opcional) */
  account?: string | null;
  /** Filtrar por subconta específica (opcional) */
  subAccount?: string;
  /** 1 = ativos (default), 0 = inativos */
  active?: 0 | 1;
  page?: number;
  perPage?: number;
  authenticationCode: string;
}
