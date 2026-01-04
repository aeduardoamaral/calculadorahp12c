
import React, { useState } from 'react';
import { HPState } from './types';
import { formatDisplay } from './services/hp12cEngine';

const INITIAL_STATE: HPState = {
  stack: [0, 0, 0, 0],
  lastX: 0,
  memory: { n: 0, i: 0, pv: 0, pmt: 0, fv: 0 },
  display: '0,00',
  isEntering: false,
  shift: 'none'
};

const HPKey = ({ 
  f, main, g, onClick, variant = "dark", isEnter = false 
}: { 
  f?: string, main: string, g?: string, onClick: () => void, variant?: "dark" | "gold" | "blue", isEnter?: boolean 
}) => {
  const getVariantClass = () => {
    if (variant === "gold") return "key-gold";
    if (variant === "blue") return "key-blue";
    return "";
  };

  return (
    <div className={`flex flex-col items-center justify-end h-24 ${isEnter ? 'row-span-2' : ''}`}>
      {f && <span className="label-f mb-1 h-4">{f}</span>}
      <button 
        onClick={onClick} 
        className={`key-3d w-full ${isEnter ? 'h-full' : 'h-12'} ${getVariantClass()} flex items-center justify-center`}
      >
        <span className={`text-sm font-bold tracking-tight ${variant !== 'dark' ? 'text-black' : 'text-white'}`}>
          {main}
        </span>
      </button>
      {g && <span className="label-g mt-1 h-4">{g}</span>}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<HPState>(INITIAL_STATE);

  const handleDigit = (digit: string) => {
    setState(prev => {
      let currentDisplay = prev.display.replace(/,/g, '');
      let newDisplay = prev.isEntering ? currentDisplay + digit : digit;
      if (newDisplay === '.') newDisplay = '0.';
      if (newDisplay.length > 10) return prev;
      return { 
        ...prev, 
        display: newDisplay.replace('.', ','), 
        isEntering: true,
        stack: [parseFloat(newDisplay) || 0, prev.stack[1], prev.stack[2], prev.stack[3]]
      };
    });
  };

  const handleEnter = () => {
    setState(prev => {
      const val = parseFloat(prev.display.replace(',', '.'));
      return { 
        ...prev, 
        stack: [val, val, prev.stack[1], prev.stack[2]], 
        isEntering: false, 
        display: formatDisplay(val).replace('.', ',')
      };
    });
  };

  const handleOp = (op: string) => {
    setState(prev => {
      const x = parseFloat(prev.display.replace(',', '.'));
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
        display: formatDisplay(res).replace('.', ','), 
        isEntering: false 
      };
    });
  };

  const handleTVM = (key: keyof HPState['memory']) => {
    const val = parseFloat(state.display.replace(',', '.'));
    setState(prev => ({ 
      ...prev, 
      memory: { ...prev.memory, [key]: val }, 
      isEntering: false,
      shift: 'none'
    }));
  };

  return (
    <div className="calc-container">
      <div className="brushed-metal w-[940px] p-8 rounded-[20px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border-b-[8px] border-black">
        
        {/* Superior: Logotipos e LCD */}
        <div className="flex justify-between items-start mb-10 px-4">
          <div className="flex flex-col">
            <h1 className="text-[#c5a059] italic text-5xl font-[900] tracking-tighter leading-none flex items-baseline">
              hp <span className="text-4xl ml-2 not-italic font-bold text-gray-300">12c</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.5em] mt-2">Platinum Financial Calculator</p>
          </div>
          
          <div className="lcd-display w-[420px] h-28 rounded-md flex flex-col justify-center items-end px-6">
            <div className="flex justify-between w-full text-[11px] font-bold text-black/60 mb-2">
              <div className="flex gap-6">
                <span className={state.shift === 'f' ? 'opacity-100' : 'opacity-10'}>f</span>
                <span className={state.shift === 'g' ? 'opacity-100' : 'opacity-10'}>g</span>
              </div>
              <span className="opacity-40">RPN</span>
            </div>
            <span className="text-6xl font-bold font-mono tracking-tighter text-[#1a231a]">
              {state.display}
            </span>
          </div>
        </div>

        {/* Teclado: 10 colunas com etiquetas realistas */}
        <div className="grid grid-cols-10 gap-x-4 gap-y-4">
          {/* Linha 1 */}
          <HPKey f="AMORT" main="n" g="12x" onClick={() => handleTVM('n')} />
          <HPKey f="INT" main="i" g="12÷" onClick={() => handleTVM('i')} />
          <HPKey f="NPV" main="PV" g="CF0" onClick={() => handleTVM('pv')} />
          <HPKey f="IRR" main="PMT" g="CFj" onClick={() => handleTVM('pmt')} />
          <HPKey f="PV" main="FV" g="Nj" onClick={() => handleTVM('fv')} />
          <HPKey f="BEG" main="CHS" g="END" onClick={() => {}} />
          <HPKey main="7" onClick={() => handleDigit('7')} />
          <HPKey main="8" onClick={() => handleDigit('8')} />
          <HPKey main="9" onClick={() => handleDigit('9')} />
          <HPKey main="÷" onClick={() => handleOp('/')} />

          {/* Linha 2 */}
          <HPKey f="yˣ" main="1/x" g="√x" onClick={() => {}} />
          <HPKey f="x!" main="yˣ" g="eˣ" onClick={() => {}} />
          <HPKey f="%" main="Δ%" g="LN" onClick={() => {}} />
          <HPKey f="ABS" main="%" g="FRAC" onClick={() => {}} />
          <HPKey f="PRGM" main="EEX" g="INTG" onClick={() => {}} />
          <HPKey f="P/R" main="RS" g="PSE" onClick={() => {}} />
          <HPKey main="4" onClick={() => handleDigit('4')} />
          <HPKey main="5" onClick={() => handleDigit('5')} />
          <HPKey main="6" onClick={() => handleDigit('6')} />
          <HPKey main="×" onClick={() => handleOp('*')} />

          {/* Linha 3 */}
          <HPKey f="SST" main="R↓" g="BST" onClick={() => {}} />
          <HPKey f="x<>y" main="x<>y" g="GTO" onClick={() => {}} />
          <HPKey f="CLx" main="CLX" g="x≤y" onClick={() => setState(prev => ({...prev, display: '0,00', isEntering: false}))} />
          <HPKey f="x≤y" main="STO" g="x=0" onClick={() => {}} />
          <HPKey f="x=0" main="RCL" g="x≠0" onClick={() => {}} />
          <HPKey main="ENTER" isEnter onClick={handleEnter} />
          <HPKey main="1" onClick={() => handleDigit('1')} />
          <HPKey main="2" onClick={() => handleDigit('2')} />
          <HPKey main="3" onClick={() => handleDigit('3')} />
          <HPKey main="-" onClick={() => handleOp('-')} />

          {/* Linha 4 */}
          <HPKey main="ON" onClick={() => setState(INITIAL_STATE)} />
          <HPKey main="f" variant="gold" onClick={() => setState(p => ({...p, shift: p.shift === 'f' ? 'none' : 'f'}))} />
          <HPKey main="g" variant="blue" onClick={() => setState(p => ({...p, shift: p.shift === 'g' ? 'none' : 'g'}))} />
          <HPKey main="STO" onClick={() => {}} />
          <HPKey main="RCL" onClick={() => {}} />
          <div className="col-span-1"></div> {/* Espaço do ENTER Tall */}
          <HPKey main="0" onClick={() => handleDigit('0')} />
          <HPKey main="." onClick={() => handleDigit('.')} />
          <HPKey main="Σ+" onClick={() => {}} />
          <HPKey main="+" onClick={() => handleOp('+')} />
        </div>

        {/* Rodapé Decorativo */}
        <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center opacity-30">
          <span className="text-[11px] text-white font-black uppercase tracking-[0.6em]">Hewlett-Packard</span>
          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-white/20"></div>
             <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
