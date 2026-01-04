
import React, { useState, useEffect } from 'react';
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
    <div className={`flex flex-col items-center justify-end h-20 md:h-24 ${isEnter ? 'row-span-2' : ''}`}>
      {f && <span className="label-f mb-1 h-4 text-[9px] md:text-[11px] uppercase tracking-tighter">{f}</span>}
      <button 
        onClick={onClick} 
        className={`key-3d w-full ${isEnter ? 'h-full' : 'h-10 md:h-12'} ${getVariantClass()} flex items-center justify-center`}
      >
        <span className={`text-[10px] md:text-[13px] font-black tracking-tight ${variant !== 'dark' ? 'text-black' : 'text-white'}`}>
          {main}
        </span>
      </button>
      {g && <span className="label-g mt-1 h-4 text-[9px] md:text-[11px] uppercase tracking-tighter">{g}</span>}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<HPState>(INITIAL_STATE);

  useEffect(() => {
    // Manter a lógica de incremento de acessos no background se necessário, 
    // mas não exibimos mais na interface conforme solicitado.
    const localAccess = parseInt(localStorage.getItem('hp12c_access_count') || '1580');
    localStorage.setItem('hp12c_access_count', (localAccess + 1).toString());
  }, []);

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

  return (
    <div className="flex items-center justify-center p-6 min-h-screen w-full">
      {/* Container Único da Calculadora */}
      <div className="calc-wrapper">
        <div className="brushed-metal w-[340px] sm:w-[500px] md:w-[700px] lg:w-[940px] p-6 md:p-10 rounded-[20px] shadow-2xl">
          
          {/* Topo Industrial */}
          <div className="flex justify-between items-start mb-8 md:mb-12 px-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-6">
                <h1 className="text-[#c5a059] italic text-3xl md:text-6xl font-[900] tracking-tighter leading-none flex items-baseline">
                  hp <span className="text-2xl md:text-5xl ml-2 not-italic font-bold text-gray-500">12c</span>
                </h1>
                <div className="flex flex-col items-center bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                   <div className="led-active"></div>
                   <span className="text-[8px] text-green-500 font-black uppercase mt-1 tracking-widest">Active</span>
                </div>
              </div>
              <p className="text-[9px] md:text-[12px] text-gray-500 font-black uppercase tracking-[0.5em] mt-3 opacity-60">Platinum Financial Calculator</p>
            </div>
            
            <div className="lcd-display w-[180px] sm:w-[280px] md:w-[420px] h-20 md:h-32 rounded-lg flex flex-col justify-center items-end px-4 md:px-8">
              <div className="flex justify-between w-full text-[10px] md:text-[13px] font-black text-black/40 mb-2">
                <div className="flex gap-4 md:gap-8">
                  <span className={state.shift === 'f' ? 'text-black' : 'opacity-10'}>f</span>
                  <span className={state.shift === 'g' ? 'text-black' : 'opacity-10'}>g</span>
                </div>
                <span className="opacity-30">RPN MODE</span>
              </div>
              <span className="text-3xl sm:text-5xl md:text-7xl font-bold font-mono tracking-tighter text-[#141d14] leading-none">
                {state.display}
              </span>
            </div>
          </div>

          {/* Teclado Réplica */}
          <div className="grid grid-cols-10 gap-x-1 md:gap-x-4 gap-y-2 md:gap-y-4">
            <HPKey f="AMORT" main="n" g="12x" onClick={() => {}} />
            <HPKey f="INT" main="i" g="12÷" onClick={() => {}} />
            <HPKey f="NPV" main="PV" g="CF0" onClick={() => {}} />
            <HPKey f="IRR" main="PMT" g="CFj" onClick={() => {}} />
            <HPKey f="PV" main="FV" g="Nj" onClick={() => {}} />
            <HPKey f="BEG" main="CHS" g="END" onClick={() => {}} />
            <HPKey main="7" onClick={() => handleDigit('7')} />
            <HPKey main="8" onClick={() => handleDigit('8')} />
            <HPKey main="9" onClick={() => handleDigit('9')} />
            <HPKey main="÷" onClick={() => handleOp('/')} />

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

            <HPKey main="ON" onClick={() => setState(INITIAL_STATE)} />
            <HPKey main="f" variant="gold" onClick={() => setState(p => ({...p, shift: p.shift === 'f' ? 'none' : 'f'}))} />
            <HPKey main="g" variant="blue" onClick={() => setState(p => ({...p, shift: p.shift === 'g' ? 'none' : 'g'}))} />
            <HPKey main="STO" onClick={() => {}} />
            <HPKey main="RCL" onClick={() => {}} />
            <div className="col-span-1"></div>
            <HPKey main="0" onClick={() => handleDigit('0')} />
            <HPKey main="." onClick={() => handleDigit('.')} />
            <HPKey main="Σ+" onClick={() => {}} />
            <HPKey main="+" onClick={() => handleOp('+')} />
          </div>

          <div className="mt-10 md:mt-16 pt-6 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] md:text-[13px] text-white/20 font-black uppercase tracking-[0.8em]">Hewlett-Packard</span>
            <div className="flex gap-4">
               <div className="w-2 h-2 rounded-full bg-white/5 shadow-inner"></div>
               <div className="w-2 h-2 rounded-full bg-white/5 shadow-inner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
