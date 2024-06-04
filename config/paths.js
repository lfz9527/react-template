"use strict";

const path = require("path");
const fs = require("fs");
const getPublicUrlOrPath = require("react-dev-utils/getPublicUrlOrPath");

// 确保所有连接在项目里都是绝对的路径
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const buildPath = process.env.BUILD_PATH || "build";

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
];

const publicUrlOrPath = getPublicUrlOrPath(
  process.env.NODE_ENV === "development",
  require(resolveApp("package.json")).homepage,
  process.env.PUBLIC_URL
);

// 在webpack里找到对应的文件，如果没有则默认为js
const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find(extension =>
    fs.existsSync(resolveFn(`${filePath}.${extension}`))
  );

  if (extension) {
    return resolveFn(`${filePath}.${extension}`);
  }

  return resolveFn(`${filePath}.js`);
};

module.exports = {
  appSrc: resolveApp('src'),
  appPath: resolveApp("."),
  appBuild: resolveApp(buildPath),
  appPackageJson: resolveApp('package.json'),
  appIndexJs: resolveModule(resolveApp, "src/index"),
  publicUrlOrPath,
};
