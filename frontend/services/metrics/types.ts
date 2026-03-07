export interface DealsOverTimeItem {
  date: string;
  count: number;
  value: number;
}

export interface DealsOverTimeResponse {
  data: DealsOverTimeItem[];
}

export interface DealsOverTimeParams {
  days?: number;
}
