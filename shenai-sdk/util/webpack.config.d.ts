import webpack = require("webpack");
export let entry: string;
export namespace module {
    let rules: {
        test: RegExp;
        use: string;
        exclude: RegExp;
    }[];
}
export namespace resolve {
    let extensions: string[];
}
export namespace experiments {
    let outputModule: boolean;
}
export namespace output {
    let filename: string;
    let path: string;
    let libraryTarget: string;
}
export let plugins: webpack.DefinePlugin[];
