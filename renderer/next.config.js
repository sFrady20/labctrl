const WindiCSSWebpackPlugin = require("windicss-webpack-plugin");

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) config.target = "electron-renderer";
    config.plugins = [...config.plugins, new WindiCSSWebpackPlugin()];
    return config;
  },
};
