console.log('Hey terminal! A message from the browser');

const json = { foo: 'bar' };

console.log({ json });

console.assert(true, 'Assertion pass');
console.assert(false, 'Assertion fails');

console.info('Some info from the app');

console.table(['webpack', 'plugin', 'terminal']);


console.error(new Error('browser error!!!'))