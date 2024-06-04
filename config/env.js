'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');

// 获取NODE_ENV 和 REACT_APP_*环境变量，并准备好它们
// 通过 webpack 配置中的 DefinePlugin 注入到应用程序中。
const REACT_APP = /^REACT_APP_/i;
const getClientEnvironment = (publicUrl) => {
    const raw = Object.keys(process.env)
        .filter(key => REACT_APP.test(key))
        .reduce((env, key) => {
                env[key] = process.env[key]
                return env;
            },
            {
                // 对于确定我们是否在生产模式下运行很有用。
                // 最重要的是，它将 React 切换到正确的模式。
                NODE_ENV: process.env.NODE_ENV || 'development',
                // 使用process.env.PUBLIC_URL对于解析public目录下的静态资源的正确路径是有用的。
                //  例如，<img src={process.env.PUBLIC_URL + '/img/logo.png'} />。
                //  使用process.env.PUBLIC_URL应该被视为一种“逃生舱口”或备选方案。
                //  这意味着，在常规的开发过程中，通常不推荐直接使用这种方式来引用静态资源
                //  应该将图片等资源放在项目的src目录下，并在代码中通过import语句来引用它们。
                //  这样做的好处是，Webpack可以处理这些资源，为它们生成正确的路径，并可能进行其他优化（如压缩、哈希命名等）。
                PUBLIC_URL: publicUrl,
                //  在开发阶段，支持对SockJS的路径名（pathname）进行配置
                //  通过配置这些设置，开发者可以同时运行多个项目，而不会因为SockJS的连接路径相同而导致冲突。
                //  在webpackHotDevClient（Webpack的热更新客户端）中，这些配置被用作连接的hostname（主机名）、pathname（路径名）和port（端口）。
                //  这意味着开发者可以指定热更新服务连接的具体信息，以适应不同的项目需求或避免端口冲突。
                //  在webpack-dev-server（Webpack的开发服务器）中，
                //  这些设置对应于sockHost（SockJS服务器的主机名）、sockPath（SockJS的连接路径）和sockPort（SockJS服务器的端口）选项。
                WDS_SOCKET_HOST: process.env.WDS_SOCKET_HOST,
                WDS_SOCKET_PATH: process.env.WDS_SOCKET_PATH,
                WDS_SOCKET_PORT: process.env.WDS_SOCKET_PORT,
                // “react-refresh”是否被启用
                // webpackHotDevClient是Webpack开发服务器用于处理热更新的客户端脚本。
                // 为了让webpackHotDevClient知道是否启用react-refresh，
                // 这个设置需要在这里被定义，
                // 从而使得热更新客户端能够根据这个设置来决定是否使用react-refresh来处理组件的热更新
                FAST_REFRESH: process.env.FAST_REFRESH !== 'false'
            })

// 将所有值字符串化，以便我们可以输入到 webpack DefinePlugin 中
    const stringified = {
        'process.env': Object.keys(raw).reduce((env, key) => {
            env[key] = JSON.stringify(raw[key]);
            return env;
        }, {}),
    };
    return {raw,stringified}
}

module.exports = getClientEnvironment;
