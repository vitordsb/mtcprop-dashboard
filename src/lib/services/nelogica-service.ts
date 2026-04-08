import { NelogicaClient } from "./nelogica-client";
import {
  NelogicaBaseResponse,
  NelogicaBrokerAccount,
  NelogicaClientStatusResponse,
  NelogicaFinancialResultItem,
  NelogicaPrefixBatchItem,
  NelogicaSignedPointResponse,
  NelogicaSuitabilityProfile,
} from "./nelogica-types";

/**
 * Serviço responsável pelas abstrações de domínio em relação à API Nelogica.
 * Contém casos de uso específicos que a MTCprop precisa para operar.
 */
export const nelogicaService = {
  /**
   * Verifica o status de um CPF/CNPJ junto à Nelogica.
   * "0" = Plano cancelado por inadimplência (Não usar)
   * "1" = Não cadastrado
   * "2" = Ponto ativo na Nelogica (outra corretora)
   * "3" = Ponto ativo na própria corretora (MTCprop)
   * "4" = Já foi assinante/teste (Sem ponto ativo)
   */
  async checkClientStatus(documento: string): Promise<NelogicaClientStatusResponse> {
    return NelogicaClient.execute<NelogicaClientStatusResponse>("status_client", {
      cpf_cnpj: documento,
    });
  },

  async listBrokerAccounts(params?: {
    contaID?: string;
    nPage?: number;
    nRows?: number;
    softDolar?: 0 | 1;
  }): Promise<NelogicaBrokerAccount[]> {
    return NelogicaClient.execute<NelogicaBrokerAccount[]>("list_broker_accounts", {
      contaID: params?.contaID,
      nPage: params?.nPage ?? 0,
      nRows: params?.nRows ?? 100,
      softDolar: params?.softDolar ?? 1,
    });
  },

  async listFinancialResults(params: {
    contaID: string;
    dtInicio?: string;
    dtFinal?: string;
    nPage?: number;
    nRows?: number;
  }): Promise<NelogicaFinancialResultItem[]> {
    return NelogicaClient.execute<NelogicaFinancialResultItem[]>("list_resultado_financeiro", {
      contaID: params.contaID,
      dtInicio: params.dtInicio,
      dtFinal: params.dtFinal,
      nPage: params.nPage ?? 0,
      nRows: params.nRows ?? 500,
    });
  },

  /**
   * Registra uma nova licença de acesso ao Profit (Profit Pro por padrão)
   */
  async cadastrarPonto(params: {
    cpf_cnpj: string;
    nome: string;
    sobrenome: string;
    cep: string;
    estado: string;
    cidade: string;
    bairro: string;
    logradouro: string;
    numero: string;
    email: string;
    dataNascimento: string; // DD/MM/YYYY
    sexo: 0 | 1; // 0 = Fem, 1 = Masc
    titularConta: string;
    contaID: string;
    planoAssinaturaID: number;
    produto?: string; // rt, pro, lite, ultra
  }): Promise<NelogicaSignedPointResponse> {
    return NelogicaClient.execute<NelogicaSignedPointResponse>("insere_ponto_assinado", {
      pessoaFisica: 1, // Fixado PF por enquanto
      produto: params.produto || "pro",
      conta: params.contaID,
      planoassinatura: params.planoAssinaturaID,
      ...params,
    });
  },

  /**
   * Cancela a licença ativa de um cliente
   */
  async cancelarPonto(cpf_cnpj: string, produto: string = "pro"): Promise<NelogicaBaseResponse> {
    return NelogicaClient.execute<NelogicaBaseResponse>("cancel_product", {
      cpf_cnpj,
      produto,
    });
  },

  /**
   * Habilita módulo simulador
   */
  async habilitarSimulador(documento: string): Promise<NelogicaBaseResponse> {
    return NelogicaClient.execute<NelogicaBaseResponse>("add_modulo", {
      documento,
      modulo: "simulador",
    });
  },

  /**
   * Desabilita módulo simulador
   */
  async cancelarSimulador(documento: string): Promise<NelogicaBaseResponse> {
    return NelogicaClient.execute<NelogicaBaseResponse>("cancel_modulo", {
      documento,
      modulo: "simulador",
    });
  },

  /**
   * Define os limites de risco base de uma conta.
   */
  async configurarRiscoConta(params: {
    contaID: string;
    grupo: string; // Ex: "PADRAO"
    dailyLoss: number; // Perda máxima em valor absoluto
    maxContratosTotais: number; // Ex: 10
  }): Promise<NelogicaBaseResponse> {
    // Usando regras genéricas para MTCprop
    return NelogicaClient.execute<NelogicaBaseResponse>("risco_conta", {
      contaID: params.contaID,
      grupo: params.grupo,
      habilitado: 1,
      dailyLoss: params.dailyLoss,
      // Estes parâmetros variam de acordo com o plano
      capitalPerOrder: params.maxContratosTotais * 1000, 
      longCapitalPosition: params.maxContratosTotais * 1000,
      shortCapitalPosition: params.maxContratosTotais * 1000,
    });
  },

  /**
   * Configura limites de contratos em lote (WIN, WDO, etc)
   */
  async configurarRiscoPrefixosLote(batch: NelogicaPrefixBatchItem[]): Promise<NelogicaBaseResponse> {
    return NelogicaClient.execute<NelogicaBaseResponse>("risco_prefix_conta", {
      batchRequest: batch,
    });
  },

  /**
   * Atualiza perfil do investidor (1 = Agressivo é o padrao p/ futuros)
   */
  async updateSuitability(contaID: string, perfil: NelogicaSuitabilityProfile = 1): Promise<NelogicaBaseResponse> {
    return NelogicaClient.execute<NelogicaBaseResponse>("update_suitability", {
      contaID,
      perfil,
    });
  },
};
