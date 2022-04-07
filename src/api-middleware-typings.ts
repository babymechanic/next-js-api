import { User } from '@supabase/gotrue-js';
import { Knex } from 'knex';
import { NextApiRequest, NextApiResponse } from 'next';
import { ServiceResponse } from '../../services/common/contracts/service-response';
import { ParamConfig } from './query-param-middle-ware/param-config';

type MiddlewareResponse = { status: number, data: { message: string } };

export class PerRequestContext {

  private readonly _param: Readonly<{ [p: string]: string | string[] }>;
  private _paramTypes: { [p: string]: ParamConfig<unknown> };

  constructor(param: { [p: string]: string | string[] }) {
    this._param = Object.freeze({...param})
    this._paramTypes = {};
  }

  get param(): Readonly<{ [p: string]: string | string[] }> {
    return this._param;
  }

  assertIsLoggedIn(): void {
    if (this.user == null || this.jwt == null) throw new Error('login required');
  }

  user?: User;
  jwt?: string;
  private _transaction?: Knex.Transaction;
  private _knexConnection?: Knex;
  error: unknown;
  private _middlewareResponse: MiddlewareResponse | undefined;

  get transaction(): Knex.Transaction | undefined {
    return this._transaction;
  }

  async createTransaction(knexConnection: Knex): Promise<void> {
    this._knexConnection = knexConnection;
    this._transaction = await knexConnection.transaction();
  }

  get middlewareResponse(): MiddlewareResponse | undefined {
    return this._middlewareResponse;
  }

  set middlewareResponse(value: MiddlewareResponse | undefined) {
    if (this._middlewareResponse != null) throw new Error('middle ware response already set');
    this._middlewareResponse = value;
  }

  async destroy(): Promise<void> {
    if (this._transaction != null && !this._transaction.isCompleted()) {
      await this._transaction.rollback();
    }
    this._transaction?.destroy();
    await this._knexConnection?.destroy();
  }

  setQueryParamType(paramTypes: { [p: string]: ParamConfig<unknown> }): void {
    this._paramTypes = paramTypes
  }

  getParamValue<T>(queryParamKey: string): null | T {
    const paramType: ParamConfig<unknown> = this._paramTypes[queryParamKey];
    if (paramType == null) {
      throw new Error(`no definition for ${queryParamKey} in query params`);
    }
    const actualValue = this.param[queryParamKey];
    if (actualValue == null) return null;
    return paramType.type.parse(actualValue) as T;
  }

}

export type NoobApiRouteHandler = (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) => Promise<unknown>;

export type NoobApiService<TRequest, TResponse> = (req: TRequest, context: PerRequestContext) => Promise<ServiceResponse<TRequest, TResponse>>;

export type Methods = 'post' | 'get' | 'patch' | 'delete';
