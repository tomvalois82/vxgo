
const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function convertThreeDigits(num: number): string {
  if (num === 0) return '';
  
  let result = '';
  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const u = num % 10;
  
  if (h > 0) {
    if (num === 100) {
      result += 'cem';
    } else {
      result += hundreds[h];
    }
  }
  
  if (t >= 2) {
    if (result) result += ' e ';
    result += tens[t];
    if (u > 0) {
      result += ' e ' + units[u];
    }
  } else if (t === 1) {
    if (result) result += ' e ';
    result += teens[u];
  } else if (u > 0) {
    if (result) result += ' e ';
    result += units[u];
  }
  
  return result;
}

export function numberToWords(value: number): string {
  if (value === 0) return 'zero reais';
  
  const integerPart = Math.floor(value);
  const decimalPart = Math.round((value - integerPart) * 100);
  
  let result = '';
  
  if (integerPart === 0) {
    result = 'zero reais';
  } else {
    const millions = Math.floor(integerPart / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const units = integerPart % 1000;
    
    if (millions > 0) {
      const millionText = convertThreeDigits(millions);
      if (millions === 1) {
        result += millionText + ' milhão';
      } else {
        result += millionText + ' milhões';
      }
    }
    
    if (thousands > 0) {
      if (result) result += ', ';
      const thousandText = convertThreeDigits(thousands);
      if (thousands === 1) {
        result += 'mil';
      } else {
        result += thousandText + ' mil';
      }
    }
    
    if (units > 0) {
      if (result) result += ', ';
      result += convertThreeDigits(units);
    } else if (result && !thousands) {
      // Handle cases like "um milhão" without adding units
    }
    
    if (integerPart === 1) {
      result += ' real';
    } else {
      result += ' reais';
    }
  }
  
  if (decimalPart > 0) {
    const centText = convertThreeDigits(decimalPart);
    if (decimalPart === 1) {
      result += ' e ' + centText + ' centavo';
    } else {
      result += ' e ' + centText + ' centavos';
    }
  }
  
  return result;
}
