
import React, { useState, useCallback } from 'react';
import { HPState, TVMMemory } from './types';
import { formatDisplay, calculateTVM } from './services/hp12cEngine';

const INITIAL_STATE: HPState = {
  stack: [0, 0, 0, 0], // [X, Y, Z, T]
  lastX: 0,
  memory: { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 },
  display: '0,00',
  isEntering: false,
  shift: 'none',
  precision: 2
};

const HPKey = ({ 
  f, main, g, onClick, variant = "dark", isEnter = false, className = ""
}: { 
  f?: string, main: string, g?: string, onClick: () => void, variant?: "dark" | "gold" | "blue", isEnter?: boolean, className?: string
}) => {
  const getVariantClass = () => {
    if (variant === "gold") return "key-gold";
    if (variant === "blue") return "key-blue";
    return "";
  };

  return (
    <div className={`flex flex-col items-center justify-end h-full w-full ${isEnter ? 'row-span-2' : ''} ${className}`}>
      {f && <span className="text-[#d4af37] mb-0.5 h-3 text-[6px] sm:text-[7px] md:text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center leading-none">{f}</span>}
      <button 
        onClick={onClick} 
        className={`key-3d w-full ${isEnter ? 'h-[96%]' : 'h-10 md:h-12'} ${getVariantClass()} flex items-center justify-center transition-all active:scale-90 active:brightness-125`}
      >
        <span className={`text-[8px] sm:text-[9px] md:text-[11px] font-black tracking-tighter ${variant !== 'dark' ? 'text-black' : 'text-white'}`}>
          {main}
        </span>
      </button>
      {g && <span className="text-[#38bdf8] mt-0.5 h-3 text-[6px] sm:text-[7px] md:text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center leading-none">{g}</span>}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<HPState>(INITIAL_STATE);

  const getDisplayValue = (val: number, precision: number) => formatDisplay(val, precision).replace('.', ',');

  // Lógica RPN: Push da pilha
  const pushStack = (val: number, currentStack: number[]) => {
    return [val, currentStack[0], currentStack[1], currentStack[2]];
  };

  // Lógica RPN: Pop da pilha (após operação binária)
  const dropStack = (res: number, currentStack: number[]) => {
    // [X, Y, Z, T] -> [Res, Z, T, T] (T é duplicado no topo na HP 12C)
    return [res, currentStack[2], currentStack[3], currentStack[3]];
  };

  const handleDigit = (digit: string) => {
    // f + dígito = Alterar precisão decimal
    if (state.shift === 'f') {
      const p = parseInt(digit);
      if (!isNaN(p)) {
        setState(prev => ({
          ...prev,
          precision: p,
          display: getDisplayValue(prev.stack[0], p),
          shift: 'none'
        }));
        return;
      }
    }

    setState(prev => {
      let newStack = [...prev.stack];
      let newDisplayStr = '';

      if (!prev.isEntering) {
        // Se não está entrando, o X atual vai para Y
        newStack = [0, prev.stack[0], prev.stack[1], prev.stack[2]];
        newDisplayStr = digit === '.' ? '0.' : digit;
      } else {
        let currentStr = prev.display.replace(/\./g, '').replace(',', '.');
        if (digit === '.' && currentStr.includes('.')) return prev;
        newDisplayStr = currentStr === '0' && digit !== '.' ? digit : currentStr + digit;
      }

      if (newDisplayStr.length > 12) return prev;

      const newVal = parseFloat(newDisplayStr);
      newStack[0] = newVal;

      return {
        ...prev,
        display: newDisplayStr.replace('.', ','),
        isEntering: true,
        stack: newStack,
        shift: 'none'
      };
    });
  };

  const handleEnter = () => {
    setState(prev => ({
      ...prev,
      stack: [prev.stack[0], prev.stack[0], prev.stack[1], prev.stack[2]],
      isEntering: false,
      shift: 'none',
      display: getDisplayValue(prev.stack[0], prev.precision)
    }));
  };

  const handleArithmetic = (op: string) => {
    setState(prev => {
      const x = prev.stack[0];
      const y = prev.stack[1];
      let res = 0;
      switch(op) {
        case '+': res = y + x; break;
        case '-': res = y - x; break;
        case '*': res = y * x; break;
        case '/': res = x !== 0 ? y / x : 0; break;
        case 'pow': res = Math.pow(y, x); break;
      }
      return {
        ...prev,
        stack: dropStack(res, prev.stack),
        display: getDisplayValue(res, prev.precision),
        lastX: x,
        isEntering: false,
        shift: 'none'
      };
    });
  };

  const handleTVM = (key: keyof TVMMemory) => {
    setState(prev => {
      const x = prev.stack[0];
      
      if (prev.shift === 'g') {
        let newVal = prev.memory[key];
        if (key === 'n') newVal = x * 12;
        if (key === 'i') newVal = x / 12;
        return {
          ...prev,
          memory: { ...prev.memory, [key]: newVal },
          stack: [newVal, prev.stack[1], prev.stack[2], prev.stack[3]],
          display: getDisplayValue(newVal, prev.precision),
          shift: 'none',
          isEntering: false
        };
      }

      if (prev.isEntering) {
        return {
          ...prev,
          memory: { ...prev.memory, [key]: x },
          isEntering: false,
          shift: 'none'
        };
      } else {
        const solved = calculateTVM(prev.memory, key);
        return {
          ...prev,
          stack: [solved, prev.stack[1], prev.stack[2], prev.stack[3]],
          memory: { ...prev.memory, [key]: solved },
          display: getDisplayValue(solved, prev.precision),
          shift: 'none',
          isEntering: false
        };
      }
    });
  };

  const handleSpecial = (type: string) => {
    setState(prev => {
      let x = prev.stack[0];
      let res = x;
      switch(type) {
        case 'chs': res = x * -1; break;
        case 'sqrt': res = Math.sqrt(x); break;
        case 'inv': res = 1 / x; break;
        case 'ln': res = Math.log(x); break;
        case 'exp': res = Math.exp(x); break;
        case 'fact': 
          const f = (n: number): number => n <= 1 ? 1 : n * f(n - 1);
          res = f(Math.floor(x));
          break;
      }
      const newStack = [...prev.stack];
      newStack[0] = res;
      return {
        ...prev,
        stack: newStack,
        display: getDisplayValue(res, prev.precision),
        shift: 'none',
        isEntering: false
      };
    });
  };

  const handleClear = () => {
    setState(prev => {
      if (prev.shift === 'f') return INITIAL_STATE;
      const newStack = [...prev.stack];
      newStack[0] = 0;
      return { ...prev, stack: newStack, display: getDisplayValue(0, prev.precision), isEntering: false, shift: 'none' };
    });
  };

  return (
    <div className="flex items-center justify-center p-2 min-h-screen w-full bg-zinc-200">
      <div className="calc-wrapper">
        <div className="brushed-metal w-[360px] sm:w-[500px] md:w-[760px] lg:w-[940px] p-4 md:p-10 rounded-[20px] shadow-2xl border-b-4 border-black/50">
          
          {/* Topo / Marca / Display */}
          <div className="flex justify-between items-start mb-6 md:mb-10 px-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 md:gap-8">
                <h1 className="text-[#c5a059] italic text-3xl md:text-5xl font-[900] tracking-tighter leading-none flex items-baseline select-none">
                  hp <span className="text-xl md:text-3xl ml-2 not-italic font-bold text-gray-500">12c</span>
                </h1>
                <div className="flex flex-col items-center bg-black/60 px-3 py-1 rounded border border-white/5">
                   <div className="led-active"></div>
                   <span className="text-[6px] text-green-500 font-bold uppercase mt-1 tracking-widest">Active</span>
                </div>
              </div>
              <p className="text-[7px] md:text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-3 opacity-60">Platinum Financial Calculator</p>
            </div>
            
            <div className="lcd-display w-[160px] sm:w-[240px] md:w-[420px] h-16 md:h-28 rounded-lg flex flex-col justify-center items-end px-3 md:px-8">
              <div className="flex justify-between w-full text-[8px] md:text-[11px] font-black text-black/60 mb-0.5 md:mb-1.5">
                <div className="flex gap-4 md:gap-8">
                  <span className={state.shift === 'f' ? 'text-black opacity-100' : 'opacity-5'}>f</span>
                  <span className={state.shift === 'g' ? 'text-black opacity-100' : 'opacity-5'}>g</span>
                </div>
                <span className="opacity-10 font-mono tracking-tighter">AUTHENTIC RPN</span>
              </div>
              <span className="text-2xl sm:text-3xl md:text-6xl font-bold font-mono tracking-tighter text-[#141d14] leading-none select-none">
                {state.display}
              </span>
            </div>
          </div>

          {/* Keypad Grid (Layout 10 Colunas) */}
          <div className="grid grid-cols-10 gap-x-1 sm:gap-x-2 md:gap-x-3 gap-y-2 sm:gap-y-4 md:gap-y-6">
            
            {/* LINHA 1: n | i | PV | PMT | FV | CHS | 7 | 8 | 9 | ÷ */}
            <HPKey f="AMORT" main="n" g="12x" onClick={() => handleTVM('n')} />
            <HPKey f="INT" main="i" g="12÷" onClick={() => handleTVM('i')} />
            <HPKey f="NPV" main="PV" g="CF0" onClick={() => handleTVM('pv')} />
            <HPKey f="IRR" main="PMT" g="CFj" onClick={() => handleTVM('pmt')} />
            <HPKey f="PV" main="FV" g="Nj" onClick={() => handleTVM('fv')} />
            <HPKey f="BEG" main="CHS" g="END" onClick={() => handleSpecial('chs')} />
            <HPKey main="7" onClick={() => handleDigit('7')} />
            <HPKey main="8" onClick={() => handleDigit('8')} />
            <HPKey main="9" onClick={() => handleDigit('9')} />
            <HPKey main="÷" onClick={() => handleArithmetic('/')} />

            {/* LINHA 2: y^x | 1/x | %T | Δ% | % | EEX | 4 | 5 | 6 | × */}
            <HPKey f="yˣ" main="yˣ" g="√x" onClick={() => state.shift === 'g' ? handleSpecial('sqrt') : handleArithmetic('pow')} />
            <HPKey f="x!" main="1/x" g="eˣ" onClick={() => state.shift === 'g' ? handleSpecial('exp') : (state.shift === 'f' ? handleSpecial('fact') : handleSpecial('inv'))} />
            <HPKey f="Σ" main="%T" g="LN" onClick={() => state.shift === 'g' ? handleSpecial('ln') : {}} />
            <HPKey f="x<>y" main="Δ%" g="FRAC" onClick={() => {}} />
            <HPKey f="%" main="%" g="INTG" onClick={() => {}} />
            <HPKey f="PRGM" main="EEX" g="PSE" onClick={() => {}} />
            <HPKey main="4" onClick={() => handleDigit('4')} />
            <HPKey main="5" onClick={() => handleDigit('5')} />
            <HPKey main="6" onClick={() => handleDigit('6')} />
            <HPKey main="×" onClick={() => handleArithmetic('*')} />

            {/* LINHA 3: R↓ | x<>y | CLX | STO | RCL | ENTER | 1 | 2 | 3 | - */}
            <HPKey f="P/R" main="R↓" g="BST" onClick={() => {
              const [x, y, z, t] = state.stack;
              setState(p => ({ ...p, stack: [y, z, t, x], display: getDisplayValue(y, p.precision), isEntering: false }));
            }} />
            <HPKey f="Σ-" main="x<>y" g="GTO" onClick={() => {
              const [x, y, z, t] = state.stack;
              setState(p => ({ ...p, stack: [y, x, z, t], display: getDisplayValue(y, p.precision), isEntering: false }));
            }} />
            <HPKey f="CLEAR" main="CLX" g="x≤y" onClick={handleClear} />
            <HPKey f="REG" main="STO" g="x=0" onClick={() => {}} />
            <HPKey f="PREFIX" main="RCL" g="x≠0" onClick={() => {}} />
            <HPKey main="ENTER" isEnter onClick={handleEnter} className="z-10" />
            <HPKey main="1" onClick={() => handleDigit('1')} />
            <HPKey main="2" onClick={() => handleDigit('2')} />
            <HPKey main="3" onClick={() => handleDigit('3')} />
            <HPKey main="-" onClick={() => handleArithmetic('-')} />

            {/* LINHA 4: ON | f | g | (blank) | (blank) | (ENTER BOT) | 0 | . | Σ+ | + */}
            <HPKey main="ON" onClick={() => setState(INITIAL_STATE)} />
            <HPKey main="f" variant="gold" onClick={() => setState(p => ({...p, shift: p.shift === 'f' ? 'none' : 'f'}))} />
            <HPKey main="g" variant="blue" onClick={() => setState(p => ({...p, shift: p.shift === 'g' ? 'none' : 'g'}))} />
            <div className="col-span-1"></div> {/* Spacer */}
            <div className="col-span-1"></div> {/* Spacer */}
            {/* O slot da coluna 6 é ocupado pelo row-span do ENTER, não precisa de div aqui se o grid fluir certo */}
            <HPKey main="0" onClick={() => handleDigit('0')} />
            <HPKey main="." onClick={() => handleDigit('.')} />
            <HPKey main="Σ+" onClick={() => {}} />
            <HPKey main="+" onClick={() => handleArithmetic('+')} />
          </div>

          <div className="mt-8 md:mt-12 pt-4 border-t border-white/5 flex justify-between items-center opacity-30 select-none">
            <span className="text-[8px] md:text-[12px] text-white font-black uppercase tracking-[0.8em]">Hewlett-Packard</span>
            <div className="flex gap-4">
               <div className="w-1.5 h-1.5 rounded-full bg-white/10 shadow-inner"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-white/10 shadow-inner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
