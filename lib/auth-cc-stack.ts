import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from '@aws-cdk/aws-apigatewayv2-alpha';
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import {join} from 'path';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';

interface AuthCcStackProps extends cdk.StackProps {
  environment?: string;
}

export class AuthCcStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: AuthCcStackProps) {
    super(scope, id, props);
    const stage = props?.environment || 'dev';
    const tableName = `UserAuthentication-${stage}`;
    const isProduction = stage === 'production';
    const LAMBDA_TIMEOUT = 5;
    const commonLambdaProps: NodejsFunctionProps = {
      bundling: {
        minify: true,
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
        keepNames: true,
      },
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: cdk.Duration.seconds(LAMBDA_TIMEOUT),
      logRetention: isProduction
        ? RetentionDays.TWO_MONTHS
        : RetentionDays.THREE_DAYS,
    };
    const commonLambdaEnv = {
      LOG_LEVEL: isProduction ? 'INFO' : 'DEBUG',
      STAGE: stage,
      REGION: cdk.Stack.of(this).region,
      DYNAMODB_TABLE: tableName,
      AVAILABILITY_ZONES: JSON.stringify(cdk.Stack.of(this).availabilityZones),
    };

    // Create Dynamodb table
    const userAuthTable = new dynamodb.Table(this, id, {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProduction
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      partitionKey: {name: 'username', type: dynamodb.AttributeType.STRING},
      /* sortKey: {name: 'createdAt', type: dynamodb.AttributeType.NUMBER}, */
      pointInTimeRecovery: true,
      tableName,
    });

    const registerLambda = new NodejsFunction(this, 'RegisterLambdaFunction', {
      memorySize: 1024,
      ...commonLambdaProps,
      handler: 'handler',
      entry: join(__dirname, '../src/lambda/register', 'index.ts'),
      environment: commonLambdaEnv,
      functionName: `register-user-${stage}`,
    });
    userAuthTable.grantReadWriteData(registerLambda);

    const authLambda = new NodejsFunction(this, 'AuthLambdaFunction', {
      memorySize: 1024,
      ...commonLambdaProps,
      handler: 'handler',
      entry: join(__dirname, '../src/lambda/auth', 'index.ts'),
      environment: commonLambdaEnv,
      functionName: `auth-user-${stage}`,
    });
    userAuthTable.grantReadData(authLambda);

    const httpApi = new HttpApi(this, `auth-api-${stage}`, {
      description: `HTTP API for user Authorization - ${stage}`,
      corsPreflight: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: [
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowCredentials: true,
        allowOrigins:
          stage === 'dev' ? ['http://localhost:3000'] : ['targetedDomains'], // dummy domains for now
      },
    });

    httpApi.addRoutes({
      path: '/register',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        'registerIntegration',
        registerLambda,
      ),
    });

    httpApi.addRoutes({
      path: '/authenticate',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        'authenticateIntegration',
        authLambda,
      ),
    });

    // Add an Output with the API Url
    new cdk.CfnOutput(this, 'apiUrl', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: httpApi.url!,
    });
  }
}
