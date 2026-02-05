// 1️⃣ Enables extra jest matchers like "toBeInTheDocument"
import '@testing-library/jest-dom';

// 2️⃣ Polyfill for TextEncoder/TextDecoder (required by react-router-dom in Node)
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 3️⃣ (Optional) Mock localStorage if you plan to test code that uses it
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();
