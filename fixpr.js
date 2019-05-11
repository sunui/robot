var remark = require("remark");
var pangu = require("./rules/pangu.js");
var pino = require("pino");
const config = require("./config");
const Octokit = require("@octokit/rest");

const { repo, owner, token } = config.github;

const github = new Octokit({
  auth: token,
  userAgent: "gold-miner-robot"
});

const pretty = pino.pretty();
pretty.pipe(process.stdout);
const logger = pino(
  {
    level: "debug"
  },
  pretty
);

const fix = function(content) {
  // 配置选项见 https://github.com/remarkjs/remark/tree/master/packages/remark-stringify
  return new Promise(resolve => {
    remark()
      .data("settings", {
        commonmark: true, //兼容commonmark规范
        fences: true, //启用代码块默认```
        bullet: "*", //列表使用*
        listItemIndent: "1", //列表一个空格
        ruleSpaces: false, //***之间无需空格
        emphasis: "*" //斜体使用*
      })
      .use(pangu)
      .process(content, function(e, f) {
        resolve(f.contents);
      });
  });
};

const getFiles = function(number) {
  return github.pulls.listFiles({
    repo,
    owner,
    pull_number: number
  });
};

const getFile = function(sha) {
  return github.git.getBlob({
    owner,
    repo,
    file_sha: sha
  });
};

const upDateFile = function({repo,owner,branch, path, sha, content}) {
  return github.repos.updateFile({
    repo,
    owner,
    path,
    message: "修复一些格式错误",
    content,
    branch,
    sha
  });
};

module.exports = async function(pull) {
  try {
    logger.debug(`Try to fix pull ${pull.number}.`);

    const files = await getFiles(pull.number);

    if (files.data.length > 1) {
      // TODO 多于一个文件不处理，提交一个 comment
    } else {
      const fileinfo = files.data[0];

      const file = await getFile(fileinfo.sha);
      const rowcontent = Buffer.from(file.data.content, "base64").toString(
        "utf8"
      );

      const newfile = await fix(rowcontent);
      const newcontent = Buffer.from(newfile).toString("base64");

      if (rowcontent !== newfile) {
        await upDateFile(
          {
            repo:pull.head.repo.name,
            owner:pull.head.repo.owner.login,
            branch:pull.head.ref,
            path:fileinfo.filename,
            sha:fileinfo.sha,
            content:newcontent
          }
        );
      }
      //TODO：提交报告
    }
  } catch (err) {
    return logger.error(err);
  }
};
