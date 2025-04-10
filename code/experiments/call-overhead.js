mdlr('experiments:performance:call-overhead', m => {

  function run_test_noargs(f) {
    let results = [];

    for (let j = 0; j < 100; ++j) {

      const stamp = performance.now();
      for (let i = 0; i < 1000000; ++i) {
        f();
      }
      const time = performance.now() - stamp;
      results.push(time);
    }
    results.sort();

    const stable_results = results.slice(5, 95);

    console.log(stable_results.reduce((a, b) => a + b, 0) / stable_results.length);
  }

  function run_test(f, ...args) {
    let results = [];

    for (let j = 0; j < 100; ++j) {

      const stamp = performance.now();
      for (let i = 0; i < 1000000; ++i) {
        f(...args);
      }
      const time = performance.now() - stamp;
      results.push(time);
    }
    results.sort();

    const stable_results = results.slice(5, 95);

    console.log(stable_results.reduce((a, b) => a + b, 0) / stable_results.length);
  }

  function doStuff(a, b, c, d, e, f, g, h, i, j) {
    return a==b
  }

  // let results = [];
  // for (let j = 0; j < 100; ++j) {

  //   const stamp = performance.now();
  //   for (let i = 0; i < 10000000; ++i) {
  //     doStuff();
  //   }
  //   const time = performance.now() - stamp;
  //   results.push(time);
  // }
  // results.sort();

  // console.log(results.slice(5, 95));

  // const f = new Function('return '+doStuff.toString());
  const code = 'return ' + doStuff;
  const func = new Function(code)();
  console.log(code, func);
  const bound_doStuff = doStuff.bind(null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

  run_test(() => doStuff(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));

  run_test(() => func(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));

  run_test(doStuff, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
  run_test(bound_doStuff);

  run_test_noargs(doStuff);

  run_test_noargs(() => doStuff(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));

  run_test_noargs(() => doStuff.call(null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10));

  run_test_noargs(bound_doStuff);

  const func2 = () => doStuff.apply(null, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  run_test_noargs(func2);

})