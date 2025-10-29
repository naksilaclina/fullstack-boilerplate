import type { Request, Response, NextFunction } from "express";

export interface IFlowResults<
  StatusType = number,
  ResponseType = object | undefined
> {
  status: StatusType;
  body: ResponseType;
}

export type RouteFlowType<ParamsType, FlowResultsType extends IFlowResults> = (
  params: ParamsType
) => Promise<FlowResultsType> | FlowResultsType;

export type ParamsMiddelewareType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export type GetParamsType<T> = (req: Request) => T;

export interface IRouteParams<ParamsType> {
  middleware: ParamsMiddelewareType[];
  getParams: GetParamsType<ParamsType>;
}

export interface IRoute<ParamsType, FlowResultsType extends IFlowResults> {
  flow: RouteFlowType<ParamsType, FlowResultsType>;
  params: IRouteParams<ParamsType>;
}
