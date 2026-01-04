
export type ShiftMode = 'none' | 'f' | 'g';

export interface HPState {
  stack: number[]; // RPN Stack [X, Y, Z, T]
  lastX: number;
  memory: {
    n: number;
    i: number;
    pv: number;
    pmt: number;
    fv: number;
  };
  display: string;
  isEntering: boolean;
  shift: ShiftMode;
}

export interface CalculationHistory {
  formula: string;
  result: number;
  timestamp: number;
}
