'use strict';

const fs = require('fs');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
const ignoredFiles = require('react-dev-utils/ignoredFiles');
const redirectServedPath = require('react-dev-utils/redirectServedPathMiddleware');
const paths = require('./paths');
const getHttpsConfig = require('./getHttpsConfig');

const host = process.env.HOST || '0.0.0.0';
const sockHost = process.env.WDS_SOCKET_HOST;
const sockPath = process.env.WDS_SOCKET_PATH; // default: '/ws'
const sockPort = process.env.WDS_SOCKET_PORT;


const createDevServerConfig = (proxy, allowedHost) => {
    const disableFirewall =
        !proxy || process.env.DANGEROUSLY_DISABLE_HOST_CHECK === 'true';

    // WebpackDevServer 2.4.3 引入了一个安全修复程序，可防止远程
    // 网站可能通过DNS重新绑定访问本地内容：
    // https://github.com/webpack/webpack-dev-server/issues/887
    // https://medium.com/webpack/webpack-dev-server-middleware-security-issues-1489d950874a
    // 但是，它提出了一些现有的用例，例如云开发
    // 开发中的环境或子域要复杂得多：
    // https://github.com/facebook/create-react-app/issues/2271
    // https://github.com/facebook/create-react-app/issues/2233
    // 虽然我们正在研究更好的解决方案，但现在我们将采取
    // 妥协。由于我们的 WDS 配置仅提供“公共”中的文件
    // 文件夹，我们不会认为访问它们是一个漏洞。但是，如果您
    // 使用“代理”功能，它会变得更加危险，因为它可以暴露
    // Django 和 Rails 等后端的远程代码执行漏洞。
    // 因此，我们将正常禁用主机检查，但如果有，请启用它
    // 指定了“代理”设置。最后，如果您
    // 真正知道你在用一个特殊的环境变量做什么。
    // 注意：[“localhost”， “.localhost”] 将支持子域 - 但我们可能会
    // 想要允许手动设置 allowedHosts 以进行更复杂的设置
    return {
        allowedHosts: disableFirewall ? 'all' : [allowedHost],
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*',
        },
        // 启用生成文件的 gzip 压缩。
        compress: true,
        static: {
            // 默认情况下，WebpackDevServer 提供当前目录中的物理文件
            // 除了它从内存中提供的所有虚拟构建产品之外。
            // 这令人困惑，因为这些文件不会自动在
            // 生产构建文件夹，除非我们复制它们。但是，复制整个
            // 项目目录很危险，因为我们可能会暴露敏感文件。
            // 取而代之的是，我们建立了一个约定，只在“公共”目录中存储文件
            // 得到服务。我们的构建脚本会将“public”复制到“build”文件夹中。
            // 在“index.html”中，您可以获取带有%PUBLIC_URL%的“public”文件夹的URL：
            // <link rel=“icon” href=“%PUBLIC_URL%/favicon.ico”>
            // 在 JavaScript 代码中，您可以使用“process.env.PUBLIC_URL”访问它。
            // 请注意，我们只建议使用“public”文件夹作为逃生舱口
            // 对于“favicon.ico”、“manifest.json”等文件，以及
            // 由于某种原因，在通过 webpack 导入时损坏了。如果你只是想
            // 使用图像，将其放在“src”中，然后从 JavaScript 中“导入”它。
            directory: paths.appPublic,
            publicPath: [paths.publicUrlOrPath],
            // 默认情况下，“contentBase”中的文件不会触发页面重新加载。
            watch: {
                //  据说，这避免了某些系统上的 CPU 过载。
                //  https://github.com/facebook/create-react-app/issues/293
                //  src/node_modules 不被忽略以支持绝对导入
                //  https://github.com/facebook/create-react-app/issues/1065
                ignored: ignoredFiles(paths.appSrc),
            },
        },
        client: {
            webSocketURL: {
                // 启用自定义 sockjs 路径名，以便将 websocket 连接到热重载服务器。
                // 为 websocket 连接启用自定义 sockjs 主机名、路径名和端口
                // 到热重载服务器。
                hostname: sockHost,
                pathname: sockPath,
                port: sockPort,
            },
            overlay: {
                errors: true,
                warnings: false,
            },
        },
        devMiddleware: {
            // 告诉 WebpackDevServer 使用与
            // 我们在 webpack 配置中指定。当主页为“.”时，默认为投放
            // 从根源上。
            // 删除最后一个斜杠，以便用户可以登陆“/test”而不是“/test/”
            publicPath: paths.publicUrlOrPath.slice(0, -1),
        },
        server: getHttpsConfig() ? 'https' : 'http',
        host,
        historyApiFallback: {
            // 带点的路径仍应使用历史回退。
            // See https://github.com/facebook/create-react-app/issues/387.
            disableDotRule: true,
            index: paths.publicUrlOrPath,
        },
        proxy,
        setupMiddlewares(middlewares, devServer) {
            if (!devServer) {
                throw new Error('webpack-dev-server is not defined');
            }
            // 从 `onBeforeSetupMiddleware` 配置项迁移
            middlewares.unshift({
                name: 'onBeforeSetupMiddleware',
                middleware: (req, res) => {
                    //  保留“evalSourceMapMiddleware”
                    //  否则，“redirectServedPath”之前的中间件将没有任何影响
                    //  这使我们可以从 webpack 中获取错误叠加的源内容
                    devServer.app.use(evalSourceMapMiddleware(devServer));

                    if (fs.existsSync(paths.proxySetup)) {
                        // 出于代理原因，这将注册用户提供的中间件
                        require(paths.proxySetup)(devServer.app);
                    }
                },
            });

            // 从 `onAfterSetupMiddleware` 配置项迁移时，
            middlewares.push({
                name: 'onAfterSetupMiddleware',
                middleware: (req, res) => {
                    // 如果网址不匹配，则从“package.json”重定向到“PUBLIC_URL”或“主页”
                    devServer.app.use(redirectServedPath(paths.publicUrlOrPath));

                    //  此 Service Worker 文件实际上是一个“no-op”，它将重置任何
                    //  以前的 Service Worker 注册了相同的主机：端口组合。
                    //  我们在开发中这样做是为了避免在以下情况下命中生产缓存
                    //  它使用相同的主机和端口。
                    // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
                    devServer.app.use(noopServiceWorkerMiddleware(paths.publicUrlOrPath));
                },
            });
        }
    }
}

module.exports = createDevServerConfig