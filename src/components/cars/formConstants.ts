
export const currentYear = new Date().getFullYear();
export const years = Array.from(
  { length: currentYear - 1950 + 2 }, 
  (_, i) => currentYear + 1 - i
);

export const engineSizes = [
  '1.0', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', 
  '2.0', '2.2', '2.4', '2.8', '3.0', '3.2', '3.6', '4.0', '4.2', '5.0'
];

export const colors = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Marrom', 'Verde', 'Amarelo', 'Azul'
];

export const categories = [
  'Hatch', 'Sedan', 'SUV', 'Conversível', 'Picape', 'Coupe', 'Esportivo'
];
