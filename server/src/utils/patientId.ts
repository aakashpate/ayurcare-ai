export function generatePatientCode(lastNumber: number = 0): string {
  const year = new Date().getFullYear();
  const nextNumber = lastNumber + 1;
  return `AYU-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

export function validatePatientCode(code: string): boolean {
  const pattern = /^AYU-\d{4}-\d{4}$/;
  return pattern.test(code);
}
