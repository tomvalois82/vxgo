
export const currentYear = new Date().getFullYear();
export const years = Array.from(
  { length: currentYear - 1950 + 2 }, 
  (_, i) => currentYear + 1 - i
);

export const engineSizes = Array.from(
  { length: 41 }, // 1.0 to 5.0 with 0.1 increments = 41 options
  (_, i) => (1.0 + i * 0.1).toFixed(1)
);

export const colors = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Marrom', 'Verde', 'Amarelo', 'Azul'
];

export const categories = [
  'Hatch', 'Sedan', 'SUV', 'Conversível', 'Picape', 'Coupe', 'Esportivo'
];
