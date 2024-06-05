'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('react-dev-utils/chalk');
const paths = require('./paths');

// 确保提供的证书和密钥有效，如果不是，抛出易于调试的错误
const validateKeyAndCerts = ({cert, key, keyFile, crtFile}) => {
    let encrypted;
    try {
        // publicEncrypt 将抛出证书无效的错误
        encrypted = crypto.publicEncrypt(cert, Buffer.from('test'));
    } catch (err) {
        throw new Error(`The certificate "${chalk.yellow(crtFile)}" is invalid.\n${err.message}`);
    }

    try {
       // privateDecrypt 将抛出具有无效密钥的错误
        crypto.privateDecrypt(key, encrypted);
    } catch (err) {
        throw new Error(`The certificate key "${chalk.yellow(keyFile)}" is invalid.\n${err.message}`);
    }
}

// 读取文件并抛出错误（如果不存在）
const readEnvFile = (file, type) => {
    if (!fs.existsSync(file)) {
        throw new Error(
            `You specified ${chalk.cyan(
                type
            )} in your env, but the file "${chalk.yellow(file)}" can't be found.`
        );
    }
    return fs.readFileSync(file);
}


const getHttpsConfig = () => {
    const {SSL_CRT_FILE, SSL_KEY_FILE, HTTPS} = process.env;
    const isHttps = HTTPS === 'true';
    if (isHttps && SSL_CRT_FILE && SSL_KEY_FILE) {
        const crtFile = path.resolve(paths.appPath, SSL_CRT_FILE);
        const keyFile = path.resolve(paths.appPath, SSL_KEY_FILE);
        const config = {
            cert: readEnvFile(crtFile, 'SSL_CRT_FILE'),
            key: readEnvFile(keyFile, 'SSL_KEY_FILE'),
        };
        validateKeyAndCerts({...config, keyFile, crtFile});
        return config;
    }
    return isHttps;
}

module.exports = getHttpsConfig;