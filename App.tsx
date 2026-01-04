
import React, { useState } from 'react';
import { HPState } from './types';
import { calculateTVM, formatDisplay } from './services/hp12cEngine';

const INITIAL_STATE: HPState = {
  stack: [0, 0, 0, 0],
  lastX: 0,
  memory: { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 },
  display: '0.00',
  isEntering: false,
  shift: 'none'
};

const CalculatorButton = ({ 
  f, main, g, onClick, className = "", color = "normal", isTall = false 
}: { 
  f?: string, main: string, g?: string, onClick: () => void, className?: string, color?: string, isTall?: boolean 
}) => {
  let btnClass = "hp-btn ";
  if (color === "gold") btnClass += "hp-btn-gold ";
  else if (color === "blue") btnClass += "hp-btn-blue ";
  if (isTall) btnClass += "h-full "; // Deixa o grid controlar a altura do botão ENTER
  
  return (
    <div className={`relative mt-4 sm:mt-5 md:mt-6 ${className} ${isTall ? 'row-span-2' : ''}`}>
      {f && <span className="label-f">{f}</span>}
      <button onClick={onClick} className={btnClass}>
        <span className="label-main font-bold">{main}</span>
      </button>
      {g && <span className="label-g">{g}</span>}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<HPState>(INITIAL_STATE);

  const handleDigit = (digit: string) => {
    setState(prev => {
      let newDisplay = prev.isEntering ? prev.display.replace(/,/g, '') + digit : digit;
      if (newDisplay === '.') newDisplay = '0.';
      const val = parseFloat(newDisplay);
      return { 
        ...prev, 
        display: newDisplay, 
        isEntering: true,
        stack: [val, prev.stack[1], prev.stack[2], prev.stack[3]]
      };
    });
  };

  const handleEnter = () => {
    setState(prev => {
      const val = parseFloat(prev.display.replace(/,/g, ''));
      return { 
        ...prev, 
        stack: [val, val, prev.stack[1], prev.stack[2]], 
        isEntering: false, 
        display: formatDisplay(val) 
      };
    });
  };

  const handleOp = (op: string) => {
    setState(prev => {
      const x = parseFloat(prev.display.replace(/,/g, ''));
      const y = prev.stack[1];
      let res = 0;
      switch(op) {
        case '+': res = y + x; break;
        case '-': res = y - x; break;
        case '*': res = y * x; break;
        case '/': res = x !== 0 ? y / x : 0; break;
      }
      return { 
        ...prev, 
        stack: [res, prev.stack[2], prev.stack[3], prev.stack[3]], 
        display: formatDisplay(res), 
        isEntering: false 
      };
    });
  };

  const handleTVMSet = (key: keyof HPState['memory']) => {
    const val = parseFloat(state.display.replace(/,/g, ''));
    setState(prev => ({ ...prev, memory: { ...prev.memory, [key]: val }, isEntering: false }));
  };

  const toggleShift = (mode: 'f' | 'g') => {
    setState(prev => ({ ...prev, shift: prev.shift === mode ? 'none' : mode }));
  };

  return (
    <div className="hp-body p-3 sm:p-5 md:p-8 rounded-xl md:rounded-2xl w-full max-w-[960px] md:w-[960px] select-none transition-all duration-300">
      {/* Top Section: Logo and LCD */}
      <div className="flex justify-between items-start mb-4 sm:mb-8 md:mb-10">
        <div className="flex flex-col">
          <h1 className="text-white italic font-bold text-lg sm:text-2xl md:text-3xl tracking-tighter leading-none">hp <span className="text-sm sm:text-xl md:text-2xl">12c</span></h1>
          <span className="text-[7px] sm:text-[10px] md:text-[12px] text-gray-400 font-bold uppercase tracking-widest sm:tracking-[0.25em]">platinum financial calculator</span>
        </div>
        
        <div className="lcd-container w-[50%] sm:w-[45%] md:w-[420px] rounded-md sm:rounded-lg p-2 sm:p-4 md:p-5 flex flex-col items-end justify-center">
          <div className="flex justify-between w-full text-[8px] sm:text-[10px] md:text-[11px] font-bold text-black/70 mb-0 sm:mb-1 px-1">
             <div className="flex gap-2 sm:gap-4">
               <span className={state.shift === 'f' ? 'opacity-100' : 'opacity-0'}>f</span>
               <span className={state.shift === 'g' ? 'opacity-100' : 'opacity-0'}>g</span>
             </div>
             <span className="hidden sm:inline">BEGIN</span>
          </div>
          <div className="lcd-text text-xl sm:text-4xl md:text-6xl font-bold leading-none">
            {state.display}
          </div>
        </div>
      </div>

      {/* Keyboard Grid - 10 columns */}
      <div className="grid grid-cols-10 gap-x-1 sm:gap-x-3 md:gap-x-4 gap-y-3 sm:gap-y-6 md:gap-y-8">
        
        {/* Row 1 */}
        <CalculatorButton f="AMORT" main="n" g="12x" onClick={() => handleTVMSet('n')} />
        <CalculatorButton f="INT" main="i" g="12÷" onClick={() => handleTVMSet('i')} />
        <CalculatorButton f="NPV" main="PV" g="CF0" onClick={() => handleTVMSet('pv')} />
        <CalculatorButton f="IRR" main="PMT" g="CFj" onClick={() => handleTVMSet('pmt')} />
        <CalculatorButton f="PV" main="FV" g="Nj" onClick={() => handleTVMSet('fv')} />
        <CalculatorButton f="BEG" main="CHS" g="END" onClick={() => {}} />
        <CalculatorButton main="7" onClick={() => handleDigit('7')} />
        <CalculatorButton main="8" onClick={() => handleDigit('8')} />
        <CalculatorButton main="9" onClick={() => handleDigit('9')} />
        <CalculatorButton main="÷" onClick={() => handleOp('/')} />

        {/* Row 2 */}
        <CalculatorButton f="yˣ" main="1/x" g="√x" onClick={() => {}} />
        <CalculatorButton f="x!" main="yˣ" g="eˣ" onClick={() => {}} />
        <CalculatorButton f="%" main="Δ%" g="LN" onClick={() => {}} />
        <CalculatorButton f="ABS" main="%" g="FRAC" onClick={() => {}} />
        <CalculatorButton f="PRGM" main="EEX" g="INTG" onClick={() => {}} />
        <CalculatorButton f="P/R" main="RS" g="PSE" onClick={() => {}} />
        <CalculatorButton main="4" onClick={() => handleDigit('4')} />
        <CalculatorButton main="5" onClick={() => handleDigit('5')} />
        <CalculatorButton main="6" onClick={() => handleDigit('6')} />
        <CalculatorButton main="×" onClick={() => handleOp('*')} />

        {/* Row 3 */}
        <CalculatorButton f="SST" main="R↓" g="BST" onClick={() => {}} />
        <CalculatorButton f="x<>y" main="x<>y" g="GTO" onClick={() => {}} />
        <CalculatorButton f="CLx" main="CLX" g="x≤y" onClick={() => setState(prev => ({...prev, display: '0.00', isEntering: false}))} />
        <CalculatorButton f="x≤y" main="STO" g="x=0" onClick={() => {}} />
        <CalculatorButton f="x=0" main="RCL" g="x≠0" onClick={() => {}} />
        <CalculatorButton main="ENTER" isTall onClick={handleEnter} />
        <CalculatorButton main="1" onClick={() => handleDigit('1')} />
        <CalculatorButton main="2" onClick={() => handleDigit('2')} />
        <CalculatorButton main="3" onClick={() => handleDigit('3')} />
        <CalculatorButton main="-" onClick={() => handleOp('-')} />

        {/* Row 4 */}
        <CalculatorButton main="ON" color="normal" onClick={() => setState(INITIAL_STATE)} />
        <CalculatorButton main="f" color="gold" onClick={() => toggleShift('f')} />
        <CalculatorButton main="g" color="blue" onClick={() => toggleShift('g')} />
        <CalculatorButton main="STO" onClick={() => {}} />
        <CalculatorButton main="RCL" onClick={() => {}} />
        <div className="col-span-1"></div>
        <CalculatorButton main="0" onClick={() => handleDigit('0')} />
        <CalculatorButton main="." onClick={() => handleDigit('.')} />
        <CalculatorButton main="Σ+" onClick={() => {}} />
        <CalculatorButton main="+" onClick={() => handleOp('+')} />

      </div>

      <div className="mt-6 sm:mt-10 md:mt-16 text-center text-[#555] text-[7px] sm:text-[10px] md:text-[12px] font-bold uppercase tracking-widest sm:tracking-[0.3em] border-t border-[#333] pt-3 sm:pt-6">
        Hewlett-Packard 12C Platinum Replica
      </div>
    </div>
  );
}
