
export const calculateTVM = (memory: { n: number, i: number, pv: number, pmt: number, fv: number }, solveFor: string): number => {
  const { n, i, pv, pmt, fv } = memory;
  const r = i / 100;
  
  switch (solveFor) {
    case 'fv':
      if (r === 0) return -(pv + pmt * n);
      return -(pv * Math.pow(1 + r, n) + pmt * (Math.pow(1 + r, n) - 1) / r);
    
    case 'pv':
      if (r === 0) return -(fv + pmt * n);
      return (-fv - pmt * (Math.pow(1 + r, n) - 1) / r) / Math.pow(1 + r, n);

    case 'pmt':
      if (r === 0) return -(fv + pv) / n;
      return (-fv - pv * Math.pow(1 + r, n)) * r / (Math.pow(1 + r, n) - 1);

    case 'n':
      if (r === 0) return pmt === 0 ? 0 : -(fv + pv) / pmt;
      try {
        const num = Math.log((pmt - fv * r) / (pmt + pv * r));
        const den = Math.log(1 + r);
        return num / den;
      } catch (e) { return 0; }

    case 'i':
      let rate = 0.1; 
      for (let j = 0; j < 20; j++) {
        const powN = Math.pow(1 + rate, n);
        const f = pv * powN + pmt * (powN - 1) / rate + fv;
        const df = n * pv * Math.pow(1 + rate, n - 1) + pmt * (n * rate * Math.pow(1 + rate, n - 1) - (powN - 1)) / (rate * rate);
        rate = rate - f / df;
      }
      return rate * 100;

    default:
      return 0;
  }
};

export const formatDisplay = (val: number, precision: number): string => {
  if (isNaN(val) || !isFinite(val)) return "Error";
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: true
  });
};
