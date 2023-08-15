/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable import/first */
const mockGetUser = jest.fn();
const mockCreateUser = jest.fn();

jest.mock('../../repositories/DynamoUserRepository', () => ({
  DynamoUserRepository: jest.fn().mockImplementation((tableName: string) => ({
    dynamoDB: {},
    tableName,
    getUser: mockGetUser,
    createUser: mockCreateUser,
  })),
}));

import {handler} from './index';

describe('Lambda Registration Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully register a new user', async () => {
    const event = {
      body: JSON.stringify({
        username: 'newUser',
        password: 'Password123!',
      }),
    };

    mockGetUser.mockResolvedValueOnce(null); // No existing user

    const response: any = await handler(event as any, {} as any, () => {});
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body!).message).toBe(
      'User created successfully.',
    );
  });

  it('should return 409 for an already existing username', async () => {
    const event = {
      body: JSON.stringify({
        username: 'existingUser',
        password: 'Password123!',
      }),
    };

    mockGetUser.mockResolvedValueOnce({
      username: 'existingUser',
      password: 'someHashedPassword',
    });

    const response: any = await handler(event as any, {} as any, () => {});
    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body!).message).toBe(
      'User with the same username already exists.',
    );
  });

  it('should return 400 for an invalid registration payload', async () => {
    const event = {
      body: JSON.stringify({
        username: 'invalidUser',
        // Missing password in the payload
      }),
    };

    const response: any = await handler(event as any, {} as any, () => {});
    expect(response.statusCode).toBe(400);
    const responseBody = JSON.parse(response.body!);
    expect(responseBody.message).toContain('Invalid request payload.');

    // Check for the details property in the response
    expect(responseBody.details).toBeDefined();
    expect(responseBody.details[0].message).toEqual('"password" is required');
  });

  it('should return 500 when there is an error fetching the user or creating one', async () => {
    const event = {
      body: JSON.stringify({
        username: 'someUser',
        password: 'Password123!',
      }),
    };

    mockGetUser.mockRejectedValueOnce(new Error('DynamoDB error')); // Simulate an error

    const response: any = await handler(event as any, {} as any, () => {});
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body!).message).toBe(
      'Internal server error. Please try again later.',
    );
  });
});
