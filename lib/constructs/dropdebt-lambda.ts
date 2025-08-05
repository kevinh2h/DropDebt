import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface DropDebtLambdaProps {
  functionName: string;
  codePath: string;
  handler: string;
  table: dynamodb.ITable;
  userPool: cognito.UserPool;
  feature: DropDebtFeature;
  timeout?: cdk.Duration;
  memorySize?: number;
  environment?: Record<string, string>;
}

export enum DropDebtFeature {
  BILL_PRIORITIZATION = 'BILL_PRIORITIZATION',
  PAYMENT_SPLITTING = 'PAYMENT_SPLITTING', 
  ESSENTIAL_PROTECTION = 'ESSENTIAL_PROTECTION',
  BUDGET_ANALYSIS = 'BUDGET_ANALYSIS',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  TEST = 'TEST'
}

export class DropDebtLambda extends Construct {
  public readonly function: lambda.Function;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: DropDebtLambdaProps) {
    super(scope, id);

    // Create CloudWatch Log Group
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/lambda/${props.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Create Lambda function
    this.function = new lambda.Function(this, 'Function', {
      functionName: props.functionName,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: props.handler,
      code: lambda.Code.fromAsset(props.codePath),
      timeout: props.timeout || cdk.Duration.seconds(30),
      memorySize: props.memorySize || 256,
      
      // Environment variables for DropDebt integration
      environment: {
        // Core DropDebt environment
        TABLE_NAME: props.table.tableName,
        USER_POOL_ID: props.userPool.userPoolId,
        DROPDEBT_REGION: cdk.Stack.of(this).region, // Use custom name to avoid reserved AWS_REGION
        FEATURE: props.feature,
        
        // Feature-specific configuration
        ...this.getFeatureEnvironment(props.feature),
        
        // Custom environment variables
        ...props.environment
      },

      // Enable X-Ray tracing for debugging
      tracing: lambda.Tracing.ACTIVE,

      // Log group configuration
      logGroup: this.logGroup
    });

    // Configure IAM permissions based on feature requirements
    this.configureIamPermissions(props);

    // Add resource tags
    cdk.Tags.of(this).add('Project', 'DropDebt');
    cdk.Tags.of(this).add('Feature', props.feature);
    cdk.Tags.of(this).add('Environment', 'Development');
  }

  private getFeatureEnvironment(feature: DropDebtFeature): Record<string, string> {
    const baseEnv = {
      // Common data access patterns
      USER_PK_PREFIX: 'USER#',
      BILL_SK_PREFIX: 'BILL#',
      EXPENSE_SK_PREFIX: 'EXPENSE#',
      PAYMENT_SK_PREFIX: 'PAYMENT#',
      GSI1_NAME: 'GSI1',
    };

    switch (feature) {
      case DropDebtFeature.BILL_PRIORITIZATION:
        return {
          ...baseEnv,
          PRIORITY_ALGORITHM: 'weighted_scoring',
          MAX_PRIORITY_SCORE: '100',
          DEFAULT_WEIGHTS: JSON.stringify({
            dueDate: 0.3,
            essential: 0.4,
            lateFee: 0.2,
            interest: 0.1
          })
        };

      case DropDebtFeature.PAYMENT_SPLITTING:
        return {
          ...baseEnv,
          SPLITTING_STRATEGIES: JSON.stringify([
            'priority_first', 'equal_split', 'minimum_first', 'avalanche', 'snowball'
          ]),
          MINIMUM_PAYMENT_THRESHOLD: '0.01'
        };

      case DropDebtFeature.ESSENTIAL_PROTECTION:
        return {
          ...baseEnv,
          ESSENTIAL_CATEGORIES: JSON.stringify([
            'housing', 'utilities', 'food', 'healthcare', 'transportation'
          ]),
          PROTECTION_THRESHOLD: '0.8' // 80% of income for essentials
        };

      case DropDebtFeature.BUDGET_ANALYSIS:
        return {
          ...baseEnv,
          ANALYSIS_PERIODS: JSON.stringify(['current_month', 'last_month', 'last_3_months']),
          VARIANCE_THRESHOLD: '0.1' // 10% variance for alerts
        };

      default:
        return baseEnv;
    }
  }

  private configureIamPermissions(props: DropDebtLambdaProps) {
    // DynamoDB permissions based on feature requirements
    const dynamodbActions = this.getDynamoDbActions(props.feature);
    
    // Grant DynamoDB permissions with user data isolation enforcement
    // Note: LeadingKeys condition removed for GSI compatibility - user isolation enforced at application level
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: dynamodbActions,
      resources: [
        props.table.tableArn,
        `${props.table.tableArn}/index/*`
      ]
    }));

    // CloudWatch Logs permissions (already handled by CDK)
    
    // X-Ray permissions for tracing - account-scoped for security
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords'
      ],
      resources: [`arn:aws:xray:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`]
    }));

    // Cognito permissions for JWT validation (reading public keys)
    this.function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:GetUser'
      ],
      resources: [props.userPool.userPoolArn]
    }));
  }

  private getDynamoDbActions(feature: DropDebtFeature): string[] {
    const baseActions = [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:Query'
    ];

    switch (feature) {
      case DropDebtFeature.BILL_PRIORITIZATION:
        return [
          ...baseActions,
          'dynamodb:BatchGetItem' // For bulk bill queries
        ];

      case DropDebtFeature.PAYMENT_SPLITTING:
        return [
          ...baseActions,
          'dynamodb:BatchGetItem',
          'dynamodb:BatchWriteItem' // For payment plan updates
        ];

      case DropDebtFeature.BUDGET_ANALYSIS:
        return [
          ...baseActions,
          'dynamodb:BatchGetItem' // Use Query operations instead of Scan for security
        ];

      default:
        return baseActions;
    }
  }
}

// Helper function for creating common DropDebt Lambda configurations
export class DropDebtLambdaHelper {
  static createBillPrioritization(
    scope: Construct, 
    id: string, 
    props: Omit<DropDebtLambdaProps, 'feature'>
  ): DropDebtLambda {
    return new DropDebtLambda(scope, id, {
      ...props,
      feature: DropDebtFeature.BILL_PRIORITIZATION
    });
  }

  static createPaymentSplitting(
    scope: Construct, 
    id: string, 
    props: Omit<DropDebtLambdaProps, 'feature'>
  ): DropDebtLambda {
    return new DropDebtLambda(scope, id, {
      ...props,
      feature: DropDebtFeature.PAYMENT_SPLITTING
    });
  }

  static createEssentialProtection(
    scope: Construct, 
    id: string, 
    props: Omit<DropDebtLambdaProps, 'feature'>
  ): DropDebtLambda {
    return new DropDebtLambda(scope, id, {
      ...props,
      feature: DropDebtFeature.ESSENTIAL_PROTECTION
    });
  }

  static createBudgetAnalysis(
    scope: Construct, 
    id: string, 
    props: Omit<DropDebtLambdaProps, 'feature'>
  ): DropDebtLambda {
    return new DropDebtLambda(scope, id, {
      ...props,
      feature: DropDebtFeature.BUDGET_ANALYSIS
    });
  }

  static createUserManagement(
    scope: Construct, 
    id: string, 
    props: Omit<DropDebtLambdaProps, 'feature'>
  ): DropDebtLambda {
    return new DropDebtLambda(scope, id, {
      ...props,
      feature: DropDebtFeature.USER_MANAGEMENT
    });
  }
}