import { PerRequestContext } from './per-request-context';
import { NextApiRequest, NextApiResponse } from 'next';

export type ApiRouteHandler = (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext) => Promise<void>;
export type ApiRouteMiddleware = (req: NextApiRequest, res: NextApiResponse, context: PerRequestContext, next: () => Promise<void>) => Promise<void>;

export type ApiRouteMethods = 'post' | 'get' | 'patch' | 'delete';
