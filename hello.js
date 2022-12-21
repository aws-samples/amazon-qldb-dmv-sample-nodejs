console.log('Hello, World!');
console.log('The sum of 2 and 3 is 5.');
var sum = parseInt(process.argv[2], 10) + parseInt(process.argv[3], 10);
console.log('The sum of ' + process.argv[2] + ' and ' +
    process.argv[3] + ' is ' + sum + '.');
