'use strict';
const path = require('path');
const cp = require('child_process');
const Package = require('@power-cli/package');
const log = require('@power-cli/log');

const SETTINGS = {
  init: '@power-cli/init',
  add: '@power-cli/add',
  publish: '@power-cli/publish',
};
const CACHE_DIR = 'dependencies'; //缓存

async function exec() {
  const cmdName = arguments[arguments.length - 1].name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';

  let targetPath =
    process.env.CLI_TARGET_PATH ||
    path.resolve(__dirname, `../../../commands/${cmdName}`);
  const homePath = process.env.CLI_HOME_PATH;
  let storePath;
  let pkg;
  log.verbose('targetPath:', targetPath);
  log.verbose('homePath:', homePath);

  // const cmdObjOpts = arguments[arguments.length -1]?.opts()

  // 用户不指定路径就远程下载，如果本地有缓存 =》检查下版本是不是最新 =》不是最新九更新
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // 缓存路径
    storePath = path.resolve(targetPath, 'node_modules'); // 缓存路径-node_modules
    log.verbose('targetPath:', targetPath);
    log.verbose('storePath:', storePath);
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
      storePath,
    });
    // 缓存是否存在
    if (await pkg.exists()) {
      // 更新pkg
      await pkg.update();
    } else {
      // 安装pkg
      await pkg.install();
    }
  } else {
    // 本地包
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  log.verbose('rootFile', rootFile);
  if (rootFile) {
    // 加载对应的 命令包
    try {
      const argv = Array.prototype.slice.apply(arguments, [0, 2]);
      const code = `require('${rootFile}').call(null, ${JSON.stringify(argv)})`;

      // 兼容window node已经兼容
      // const spawn = (cmd, args, options) => {
      //   const win32 = process.platform === 'win32'
      //   const command = win32 ? 'cmd' : cmd
      //   const cmdArgs = win32 ? ['/c'].concat(cmd, arg) : args
      //   return cp.spawn(command, cmdArgs, options || {})
      // }
      // 子进程加载包
      const child = cp.spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit', // 绑定父类
      });
      // 全局异常处理
      child.on('error', (e) => {
        console.error(e.message, 'error');
        process.exit(1); //停止主进程
      });
      child.on('exit', (e) => {
        log.verbose('加载命令执行成功, 退出子进程' + e);
      });
      child.on('close', (e) => {
        log.verbose('关闭' + e);
      });
    } catch (e) {
      log.error(e.message);
    }
  }
}
module.exports = exec;
