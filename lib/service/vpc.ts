import config = require('config');
import { Aspects, Tag } from 'aws-cdk-lib';
import {
    GatewayVpcEndpointAwsService,
    InterfaceVpcEndpointAwsService,
    IpAddresses,
    SubnetType,
    Vpc,
    IVpc,
    SecurityGroup,
    ISecurityGroup,
    Peer,
    Port,
} from 'aws-cdk-lib/aws-ec2';

import { StackUtil } from '../../util/stack-util';
import { MainStack } from '../main-stack';

export class VpcStack {
    public vpc: IVpc;
    public albSecurityGroup: ISecurityGroup;
    public webSecurityGroup: ISecurityGroup;
    public dbSecurityGroup: ISecurityGroup;

    constructor(scope: MainStack) {
        var allowedSources: {
            cidrIp: string;
            description: string;
        }[] = config.get('vpc.allowedSources');

        this.vpc = new Vpc(scope, 'Vpc', {
            ipAddresses: IpAddresses.cidr(config.get('vpc.ipAddresses')),
            vpcName: StackUtil.getName('vpc'),
            availabilityZones: ['ap-northeast-1a', 'ap-northeast-1c'],
            subnetConfiguration: [
                {
                    name: 'public',
                    subnetType: SubnetType.PUBLIC,
                    cidrMask: 24,
                    mapPublicIpOnLaunch: true,
                },
                {
                    name: 'Isolated',
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                    cidrMask: 24,
                },
            ],
        });
        Aspects.of(this.vpc).add(new Tag('Name', StackUtil.getName('vpc')));
        {
            this.vpc.addGatewayEndpoint('S3Endpoint', {
                service: GatewayVpcEndpointAwsService.S3,
                subnets: [{ subnets: this.vpc.isolatedSubnets }],
            });
            this.vpc.addInterfaceEndpoint('EcrEndpoint', {
                service: InterfaceVpcEndpointAwsService.ECR,
            });
            this.vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
                service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
            });
            this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
                service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            });
            this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
                service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            });
        }

        this.albSecurityGroup = new SecurityGroup(scope, 'AlbSg', {
            vpc: this.vpc,
            description: `ALB Group for ${StackUtil.getName()}`,
            securityGroupName: StackUtil.getName('alb'),
            allowAllOutbound: false,
        });
        Aspects.of(this.albSecurityGroup).add(new Tag('Name', StackUtil.getName('alb')));
        this.albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Browser access from outside');
        this.albSecurityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(80), 'Browser access from outside');

        this.webSecurityGroup = new SecurityGroup(scope, 'WebSg', {
            vpc: this.vpc,
            description: `Web Group for ${StackUtil.getName()}`,
            securityGroupName: StackUtil.getName('web'),
        });
        Aspects.of(this.webSecurityGroup).add(new Tag('Name', StackUtil.getName('web')));
        this.webSecurityGroup.addIngressRule(
            this.albSecurityGroup,
            Port.tcp(80),
            `Web access from ${StackUtil.getName('alb')}`,
        );
        allowedSources.forEach((allowedSource) => {
            this.webSecurityGroup.addIngressRule(
                Peer.ipv4(allowedSource.cidrIp),
                Port.tcp(80),
                allowedSource.description,
            );
        });

        this.dbSecurityGroup = new SecurityGroup(scope, 'DbSg', {
            vpc: this.vpc,
            description: `DB Group for ${StackUtil.getName()}`,
            securityGroupName: StackUtil.getName('db'),
        });
        Aspects.of(this.dbSecurityGroup).add(new Tag('Name', StackUtil.getName('db')));
        this.dbSecurityGroup.addIngressRule(
            this.webSecurityGroup,
            Port.tcp(3306),
            `DB access from ${StackUtil.getName('web')}`,
        );
        allowedSources.forEach((allowedSource) => {
            this.dbSecurityGroup.addIngressRule(
                Peer.ipv4(allowedSource.cidrIp),
                Port.tcp(3306),
                allowedSource.description,
            );
        });
    }
}
