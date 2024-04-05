import config = require('config');
import { ApplicationLoadBalancer, IpAddressType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

import { StackUtil } from '../../util/stack-util';
import { MainStack } from '../main-stack';

export class AlbStack {
    public alb: ApplicationLoadBalancer;

    constructor(scope: MainStack) {
        this.alb = new ApplicationLoadBalancer(scope, 'Alb', {
            loadBalancerName: StackUtil.getName('alb'),
            vpc: scope.vpc.vpc,
            internetFacing: true,
            ipAddressType: IpAddressType.IPV4,
            deletionProtection: config.get('alb.deletionProtection'),
            securityGroup: scope.vpc.albSecurityGroup,
        });
    }
}
