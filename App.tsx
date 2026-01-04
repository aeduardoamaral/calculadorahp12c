
import React, { useState, useCallback } from 'react';
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
  
  return (
    <div className={`relative mt-6 ${className} ${isTall ? 'row-span-2' : ''}`}>
      {f && <span className="label-f">{f}</span>}
      <button onClick={onClick} className={`${btnClass} ${isTall ? 'h-full' : ''}`}>
        <span className="label-main">{main}</span>
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
      const val = parseFloat(newDisplay) || 0;
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
    setState(prev => ({ 
      ...prev, 
      memory: { ...prev.memory, [key]: val }, 
      isEntering: false,
      shift: 'none'
    }));
  };

  const toggleShift = (mode: 'f' | 'g') => {
    setState(prev => ({ ...prev, shift: prev.shift === mode ? 'none' : mode }));
  };

  return (
    <div className="hp-body p-8 rounded-2xl w-[920px] select-none flex flex-col">
      {/* Top Section */}
      <div className="flex justify-between items-start mb-10">
        <div className="flex flex-col">
          <h1 className="text-white italic font-black text-4xl tracking-tighter leading-none">hp <span className="text-3xl font-bold">12c</span></h1>
          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">platinum financial calculator</span>
        </div>
        
        <div className="lcd-container w-[400px] rounded-lg p-5 flex flex-col items-end justify-center">
          <div className="flex justify-between w-full text-[11px] font-black text-black/60 mb-1 px-1">
             <div className="flex gap-4">
               <span className={state.shift === 'f' ? 'opacity-100' : 'opacity-0 transition-opacity'}>f</span>
               <span className={state.shift === 'g' ? 'opacity-100' : 'opacity-0 transition-opacity'}>g</span>
             </div>
             <span className="opacity-40">RPN</span>
          </div>
          <div className="lcd-text text-6xl font-bold tracking-tighter">
            {state.display}
          </div>
        </div>
      </div>

      {/* Keyboard Grid */}
      <div className="grid grid-cols-10 gap-x-4 gap-y-8">
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
        <CalculatorButton main="ON" onClick={() => setState(INITIAL_STATE)} />
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

      {/* Plate */}
      <div className="mt-14 pt-6 border-t border-white/5 flex justify-between items-center opacity-40">
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">High-Fidelity RPN Logic</span>
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Hewlett-Packard 12C Platinum</span>
      </div>
    </div>
  );
}
