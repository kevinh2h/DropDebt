import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { AuthStack } from './stacks/auth-stack';
import { SimpleLambda } from './constructs/simple-lambda';
import { DropDebtLambda, DropDebtFeature } from './constructs/dropdebt-lambda';
import { BillsLambda } from './constructs/bills-lambda';
import { ExpensesLambda } from './constructs/expenses-lambda';
import { PaymentSplitsLambda } from './constructs/payment-splits-lambda';
import { SecurityMonitoring } from './constructs/security-monitoring';

export class DropdebtStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference existing database stack exports
    const tableName = cdk.Fn.importValue('DropDebt-TableName');
    
    // Create reference to existing table
    const table = dynamodb.Table.fromTableName(this, 'ExistingTable', tableName);

    // Auth Stack - Cognito User Pool for authentication
    const authStack = new AuthStack(this, 'AuthStack', {
      stackName: `${id}-Auth`,
      description: 'DropDebt Cognito User Pool and authentication resources'
    });

    // Sample Lambda function using SimpleLambda construct
    const sampleLambda = new SimpleLambda(this, 'SampleLambda', {
      functionName: 'dropdebt-sample-function',
      codePath: 'src/functions/sample',
      handler: 'index.handler',
      table: table
    });

    // Test Lambda function using DropDebtLambda construct
    const testLambda = new DropDebtLambda(this, 'TestLambda', {
      functionName: 'dropdebt-test-function',
      codePath: 'src/handlers/test',
      handler: 'index.handler',
      table: table,
      userPool: authStack.userPool,
      feature: DropDebtFeature.TEST
    });

    // Bills Management Lambda function with consequence-based prioritization
    const billsLambda = new BillsLambda(this, 'BillsLambda', {
      functionName: 'dropdebt-bills-function',
      codePath: 'src/handlers/bills',
      handler: 'index.handler',
      table: table,
      userPool: authStack.userPool,
      memorySize: 512, // Higher memory for priority calculations
      timeout: cdk.Duration.seconds(30)
    });

    // Essential Expenses Lambda function for budget safety protection
    const expensesLambda = new ExpensesLambda(this, 'ExpensesLambda', {
      functionName: 'dropdebt-expenses-function',
      codePath: 'src/handlers/expenses',
      handler: 'index.handler',
      table: table,
      userPool: authStack.userPool,
      memorySize: 256, // Modest memory for expense calculations
      timeout: cdk.Duration.seconds(30)
    });

    // Crisis Triage Lambda function - simple emergency guidance
    const paymentSplitsLambda = new PaymentSplitsLambda(this, 'PaymentSplitsLambda', {
      functionName: 'dropdebt-payment-splits-function',
      codePath: 'src/handlers/payment-splits',
      handler: 'index.handler',
      table: table,
      userPool: authStack.userPool,
      billsLambdaArn: billsLambda.function.functionArn,
      expensesLambdaArn: expensesLambda.function.functionArn,
      memorySize: 256, // Standard memory for crisis triage
      timeout: cdk.Duration.seconds(30)
    });

    // Security monitoring for Lambda functions (temporarily disabled for deployment)
    // const securityMonitoring = new SecurityMonitoring(this, 'SecurityMonitoring', {
    //   lambdaFunctions: [sampleLambda.function, testLambda.function]
    // });

    // Stack outputs
    new cdk.CfnOutput(this, 'ProjectInfo', {
      value: JSON.stringify({
        projectName: 'DropDebt',
        version: '1.0.0',
        stacks: ['DatabaseStack', 'AuthStack'],
        features: [
          'User Authentication',
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

    new cdk.CfnOutput(this, 'TestLambdaFunction', {
      value: testLambda.function.functionName,
      description: 'DropDebt test Lambda function name'
    });

    new cdk.CfnOutput(this, 'BillsLambdaFunction', {
      value: billsLambda.function.functionName,
      description: 'DropDebt bills management Lambda function name'
    });

    new cdk.CfnOutput(this, 'ExpensesLambdaFunction', {
      value: expensesLambda.function.functionName,
      description: 'DropDebt essential expenses Lambda function name'
    });

    new cdk.CfnOutput(this, 'PaymentSplitsLambdaFunction', {
      value: paymentSplitsLambda.function.functionName,
      description: 'DropDebt crisis triage Lambda function name'
    });

    // Auth outputs for easy access
    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: authStack.userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'CognitoClientId', {
      value: authStack.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    // Security dashboard output (temporarily disabled)
    // new cdk.CfnOutput(this, 'SecurityDashboard', {
    //   value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${securityMonitoring.dashboard.dashboardName}`,
    //   description: 'CloudWatch Security Dashboard URL'
    // });
  }
}