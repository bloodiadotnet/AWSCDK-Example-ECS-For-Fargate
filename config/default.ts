const stage = process.env.NODE_ENV ? process.env.NODE_ENV : 'default';
const product = 'awscdk-example-ecs-for-fargate';

export = {
    stage: stage.toLowerCase(),
    product: product,

    aws: {
        computing: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
        },
    },

    tags: {
        stage: {
            key: 'Stage',
            value: stage.toUpperCase(),
        },
        product: {
            key: 'Product',
            value: product,
        },
    },

    vpc: {
        ipAddresses: '10.0.0.0/16',
        allowedSources: [
            { cidrIp: '1.1.1.1/32', description: 'Example1' },
            { cidrIp: '2.2.2.2/32', description: 'Example2' },
            { cidrIp: '3.3.3.3/32', description: 'Example3' },
        ],
    },
};
