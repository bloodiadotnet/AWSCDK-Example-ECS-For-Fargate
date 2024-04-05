import config = require('config');
import { App, Stack, StackProps, Tags } from 'aws-cdk-lib';

import { VpcStack } from './service/vpc';
import { RdsStack } from './service/rds';
import { AlbStack } from './service/alb';
import { EcrStack } from './service/ecr';
import { EcsStack } from './service/ecs';
import { FargateStack } from './service/fargate';

export class MainStack extends Stack {
    public vpc: VpcStack;
    public rds: RdsStack;
    public alb: AlbStack;
    public ecr: EcrStack;
    public ecs: EcsStack;
    public fargate: FargateStack;

    constructor(app: App, id: string, props?: StackProps) {
        super(app, id, props);

        Promise.resolve()
            .then(async () => {
                this.vpc = new VpcStack(this);
                this.rds = new RdsStack(this);
                this.alb = new AlbStack(this);
                this.ecr = new EcrStack(this);
                this.ecs = new EcsStack(this);
                this.fargate = new FargateStack(this);

                Tags.of(this).add(config.get('tags.stage.key'), config.get('tags.stage.value'));
                Tags.of(this).add(config.get('tags.product.key'), config.get('tags.product.value'));
            })
            .catch((err) =>
                console.error({
                    message: err.message,
                    stack: err.stack,
                }),
            );
    }
}
