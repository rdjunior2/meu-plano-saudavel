import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Estende os matchers do jest com matchers específicos para DOM
expect.extend(matchers);

// Limpa após cada teste para evitar vazamento de estado entre testes
afterEach(() => {
  cleanup();
}); 