import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { DatabaseStack } from './stacks/database-stack';
import { SimpleLambda } from './constructs/simple-lambda';

export class DropdebtStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Database Stack - DynamoDB table and related resources
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      stackName: `${id}-Database`,
      description: 'DropDebt DynamoDB table and database resources'
    });

    // Sample Lambda function using SimpleLambda construct
    const sampleLambda = new SimpleLambda(this, 'SampleLambda', {
      functionName: 'dropdebt-sample-function',
      codePath: 'src/functions/sample',
      handler: 'index.handler',
      table: databaseStack.table
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'ProjectInfo', {
      value: JSON.stringify({
        projectName: 'DropDebt',
        version: '1.0.0',
        stacks: ['DatabaseStack'],
        features: [
          'Bill Prioritization',
          'Payment Splitting', 
          'Essential Needs Protection',
          'Budget Analysis'
        ]
      }),
      description: 'DropDebt project information'
    });

    new cdk.CfnOutput(this, 'SampleLambdaFunction', {
      value: sampleLambda.function.functionName,
      description: 'Sample Lambda function name'
    });
  }
}