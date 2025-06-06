import { Transform } from 'class-transformer';

export function Trim() {
  return Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
}

export function TrimArray() {
  return Transform(({ value }) => {
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      return value.map(item => item.trim());
    }
    return value;
  });
}
