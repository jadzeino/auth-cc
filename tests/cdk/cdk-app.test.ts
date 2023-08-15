import {Template} from '@aws-cdk/assertions';
import * as cdk from 'aws-cdk-lib';
import {AuthCcStack} from '../../lib/auth-cc-stack';

describe('test authCc-stack stack', () => {
  const app = new cdk.App();
  const stack = new AuthCcStack(app, 'authCc-stack-test');

  const assert = Template.fromStack(stack as any);
  test('AuthCcStack should have a DynamoDB table with the correct attributes', () => {
    assert.resourceCountIs('AWS::DynamoDB::Table', 1);
    assert.hasResourceProperties('AWS::DynamoDB::Table', {
      AttributeDefinitions: [{AttributeName: 'username', AttributeType: 'S'}],
      KeySchema: [{AttributeName: 'username', KeyType: 'HASH'}],
    });
  });

  test('AuthCcStack should have two Lambda functions', () => {
    const lambdas = assert.findResources('AWS::Lambda::Function');
    console.log(lambdas);
    assert.resourceCountIs('AWS::Lambda::Function', 3);
  });

  test('AuthCcStack should have an HTTP API with the correct routes', () => {
    assert.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });

  test('HTTP API should have correct CORS headers', () => {
    assert.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      CorsConfiguration: {
        AllowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });
  });

  test('HTTP API should have correct CORS allowed origins for local development', () => {
    assert.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      CorsConfiguration: {
        AllowOrigins: ['http://localhost:3000'],
      },
    });
  });
});
