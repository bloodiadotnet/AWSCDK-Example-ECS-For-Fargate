import config = require('config');
import * as cdk from 'aws-cdk-lib';
import {
    ContainerImage,
    FargateTaskDefinition,
    HealthCheck,
    LogDrivers,
    Protocol,
    ContainerDependencyCondition,
} from 'aws-cdk-lib/aws-ecs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

import { StackUtil } from '../../util/stack-util';
import { MainStack } from '../main-stack';

export class EcsStack {
    public taskDefinition: FargateTaskDefinition;

    constructor(scope: MainStack) {
        this.taskDefinition = new FargateTaskDefinition(scope, 'TaskDefinition', {
            cpu: config.get('ecs.spec.cpu'),
            memoryLimitMiB: config.get('ecs.spec.memoryLimitMiB'),
            ephemeralStorageGiB: config.get('ecs.spec.ephemeralStorageGiB'),
        });

        const webContainerImage = ContainerImage.fromEcrRepository(scope.ecr.webRepository, 'latest');

        const appContainerImage = ContainerImage.fromEcrRepository(scope.ecr.appRepository, 'latest');

        const webLogGroup = new LogGroup(scope, 'WebLogGroup', {
            logGroupName: StackUtil.getName('web'),
            retention: config.get('ecs.web.retention'),
            removalPolicy: config.get('ecs.web.removalPolicy'),
        });

        const appLogGroup = new LogGroup(scope, 'AppLogGroup', {
            logGroupName: StackUtil.getName('app'),
            retention: config.get('ecs.app.retention'),
            removalPolicy: config.get('ecs.app.removalPolicy'),
        });

        this.taskDefinition.addToTaskRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    'ecr:GetAuthorizationToken',
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:GetRepositoryPolicy',
                    'ecr:DescribeRepositories',
                    'ecr:ListImages',
                    'ecr:DescribeImages',
                    'ecr:BatchGetImage',
                    'ecr:GetLifecyclePolicy',
                    'ecr:GetLifecyclePolicyPreview',
                    'ecr:ListTagsForResource',
                    'ecr:DescribeImageScanFindings',
                ],
                resources: [scope.ecr.webRepository.repositoryArn, scope.ecr.appRepository.repositoryArn],
            }),
        );

        this.taskDefinition.addToTaskRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    'secretsmanager:GetResourcePolicy',
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                    'secretsmanager:ListSecretVersionIds',
                ],
                resources: [scope.rds.secret.secretArn],
            }),
        );

        const webContainer = this.taskDefinition.addContainer('WebContainer', {
            containerName: 'web',
            image: webContainerImage,
            portMappings: [{ hostPort: 80, containerPort: 80, protocol: Protocol.TCP }],
            essential: true,
            healthCheck: webHealthCheck,
            readonlyRootFilesystem: false,
            environment: {
                FASTCGI_PASS: 'localhost',
            },
            logging: LogDrivers.awsLogs({
                streamPrefix: webLogGroup.logGroupName,
                logGroup: webLogGroup,
            }),
        });

        const appContainer = this.taskDefinition.addContainer('AppContainer', {
            containerName: 'app',
            image: appContainerImage,
            portMappings: [{ hostPort: 9000, containerPort: 9000, protocol: Protocol.TCP }],
            essential: true,
            healthCheck: appHealthCheck,
            readonlyRootFilesystem: false,
            secrets: {
                DB_HOST: cdk.aws_ecs.Secret.fromSecretsManager(scope.rds.secret, 'host'),
                DB_PORT: cdk.aws_ecs.Secret.fromSecretsManager(scope.rds.secret, 'port'),
                DB_DATABASE: cdk.aws_ecs.Secret.fromSecretsManager(scope.rds.secret, 'dbname'),
                DB_USERNAME: cdk.aws_ecs.Secret.fromSecretsManager(scope.rds.secret, 'username'),
                DB_PASSWORD: cdk.aws_ecs.Secret.fromSecretsManager(scope.rds.secret, 'password'),
            },
            logging: LogDrivers.awsLogs({
                streamPrefix: appLogGroup.logGroupName,
                logGroup: appLogGroup,
            }),
        });

        webContainer.addContainerDependencies({
            container: appContainer,
            condition: ContainerDependencyCondition.HEALTHY,
        });
    }
}

const webHealthCheck: HealthCheck = {
    command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
};

const appHealthCheck: HealthCheck = {
    command: ['CMD-SHELL', 'lsof -i:9000 || exit 1'],
};
