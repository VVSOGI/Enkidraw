const path = require("path");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const isServe = process.argv.includes("serve");

  // 라이브러리 빌드용 공통 설정
  const commonConfig = {
    entry: "./src/index.ts",

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      browsers: ["> 1%", "last 2 versions", "not dead"],
                    },
                    modules: false, // webpack이 모듈 처리하도록
                  },
                ],
                "@babel/preset-typescript",
              ],
            },
          },
        },
      ],
    },

    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },

    externals: {
      // 피어 디펜던시나 사용자가 제공해야 하는 것들
      // 예: 'react': 'react' (만약 React 피어 디펜던시라면)
    },

    devtool: "source-map",
  };

  // 개발 서버용 설정
  if (isServe) {
    return {
      ...commonConfig,
      mode: "development",
      experiments: {
        outputModule: true,
      },

      output: {
        path: path.resolve(__dirname, "development", "source"),
        filename: "index.js",
        library: {
          type: "module",
        },
        clean: true,
      },

      devServer: {
        static: {
          directory: path.join(__dirname, "development"),
          publicPath: "/",
        },
        port: 8080,
        open: true,
        hot: true,
        compress: true,
        historyApiFallback: {
          index: "/index.html",
        },
        devMiddleware: {
          writeToDisk: (filePath) => {
            // hot-update 파일들은 디스크에 쓰지 않고 메모리에만 유지
            return !filePath.includes(".hot-update.");
          },
        },
      },
    };
  }

  // 라이브러리 빌드용 설정 (CommonJS + ESM)
  return [
    // CommonJS 버전
    {
      ...commonConfig,
      output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index.js",
        library: "EnkiDraw",
        libraryTarget: "commonjs2",
        clean: true,
      },

      optimization: isProduction
        ? {
            minimize: true,
          }
        : {},
    },

    // ESM 버전
    {
      ...commonConfig,
      experiments: {
        outputModule: true,
      },

      output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index.esm.js",
        library: {
          type: "module",
        },
        clean: false, // CommonJS 빌드 결과 유지
      },

      optimization: isProduction
        ? {
            minimize: true,
          }
        : {},
    },
  ];
};
