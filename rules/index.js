var remark = require("remark");
var pangu = require("./pangu.js");

module.exports = function(content) {
  // 配置选项见 https://github.com/remarkjs/remark/tree/master/packages/remark-stringify
  return new Promise(resolve => {
    remark()
      .data("settings", {
        commonmark: true, //兼容commonmark规范
        fences: true, //启用代码块默认```
        bullet: "*", //列表使用*
        listItemIndent: "1", //列表一个空格
        rule:"-",
        ruleSpaces: false, //***之间无需空格
        emphasis: "*" //斜体使用*
      })
      .use(pangu)
      .process(content, function(e, f) {
        resolve(f.contents);
      });
  });
};
