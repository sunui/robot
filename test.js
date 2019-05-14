var fs = require("fs");
var path = require("path");
var fix = require("./rules/index.js");

const root = path.join(__dirname, "tests/TODO1");

function updateFile(file_path) {
  return fs.readFile(file_path, async function(err, data) {
    
    console.log("读取",file_path)

    const fixedcontent = await fix(data.toString());

    if (err) console.log(err);

    fs.writeFile(file_path, fixedcontent, function(err) {
      console.log("写入",file_path)
      if (err) console.log(err);
    });
  });
}

fs.readdir(root, { withFileTypes: true }, function(err, data) {
  const tests = data.filter(f => f.isFile()).map(f => path.join(root, f.name));

  tests.forEach(file_path => {
    updateFile(file_path);
  });
});

