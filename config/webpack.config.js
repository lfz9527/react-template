"use strict";

const paths = require("./paths");
const getClientEnvironment = require('./env');

// 源映射资源繁重，可能会导致大型源文件内存不足问题。
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

const imageInlineSizeLimit = parseInt(
    process.env.IMAGE_INLINE_SIZE_LIMIT || '10000'
);


const hasJsxRuntime = (() => {
    if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
        return false;
    }

    try {
        require.resolve('react/jsx-runtime');
        return true;
    } catch (e) {
        return false;
    }
})();

// 这是生产和开发配置。
//它专注于开发人员体验、快速重建和最小捆绑包。
module.exports = (webpackEnv) => {
    const isEnvDevelopment = webpackEnv === "development";
    const isEnvProduction = webpackEnv === "production";

    // 用于在生产中启用性能分析的变量传递到别名对象中。如果传递到 build 命令中，则使用标志
    const isEnvProductionProfile =  isEnvProduction && process.argv.includes('--profile');

    // 我们将为我们的应用提供“paths.publicUrlOrPath”，
    // 在 JavaScript 中为 'index.html' 中的 %PUBLIC_URL% 和 'process.env.PUBLIC_URL'。
    // 省略尾部斜杠，因为 %PUBLIC_URL%/xyz 看起来比 %PUBLIC_URL%xyz 更好。
    // 获取要注入到我们的应用程序中的环境变量。

    const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
    const shouldUseReactRefresh = env?.raw?.FAST_REFRESH;

    return {
        target: ["browserslist"],
        // 受限于错误和警告的Webpack提示
        stats: "errors-warnings",
        mode: "development",
        // 出现错误时，webpack 退出打包过程
        bail: true,
        entry: paths.appIndexJs,
        output: {
            path: paths.appBuild,
        },
        module: {
            parser: {
                javascript: {
                    reexportExportsPresence: false,
                },
            },
            rules: [
                // 处理包含源映射的node_modules包
                shouldUseSourceMap && {
                    enforce: 'pre',
                    exclude: /@babel(?:\/|\\{1,2})runtime/,
                    test: /\.(js|mjs|jsx|ts|tsx|css)$/,
                    loader: require.resolve('source-map-loader'),
                },
                {
                    // “oneOf”将遍历所有后续加载程序，直到一个
                    // 符合要求。当没有加载器匹配时，它会掉落
                    // 回到加载器列表末尾的“文件”加载器。
                    oneOf: [
                        // https://github.com/jshttp/mime-db
                        {
                            test: [/\.avif$/],
                            type: 'asset',
                            mimetype: 'image/avif',
                            parser: {
                                dataUrlCondition: {
                                    maxSize: imageInlineSizeLimit,
                                },
                            },
                        },
                        // “url”加载器的工作方式类似于“文件”加载器，
                        // 但它会将小于指定字节限制的资源嵌入为数据URLs，以避免额外的HTTP请求。
                        // 一个缺失的 test 相当于一个匹配。
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            type: 'asset',
                            parser: {
                                dataUrlCondition: {
                                    maxSize: imageInlineSizeLimit,
                                },
                            },
                        },
                        {
                            test: /\.svg$/,
                            use: [
                                {
                                    loader: require.resolve('@svgr/webpack'),
                                    options: {
                                        prettier: false,
                                        svgo: false,
                                        svgoConfig: {
                                            plugins: [{removeViewBox: false}],
                                        },
                                        titleProp: true,
                                        ref: true,
                                    },
                                },
                                {
                                    loader: require.resolve('file-loader'),
                                    options: {
                                        name: 'static/media/[name].[hash].[ext]',
                                    },
                                },
                            ],
                            issuer: {
                                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
                            },
                        },
                        // 使用 Babel 处理应用程序 JS。
                        // 预设包括 JSX、Flow、TypeScript 和一些 ESnext 功能。
                        {
                            test: /\.(js|mjs|jsx|ts|tsx)$/,
                            include: paths.appSrc,
                            loader: require.resolve('babel-loader'),
                            options:{
                                customize: require.resolve(
                                    'babel-preset-react-app/webpack-overrides'
                                ),
                                presets: [
                                    [
                                        require.resolve('babel-preset-react-app'),
                                        {
                                            runtime: hasJsxRuntime ? 'automatic' : 'classic',
                                        },
                                    ],
                                ],
                                plugins:[
                                    isEnvDevelopment && shouldUseReactRefresh && require.resolve('react-refresh/babel'),
                                ].filter(Boolean),
                            }

                        }
                    ]
                }
            ].filter(Boolean),
        }
    };
};
