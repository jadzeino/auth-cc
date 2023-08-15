import {APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import bcrypt from 'bcryptjs';
import {DynamoUserRepository} from '../../repositories/DynamoUserRepository';
import {extractBasicAuthCredentials} from '../../utils/util';
import {AuthorizationError} from '../../utils/AuthorizationError';

const userRepo = new DynamoUserRepository(process.env.DYNAMODB_TABLE!);

export const handler: APIGatewayProxyHandler = async (
  event,
): Promise<APIGatewayProxyResult> => {
  console.log('event  ', event);
  try {
    const credentials = extractBasicAuthCredentials(
      event.headers?.Authorization || event.headers?.authorization,
    );

    const {username, password: rawPassword} = credentials;

    const user = await userRepo.getUser(username);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({message: 'User not found.'}),
      };
    }

    const isPasswordValid = await bcrypt.compare(rawPassword, user.password);

    if (!isPasswordValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({message: 'Invalid credentials.'}),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({message: 'Authentication successful.'}),
    };
  } catch (error) {
    console.error('Error:', error);

    // Return specific errors for invalid Authorization header
    if (error instanceof AuthorizationError) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: error.message,
        }),
      };
    }

    // General error handling
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error. Please try again later.',
      }),
    };
  }
};
