var pangu = require('pangu')
// ✅中英文之间需要增加空格
// ✅中文与数字之间需要增加空格
// ✅破折号前后需要增加一个空格
// ✅全角和半角
// ✅使用全角中文标点
// ✅遇到完整的英文整句、特殊名词，其內容使用半角标点
// ✅斜体文字使用加粗样式代替

// 数字与单位之间需要增加空格
// 全角标点与其他字符之间不加空格
// 不重复使用标点符号
// 中文破折号
// 数字使用半角字符
// 专有名词使用正确的大小写
// 不要使用不地道的缩写
// 如果文章中有脚注怎么办

module.exports = function() {
  var Compiler = this.Compiler
  var visitors = Compiler.prototype.visitors

  // 备份一下原生方法
  var {emphasis,text,inlineCode} = visitors

  // 重写
  visitors.emphasis = function(node) {
    return "*"+ emphasis.apply(this, arguments)+"*";
  }
  visitors.text=function(node){
    return usePangu(text.apply(this, arguments))
  }
  visitors.inlineCode=function(node){
    return usePangu(inlineCode.apply(this, arguments))
  }
}

// 处理空格
function usePangu(value) {
    if (!value){
        return value
    } 
    return pangu.spacing(value)
}
  
