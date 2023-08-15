import {AuthorizationError} from './AuthorizationError';
import {RegistrationValidationError} from './RegistrationValidationError';
import {extractBasicAuthCredentials, validateRegisterPayload} from './util';

describe('extractBasicAuthCredentials', () => {
  it('should extract credentials from a valid Authorization header', () => {
    const header = `Basic ${Buffer.from('username:password').toString(
      'base64',
    )}`;
    const credentials = extractBasicAuthCredentials(header);
    expect(credentials).toEqual({username: 'username', password: 'password'});
  });

  it('should throw an AuthorizationError for invalid Authorization format', () => {
    const header = 'Basic invalidBase64';
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      AuthorizationError,
    );
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      'Invalid credentials format',
    );
  });

  it('should throw an AuthorizationError when the Authorization header is missing', () => {
    expect(() => extractBasicAuthCredentials(undefined)).toThrow(
      AuthorizationError,
    );
    expect(() => extractBasicAuthCredentials(undefined)).toThrow(
      'Authorization header is missing',
    );
  });

  it('should throw an AuthorizationError for non-Basic authorization type', () => {
    const header = 'Bearer someToken';
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      AuthorizationError,
    );
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      'Invalid Authorization format',
    );
  });

  it("should throw an AuthorizationError when there's no space after Basic", () => {
    const header = 'BasicSomeValue';
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      AuthorizationError,
    );
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      'Invalid Authorization format',
    );
  });

  it('should throw an AuthorizationError when credentials format is invalid', () => {
    const header = `Basic ${Buffer.from('usernameWithoutColon').toString(
      'base64',
    )}`;
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      AuthorizationError,
    );
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      'Invalid credentials format',
    );
  });

  it('should throw an AuthorizationError when username or password is empty', () => {
    const header = `Basic ${Buffer.from(':').toString('base64')}`;
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      AuthorizationError,
    );
    expect(() => extractBasicAuthCredentials(header)).toThrow(
      'Invalid credentials format',
    );
  });
});

describe('validateRegisterPayload', () => {
  it('should validate a valid payload', () => {
    const payload = {
      username: 'AhmedZeno',
      password: 'Abc123!',
    };

    expect(() => validateRegisterPayload(payload)).not.toThrow();
    expect(validateRegisterPayload(payload)).toEqual(payload);
  });

  it('should throw error for invalid username', () => {
    const payload = {
      username: 'ab',
      password: 'Abc123!',
    };

    expect(() => validateRegisterPayload(payload)).toThrow(
      RegistrationValidationError,
    );
    expect(() => validateRegisterPayload(payload)).toThrow(
      'Invalid request payload.',
    );
  });

  it('should throw error for password without uppercase', () => {
    const payload = {
      username: 'AhmedZeno',
      password: 'abc123!',
    };

    expect(() => validateRegisterPayload(payload)).toThrow(
      RegistrationValidationError,
    );
  });

  it('should throw error for password without lowercase', () => {
    const payload = {
      username: 'AhmedZeno',
      password: 'ABC123!',
    };

    expect(() => validateRegisterPayload(payload)).toThrow(
      RegistrationValidationError,
    );
  });

  it('should throw error for password without number', () => {
    const payload = {
      username: 'AhmedZeno',
      password: 'Abcdef!',
    };

    expect(() => validateRegisterPayload(payload)).toThrow(
      RegistrationValidationError,
    );
  });

  it('should throw error for password without special character', () => {
    const payload = {
      username: 'AhmedZeno',
      password: 'Abc1234',
    };

    expect(() => validateRegisterPayload(payload)).toThrow(
      RegistrationValidationError,
    );
  });

  it('should throw error for password below minimum length', () => {
    const payload = {
      username: 'AhmedZeno',
      password: 'Abc1!',
    };

    expect(() => validateRegisterPayload(payload)).toThrow(
      RegistrationValidationError,
    );
  });

  it('should throw error for invalid username and check details', () => {
    const payload = {
      username: 'ab',
      password: 'Abc123!',
    };

    // Expect the function to throw RegistrationValidationError
    expect(() => validateRegisterPayload(payload)).toThrow(
      RegistrationValidationError,
    );

    try {
      validateRegisterPayload(payload);
    } catch (error) {
      if (error instanceof RegistrationValidationError) {
        // Validate that the details contain the appropriate error information
        expect(error.details).toBeDefined();
        expect(error.details[0].message).toBe(
          '"username" length must be at least 3 characters long',
        );
      } else {
        // Rethrow any other errors to make sure they cause the test to fail
        throw error;
      }
    }
  });

  it('should throw error for invalid password and check details', () => {
    const payload = {
      username: 'AhmedZeno',
      password: 'Abc123',
    };

    // Expect the function to throw RegistrationValidationError
    expect(() => validateRegisterPayload(payload)).toThrow(
      RegistrationValidationError,
    );

    try {
      validateRegisterPayload(payload);
    } catch (error) {
      if (error instanceof RegistrationValidationError) {
        // Validate that the details contain the appropriate error information
        expect(error.details).toBeDefined();
        expect(error.details[0].message).toContain(
          '"password" with value "Abc123" fails to match the required pattern',
        );
      } else {
        // Rethrow any other errors to make sure they cause the test to fail
        throw error;
      }
    }
  });
});
