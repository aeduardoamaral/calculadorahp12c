
import React, { useState } from 'react';
import { HPState } from './types';
import { formatDisplay } from './services/hp12cEngine';

const INITIAL_STATE: HPState = {
  stack: [0, 0, 0, 0],
  lastX: 0,
  memory: { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 },
  display: '0.00',
  isEntering: false,
  shift: 'none'
};

const SimpleButton = ({ 
  f, main, g, onClick, color = "dark", isTall = false 
}: { 
  f?: string, main: string, g?: string, onClick: () => void, color?: string, isTall?: boolean 
}) => {
  let bgColor = "bg-[#333]";
  if (color === "gold") bgColor = "bg-[#d4af37]";
  if (color === "blue") bgColor = "bg-[#38bdf8]";
  
  return (
    <div className={`flex flex-col items-center justify-end h-16 ${isTall ? 'row-span-2' : ''}`}>
      {f && <span className="label-f-text mb-1 h-3">{f}</span>}
      <button 
        onClick={onClick} 
        className={`${bgColor} w-full ${isTall ? 'h-full' : 'h-10'} rounded-sm btn-hp shadow-md`}
      >
        <span className={`label-main-text ${color !== 'dark' ? 'text-black' : 'text-white'}`}>{main}</span>
      </button>
      {g && <span className="label-g-text mt-1 h-3">{g}</span>}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<HPState>(INITIAL_STATE);

  const handleDigit = (digit: string) => {
    setState(prev => {
      let newDisplay = prev.isEntering ? prev.display.replace(/,/g, '') + digit : digit;
      if (newDisplay === '.') newDisplay = '0.';
      if (newDisplay.length > 12) return prev;
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

  return (
    <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-lg w-full max-w-[900px] shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-left w-full sm:w-auto">
          <h1 className="text-[#d4af37] italic text-3xl font-black leading-none">hp <span className="text-2xl">12c</span></h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Financial Calculator</p>
        </div>
        
        <div className="lcd-screen w-full sm:w-[350px] h-20 sm:h-24 rounded flex flex-col justify-center items-end px-4">
          <div className="flex justify-between w-full text-[10px] font-bold text-black/40 mb-1">
            <div className="flex gap-4">
              <span className={state.shift === 'f' ? 'opacity-100' : 'opacity-0'}>f</span>
              <span className={state.shift === 'g' ? 'opacity-100' : 'opacity-0'}>g</span>
            </div>
            <span>RPN</span>
          </div>
          <span className="text-3xl sm:text-5xl font-bold">{state.display}</span>
        </div>
      </div>

      {/* Grid of buttons - 10 Columns */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
        {/* Row 1 */}
        <SimpleButton f="AMORT" main="n" g="12x" onClick={() => handleTVMSet('n')} />
        <SimpleButton f="INT" main="i" g="12÷" onClick={() => handleTVMSet('i')} />
        <SimpleButton f="NPV" main="PV" g="CF0" onClick={() => handleTVMSet('pv')} />
        <SimpleButton f="IRR" main="PMT" g="CFj" onClick={() => handleTVMSet('pmt')} />
        <SimpleButton f="PV" main="FV" g="Nj" onClick={() => handleTVMSet('fv')} />
        <SimpleButton f="BEG" main="CHS" g="END" onClick={() => {}} />
        <SimpleButton main="7" onClick={() => handleDigit('7')} />
        <SimpleButton main="8" onClick={() => handleDigit('8')} />
        <SimpleButton main="9" onClick={() => handleDigit('9')} />
        <SimpleButton main="÷" onClick={() => handleOp('/')} />

        {/* Row 2 */}
        <SimpleButton f="yˣ" main="1/x" g="√x" onClick={() => {}} />
        <SimpleButton f="x!" main="yˣ" g="eˣ" onClick={() => {}} />
        <SimpleButton f="%" main="Δ%" g="LN" onClick={() => {}} />
        <SimpleButton f="ABS" main="%" g="FRAC" onClick={() => {}} />
        <SimpleButton f="PRGM" main="EEX" g="INTG" onClick={() => {}} />
        <SimpleButton f="P/R" main="RS" g="PSE" onClick={() => {}} />
        <SimpleButton main="4" onClick={() => handleDigit('4')} />
        <SimpleButton main="5" onClick={() => handleDigit('5')} />
        <SimpleButton main="6" onClick={() => handleDigit('6')} />
        <SimpleButton main="×" onClick={() => handleOp('*')} />

        {/* Row 3 */}
        <SimpleButton f="SST" main="R↓" g="BST" onClick={() => {}} />
        <SimpleButton f="x<>y" main="x<>y" g="GTO" onClick={() => {}} />
        <SimpleButton f="CLx" main="CLX" g="x≤y" onClick={() => setState(prev => ({...prev, display: '0.00', isEntering: false}))} />
        <SimpleButton f="x≤y" main="STO" g="x=0" onClick={() => {}} />
        <SimpleButton f="x=0" main="RCL" g="x≠0" onClick={() => {}} />
        <SimpleButton main="ENTER" isTall onClick={handleEnter} />
        <SimpleButton main="1" onClick={() => handleDigit('1')} />
        <SimpleButton main="2" onClick={() => handleDigit('2')} />
        <SimpleButton main="3" onClick={() => handleDigit('3')} />
        <SimpleButton main="-" onClick={() => handleOp('-')} />

        {/* Row 4 */}
        <SimpleButton main="ON" onClick={() => setState(INITIAL_STATE)} />
        <SimpleButton main="f" color="gold" onClick={() => setState(p => ({...p, shift: p.shift === 'f' ? 'none' : 'f'}))} />
        <SimpleButton main="g" color="blue" onClick={() => setState(p => ({...p, shift: p.shift === 'g' ? 'none' : 'g'}))} />
        <SimpleButton main="STO" onClick={() => {}} />
        <SimpleButton main="RCL" onClick={() => {}} />
        <div className="hidden sm:block"></div> {/* Spacer for ENTER in desktop */}
        <SimpleButton main="0" onClick={() => handleDigit('0')} />
        <SimpleButton main="." onClick={() => handleDigit('.')} />
        <SimpleButton main="Σ+" onClick={() => {}} />
        <SimpleButton main="+" onClick={() => handleOp('+')} />
      </div>

      <div className="mt-8 text-center border-t border-white/10 pt-4">
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">Hewlett Packard 12C Platinum Replica</p>
      </div>
    </div>
  );
}
