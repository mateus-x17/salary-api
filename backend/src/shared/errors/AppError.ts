/**
 * @description Classe customizada de erros da aplicação para evitar vazar stack traces e padronizar o código de erro retornado.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'BAD_REQUEST', statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
