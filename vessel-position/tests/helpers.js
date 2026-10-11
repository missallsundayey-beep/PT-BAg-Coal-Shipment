const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const order = ['config','utils','parser','vessel-status','layout','renderer','export-png','sample-report','app'];
function load(extra = {}) {
  const context = vm.createContext(extra);
  for (const name of order) vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),context,{filename:name+'.js'});
  return context;
}
function generate(context, text, time) {
  context.inputText=text;context.inputTime=time;
  return JSON.parse(vm.runInContext('JSON.stringify(generate(inputText,inputTime))',context));
}
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/baseline.json'),'utf8'));
module.exports={root,order,load,generate,baseline};
