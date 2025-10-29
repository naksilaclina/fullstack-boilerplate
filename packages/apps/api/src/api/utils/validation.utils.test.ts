import { validateEmail, validatePassword, validateName } from './validation.utils';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should create a validation chain for email', () => {
      const validationChain = validateEmail();
      expect(validationChain).toBeDefined();
      expect(typeof validationChain).toBe('function');
    });
  });

  describe('validatePassword', () => {
    it('should create a validation chain for password', () => {
      const validationChain = validatePassword();
      expect(validationChain).toBeDefined();
      expect(typeof validationChain).toBe('function');
    });
  });

  describe('validateName', () => {
    it('should create a validation chain for name fields', () => {
      const validationChain = validateName('firstName');
      expect(validationChain).toBeDefined();
      expect(typeof validationChain).toBe('function');
    });
  });
});