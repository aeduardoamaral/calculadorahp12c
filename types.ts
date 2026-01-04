
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
  isEntering: boolean; // True quando o usuário está digitando
  shift: ShiftMode;
  precision: number; // Número de casas decimais (0-9)
}
