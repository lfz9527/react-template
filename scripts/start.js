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
const WebpackDevServer = require("webpack-dev-server");
const paths = require('../config/paths.js')

const { createCompiler,choosePort,prepareUrls } = require("react-dev-utils/WebpackDevServerUtils");

const configFactory = require("../config/webpack.config");

const config = configFactory("development");
const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const appName = require(paths.appPackageJson).name;

// 判断是否在tty环境
const isInteractive = process.stdout.isTTY;

// 端口
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
// 主机
const HOST = process.env.HOST || "0.0.0.0";

const { checkBrowsers } = require("react-dev-utils/browsersHelper");
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

    // 创建Webpack编译器实例有用的信息
    const compiler = createCompiler({
      appName,
      config,
      webpack,
      urls
    });

    // 服务配置
    const serverConfig = {
      host: HOST,
      port,
    };

    const devServer = new WebpackDevServer((serverConfig), compiler);

    // 执行 WebpackDevServer.
    devServer.startCallback(() => {
      console.log(chalk.cyan("Starting the development server...\n"));
    });

    ["SIGINT", "SIGTERM"].forEach(function (sig) {
      process.on(sig, function () {
        devServer.close();
        process.exit();
      });
    });
  })
  .catch((err) => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
