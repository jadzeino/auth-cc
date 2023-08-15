/* eslint-disable @typescript-eslint/no-unsafe-argument */
import lambdaLocal = require('lambda-local');
import path = require('path');
import bcrypt from 'bcryptjs';
import {DynamoUserRepository} from '../../src/repositories/DynamoUserRepository';

describe('AuthLambdaFunction', () => {
  const username = 'AhmedZeno';
  const password = 'Password123!';
  const hashedPassword = bcrypt.hashSync(password, 10);

  const jsonPayload = {
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
        'base64',
      )}`,
    },
  };

  beforeAll(async () => {
    const repo = new DynamoUserRepository('UserAuthentication-test');
    await repo.createUser({
      username,
      password: hashedPassword,
    });
  });

  afterAll(async () => {
    const repo = new DynamoUserRepository('UserAuthentication-test');
    await repo.clearTable();
  });

  it('should authenticate user', async () => {
    const result: any = await lambdaLocal.execute({
      event: jsonPayload,
      lambdaPath: path.join(__dirname, '../../src/lambda/auth/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe('Authentication successful.');
  });

  it('should reject invalid password', async () => {
    const wrongPasswordPayload = {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${username}:wrongPassword`,
        ).toString('base64')}`,
      },
    };

    const result: any = await lambdaLocal.execute({
      event: wrongPasswordPayload,
      lambdaPath: path.join(__dirname, '../../src/lambda/auth/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).message).toBe('Invalid credentials.');
  });

  it('should indicate if user is not found', async () => {
    const wrongUsernamePayload = {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `wrongUsername:${password}`,
        ).toString('base64')}`,
      },
    };

    const result: any = await lambdaLocal.execute({
      event: wrongUsernamePayload,
      lambdaPath: path.join(__dirname, '../../src/lambda/auth/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe('User not found.');
  });

  it('should handle invalid Authorization header format', async () => {
    const invalidHeaderPayload = {
      headers: {
        Authorization: `Bearer randomtoken`,
      },
    };

    const result: any = await lambdaLocal.execute({
      event: invalidHeaderPayload,
      lambdaPath: path.join(__dirname, '../../src/lambda/auth/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });

    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body).message).toContain(
      'Invalid Authorization format',
    );
  });
});
