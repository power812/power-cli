const path = require('path');
const pkg = require('./../package.json');
const log = require('@power-cli/log');
const constant = require('./const');
const semver = require('semver');
const colors = require('colors/safe');
const { homedir } = require('os');
const dotenv = require('dotenv');
const commander = require('commander');
const program = new commander.Command();
const exec = require('@power-cli/exec');
const fs = require('fs');
const userHome = homedir();

async function core() {
  try {
    //准备阶段
    prepare();

    // 注册命令
    registerCommand();
  } catch (e) {
    log.error(e.message);
    if (program.opts().debug) {
      console.log(e);
    }
  }
}
// 脚手脚初始化阶段
async function prepare() {
  // 检测cli版本
  checkPkgVersion();
  //  检测node最低版本号
  checkNodeVersion();
  // 检查超级管理员, 如果是超级管理员就降级
  checkRoot();

  // 检查用户主目录
  checkUserHome();

  // 检查环境变量
  checkEnv();

  // 检查最cli工具新版本号，提示用户更新？
  checkVersionUpdate();
}
function registerCommand() {
  // 初始化
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command>  [options]')
    .version(pkg.version)
    .option('-d --debug', '是否开启调试模式', false)
    .option('-tp --targetPath <targetPath>', '是否开启本地调试路径', '');
  // 命令注册
  program
    .command('init <projectName>')
    .option('-f, --force', '是否强制初始化项目')
    .showHelpAfterError()
    .action(exec);
  // 代码复用
  program
    .command('add [templateName]')
    .option('-f, --force', '是否强制代码')
    .showHelpAfterError()
    .action(exec);
  // 发布命令
  program
    .command('publish [git]')
    .option('--refreshServer', '强制更新远程地址仓库')
    .option('--refreshToken', '强制更新远程仓库token')
    .option('--refreshOwner', '强制更新远程仓库组织')
    .option('--buildCmd <buildCmd>', '自定义打包命令')
    .option('--prod', '是否正式发布')
    .showHelpAfterError()
    .action(exec);
  // 调试模式
  program.on('option:debug', () => {
    if (program.opts().debug) {
      process.env.LOCAL_LEVEL = 'verbose';
    } else {
      process.env.LOCAL_LEVEL = 'info';
    }
    log.level = process.env.LOCAL_LEVEL;
    log.verbose('开启调试模式');
  });
  // 对未知命令的监听
  program.on('command:*', (obj) => {
    log.info('未知命令', obj[0]);
    const availableCommand = program.commands.map((command) => command.name());
    log.info('可用命令：', availableCommand.join(','));
    // 未输入命令显示帮助文档
    if (program.args?.length < 1) {
      program.outputHelp();
      // 输入空行
      console.log();
    }
  });
  // 监听targetPath
  program.on('option:targetPath', function () {
    process.env.CLI_TARGET_PATH = program.opts().targetPath;
  });

  program.parse(process.argv);
}
async function checkVersionUpdate() {
  // 获取当前版本
  const currentVersion = pkg.version;
  const pkgName = pkg.name;
  const { getNewVersion } = require('@power-cli/get-npm-info');
  // const npmVersions  = await getNpmVersion(pkgName)
  const newVersion = await getNewVersion(pkgName);
  if (newVersion && semver.gt(newVersion, currentVersion)) {
    log.info(
      '更新提示：',
      colors.yellow(
        `请手动更新${pkgName},当前版本：${currentVersion},最新版本：${newVersion}`
      )
    );
  }
  // 调用NPMApi获取所有版本号
}
function checkEnv() {
  const createDefaultConfig = () => {
    const cliConfig = {
      path: userHome,
    };
    if (process.env.CLI_HOME) {
      cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
    } else {
      cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
    }

    process.env.CLI_HOME_PATH = cliConfig['cliHome'];
    return cliConfig;
  };
  // /usr/power/.env存在
  dotenv.config({ path: path.resolve(userHome, '.env') });
  const dotenvPath = path.resolve(userHome, '.env');
  if (fs.existsSync(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();

  // log.info('环境变量路径：', process.env.CLI_HOME_PATH)
}

//检查用户主目录
function checkUserHome() {
  if (!userHome || !fs.existsSync(userHome)) {
    throw new Error(log.notice('当前登录用户主目录不存在'));
  }
}
function checkRoot() {
  const p = import('root-check');
  p.then((rootCheck) => {
    rootCheck?.default();
  });

  // rootCheck()
}
// 检查node 版本
function checkNodeVersion() {
  const lowerVersion = constant.LOWER_NODE_VERSION;
  const nodeVersion = process.version;
  if (!semver.gte(nodeVersion, lowerVersion)) {
    throw new Error(
      colors.red(`node版本过低，需要安装node最低版本${nodeVersion}`)
    );
  }
}
// 提示版本
function checkPkgVersion() {
  log.notice(pkg.version);
}
// 全局错误处理
process.on('unhandledRejection', (reason, p) => {
  //我刚刚捕获了一个未处理的promise rejection,
  console.log('unhandledRejection', reason, p);
  throw reason;
});
process.on('uncaughtException', (error) => {
  //我刚收到一个从未被处理的错误，现在处理它，并决定是否需要重启应用
  console.log('uncaughtException', error);
  throw error;
});

module.exports = core;
