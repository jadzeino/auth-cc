#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {AuthCcStack} from '../lib/auth-cc-stack';

const stage = process.env.ENVIRONMENT || 'dev';

const app = new cdk.App();
new AuthCcStack(app, `authCc-stack-${stage}`, {
  stackName: `authCc-stack-${stage}`,
  env: {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  environment: stage,
});
