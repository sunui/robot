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

const getPull = function(pull_number) {
  return github.pulls.get({
    owner,
    repo,
    pull_number
  })
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

const addComment = function addComment(issue_number, body) {
  return github.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  })
}

module.exports = async function(pull,sender) {
  try {
    logger.debug(`Try to fix pull ${pull.number}.`);

    const files = await getFiles(pull.number);

    if (files.data.length > 1) {

      addComment(pull.number,`@${sender.login} 您提交了多个文件，请检查。`)

    } else {
      const fileinfo = files.data[0];

      const file = await getFile(fileinfo.sha);
      const rowcontent = Buffer.from(file.data.content, "base64").toString(
        "utf8"
      );

      const newfile = await fix(rowcontent);
      const newcontent = Buffer.from(newfile).toString("base64");


      let head=pull.head;
      let user=pull.user;
      if(!head){
        const {data} =await getPull(pull.number)
        head=data.head
        user=data.user
      }

      if (rowcontent !== newfile) {
        await upDateFile(
          {
            repo:head.repo.name,
            owner:head.repo.owner.login,
            branch:head.ref,
            path:fileinfo.filename,
            sha:fileinfo.sha,
            content:newcontent
          }
        );
      }else{
        addComment(pull.number,`@${sender.login} 没发现什么问题。`)
      }
      //TODO：提交报告
    }
  } catch (err) {
    return logger.error(err);
  }
};
