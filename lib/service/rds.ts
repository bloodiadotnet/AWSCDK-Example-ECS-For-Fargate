import config = require('config');
import { Duration } from 'aws-cdk-lib';
import { InstanceType, SubnetType } from 'aws-cdk-lib/aws-ec2';
import {
    ParameterGroup,
    DatabaseCluster,
    DatabaseClusterEngine,
    ClusterInstance,
    CaCertificate,
    Credentials,
    DatabaseSecret,
} from 'aws-cdk-lib/aws-rds';

import { StackUtil } from '../../util/stack-util';
import { MainStack } from '../main-stack';

export class RdsStack {
    public secret: DatabaseSecret;
    public cluster: DatabaseCluster;

    constructor(scope: MainStack) {
        this.secret = new DatabaseSecret(scope, 'DatabaseSecret', {
            username: config.get('rds.mysql.userName'),
            secretName: StackUtil.getName('secret'),
        });

        const clusterParameterGroup = new ParameterGroup(scope, 'ClusterParameterGroup', {
            engine: DatabaseClusterEngine.auroraMysql({
                version: config.get('rds.engineVersion'),
            }),
            parameters: config.get('rds.mysql.parameters.cluster'),
            description: `Parameter group for ${StackUtil.getName('rds')}`,
        });

        const instanceParameterGroup = new ParameterGroup(scope, 'InstanceParameterGroup', {
            engine: DatabaseClusterEngine.auroraMysql({
                version: config.get('rds.engineVersion'),
            }),
            parameters: config.get('rds.mysql.parameters.instance'),
            description: `Parameter group for ${StackUtil.getName('instance-xxx')}`,
        });

        this.cluster = new DatabaseCluster(scope, StackUtil.getName('rds'), {
            clusterIdentifier: StackUtil.getName('rds'),
            engine: DatabaseClusterEngine.auroraMysql({
                version: config.get('rds.engineVersion'),
            }),
            vpc: scope.vpc.vpc,
            securityGroups: [scope.vpc.dbSecurityGroup],
            credentials: Credentials.fromSecret(this.secret),
            vpcSubnets: {
                subnetType: SubnetType.PRIVATE_ISOLATED,
            },
            writer: ClusterInstance.provisioned('writer', {
                instanceIdentifier: StackUtil.getName('instance-001'),
                instanceType: InstanceType.of(config.get('rds.instanceClass'), config.get('rds.instanceSize')),
                parameterGroup: instanceParameterGroup,
                autoMinorVersionUpgrade: false,
                caCertificate: CaCertificate.RDS_CA_RDS2048_G1,
                enablePerformanceInsights: config.get('rds.enablePerformanceInsights'),
            }),
            readers: [
                ClusterInstance.provisioned('reader', {
                    instanceIdentifier: StackUtil.getName('instance-002'),
                    instanceType: InstanceType.of(config.get('rds.instanceClass'), config.get('rds.instanceSize')),
                    parameterGroup: instanceParameterGroup,
                    autoMinorVersionUpgrade: false,
                    caCertificate: CaCertificate.RDS_CA_RDS2048_G1,
                    enablePerformanceInsights: config.get('rds.enablePerformanceInsights'),
                }),
            ],
            backup: {
                retention: Duration.days(config.get('rds.backupGeneration')),
                preferredWindow: config.get('rds.backupWindow'),
            },
            storageEncrypted: true,
            defaultDatabaseName: config.get('rds.defaultDatabaseName'),
            instanceIdentifierBase: StackUtil.getName('rds'),
            monitoringInterval: Duration.seconds(60),
            deletionProtection: config.get('rds.deletionProtection'),
            parameterGroup: clusterParameterGroup,
            preferredMaintenanceWindow: config.get('rds.maintenanceWindow'),
            removalPolicy: config.get('rds.removalPolicy'),
            copyTagsToSnapshot: config.get('rds.copyTagsToSnapshot'),
        });
    }
}
