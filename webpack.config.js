const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      // Inyectar el polyfill antes del código principal
      polyfill: './et-initialize-polyfill.js',
      main: './src/main.tsx'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      clean: true,
      publicPath: '/'
    },
    
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true
              }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.(js|jsx)$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: 'defaults' }],
                ['@babel/preset-react', { runtime: 'automatic' }]
              ]
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[hash][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[hash][ext]'
          }
        }
      ]
    },
    
    plugins: [
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
      }),
      
      new HtmlWebpackPlugin({
        template: './index.html',
        inject: 'body',
        chunks: ['polyfill', 'main'], // Asegurar que el polyfill se cargue primero
        chunksSortMode: 'manual'
      }),
      
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
          chunkFilename: '[name].[contenthash].chunk.css'
        })
      ] : [])
    ],
    
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              // Configuraciones específicas para evitar problemas con eT.initialize
              drop_console: false, // Mantener console.log para debugging
              drop_debugger: false,
              pure_funcs: [], // No eliminar funciones que podrían ser importantes
              // Evitar optimizaciones agresivas que podrían romper eT
              unsafe: false,
              unsafe_comps: false,
              unsafe_Function: false,
              unsafe_math: false,
              unsafe_symbols: false,
              unsafe_methods: false,
              unsafe_proto: false,
              unsafe_regexp: false,
              unsafe_undefined: false
            },
            mangle: {
              // Preservar nombres de funciones importantes
              reserved: ['eT', 'initialize', 'setProperty', 'getPropertyValue'],
              keep_fnames: /^(eT|initialize|setProperty)$/
            },
            format: {
              comments: /^!/
            }
          },
          extractComments: false
        }),
        
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                // Configuraciones CSS seguras
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                colormin: false, // Evitar optimizaciones de color que podrían causar problemas
                minifyFontValues: false,
                minifySelectors: false // Preservar selectores exactos
              }
            ]
          }
        })
      ],
      
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Separar el polyfill en su propio chunk
          polyfill: {
            name: 'polyfill',
            test: /et-initialize-polyfill/,
            chunks: 'all',
            enforce: true,
            priority: 100
          },
          // Separar vendor libraries
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10
          },
          // Chunk común para código compartido
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5
          }
        }
      },
      
      runtimeChunk: {
        name: 'runtime'
      }
    },
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true
    },
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  };
};