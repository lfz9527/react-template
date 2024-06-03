"use strict";

const paths = require("./paths");

// 这是生产和开发配置。
//它专注于开发人员体验、快速重建和最小捆绑包。
module.exports = (webpackEnv) => {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";

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
  };
};
