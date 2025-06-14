module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: ["> 1%", "last 2 versions", "not dead"],
        },
      },
    ],
    "@babel/preset-typescript",
  ],

  env: {
    test: {
      presets: [["@babel/preset-env", { targets: { node: "current" } }], "@babel/preset-typescript"],
    },
  },
};
