/** Utilitários para leitura de arquivos .csv de plataformas diversas */

/** Detecta o separador mais provável analisando a primeira linha */
export const detectarSeparador = (primeiraLinha: string): string => {
  const candidatos = [';', ',', '|', '\t'];
  let melhor = ',';
  let maiorContagem = -1;
  candidatos.forEach((sep) => {
    // Conta apenas separadores fora de aspas
    let dentroAspas = false;
    let contagem = 0;
    for (const caractere of primeiraLinha) {
      if (caractere === '"') dentroAspas = !dentroAspas;
      else if (caractere === sep && !dentroAspas) contagem += 1;
    }
    if (contagem > maiorContagem) {
      maiorContagem = contagem;
      melhor = sep;
    }
  });
  return melhor;
};

/** Faz o parse completo do conteúdo csv respeitando aspas duplas e quebras de linha */
export const parseCsv = (
  conteudo: string,
): { cabecalho: string[]; linhas: string[][]; separador: string } => {
  // Remove BOM
  const texto = conteudo.replace(/^\uFEFF/, '');
  const primeiraQuebra = texto.search(/\r?\n/);
  const primeiraLinha = primeiraQuebra === -1 ? texto : texto.slice(0, primeiraQuebra);
  const separador = detectarSeparador(primeiraLinha);

  const registros: string[][] = [];
  let campoAtual = '';
  let linhaAtual: string[] = [];
  let dentroAspas = false;

  const finalizarCampo = () => {
    linhaAtual.push(campoAtual.trim());
    campoAtual = '';
  };
  const finalizarLinha = () => {
    finalizarCampo();
    if (linhaAtual.some((valor) => valor !== '')) registros.push(linhaAtual);
    linhaAtual = [];
  };

  for (let i = 0; i < texto.length; i += 1) {
    const caractere = texto[i];
    if (dentroAspas) {
      if (caractere === '"') {
        if (texto[i + 1] === '"') {
          campoAtual += '"';
          i += 1;
        } else {
          dentroAspas = false;
        }
      } else {
        campoAtual += caractere;
      }
      continue;
    }
    if (caractere === '"') {
      dentroAspas = true;
    } else if (caractere === separador) {
      finalizarCampo();
    } else if (caractere === '\n') {
      finalizarLinha();
    } else if (caractere !== '\r') {
      campoAtual += caractere;
    }
  }
  if (campoAtual !== '' || linhaAtual.length > 0) finalizarLinha();

  const [cabecalho = [], ...linhas] = registros;
  return { cabecalho, linhas, separador };
};
