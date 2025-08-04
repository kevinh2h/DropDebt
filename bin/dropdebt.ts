#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DropdebtStack } from '../lib/dropdebt-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';

const app = new cdk.App();

// Database stack with DynamoDB table
new DatabaseStack(app, 'DropDebtDatabaseStack', {
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

// Main application stack (placeholder for future use)
new DropdebtStack(app, 'DropdebtStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});