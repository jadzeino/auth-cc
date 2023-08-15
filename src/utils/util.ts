import Joi from 'joi';
import {AuthorizationError} from './AuthorizationError';
import {RegistrationValidationError} from './RegistrationValidationError';

export interface BasicAuthCredentials {
  username: string;
  password: string;
}

export function extractBasicAuthCredentials(
  authHeader: string | undefined,
): BasicAuthCredentials {
  if (!authHeader) {
    throw new AuthorizationError('Authorization header is missing');
  }

  const schema = Joi.string().pattern(/^Basic .+/);
  if (schema.validate(authHeader).error) {
    throw new AuthorizationError('Invalid Authorization format');
  }

  const base64Credentials = authHeader.split(' ')[1];
  let decodedCredentials;
  try {
    decodedCredentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8',
    );
  } catch {
    throw new AuthorizationError('Invalid Base64 encoded credentials');
  }

  const [username, password] = decodedCredentials.split(':');

  if (!username || !password) {
    throw new AuthorizationError('Invalid credentials format');
  }

  return {username, password};
}

export function validateRegisterPayload(body: any) {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string()
      /**
       * Password Requirements:
       * - Minimum length of 7 characters.
       * - Contains at least one uppercase alphabetical character.
       * - Contains at least one lowercase alphabetical character.
       * - Contains at least one numeric character.
       * - Contains at least one of the following special characters: !@#$%^&*()
       */
      .pattern(
        new RegExp(
          '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()]).{7,}$',
        ),
      )
      .required(),
  });

  const {error} = schema.validate(body);
  if (error) {
    throw new RegistrationValidationError(
      'Invalid request payload.',
      error.details,
    );
  }

  return body;
}
