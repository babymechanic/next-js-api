import { PerRequestContext } from './per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';

export type ApiRouteHandler = (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) => unknown;
export type ApiRouteMiddleware = ApiRouteHandler;

export type ApiRouteMethods = 'post' | 'get' | 'patch' | 'delete' | 'options';
