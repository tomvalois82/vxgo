/**
 * Utilitários para formatação e validação de telefones brasileiros,
 * especialmente para exportação de CSVs (ex: integração 3C Plus).
 */

export class TelefoneInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TelefoneInvalidoError';
  }
}

/**
 * Formata um telefone brasileiro no padrão de 11 dígitos (DDD + 9 + número),
 * sem qualquer pontuação, espaço ou caractere especial.
 *
 * Regras:
 * - Remove máscaras, espaços, parênteses, hífens, sinal de + e código do país (55).
 * - Remove 0 inicial quando o número ainda possui mais de 11 dígitos.
 * - Se sobrarem 10 dígitos, insere o 9 obrigatório após o DDD.
 * - Valida: exatamente 11 dígitos, DDD com 2 dígitos e sem iniciar em 0, 3º dígito = 9.
 *
 * @param telefone - Número de telefone em qualquer formato aceito.
 * @returns String com 11 dígitos ou null quando o valor estiver vazio.
 * @throws TelefoneInvalidoError quando o número não atender aos critérios.
 *
 * @example
 * formatarTelefoneBR('(81) 99650-5552') // '81996505552'
 * formatarTelefoneBR('082996505552')    // '82996505552'
 * formatarTelefoneBR('23 9 9650-5552')  // '23996505552'
 * formatarTelefoneBR('01196505552')     // throw TelefoneInvalidoError
 */
export function formatarTelefoneBR(telefone?: string | null): string | null {
  if (!telefone || telefone.trim() === '') {
    return null;
  }

  let digitos = telefone.replace(/\D/g, '');

  // Remove zeros iniciais (prefixo de discagem), pois o DDD nunca inicia com 0.
  digitos = digitos.replace(/^0+/, '');

  // Remove código do país (55) apenas quando sobra mais de 11 dígitos.
  if (digitos.startsWith('55') && digitos.length > 11) {
    digitos = digitos.slice(2);
    digitos = digitos.replace(/^0+/, '');
  }

  // Se sobrarem 10 dígitos, insere o 9 obrigatório após o DDD.
  if (digitos.length === 10) {
    digitos = `${digitos.slice(0, 2)}9${digitos.slice(2)}`;
  }

  // Validações finais.
  if (digitos.length !== 11) {
    throw new TelefoneInvalidoError(
      `Telefone inválido: deve conter exatamente 11 dígitos (recebido ${digitos.length}).`
    );
  }

  if (digitos[0] === '0' || digitos[1] === '0') {
    throw new TelefoneInvalidoError('Telefone inválido: DDD não pode iniciar com 0.');
  }

  if (digitos[2] !== '9') {
    throw new TelefoneInvalidoError(
      'Telefone inválido: o 3º dígito deve ser 9 (padrão celular brasileiro).'
    );
  }

  return digitos;
}

/**
 * Exibe um telefone brasileiro no formato de máscara (DD) 9XXXX-XXXX,
 * para uso em telas e listagens.
 *
 * Regras:
 * - Mantém apenas dígitos e remove código do país (55) quando o total
 *   passa de 11 dígitos.
 * - 11 dígitos -> (DD) XXXXX-XXXX
 * - 10 dígitos -> (DD) XXXX-XXXX
 * - Qualquer outro caso devolve o valor original sem alteração.
 *
 * @param telefone - Número de telefone em qualquer formato aceito.
 * @returns String mascarada, o valor original ou null quando vazio.
 *
 * @example
 * mascararTelefoneBR('81996505552') // '(81) 99650-5552'
 * mascararTelefoneBR('8199650552')  // '(81) 9965-0552'
 */
export function mascararTelefoneBR(telefone?: string | null): string | null {
  if (!telefone || telefone.trim() === '') {
    return null;
  }

  let digitos = telefone.replace(/\D/g, '');

  // Remove código do país (55) apenas quando sobra mais de 11 dígitos.
  if (digitos.startsWith('55') && digitos.length > 11) {
    digitos = digitos.slice(2);
  }

  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }

  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  return telefone.trim();
}

