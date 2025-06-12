
const units = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'
];

const tens = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
];

const hundreds = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
];

function convertHundreds(num: number): string {
  if (num === 0) return '';
  if (num === 100) return 'cem';
  
  let result = '';
  
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  
  if (h > 0) {
    result += hundreds[h];
  }
  
  if (remainder > 0) {
    if (result) result += ' e ';
    
    if (remainder < 20) {
      result += units[remainder];
    } else {
      const t = Math.floor(remainder / 10);
      const u = remainder % 10;
      result += tens[t];
      if (u > 0) {
        result += ' e ' + units[u];
      }
    }
  }
  
  return result;
}

export function convertToWords(value: number): string {
  if (value === 0) return 'zero reais';
  
  const integerPart = Math.floor(value);
  const decimalPart = Math.round((value - integerPart) * 100);
  
  let result = '';
  
  if (integerPart >= 1000000) {
    const millions = Math.floor(integerPart / 1000000);
    result += convertHundreds(millions) + (millions === 1 ? ' milhão' : ' milhões');
    const remainder = integerPart % 1000000;
    if (remainder > 0) {
      result += ' e ' + convertToWords(remainder).replace(' reais', '');
    }
  } else if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    result += convertHundreds(thousands) + ' mil';
    const remainder = integerPart % 1000;
    if (remainder > 0) {
      result += ' e ' + convertHundreds(remainder);
    }
  } else {
    result += convertHundreds(integerPart);
  }
  
  result += integerPart === 1 ? ' real' : ' reais';
  
  if (decimalPart > 0) {
    result += ' e ' + convertHundreds(decimalPart) + (decimalPart === 1 ? ' centavo' : ' centavos');
  }
  
  return result;
}

export function convertFromWords(words: string): number {
  if (!words || typeof words !== 'string') return 0;
  
  // Simple regex to extract numbers from text if it contains any
  const numberMatch = words.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }
  
  // If no numbers found, return 0
  return 0;
}
