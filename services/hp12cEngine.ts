
export const calculateTVM = (n: number, i: number, pv: number, pmt: number, fv: number, solveFor: string): number => {
  const rate = i / 100;
  
  switch (solveFor) {
    case 'fv':
      // FV = -PV(1+i)^n - PMT[(1+i)^n - 1]/i
      if (rate === 0) return -(pv + pmt * n);
      return -(pv * Math.pow(1 + rate, n) + pmt * (Math.pow(1 + rate, n) - 1) / rate);
    
    case 'pv':
      // PV = [-FV - PMT[(1+i)^n - 1]/i] / (1+i)^n
      if (rate === 0) return -(fv + pmt * n);
      return (-fv - pmt * (Math.pow(1 + rate, n) - 1) / rate) / Math.pow(1 + rate, n);

    case 'pmt':
      // PMT = [-FV - PV(1+i)^n] * i / [(1+i)^n - 1]
      if (rate === 0) return -(fv + pv) / n;
      return (-fv - pv * Math.pow(1 + rate, n)) * rate / (Math.pow(1 + rate, n) - 1);

    case 'n':
      // Complex logarithmic solution
      if (rate === 0) return -(fv + pv) / pmt;
      try {
        const num = Math.log((-fv * rate + pmt) / (pv * rate + pmt));
        const den = Math.log(1 + rate);
        return num / den;
      } catch (e) { return 0; }

    default:
      return 0;
  }
};

export const formatDisplay = (val: number): string => {
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  });
};
