import config = require('config');

export class StackUtil {
    static getName(name?: string) {
        let names = [config.get('product'), config.get('stage')];

        if (name) names.push(name);

        return names.join('-');
    }
}

export function getSsmParameterKey(path: string): string {
    return `/secret/${path}/${config.get('stage')}`;
}
