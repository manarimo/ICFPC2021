const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    createProxyMiddleware("/problems", {
      target: "http://icfpc2021-manarimo.s3-website-us-east-1.amazonaws.com",
      changeOrigin: true,
    })
  );
};
