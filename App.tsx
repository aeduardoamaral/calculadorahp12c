
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
      {f && <span className="label-f mb-1 h-4 text-[9px] md:text-[11px]">{f}</span>}
      <button 
        onClick={onClick} 
        className={`key-3d w-full ${isEnter ? 'h-full' : 'h-10 md:h-12'} ${getVariantClass()} flex items-center justify-center`}
      >
        <span className={`text-[11px] md:text-sm font-bold tracking-tight ${variant !== 'dark' ? 'text-black' : 'text-white'}`}>
          {main}
        </span>
      </button>
      {g && <span className="label-g mt-1 h-4 text-[9px] md:text-[11px]">{g}</span>}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<HPState>(INITIAL_STATE);
  const [accessCount, setAccessCount] = useState(0);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`;

  useEffect(() => {
    // Simulação de contador de acessos persistente
    const localAccess = parseInt(localStorage.getItem('hp12c_access_count') || '1245');
    const newCount = localAccess + 1;
    localStorage.setItem('hp12c_access_count', newCount.toString());
    setAccessCount(newCount);
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
    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 p-4">
      {/* Container Principal da Calculadora */}
      <div className="calc-wrapper">
        <div className="brushed-metal w-[340px] sm:w-[500px] md:w-[700px] lg:w-[940px] p-4 sm:p-6 md:p-8 rounded-[15px] md:rounded-[20px] shadow-2xl border-b-[8px] border-black">
          
          {/* Topo: Logo, LED e LCD */}
          <div className="flex justify-between items-start mb-6 md:mb-10 px-2 md:px-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-[#c5a059] italic text-2xl md:text-5xl font-[900] tracking-tighter leading-none flex items-baseline">
                  hp <span className="text-xl md:text-4xl ml-2 not-italic font-bold text-gray-400">12c</span>
                </h1>
                <div className="flex flex-col items-center ml-4">
                   <div className="led-active"></div>
                   <span className="text-[7px] text-green-500 font-bold uppercase mt-1">Active</span>
                </div>
              </div>
              <p className="text-[8px] md:text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] md:tracking-[0.5em] mt-2">Platinum Financial Calculator</p>
            </div>
            
            <div className="lcd-display w-[180px] sm:w-[280px] md:w-[420px] h-16 md:h-28 rounded-md flex flex-col justify-center items-end px-3 md:px-6">
              <div className="flex justify-between w-full text-[9px] md:text-[11px] font-bold text-black/60 mb-1 md:mb-2">
                <div className="flex gap-3 md:gap-6">
                  <span className={state.shift === 'f' ? 'opacity-100' : 'opacity-10'}>f</span>
                  <span className={state.shift === 'g' ? 'opacity-100' : 'opacity-10'}>g</span>
                </div>
                <span className="opacity-40">RPN</span>
              </div>
              <span className="text-2xl sm:text-4xl md:text-6xl font-bold font-mono tracking-tighter text-[#1a231a]">
                {state.display}
              </span>
            </div>
          </div>

          {/* Grid de Teclas */}
          <div className="grid grid-cols-10 gap-x-1 sm:gap-x-2 md:gap-x-4 gap-y-2 md:gap-y-4">
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

          <div className="mt-6 md:mt-12 pt-4 md:pt-6 border-t border-white/5 flex justify-between items-center opacity-30">
            <span className="text-[8px] md:text-[11px] text-white font-black uppercase tracking-[0.6em]">Hewlett-Packard</span>
            <div className="flex gap-2">
               <div className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-white/20"></div>
               <div className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-white/20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Lateral: QR Code e Estatísticas */}
      <div className="flex flex-col items-center lg:items-start gap-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-200 min-w-[280px]">
        <div className="text-center lg:text-left">
          <h3 className="text-gray-800 font-bold text-lg mb-1">Use no seu Celular</h3>
          <p className="text-gray-500 text-sm">Escaneie o código abaixo</p>
        </div>
        
        <div className="p-3 bg-white border-2 border-gray-100 rounded-xl shadow-inner">
          <img src={qrUrl} alt="QR Code" className="w-32 h-32 md:w-40 md:h-40" />
        </div>

        <div className="w-full space-y-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Acessos Totais</span>
            <span className="bg-gray-100 text-gray-800 font-mono font-bold px-3 py-1 rounded-full text-sm">
              {accessCount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Disponibilidade</span>
            <span className="flex items-center gap-2 text-green-600 font-bold text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              Online
            </span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
          <p className="text-blue-700 text-xs leading-relaxed">
            <b>Dica:</b> Para uma experiência tátil melhor no tablet ou celular, use o dispositivo na horizontal.
          </p>
        </div>
      </div>
    </div>
  );
}
