const sinon = require('sinon')

const { 
  mockLogger,
} = require('howdju-test-common')

const {
  BaseDao,
  convertRowToObject,
  START_PREFIX,
  STOP_PREFIX,
} = require('./BaseDao')

describe('BaseDao', () => {
  
  describe('querySingleValue', () => {
    
    test('queries a single value', async () => {
      const theValue = 'the value'
      const database = {
        query: sinon.fake.returns({rows: [[theValue]]}),
      }
      const dao = new BaseDao(mockLogger, database, null)
      
      const theQueryName = 'query-name'
      const theSql = 'the SQL'
      const theArgs = ['arg1', 'arg2']
      const result = await dao.queryOneValue(theQueryName, theSql, theArgs)
      
      expect(result).toEqual(theValue)
      sinon.assert.calledWith(database.query, theQueryName, theSql, theArgs, true)
    })
    
    test('throws on no row', async () => {
      const database = {
        query: sinon.fake.returns({rows: []}),
      }
      const dao = new BaseDao(mockLogger, database, null)

      await expect(dao.queryOneValue('query-name', 'sql', [])).rejects.toThrow('Missing required row')
    })
  })
  
  describe('convertRowToObject', () => {
    test('adds prefixes', () => {
      const fields = [
        {name: 'id'},
        {name: START_PREFIX + 'my_prefix_'},
        {name: 'foo'},
        {name: STOP_PREFIX},
        {name: 'baz'},
      ]
      const row = [
        1,
        '',
        'bar',
        '',
        'spaz',
      ]
      const expected = {
        id: 1,
        my_prefix_foo: 'bar',
        baz: 'spaz',
      }
      expect(convertRowToObject(fields, row)).toEqual(expected)
    })
    
    test('handles collisions', () => {
      const fields = [
        {name: START_PREFIX + 'prefix_'},
        {name: 'foo'},
        {name: START_PREFIX + 'prefix2_'},
        // collides with previous key foo: after it is prefixed
        {name: 'prefix_foo'},
      ]
      const row = [
        '',
        'foo',
        '',
        'bar',
      ]
      const expected = {
        prefix_foo: 'foo',
        prefix2_prefix_foo: 'bar',
      }
      expect(convertRowToObject(fields, row)).toEqual(expected)
    })
  })
})

