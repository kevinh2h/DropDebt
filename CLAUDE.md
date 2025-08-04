# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the DropDebt AWS CDK infrastructure project built with TypeScript. It provides the backend infrastructure for a Smart Bill Payment Schedule application using AWS services.

## Common Commands

### CDK Development
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile automatically
- `npm test` - Run Jest unit tests
- `npm run synth` - Synthesize CloudFormation templates
- `npm run deploy` - Deploy all stacks to AWS
- `npm run destroy` - Destroy all stacks
- `npm run bootstrap` - Bootstrap CDK in the AWS environment

### Development Workflow
- Always run `npm run build` before CDK commands
- Use `cdk synth` to validate changes before deployment
- Run tests with `npm test` to ensure infrastructure is correct

## Architecture

This is a standard AWS CDK v2 project structure:
- `/bin` - CDK app entry point (`dropdebt.ts`)
- `/lib` - CDK stack definitions (`dropdebt-stack.ts`)
- `/test` - Jest test files (`.test.ts` suffix)
- Uses TypeScript with strict mode enabled
- CDK v2 with `aws-cdk-lib` single package approach

## Development Notes

- TypeScript configuration uses strict mode with ES2020 target
- All AWS services should be imported from `aws-cdk-lib`
- CDK constructs imported from `constructs` package
- Environment variables for AWS credentials handled by AWS CLI
- Generated files (*.js, *.d.ts, cdk.out/) are excluded from Git