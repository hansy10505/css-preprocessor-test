const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const config = require('./config/index')   // 配置文件
const CleanWebpackPlugin = require('clean-webpack-plugin')  // 清除文件夹插件
const ExtractTextPlugin = require('extract-text-webpack-plugin')    // 分离CSS插件
const HtmlWebpackPlugin = require('html-webpack-plugin')    // 生成html打包插件


const SRC_PATH = path.resolve('./src')     // 源代码的根目录（本地物理文件路径）
const ASSETS_BUILD_PATH = path.resolve('./dist')    // 打包后的资源根目录（本地物理文件路径）
const ASSETS_PUBLIC_PATH = './assets/'     // 资源根目录（可以是 CDN 上的绝对路径，或相对路径）

// 获取所有入口文件
var getEntry = function(globPath) {
    var entries = {
    };
    glob.sync(globPath).forEach(function(entry) {
        var pathname = entry.split('/').splice(-2).join('/').split('.')[0]
        entries[pathname] = [entry]
    });
    return entries;
};
var entries = getEntry('./src/view/*.html')
var chunks = Object.keys(entries)

// webpack配置
module.exports = {
    context: SRC_PATH, // 设置源代码的默认根路径
    resolve: {
        extensions: ['.js'],    // 默认省略后缀
    },
    entry: config.pages,
    output: {
        path: path.join(__dirname, 'dist'),
        // publicPath: 'cdn',
        filename: ASSETS_PUBLIC_PATH + 'js/[name].[chunkhash:8].js'
    },
    module: {
        rules: [
            // eslint-loader
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'eslint-loader',
                options: {
                    // eslint options (if necessary)
                    'indent': 4,  // 缩进为4空格
                    'semi': [3, 'always'], // 不管分号
                    'no-unused-vars': [2, {'vars': 'local', 'args': 'after-used'}], // 不允许var后不使用变量
                }
            },
            {
                test: require.resolve('jquery'),
                use: [{
                    loader: 'expose-loader',
                    options: 'jQuery'
                },{
                    loader: 'expose-loader',
                    options: '$'
                }]
            },
            {
                test: /\.js$/,
                exclude: path.join(__dirname, 'node_modules'),
                include: path.join(__dirname, 'src'),
                loader: 'babel-loader'
            },
            // file-loader
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: ASSETS_PUBLIC_PATH + '/img/',
                        useRelativePath:true,
                        limit: 8192,
                        name: '[name].[hash:8].[ext]'
                    }
                }]
            },
            // file-loader
            {
                test: /\.(woff|woff2|eot|ttf|svg|otf)$/i,
                use: [{
                    loader: 'file-loader',
                    options: {
                        limit: 8192,
                        outputPath: ASSETS_PUBLIC_PATH + '/fonts/',
                        useRelativePath:true,
                        name: '[name].[ext]'
                    }
                }]
            },
            // html-loader
            {
                test: /\.html$/,
                exclude: path.join(__dirname, 'node_modules'),
                include: path.join(__dirname, 'src'),
                loader: 'html-loader'
            },
            // css-loader
            {
                test: /\.css$/,
                exclude: path.join(__dirname, 'node_modules'),
                include: path.join(__dirname, 'src'),
                use: ExtractTextPlugin.extract([
                    // 'style-loader', 'css-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                require('postcss-import'),
                                require('autoprefixer')({
                                    browsers: ['last 5 versions']
                                }),
                            ]
                        }
                    }
                ])
            },
            // less-loader
            {
                test: /\.less$/,
                exclude: path.join(__dirname, 'node_modules'),
                include: path.join(__dirname, 'src'),
                use: ExtractTextPlugin.extract([
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                require('postcss-import'),
                                require('autoprefixer')({
                                    browsers: ['last 5 versions']
                                }),
                            ]
                        }
                    },
                    'less-loader'
                ])
            },
            // scss-loader
            {
                test: /\.scss$/,
                exclude: path.join(__dirname, 'node_modules'),
                include: path.join(__dirname, 'src'),
                use: ExtractTextPlugin.extract([
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                require('postcss-import'),
                                require('autoprefixer')({
                                    browsers: ['last 5 versions']
                                }),
                            ]
                        }
                    },
                    'sass-loader'
                ])
            },
            // sass-loader
            {
                test: /\.sass$/,
                exclude: path.join(__dirname, 'node_modules'),
                include: path.join(__dirname, 'src'),
                use: ExtractTextPlugin.extract([
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                require('postcss-import'),
                                require('autoprefixer')({
                                    browsers: ['last 5 versions']
                                }),
                            ]
                        }
                    },
                    'sass-loader'
                ])
            },
        ]
    },
    plugins: [  
        // 每次打包前，先清空原来目录中的内容
        new CleanWebpackPlugin([ASSETS_BUILD_PATH], { verbose: false }),
        // 官方文档推荐使用下面的插件确保 NODE_ENV
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
        }),
        // 抽取 CSS 文件
        new ExtractTextPlugin({
            filename: ASSETS_PUBLIC_PATH + 'css/[name].css',
            allChunks: true,
            ignoreOrder: true
        }),
        
    ]
};
// 循环多页面路目录内的文件
chunks.forEach(function(pathname) {
    if (pathname == 'vendor') {
        return;
    }
    var conf = {
        title: 'My App',
        filename: pathname.split('/')[1] + '.html',
        template: pathname + '.html',
        inject: 'body',
        chunks: ['vendor', pathname.split('/')[1]],
        minify: {
            removeComments: true,
            collapseWhitespace: false
        }
    };
    if (pathname in module.exports.entry) {
        conf.chunks = ['vendor', pathname];
        conf.hash = false;
    }
    module.exports.plugins.push(new HtmlWebpackPlugin(conf));
});