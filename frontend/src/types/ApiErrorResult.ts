export type ApiErrorResult = {
  status: number;
  payload: {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    [key: string]: unknown;
  };
};