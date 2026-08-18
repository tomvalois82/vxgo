import { describe, expect, it } from 'bun:test'; // @ts-ignore tipos do bun:test não estão no projeto, mas bun os fornece em runtime
import { formatarTelefoneBR, TelefoneInvalidoError } from './phoneUtils';

describe('formatarTelefoneBR', () => {
  describe('saídas válidas', () => {
    it('formata número já correto sem alterações', () => {
      expect(formatarTelefoneBR('81996505552')).toBe('81996505552');
      expect(formatarTelefoneBR('87996505552')).toBe('87996505552');
    });

    it('remove máscaras comuns', () => {
      expect(formatarTelefoneBR('(81) 99650-5552')).toBe('81996505552');
      expect(formatarTelefoneBR('(83) 99650-5552')).toBe('83996505552');
    });

    it('remove espaços, parênteses e hífens', () => {
      expect(formatarTelefoneBR('81 9 9650-5552')).toBe('81996505552');
      expect(formatarTelefoneBR('42 9 9650-5552')).toBe('42996505552');
    });

    it('remove 0 inicial quando ainda sobra mais de 11 dígitos', () => {
      expect(formatarTelefoneBR('082996505552')).toBe('82996505552');
      expect(formatarTelefoneBR('081996505552')).toBe('81996505552');
    });

    it('remove código do país 55 quando sobra mais de 11 dígitos', () => {
      expect(formatarTelefoneBR('5581996505552')).toBe('81996505552');
      expect(formatarTelefoneBR('+55 81 9 9650-5552')).toBe('81996505552');
    });

    it('insere 9 obrigatório quando faltam 11 dígitos', () => {
      expect(formatarTelefoneBR('8196505552')).toBe('81996505552');
      expect(formatarTelefoneBR('42396505552')).toBe('42996505552');
    });

    it('retorna null para entrada vazia', () => {
      expect(formatarTelefoneBR('')).toBeNull();
      expect(formatarTelefoneBR(null)).toBeNull();
      expect(formatarTelefoneBR(undefined)).toBeNull();
      expect(formatarTelefoneBR('   ')).toBeNull();
    });
  });

  describe('erros', () => {
    it('rejeita DDD iniciado com 0 quando já tem 11 dígitos', () => {
      expect(() => formatarTelefoneBR('01196505552')).toThrow(TelefoneInvalidoError);
      expect(() => formatarTelefoneBR('021996505552')).toThrow(TelefoneInvalidoError);
    });

    it('rejeita quando 3º dígito não é 9', () => {
      expect(() => formatarTelefoneBR('05196505552')).toThrow(TelefoneInvalidoError);
      expect(() => formatarTelefoneBR('84896505552')).toThrow(TelefoneInvalidoError);
    });

    it('rejeita quando não atinge 11 dígitos', () => {
      expect(() => formatarTelefoneBR('8199650555')).toThrow(TelefoneInvalidoError);
    });

    it('rejeita quando ultrapassa 11 dígitos mesmo após cortes', () => {
      expect(() => formatarTelefoneBR('123456789012')).toThrow(TelefoneInvalidoError);
    });
  });
});
