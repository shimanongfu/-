function func() {
  function wait() {
    return this;
  }
  function sleep() {
    return this;
  }
  function excute() {
    return this;
  }
  return {
    wait,
    sleep,
    excute,
  };
}

module.exports = func();
