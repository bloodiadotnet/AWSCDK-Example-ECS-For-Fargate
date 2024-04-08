import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { RemovalPolicy } from 'aws-cdk-lib';
import { TagMutability } from 'aws-cdk-lib/aws-ecr';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { FargatePlatformVersion } from 'aws-cdk-lib/aws-ecs';
import { InstanceClass, InstanceSize } from 'aws-cdk-lib/aws-ec2';
import { AuroraMysqlEngineVersion } from 'aws-cdk-lib/aws-rds';

export = {
    rds: {
        engineVersion: AuroraMysqlEngineVersion.VER_3_06_0,
        instanceClass: InstanceClass.BURSTABLE4_GRAVITON,
        instanceSize: InstanceSize.MEDIUM,
        capacity: 1,
        backupGeneration: 7,
        backupWindow: '17:30-18:00', // UTC
        maintenanceWindow: 'Mon:18:00-Mon:19:00', // UTC
        copyTagsToSnapshot: true,
        enablePerformanceInsights: true,
        deletionProtection: false,
        removalPolicy: RemovalPolicy.DESTROY,
        defaultDatabaseName: 'demo',
        mysql: {
            userName: 'dba',

            parameters: {
                cluster: {
                    long_query_time: '10',
                    slow_query_log: '1',
                    time_zone: 'Asia/Tokyo',
                },
                instance: {
                    long_query_time: '10',
                    slow_query_log: '1',
                },
            },
        },
    },

    alb: {
        deletionProtection: false,
    },

    ecr: {
        web: {
            removalPolicy: RemovalPolicy.DESTROY,
            imageTagMutability: TagMutability.MUTABLE,
            imageScanOnPush: true,
            emptyOnDelete: true,
            platform: Platform.LINUX_AMD64,
        },
        app: {
            removalPolicy: RemovalPolicy.DESTROY,
            imageTagMutability: TagMutability.MUTABLE,
            imageScanOnPush: true,
            emptyOnDelete: true,
            platform: Platform.LINUX_AMD64,
        },
    },

    ecs: {
        spec: {
            cpu: 256,
            memoryLimitMiB: 512,
            ephemeralStorageGiB: 21,
        },
        web: {
            retention: RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
        },
        app: {
            retention: RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
        },
    },

    fargate: {
        scaling: {
            minCapacity: 1,
            maxCapacity: 2,
        },
        desiredCount: 1,
        platformVersion: FargatePlatformVersion.VERSION1_4,
    },
};
