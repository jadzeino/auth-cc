import {APIGatewayProxyHandler} from 'aws-lambda';
import bcrypt from 'bcryptjs';
import {DynamoUserRepository} from '../../repositories/DynamoUserRepository';
import {validateRegisterPayload} from '../../utils/util';
import {RegistrationValidationError} from '../../utils/RegistrationValidationError';

const userRepo = new DynamoUserRepository(process.env.DYNAMODB_TABLE!);

export const handler: APIGatewayProxyHandler = async event => {
  // console.log('event  ', event);
  try {
    // Parsing and validating the request body
    const body = validateRegisterPayload(JSON.parse(event.body!));
    const {username, password}: {username: string; password: string} = body;

    if (process.env.TEST_ENV === 'local') {
      await userRepo.createTableIfNotExists();
    }
    // Check if the user already exists
    const existingUser = await userRepo.getUser(username);
    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: 'User with the same username already exists.',
        }),
      };
    }

    // Hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Saving the user
    await userRepo.createUser({
      username,
      // password,
      password: hashedPassword,
    });

    return {
      statusCode: 201,
      body: JSON.stringify({message: 'User created successfully.'}),
    };
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof RegistrationValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: error.message,
          details: error.details,
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error. Please try again later.',
      }),
    };
  }
};
