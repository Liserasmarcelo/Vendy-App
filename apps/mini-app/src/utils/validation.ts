import { CheckoutFormData, ValidationError } from '../types/checkout';

export function validateCheckoutForm(data: CheckoutFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'El nombre completo es requerido (mínimo 2 caracteres)' });
  }

  if (!data.phone || !/^\+?[\d\s-]{8,}$/.test(data.phone.trim())) {
    errors.push({ field: 'phone', message: 'Ingresá un teléfono válido (mínimo 8 dígitos)' });
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'El email no es válido' });
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.push({ field: 'address', message: 'La dirección es requerida (mínimo 5 caracteres)' });
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.push({ field: 'city', message: 'La ciudad es requerida' });
  }

  if (!data.country || data.country.length !== 2) {
    errors.push({ field: 'country', message: 'Seleccioná un país' });
  }

  return errors;
}

export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find(e => e.field === field)?.message;
}

export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some(e => e.field === field);
}
