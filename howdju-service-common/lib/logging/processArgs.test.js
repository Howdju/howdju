const {processArgs} = require('./processArgs')

test('processes message', () => {
  expect(processArgs(['hello'])).toEqual({
    message: 'hello',
    data: null,
  });
})

test('processes data', () => {
  expect(processArgs([{'key': 'value'}])).toEqual({
    message: null,
    data: {'key': 'value'},
  });
})

test('processes message and data', () => {
  expect(processArgs(['some message', {'key': 'value'}])).toEqual({
    message: 'some message',
    data: {'key': 'value'},
  });
})

test('processes interleaved message and data', () => {
  expect(processArgs(['some message', {'key': 'value'}, 'more message'])).toEqual({
    message: 'some message {"key":"value"} more message',
    data: {'key': 'value'},
  });
})

test('processes multiple interleaved message and data', () => {
  expect(processArgs(['some message', {'key': 'value'}, 'more message', {'key2': 'value2'}])).toEqual({
    message: 'some message {"key":"value"} more message {"key2":"value2"}',
    data: [{'key': 'value'}, {'key2': 'value2'}],
  });
})
