import type { APIConfig } from './types';

export abstract class BaseAPIClient {
  protected config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  protected async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(endpoint, this.config.baseURL);

    // Adiciona parâmetros comuns
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        // DO NOT add 'Content-Type' for GET requests
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Tempo limite da requisição excedido');
        }
        throw error;
      }
      throw new Error('Ocorreu um erro desconhecido');
    }
  }

  protected handleAPIError(
    response: any,
    defaultMessage: string = 'Falha na requisição da API',
  ): never {
    if (response.Response === 'False') {
      throw new Error(response.Error || defaultMessage);
    }
    throw new Error(defaultMessage);
  }
}
