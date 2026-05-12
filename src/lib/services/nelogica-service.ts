import { NelogicaClient } from "./nelogica-client";
import {
  NelogicaBaseResponse,
  NelogicaBrokerAccount,
  NelogicaClientStatusResponse,
  NelogicaFinancialResultItem,
  NelogicaPrefixBatchItem,
  NelogicaSuitabilityProfile,
  PropTradingCancelParams,
  PropTradingCreateParams,
  PropTradingModernResponse,
  PropTradingSubscription,
} from "./nelogica-types";

/**
 * Serviço responsável pelas abstrações de domínio em relação à API Nelogica.
 * Contém casos de uso específicos que a MTCprop precisa para operar.
 *
 * A MTCprop utiliza o modelo de Mesa Proprietária (prop_trading_*):
 * - Uma conta master pertence à mesa
 * - Cada trader tem uma subconta (subAccount) vinculada à conta master
 */
export const nelogicaService = {
  // ─────────────────────────────────────────────────────────────
  // API Mesa Proprietária — endpoints prop_trading_*
  // ─────────────────────────────────────────────────────────────

  /**
   * Lista as subcontas de traders da mesa proprietária.
   *
   * Principal endpoint para popular a dashboard de Planos Ativos.
   * Uma única chamada retorna todos os traders ativos sem N+1.
   *
   * @param params.active       1 = ativas (default), 0 = inativas
   * @param params.document     Filtrar por CPF/CNPJ (opcional)
   * @param params.account      Filtrar por conta master (opcional)
   * @param params.subAccount   Filtrar por subconta específica (opcional)
   * @param params.page         Página (default 1)
   * @param params.perPage      Registros por página (default 1000, máx 1000)
   */
  async listPropTraders(params?: {
    document?: string;
    subscriptionPlanId?: number;
    account?: string | null;
    subAccount?: string;
    active?: 0 | 1;
    page?: number;
    perPage?: number;
  }): Promise<PropTradingSubscription[]> {
    const result = await NelogicaClient.execute<PropTradingSubscription[] | PropTradingModernResponse>(
      "prop_trading_list_user_subscription",
      {
        document: params?.document,
        subscriptionPlanId: params?.subscriptionPlanId,
        account: params?.account ?? null,
        subAccount: params?.subAccount,
        active: params?.active ?? 1,
        page: params?.page ?? 1,
        perPage: params?.perPage ?? 1000,
      },
    );

    // Sucesso → array; erro → objeto { success: false, code, message }
    return Array.isArray(result) ? result : [];
  },

  /**
   * Cadastra um trader como subconta de teste na mesa proprietária.
   *
   * O campo `testAccount` é o número da subconta sendo criada.
   * O campo `subscriptionPlanId` deve corresponder ao plano negociado pela MTCprop.
   *
   * Resposta de sucesso: { success: true, code: 200, message: "Operação concluída com sucesso." }
   */
  async cadastrarSubContaProp(
    params: Omit<PropTradingCreateParams, "authenticationCode">,
  ): Promise<PropTradingModernResponse> {
    return NelogicaClient.execute<PropTradingModernResponse>(
      "prop_trading_user_subscription",
      params,
    );
  },

  /**
   * Cancela a subconta de um trader na mesa proprietária.
   *
   * Se `testAccount` for omitido, cancela TODAS as subcontas
   * vinculadas à conta master informada.
   */
  async cancelarSubContaProp(
    params: Omit<PropTradingCancelParams, "authenticationCode">,
  ): Promise<PropTradingModernResponse> {
    return NelogicaClient.execute<PropTradingModernResponse>(
      "prop_trading_cancel_user_subscription",
      params,
    );
  },

  // ─────────────────────────────────────────────────────────────
  // Endpoints auxiliares (ainda utilizados pela dashboard)
  // ─────────────────────────────────────────────────────────────

  /**
   * Verifica o status de um CPF/CNPJ junto à Nelogica.
   * "0" = Plano cancelado por inadimplência
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
    grupo: string;
    dailyLoss: number;
    maxContratosTotais: number;
  }): Promise<NelogicaBaseResponse> {
    return NelogicaClient.execute<NelogicaBaseResponse>("risco_conta", {
      contaID: params.contaID,
      grupo: params.grupo,
      habilitado: 1,
      dailyLoss: params.dailyLoss,
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
   * Atualiza perfil do investidor (1 = Agressivo é o padrão p/ futuros)
   */
  async updateSuitability(
    contaID: string,
    perfil: NelogicaSuitabilityProfile = 1,
  ): Promise<NelogicaBaseResponse> {
    return NelogicaClient.execute<NelogicaBaseResponse>("update_suitability", {
      contaID,
      perfil,
    });
  },
};
