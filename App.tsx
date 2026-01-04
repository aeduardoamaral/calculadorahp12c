
import React, { useState, useEffect, useMemo } from 'react';
import { HPState, TVMMemory } from './types';
import { formatDisplay, calculateTVM } from './services/hp12cEngine';

const INITIAL_STATE: HPState = {
  stack: [0, 0, 0, 0], // X, Y, Z, T
  lastX: 0,
  memory: { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 },
  display: '0,00',
  isEntering: false,
  shift: 'none',
  precision: 2,
  isOn: true
};

const HPKey = ({ 
  f, main, g, onClick, variant = "dark", isEnter = false, className = "", disabled = false
}: { 
  f?: string, main: string, g?: string, onClick: () => void, variant?: "dark" | "gold" | "blue", isEnter?: boolean, className?: string, disabled?: boolean
}) => {
  const getVariantClass = () => {
    if (variant === "gold") return "key-gold";
    if (variant === "blue") return "key-blue";
    return "";
  };

  return (
    <div className={`flex flex-col items-center justify-end h-full w-full ${isEnter ? 'row-span-2' : ''} ${className}`}>
      {f && (
        <span className={`mb-0.5 h-3 text-[6px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center leading-none ${disabled ? 'opacity-10' : 'text-[#d4af37]'}`}>
          {f}
        </span>
      )}
      <button 
        onClick={onClick} 
        disabled={disabled && main !== 'ON'}
        className={`key-3d w-full ${isEnter ? 'h-[97%]' : 'h-10 md:h-12'} ${getVariantClass()} flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed`}
      >
        <span className={`text-[8px] sm:text-[10px] md:text-[11px] font-black tracking-tighter ${variant !== 'dark' ? 'text-black' : 'text-white'} ${disabled && main !== 'ON' ? 'opacity-20' : ''}`}>
          {main}
        </span>
      </button>
      {g && (
        <span className={`mt-0.5 h-3 text-[6px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center leading-none ${disabled ? 'opacity-10' : 'text-[#38bdf8]'}`}>
          {g}
        </span>
      )}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<HPState>(INITIAL_STATE);
  const [accessCount, setAccessCount] = useState<number>(0);

  useEffect(() => {
    const savedCount = localStorage.getItem('hp12c_access_count');
    const newCount = (savedCount ? parseInt(savedCount) : 0) + 1;
    localStorage.setItem('hp12c_access_count', newCount.toString());
    setAccessCount(newCount);
  }, []);

  const updateDisplayStr = (val: number, precision: number) => formatDisplay(val, precision);

  // Calcula o tamanho da fonte dinamicamente com base no comprimento da string exibida
  const getFontSizeClass = useMemo(() => {
    const len = state.display.length;
    if (len <= 10) return "text-3xl sm:text-5xl md:text-8xl";
    if (len <= 14) return "text-2xl sm:text-4xl md:text-7xl";
    if (len <= 18) return "text-xl sm:text-3xl md:text-6xl";
    return "text-lg sm:text-2xl md:text-5xl";
  }, [state.display]);

  const handleDigit = (digit: string) => {
    if (!state.isOn) return;
    
    if (state.shift === 'f') {
      const p = parseInt(digit);
      if (!isNaN(p)) {
        setState(prev => ({
          ...prev,
          precision: p,
          display: updateDisplayStr(prev.stack[0], p),
          shift: 'none'
        }));
        return;
      }
    }

    setState(prev => {
      let newStack = [...prev.stack];
      let newDisplay = '';
      
      if (!prev.isEntering) {
        newStack = [0, prev.stack[0], prev.stack[1], prev.stack[2]];
        newDisplay = digit === '.' ? '0.' : digit;
      } else {
        let current = prev.display.replace(/\./g, '').replace(',', '.');
        if (digit === '.' && current.includes('.')) return prev;
        newDisplay = (current === '0' && digit !== '.') ? digit : current + digit;
      }

      if (newDisplay.length > 20) return prev; // Aumentado limite de caracteres
      
      const newVal = parseFloat(newDisplay);
      newStack[0] = newVal;

      return {
        ...prev,
        stack: newStack,
        display: newDisplay.replace('.', ','),
        isEntering: true,
        shift: 'none'
      };
    });
  };

  const handleEnter = () => {
    if (!state.isOn) return;
    setState(prev => ({
      ...prev,
      stack: [prev.stack[0], prev.stack[0], prev.stack[1], prev.stack[2]],
      isEntering: false,
      shift: 'none',
      display: updateDisplayStr(prev.stack[0], prev.precision)
    }));
  };

  const handleArithmetic = (op: string) => {
    if (!state.isOn) return;
    setState(prev => {
      const x = prev.stack[0];
      const y = prev.stack[1];
      let res = 0;
      switch(op) {
        case '+': res = y + x; break;
        case '-': res = y - x; break;
        case '*': res = y * x; break;
        case '/': res = x !== 0 ? y / x : 0; break;
      }
      const newStack = [res, prev.stack[2], prev.stack[3], prev.stack[3]];
      return {
        ...prev,
        stack: newStack,
        lastX: x,
        display: updateDisplayStr(res, prev.precision),
        isEntering: false,
        shift: 'none'
      };
    });
  };

  const handleTVM = (key: keyof TVMMemory) => {
    if (!state.isOn) return;
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
          display: updateDisplayStr(newVal, prev.precision),
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
          memory: { ...prev.memory, [key]: solved },
          stack: [solved, prev.stack[1], prev.stack[2], prev.stack[3]],
          display: updateDisplayStr(solved, prev.precision),
          shift: 'none'
        };
      }
    });
  };

  const handlePower = () => {
    setState(prev => ({ ...prev, isOn: !prev.isOn, shift: 'none' }));
  };

  const handleSpecial = (type: string) => {
    if (!state.isOn) return;
    setState(prev => {
      let x = prev.stack[0];
      let res = x;
      switch(type) {
        case 'chs': res = x * -1; break;
        case 'clx': res = 0; break;
        case 'sqrt': res = Math.sqrt(x); break;
        case 'inv': res = 1/x; break;
      }
      const newStack = [...prev.stack];
      newStack[0] = res;
      return {
        ...prev,
        stack: newStack,
        display: updateDisplayStr(res, prev.precision),
        isEntering: false,
        shift: 'none'
      };
    });
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-screen w-full bg-[#f8fafc]">
      <div className="calc-wrapper">
        <div className="brushed-metal w-[360px] sm:w-[540px] md:w-[840px] lg:w-[1020px] p-6 md:p-12 rounded-[40px] border-b-[10px] border-black/90">
          
          {/* Header e Visor Expandido */}
          <div className="flex justify-between items-start mb-10 md:mb-14 px-2 gap-4">
            <div className="flex flex-col flex-shrink-0">
              <div className="flex items-center gap-4 md:gap-8">
                <h1 className="text-[#c5a059] italic text-4xl md:text-7xl font-[900] tracking-tighter leading-none select-none">
                  hp <span className="text-2xl md:text-4xl ml-2 not-italic font-bold text-gray-500">12c</span>
                </h1>
                
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 md:w-6 md:h-6 rounded-full border border-white/10 transition-all duration-500 ${state.isOn ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-950 opacity-40'}`}></div>
                  <span className="text-[7px] md:text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Power</span>
                </div>
              </div>
              <p className="text-[8px] md:text-[12px] text-gray-500 font-black uppercase tracking-[0.4em] mt-6 opacity-60">Platinum Financial Calculator</p>
              
              <div className="hidden sm:flex flex-col bg-black/40 px-3 py-1 mt-4 rounded-md border border-white/5 w-fit">
                   <span className="text-[7px] text-gray-500 font-bold uppercase">S/N - Access</span>
                   <span className="text-[11px] text-gray-300 font-mono tracking-widest">{accessCount.toString().padStart(6, '0')}</span>
              </div>
            </div>
            
            {/* Visor LCD com Flex-1 e Redimensionamento de Fonte */}
            <div className={`lcd-display flex-1 max-w-[650px] h-20 md:h-36 rounded-xl flex flex-col justify-center items-end px-6 md:px-14 transition-all duration-700 overflow-hidden ${state.isOn ? 'bg-[#8da383]' : 'bg-[#151715] border-[#0a0a0a] shadow-none'}`}>
              {state.isOn && (
                <>
                  <div className="flex justify-between w-full text-[9px] md:text-[15px] font-black text-black/70 mb-1 md:mb-4">
                    <div className="flex gap-4 md:gap-12">
                      <span className={state.shift === 'f' ? 'text-black opacity-100 scale-125' : 'opacity-0'}>f</span>
                      <span className={state.shift === 'g' ? 'text-black opacity-100 scale-125' : 'opacity-0'}>g</span>
                    </div>
                    <span className="opacity-10 font-mono text-[8px] md:text-[12px] uppercase tracking-widest">Precision RPN</span>
                  </div>
                  <span className={`font-bold font-mono tracking-tighter text-[#1a241a] leading-none select-none transition-all duration-200 whitespace-nowrap ${getFontSizeClass}`}>
                    {state.display}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Grid de Teclas */}
          <div className="grid grid-cols-10 gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-4 sm:gap-y-6 md:gap-y-10">
            {/* LINHA 1 */}
            <HPKey f="AMORT" main="n" g="12x" onClick={() => handleTVM('n')} disabled={!state.isOn} />
            <HPKey f="INT" main="i" g="12÷" onClick={() => handleTVM('i')} disabled={!state.isOn} />
            <HPKey f="NPV" main="PV" g="CF0" onClick={() => handleTVM('pv')} disabled={!state.isOn} />
            <HPKey f="IRR" main="PMT" g="CFj" onClick={() => handleTVM('pmt')} disabled={!state.isOn} />
            <HPKey f="PV" main="FV" g="Nj" onClick={() => handleTVM('fv')} disabled={!state.isOn} />
            <HPKey f="BEG" main="CHS" g="END" onClick={() => handleSpecial('chs')} disabled={!state.isOn} />
            <HPKey main="7" onClick={() => handleDigit('7')} disabled={!state.isOn} />
            <HPKey main="8" onClick={() => handleDigit('8')} disabled={!state.isOn} />
            <HPKey main="9" onClick={() => handleDigit('9')} disabled={!state.isOn} />
            <HPKey main="÷" onClick={() => handleArithmetic('/')} disabled={!state.isOn} />

            {/* LINHA 2 */}
            <HPKey f="yˣ" main="yˣ" g="√x" onClick={() => state.shift === 'g' ? handleSpecial('sqrt') : handleArithmetic('pow')} disabled={!state.isOn} />
            <HPKey f="x!" main="1/x" g="eˣ" onClick={() => handleSpecial('inv')} disabled={!state.isOn} />
            <HPKey f="Σ" main="%T" g="LN" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="x<>y" main="Δ%" g="FRAC" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="%" main="%" g="INTG" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="PRGM" main="EEX" g="PSE" onClick={() => {}} disabled={!state.isOn} />
            <HPKey main="4" onClick={() => handleDigit('4')} disabled={!state.isOn} />
            <HPKey main="5" onClick={() => handleDigit('5')} disabled={!state.isOn} />
            <HPKey main="6" onClick={() => handleDigit('6')} disabled={!state.isOn} />
            <HPKey main="×" onClick={() => handleArithmetic('*')} disabled={!state.isOn} />

            {/* LINHA 3 */}
            <HPKey f="P/R" main="R↓" g="BST" onClick={() => {
              const [x, y, z, t] = state.stack;
              setState(p => ({ ...p, stack: [y, z, t, x], display: updateDisplayStr(y, p.precision), isEntering: false }));
            }} disabled={!state.isOn} />
            <HPKey f="Σ-" main="x<>y" g="GTO" onClick={() => {
              const [x, y, z, t] = state.stack;
              setState(p => ({ ...p, stack: [y, x, z, t], display: updateDisplayStr(y, p.precision), isEntering: false }));
            }} disabled={!state.isOn} />
            <HPKey f="CLEAR" main="CLX" g="x≤y" onClick={() => handleSpecial('clx')} disabled={!state.isOn} />
            <HPKey f="REG" main="STO" g="x=0" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="PREFIX" main="RCL" g="x≠0" onClick={() => {}} disabled={!state.isOn} />
            <HPKey main="ENTER" isEnter onClick={handleEnter} disabled={!state.isOn} />
            <HPKey main="1" onClick={() => handleDigit('1')} disabled={!state.isOn} />
            <HPKey main="2" onClick={() => handleDigit('2')} disabled={!state.isOn} />
            <HPKey main="3" onClick={() => handleDigit('3')} disabled={!state.isOn} />
            <HPKey main="-" onClick={() => handleArithmetic('-')} disabled={!state.isOn} />

            {/* LINHA 4 */}
            <HPKey main="ON" onClick={handlePower} />
            <HPKey main="f" variant="gold" onClick={() => setState(p => ({...p, shift: p.shift === 'f' ? 'none' : 'f'}))} disabled={!state.isOn} />
            <HPKey main="g" variant="blue" onClick={() => setState(p => ({...p, shift: p.shift === 'g' ? 'none' : 'g'}))} disabled={!state.isOn} />
            <HPKey f="D.MY" main="STO" g="M.DY" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="x̄" main="RCL" g="s" onClick={() => {}} disabled={!state.isOn} />
            <div className="col-span-1 invisible"></div> 
            <HPKey main="0" onClick={() => handleDigit('0')} disabled={!state.isOn} />
            <HPKey main="." onClick={() => handleDigit('.')} disabled={!state.isOn} />
            <HPKey main="Σ+" onClick={() => {}} disabled={!state.isOn} />
            <HPKey main="+" onClick={() => handleArithmetic('+')} disabled={!state.isOn} />
          </div>

          <div className="mt-12 md:mt-20 pt-10 border-t border-white/5 flex justify-between items-center opacity-30 select-none">
            <div className="flex flex-col">
              <span className="text-[12px] md:text-[18px] text-white font-black uppercase tracking-[1.2em]">Hewlett-Packard</span>
              <span className="text-[8px] md:text-[11px] text-gray-500 mt-2 font-mono uppercase tracking-[0.3em]">Precision Financial Instrument</span>
            </div>
            <div className="flex gap-5">
               <div className="w-2.5 h-2.5 rounded-full bg-white/10 shadow-inner"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-white/10 shadow-inner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
