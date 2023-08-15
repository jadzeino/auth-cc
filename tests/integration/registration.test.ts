import lambdaLocal = require('lambda-local');
import path = require('path');
import {DynamoUserRepository} from '../../src/repositories/DynamoUserRepository';

describe('RegisterLambdaFunction', () => {
  const jsonPayload = {
    version: '2.0',
    routeKey: 'POST /register',
    rawPath: '/register',
    rawQueryString: '',
    headers: {
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
      'content-length': '66',
      'content-type': 'application/json',
      host: 'k2riz1y5m4.execute-api.eu-central-1.amazonaws.com',
      'postman-token': '3a424409-fd2f-42da-9c1d-a15357f293f2',
      'user-agent': 'PostmanRuntime/7.32.2',
      'x-amzn-trace-id': 'Root=1-64db4be9-44dea0402017747333f95622',
      'x-forwarded-for': '212.34.12.169',
      'x-forwarded-port': '443',
      'x-forwarded-proto': 'https',
    },
    requestContext: {
      accountId: '430222119527',
      apiId: 'k2riz1y5m4',
      domainName: 'k2riz1y5m4.execute-api.eu-central-1.amazonaws.com',
      domainPrefix: 'k2riz1y5m4',
      http: {
        method: 'POST',
        path: '/register',
        protocol: 'HTTP/1.1',
        sourceIp: '212.34.12.169',
        userAgent: 'PostmanRuntime/7.32.2',
      },
      requestId: 'JsjMdjQQFiAEMJg=',
      routeKey: 'POST /register',
      stage: '$default',
      time: '15/Aug/2023:09:56:57 +0000',
      timeEpoch: 1692093417059,
    },
    body: '{\n  "username": "AhmedZeno",\n  "password": "Password123!"\n}',
    isBase64Encoded: false,
  };

  afterAll(async () => {
    const repo = new DynamoUserRepository('UserAuthentication-test');
    await repo.clearTable();
  });

  afterEach(async () => {
    const repo = new DynamoUserRepository('UserAuthentication-test');
    await repo.clearTable();
  });

  it('should register a user', async () => {
    const result: any = await lambdaLocal.execute({
      event: jsonPayload,
      lambdaPath: path.join(__dirname, '../../src/lambda/register/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });
    expect(result.statusCode).toBe(201);
  });

  it('should fail if user already exists', async () => {
    await lambdaLocal.execute({
      event: jsonPayload,
      lambdaPath: path.join(__dirname, '../../src/lambda/register/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });

    const secondAttempt: any = await lambdaLocal.execute({
      event: jsonPayload,
      lambdaPath: path.join(__dirname, '../../src/lambda/register/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });

    expect(secondAttempt.statusCode).toBe(409);
    expect(secondAttempt.body).toContain(
      'User with the same username already exists.',
    );
  });

  it('should fail if password is missing', async () => {
    const payloadMissingPassword = {
      ...jsonPayload,
      body: '{ "username": "NewUser" }',
    };

    const result: any = await lambdaLocal.execute({
      event: payloadMissingPassword,
      lambdaPath: path.join(__dirname, '../../src/lambda/register/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });

    expect(result.statusCode).toBe(400);
    expect(result.body).toContain('Invalid request payload.');
  });

  it('should fail with wrong format payload', async () => {
    const wrongFormatPayload = {
      ...jsonPayload,
      body: '{ "username": 123, "password": "Password123!" }',
    };

    const result: any = await lambdaLocal.execute({
      event: wrongFormatPayload,
      lambdaPath: path.join(__dirname, '../../src/lambda/register/index.ts'),
      handler: 'handler',
      environment: {
        DYNAMODB_TABLE: 'UserAuthentication-test',
        TEST_ENV: 'local',
      },
    });

    expect(result.statusCode).toBe(400);
  });
});
