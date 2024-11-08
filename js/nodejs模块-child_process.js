const child_process = require('child_process');

const { exec, execFile, fork, spawn } = child_process;

// exec
// exec('ls -al', (err, stdout, stderr) => {
//   if (err) {
//     console.error(`exec error: ${err}`);
//     return;
//   }
//   stdout && console.log(`stdout: ${stdout}`);
//   stderr && console.error(`stderr: ${stderr}`);
// });

// execFile
// execFile('ls', ['-al'], (err, stdout, stderr) => {
//   if (err) {
//     console.error(`execFile error: ${err}`);
//     return;
//   }
//   stdout && console.log(`stdout: ${stdout}`);
//   stderr && console.error(`stderr: ${stderr}`);
// });

// fork
const child = fork('./js/函数柯里化.js', {
  silent: false,
});
