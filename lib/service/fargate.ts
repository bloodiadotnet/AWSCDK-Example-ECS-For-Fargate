import config = require('config');
import { Duration } from 'aws-cdk-lib';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Protocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

import { StackUtil } from '../../util/stack-util';
import { MainStack } from '../main-stack';

export class FargateStack {
    constructor(scope: MainStack) {
        const ecsCluster = new Cluster(scope, 'EcsCluster', {
            vpc: scope.vpc.vpc,
            clusterName: StackUtil.getName('ecscluster'),
            containerInsights: true,
        });

        const fargateService = new ApplicationLoadBalancedFargateService(scope, 'FargateService', {
            cluster: ecsCluster,
            serviceName: StackUtil.getName('fargateservice'),
            taskDefinition: scope.ecs.taskDefinition,
            desiredCount: config.get('fargate.desiredCount'),
            platformVersion: config.get('fargate.platformVersion'),
            listenerPort: 80,
            loadBalancer: scope.alb.alb,
            enableExecuteCommand: true,
            assignPublicIp: false,
            securityGroups: [scope.vpc.webSecurityGroup],
        });

        if (config.get('fargate.scaling')) {
            const scaling = fargateService.service.autoScaleTaskCount(config.get('fargate.scaling'));
            scaling.scaleOnCpuUtilization('Scaling', {
                targetUtilizationPercent: 90,
                scaleInCooldown: Duration.seconds(60),
                scaleOutCooldown: Duration.seconds(60),
            });
        }

        fargateService.targetGroup.configureHealthCheck({
            protocol: Protocol.HTTP,
            port: '80',
            healthyThresholdCount: 3,
            interval: Duration.seconds(10),
        });
    }
}
