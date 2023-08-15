# Auth CC Documentation

## Overview

The Auth CC will implement an authorization function by leveraging AWS services.
With the power of the AWS CDK, it provides blueprints for building a simple
authorization system with DynamoDB, AWS Lambda, and HTTP API Gateway.

## Components

- **DynamoDB Table**: A NoSQL database service holding user data.
- **Lambda Functions**:
  - **Registration Lambda**: Handles user registration.
  - **Authentication Lambda**: Authenticates user requests.
- **HTTP API Gateway**: Provides endpoints for user interaction.

## Deployment to AWS using CDK

### Prerequisites

- Ensure AWS CDK is installed:

```
npm install -g aws-cdk
```

- Bootstrap the CDK App Bootstrap your AWS environment:

```
cdk bootstrap
```

- Deploy the Stack Deploy the stack to AWS:

```
cdk deploy
```

- Open the AWS CloudFormation in thw aws Console and the stack should be created
  in your default region

- Cleanup

```
aws-cdk destroy
```

After deploying the script will log the Api endpoint url

## Running Services Locally

- DynamoDB with Docker

Start a local DynamoDB instance:

```
docker run -p 8000:8000 amazon/dynamodb-local
```

- Lambdas with AWS SAM CLI Convert CDK to SAM template:

```
cdk synth --no-staging > template.yaml
```

- Start the local API:

```
sam local start-api
```

- Access functions at http://127.0.0.1:3000/.

## Testing

### Local Testing

Use tools like Postman or curl.

### Unit Testing

```
Run: npm test
```

### Integration Testing

```
npm run dynamodb:start
npm run create-table
npm run test:integration
npm run posttest:integration
```

### Postman Collection

A [collection](./Auth-cc.postman_collection.json) is provided in the repo for
ease of testing.

### Endpoints

`/register`

Body: username: String password: String

Example:

```
{
  "username": "JohnDoe",
  "password": "Securepassword123!"
}
```

`/auth`

Parameters & Body: username: String password: String

Example:

```
{
  "username": "JohnDoe",
  "password": "Securepassword123!"
}
```
