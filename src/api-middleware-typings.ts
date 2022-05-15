import { PerRequestContext } from './per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';

export type ApiRouteHandler = (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) => Promise<unknown>;
export type ApiRouteMiddleware = ApiRouteHandler;

export type Methods = 'post' | 'get' | 'patch' | 'delete' | 'options';
