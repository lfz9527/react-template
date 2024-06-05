module.exports = {
    proxy: {
        "/api/**": {
            target: "http://xxx.com/",
            changeOrigin: true
        }
    }
};