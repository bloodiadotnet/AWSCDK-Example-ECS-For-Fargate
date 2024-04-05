import config = require('config');
import * as path from 'path';
import { ECRDeployment, DockerImageName } from 'cdk-ecr-deployment';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';

import { StackUtil } from '../../util/stack-util';
import { MainStack } from '../main-stack';

export class EcrStack {
    public webRepository: Repository;
    public appRepository: Repository;

    constructor(scope: MainStack) {
        this.webRepository = new Repository(scope, 'WebRepository', {
            repositoryName: StackUtil.getName('web'),
            removalPolicy: config.get('ecr.web.removalPolicy'),
            imageTagMutability: config.get('ecr.web.imageTagMutability'),
            imageScanOnPush: config.get('ecr.web.imageScanOnPush'),
            emptyOnDelete: config.get('ecr.web.emptyOnDelete'),
        });

        this.appRepository = new Repository(scope, 'AppRepository', {
            repositoryName: StackUtil.getName('app'),
            removalPolicy: config.get('ecr.app.removalPolicy'),
            imageTagMutability: config.get('ecr.app.imageTagMutability'),
            imageScanOnPush: config.get('ecr.app.imageScanOnPush'),
            emptyOnDelete: config.get('ecr.app.emptyOnDelete'),
        });

        const webDockerImageAsset = new DockerImageAsset(scope, 'WebDockerImageAsset', {
            assetName: StackUtil.getName('web'),
            directory: path.join('docker', 'web'),
            platform: config.get('ecr.web.platform'),
        });

        const appDockerImageAsset = new DockerImageAsset(scope, 'AppDockerImageAsset', {
            assetName: StackUtil.getName('app'),
            directory: path.join('docker', 'app'),
            platform: config.get('ecr.app.platform'),
        });

        new ECRDeployment(scope, 'WebEcrDeployment', {
            src: new DockerImageName(webDockerImageAsset.imageUri),
            dest: new DockerImageName(
                `${config.get('aws.computing.account')}.dkr.ecr.${config.get('aws.computing.region')}.amazonaws.com/${this.webRepository.repositoryName}:latest`,
            ),
        });

        new ECRDeployment(scope, 'AppEcrDeployment', {
            src: new DockerImageName(appDockerImageAsset.imageUri),
            dest: new DockerImageName(
                `${config.get('aws.computing.account')}.dkr.ecr.${config.get('aws.computing.region')}.amazonaws.com/${this.appRepository.repositoryName}:latest`,
            ),
        });
    }
}
