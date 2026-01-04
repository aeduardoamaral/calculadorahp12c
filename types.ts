
export type ShiftMode = 'none' | 'f' | 'g';

export interface TVMMemory {
  n: number;
  i: number;
  pv: number;
  pmt: number;
  fv: number;
}

export interface HPState {
  stack: number[]; // RPN Stack [X, Y, Z, T]
  lastX: number;
  memory: TVMMemory;
  display: string;
  isEntering: boolean;
  shift: ShiftMode;
  precision: number;
  isOn: boolean; // Estado de energia
}
