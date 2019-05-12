var pangu = require('pangu')

module.exports = function() {
  var Compiler = this.Compiler
  var visitors = Compiler.prototype.visitors

  // 备份一下原生方法
  var {emphasis,text} = visitors

  // 重写
  visitors.emphasis = function(node) {
    return "*"+ emphasis.apply(this, arguments)+"*";
  }
  visitors.text=function(node){
    return usePangu(text.apply(this, arguments))
  }
}

// 处理空格
function usePangu(value) {
    if (!value){
        return value
    } 
    return pangu.spacing(value)
}
  
