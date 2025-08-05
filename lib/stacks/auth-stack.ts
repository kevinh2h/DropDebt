import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface AuthStackProps extends cdk.StackProps {
  stackName: string;
  description: string;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'DropDebtUserPool', {
      userPoolName: 'dropdebt-users',
      // Email as username for easier user experience
      signInAliases: {
        email: true,
        username: false,
        phone: false
      },
      // Case-insensitive email matching
      signInCaseSensitive: false,
      
      // Auto-verify email addresses
      autoVerify: {
        email: true
      },

      // Standard attributes required for DropDebt
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        },
        givenName: {
          required: true,
          mutable: true
        },
        familyName: {
          required: true,
          mutable: true
        }
      },

      // Password policy suitable for DropDebt users
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false, // Keep simple for MVP
        tempPasswordValidity: cdk.Duration.days(7)
      },

      // Account recovery via email only
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // Email settings
      email: cognito.UserPoolEmail.withCognito(),

      // Remove user after 7 days if not confirmed (cleanup)
      deviceTracking: {
        challengeRequiredOnNewDevice: false,
        deviceOnlyRememberedOnUserPrompt: false
      },

      // No MFA for MVP (can add later)
      mfa: cognito.Mfa.OFF,

      // Deletion protection for production
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Create User Pool Client for web application
    this.userPoolClient = new cognito.UserPoolClient(this, 'DropDebtUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'dropdebt-web-client',
      
      // No client secret for web applications
      generateSecret: false,
      
      // Enable necessary auth flows
      authFlows: {
        userSrp: true,        // Secure Remote Password (recommended)
        userPassword: true,   // Allow direct password auth for testing
        adminUserPassword: false,
        custom: false
      },

      // Token validity periods
      accessTokenValidity: cdk.Duration.hours(1),      // 1 hour access tokens
      refreshTokenValidity: cdk.Duration.days(30),     // 30 day refresh tokens
      idTokenValidity: cdk.Duration.hours(1),          // 1 hour ID tokens

      // Prevent user existence errors (security)
      preventUserExistenceErrors: true,

      // Read and write attributes
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          emailVerified: true,
          givenName: true,
          familyName: true
        }),
      
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          givenName: true,
          familyName: true
        }),

      // Refresh token rotation would be configured here in future versions

      // Supported identity providers
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO
      ]
    });

    // Stack outputs for Lambda integration
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID for DropDebt',
      exportName: `${props.stackName}-UserPoolId`
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID for DropDebt web app',
      exportName: `${props.stackName}-UserPoolClientId`
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN for IAM policies',
      exportName: `${props.stackName}-UserPoolArn`
    });

    new cdk.CfnOutput(this, 'UserPoolProviderUrl', {
      value: this.userPool.userPoolProviderUrl,
      description: 'Cognito User Pool Provider URL for JWT validation',
      exportName: `${props.stackName}-UserPoolProviderUrl`
    });

    // Add tags for resource management
    cdk.Tags.of(this).add('Project', 'DropDebt');
    cdk.Tags.of(this).add('Environment', 'Development');
    cdk.Tags.of(this).add('Stack', 'Auth');
  }
}