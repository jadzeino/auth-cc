/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable import/first */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

// Mocked methods
const mockGetUser = jest.fn();
const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('../../repositories/DynamoUserRepository', () => ({
  DynamoUserRepository: jest.fn().mockImplementation((tableName: string) => ({
    dynamoDB: {}, // Some mock or stub for DynamoDBClient
    tableName,
    getUser: mockGetUser,
    createUser: mockCreateUser,
    deleteUser: mockDeleteUser,
    updateUser: mockUpdateUser,
  })),
}));

import bcrypt from 'bcryptjs';
import {handler} from './index'; // Import after mock
import {DynamoUserRepository} from '../../repositories/DynamoUserRepository'; // Import after mock

describe('Lambda Authentication Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clears mock calls and implementations.
  });

  it('should return authentication successful for a valid user', async () => {
    const event = {
      headers: {
        Authorization: `Basic ${Buffer.from('ahmedzeno:Password123!').toString(
          'base64',
        )}`,
      },
    };

    const hashedPassword = bcrypt.hashSync('Password123!', 10);
    // Mock the return value for getUser function
    mockGetUser.mockResolvedValueOnce({
      username: 'username',
      password: hashedPassword, // use bcryptjs to hash 'password' for this test
    });

    const response: any = await handler(event as any, {} as any, () => {});

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body!).message).toBe(
      'Authentication successful.',
    );
  });

  it('should return 404 when user is not found', async () => {
    const event = {
      headers: {
        Authorization: `Basic ${Buffer.from(
          'unknownUser:Password123!',
        ).toString('base64')}`,
      },
    };

    mockGetUser.mockResolvedValueOnce(null); // No user found

    const response: any = await handler(event as any, {} as any, () => {});
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body!).message).toBe('User not found.');
  });

  it('should return 401 when password is invalid', async () => {
    const event = {
      headers: {
        Authorization: `Basic ${Buffer.from(
          'ahmedzeno:WrongPassword!',
        ).toString('base64')}`,
      },
    };

    const hashedPassword = bcrypt.hashSync('Password123!', 10);
    mockGetUser.mockResolvedValueOnce({
      username: 'ahmedzeno',
      password: hashedPassword,
    });

    const response: any = await handler(event as any, {} as any, () => {});
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body!).message).toBe('Invalid credentials.');
  });

  it('should return 500 when there is an error fetching the user', async () => {
    const event = {
      headers: {
        Authorization: `Basic ${Buffer.from('ahmedzeno:Password123!').toString(
          'base64',
        )}`,
      },
    };

    mockGetUser.mockRejectedValueOnce(new Error('DynamoDB error')); // Simulate an error

    const response: any = await handler(event as any, {} as any, () => {});
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body!).message).toBe(
      'Internal server error. Please try again later.',
    );
  });

  it('should return 401 for an invalid Authorization header format', async () => {
    const event = {
      headers: {
        Authorization: `Bearer token`, // Invalid format for this handler
      },
    };

    const response: any = await handler(event as any, {} as any, () => {});
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body!).message).toContain(
      'Invalid Authorization format',
    );
  });
});
