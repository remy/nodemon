module.exports = [
  // {
  //   command: 'nodemon --some arg=remy -x "python -someopt" -w somedir/foo -w other/dir -w third/other -i "*.jade"',
  //   script: '',
  //   exec: 'python',
  //   fixture: {
  //     path: 'test/fixtures/'
  //   }
  // },
  {
    command: 'nodemon --watch src/ -e js,coffee app.js',
    script: 'app.js',
    exec: 'node'
  }
];