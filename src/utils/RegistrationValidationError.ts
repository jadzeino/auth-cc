export class RegistrationValidationError extends Error {
  details: any;

  constructor(message: string, details: any) {
    super(message);
    this.name = 'RegistrationValidationError';
    this.details = details;
    Object.setPrototypeOf(this, RegistrationValidationError.prototype);
  }
}
