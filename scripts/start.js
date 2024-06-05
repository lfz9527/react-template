"use strict";

process.env.NODE_ENV = "development";

// 使脚本在未经处理的拒绝时崩溃，而不是静默
// 忽略它们。在未来，未经处理的承诺拒绝将
// 使用非零退出代码终止Node.js进程。

process.on("unhandledRejection", (err) => {
    throw err;
});

const fs = require("fs");
const chalk = require("react-dev-utils/chalk");
const webpack = require("webpack");
const semver = require('semver'); // npm语义版本生成器
const WebpackDevServer = require("webpack-dev-server");
const paths = require('../config/paths.js')
const openBrowser = require('react-dev-utils/openBrowser');
const clearConsole = require('react-dev-utils/clearConsole');
const {createCompiler, prepareProxy, choosePort, prepareUrls} = require("react-dev-utils/WebpackDevServerUtils");
const getClientEnvironment = require('../config/env');
const react = require(require.resolve('react', {paths: [paths.appPath]}));
const configFactory = require("../config/webpack.config");
const createDevServerConfig = require('../config/webpackDevServer.config');

const config = configFactory("development");
const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const appName = require(paths.appPackageJson).name;

// 判断是否在tty环境
const isInteractive = process.stdout.isTTY;
const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
const useYarn = fs.existsSync(paths.yarnLockFile);

// 端口
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
// 主机
const HOST = process.env.HOST || "0.0.0.0";

const {checkBrowsers} = require("react-dev-utils/browsersHelper");
checkBrowsers(".", isInteractive)
    .then(() => {
        // 我们尝试使用默认端口，但如果它被占用，我们会向用户提供
        // 在另一个端口上运行。`choosePort（）`Promise解析到下一个可用端口。
        return choosePort(HOST, DEFAULT_PORT);
    })
    .then((port) => {
        const urls = prepareUrls(
            protocol,
            HOST,
            port,
            paths.publicUrlOrPath.slice(0, -1)
        );

        // 加载 proxy 配置
        const {proxy: setupProxy} = require(paths.proxySetup).proxy ?? '';
        const  proxySetting = JSON.stringify(setupProxy)

        // 创建Webpack编译器实例有用的信息
        const compiler = createCompiler({
            appName,
            config,
            webpack,
            urls
        });

        const proxyConfig = prepareProxy(
            proxySetting,
            paths.appPublic,
            paths.publicUrlOrPath
        )
        // 通过 Web 服务器提供编译器生成的 webpack 资源。
        const serverConfig = {
            ...createDevServerConfig(proxyConfig, urls.lanUrlForConfig),
            host: HOST,
            port,
        };
        const devServer = new WebpackDevServer((serverConfig), compiler);

        // 执行 WebpackDevServer.
        devServer.startCallback(() => {
            if (isInteractive) {
                clearConsole();
            }

            if (env.raw.FAST_REFRESH && semver.lt(react.version, '16.10.0')) {
                console.log(
                    chalk.yellow(
                        `Fast Refresh requires React 16.10 or higher. You are using React ${react.version}.`
                    )
                );
            }

            console.log(chalk.cyan("Starting the development server...\n"));
            openBrowser(urls.localUrlForBrowser); // 自动打开浏览器
        });

        ["SIGINT", "SIGTERM"].forEach(function (sig) {
            process.on(sig, function () {
                devServer.close();
                process.exit();
            });
        });

        if (process.env.CI !== 'true') {
            // 当 stdin 结束时优雅退出
            process.stdin.on('end', function () {
                devServer.close();
                process.exit();
            });
        }
    })
    .catch((err) => {
        if (err && err.message) {
            console.log(err.message);
        }
        process.exit(1);
    });
