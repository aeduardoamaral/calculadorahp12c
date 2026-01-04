
import React, { useState, useEffect, useMemo } from 'react';
import { HPState, TVMMemory } from './types';
import { formatDisplay, calculateTVM } from './services/hp12cEngine';

const INITIAL_STATE: HPState = {
  stack: [0, 0, 0, 0],
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
      {f && <span className={`mb-0.5 h-3 text-[6px] sm:text-[7px] md:text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center leading-none ${disabled ? 'opacity-20' : 'text-[#d4af37]'}`}>{f}</span>}
      <button 
        onClick={onClick} 
        disabled={disabled && main !== 'ON'}
        className={`key-3d w-full ${isEnter ? 'h-[96%]' : 'h-10 md:h-12'} ${getVariantClass()} flex items-center justify-center transition-all active:scale-90 active:brightness-125 disabled:cursor-not-allowed`}
      >
        <span className={`text-[8px] sm:text-[9px] md:text-[11px] font-black tracking-tighter ${variant !== 'dark' ? 'text-black' : 'text-white'} ${disabled && main !== 'ON' ? 'opacity-20' : ''}`}>
          {main}
        </span>
      </button>
      {g && <span className={`mt-0.5 h-3 text-[6px] sm:text-[7px] md:text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center leading-none ${disabled ? 'opacity-20' : 'text-[#38bdf8]'}`}>{g}</span>}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<HPState>(INITIAL_STATE);
  const [accessCount, setAccessCount] = useState<number>(0);

  // Lógica de Contador de Acessos Real (Persistido localmente)
  useEffect(() => {
    const savedCount = localStorage.getItem('hp12c_access_count');
    const newCount = savedCount ? parseInt(savedCount) + 1 : 1;
    localStorage.setItem('hp12c_access_count', newCount.toString());
    setAccessCount(newCount);
  }, []);

  const getDisplayValue = (val: number, precision: number) => formatDisplay(val, precision).replace('.', ',');

  const dropStack = (res: number, currentStack: number[]) => {
    return [res, currentStack[2], currentStack[3], currentStack[3]];
  };

  const handleDigit = (digit: string) => {
    if (!state.isOn) return;
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
      return { ...prev, display: newDisplayStr.replace('.', ','), isEntering: true, stack: newStack, shift: 'none' };
    });
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
      return { ...prev, stack: dropStack(res, prev.stack), display: getDisplayValue(res, prev.precision), isEntering: false, shift: 'none' };
    });
  };

  const handlePower = () => {
    setState(prev => ({ ...prev, isOn: !prev.isOn, shift: 'none', isEntering: false }));
  };

  const handleEnter = () => {
    if (!state.isOn) return;
    setState(prev => ({
      ...prev,
      stack: [prev.stack[0], prev.stack[0], prev.stack[1], prev.stack[2]],
      isEntering: false,
      shift: 'none',
      display: getDisplayValue(prev.stack[0], prev.precision)
    }));
  };

  return (
    <div className="flex items-center justify-center p-2 min-h-screen w-full bg-[#e5e7eb]">
      <div className="calc-wrapper">
        <div className="brushed-metal w-[360px] sm:w-[520px] md:w-[780px] lg:w-[960px] p-5 md:p-12 rounded-[30px] shadow-2xl border-b-[6px] border-black/80">
          
          {/* Topo / Status / Display */}
          <div className="flex justify-between items-start mb-8 md:mb-12 px-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-5 md:gap-10">
                <h1 className="text-[#c5a059] italic text-3xl md:text-5xl font-[900] tracking-tighter leading-none select-none">
                  hp <span className="text-xl md:text-3xl ml-1 not-italic font-bold text-gray-500">12c</span>
                </h1>
                
                {/* Luz Indicadora de Funcionamento */}
                <div className="flex flex-col items-center">
                   <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border border-white/20 transition-all duration-500 ${state.isOn ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-900 shadow-inner'}`}></div>
                   <span className="text-[6px] md:text-[8px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Power</span>
                </div>

                {/* Contador de Acessos Real */}
                <div className="hidden sm:flex flex-col items-start bg-black/40 px-3 py-1 rounded border border-white/5">
                   <span className="text-[6px] text-gray-500 font-bold uppercase">Usage Count</span>
                   <span className="text-[10px] text-gray-300 font-mono leading-none">{accessCount.toString().padStart(6, '0')}</span>
                </div>
              </div>
              <p className="text-[7px] md:text-[11px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-4 opacity-70 select-none">Platinum Financial Calculator</p>
            </div>
            
            <div className={`lcd-display w-[160px] sm:w-[260px] md:w-[440px] h-16 md:h-32 rounded-lg flex flex-col justify-center items-end px-4 md:px-10 transition-colors duration-700 ${state.isOn ? 'bg-[#8da383]' : 'bg-[#1a1c1a] shadow-none border-gray-900'}`}>
              {state.isOn && (
                <>
                  <div className="flex justify-between w-full text-[8px] md:text-[12px] font-black text-black/60 mb-1 md:mb-3">
                    <div className="flex gap-4 md:gap-10">
                      <span className={state.shift === 'f' ? 'text-black opacity-100 scale-110' : 'opacity-5'}>f</span>
                      <span className={state.shift === 'g' ? 'text-black opacity-100 scale-110' : 'opacity-5'}>g</span>
                    </div>
                    <span className="opacity-10 font-mono tracking-widest">RPN MODE</span>
                  </div>
                  <span className="text-2xl sm:text-4xl md:text-7xl font-bold font-mono tracking-tighter text-[#1a241a] leading-none select-none">
                    {state.display}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Keypad Grid Corrected Layout */}
          <div className="grid grid-cols-10 gap-x-2 md:gap-x-4 gap-y-3 md:gap-y-8">
            
            {/* LINHA 1 */}
            <HPKey f="AMORT" main="n" g="12x" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="INT" main="i" g="12÷" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="NPV" main="PV" g="CF0" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="IRR" main="PMT" g="CFj" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="PV" main="FV" g="Nj" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="BEG" main="CHS" g="END" onClick={() => {}} disabled={!state.isOn} />
            <HPKey main="7" onClick={() => handleDigit('7')} disabled={!state.isOn} />
            <HPKey main="8" onClick={() => handleDigit('8')} disabled={!state.isOn} />
            <HPKey main="9" onClick={() => handleDigit('9')} disabled={!state.isOn} />
            <HPKey main="÷" onClick={() => handleArithmetic('/')} disabled={!state.isOn} />

            {/* LINHA 2 */}
            <HPKey f="yˣ" main="yˣ" g="√x" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="x!" main="1/x" g="eˣ" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="Σ" main="%T" g="LN" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="x<>y" main="Δ%" g="FRAC" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="%" main="%" g="INTG" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="PRGM" main="EEX" g="PSE" onClick={() => {}} disabled={!state.isOn} />
            <HPKey main="4" onClick={() => handleDigit('4')} disabled={!state.isOn} />
            <HPKey main="5" onClick={() => handleDigit('5')} disabled={!state.isOn} />
            <HPKey main="6" onClick={() => handleDigit('6')} disabled={!state.isOn} />
            <HPKey main="×" onClick={() => handleArithmetic('*')} disabled={!state.isOn} />

            {/* LINHA 3 */}
            <HPKey f="P/R" main="R↓" g="BST" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="Σ-" main="x<>y" g="GTO" onClick={() => {}} disabled={!state.isOn} />
            <HPKey f="CLEAR" main="CLX" g="x≤y" onClick={() => {}} disabled={!state.isOn} />
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
            <div className="col-span-1"></div>
            <div className="col-span-1"></div>
            {/* Espaço do ENTER */}
            <div className="col-span-1 invisible"></div> 
            <HPKey main="0" onClick={() => handleDigit('0')} disabled={!state.isOn} />
            <HPKey main="." onClick={() => handleDigit('.')} disabled={!state.isOn} />
            <HPKey main="Σ+" onClick={() => {}} disabled={!state.isOn} />
            <HPKey main="+" onClick={() => handleArithmetic('+')} disabled={!state.isOn} />
          </div>

          <div className="mt-10 md:mt-16 pt-6 border-t border-white/5 flex justify-between items-center opacity-40 select-none">
            <div className="flex flex-col">
              <span className="text-[10px] md:text-[14px] text-white font-black uppercase tracking-[1em]">Hewlett-Packard</span>
              <span className="text-[6px] md:text-[8px] text-gray-500 mt-1">S/N: {accessCount.toString().padStart(8, 'A')}</span>
            </div>
            <div className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-white/10 shadow-inner"></div>
               <div className="w-2 h-2 rounded-full bg-white/10 shadow-inner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
