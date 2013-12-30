_ = require 'lodash'
assert = require 'assert'
child_process = require "child_process"
fs = require 'fs'
express = require 'express'

app = express()

app.use express.json(
  strict: false
  limit: '50mb'
)

app.use express.urlencoded(limit: '50mb')

dataStore = {}

if fs.existsSync('data.json')
  dataStore = JSON.parse(fs.readFileSync('data.json',
    encoding: 'utf-8'
  ))

dbVersion = 0
programVersion = 'unknown'

child_process.execFile 'git', [ 'describe', '--always', '--dirty' ], null,
  (err, stdout, stderr) ->
    if err?
      console.error err
      console.error stderr
      process.exit 1
    else
      programVersion = stdout

starDate = (dt) ->
  d = dt or new Date()
  y = d.getUTCFullYear()
  t0 = Date.UTC(y, 0, 1, 0, 0, 0, 0)
  t1 = Date.UTC(y + 1, 0, 1, 0, 0, 0, 0)
  t = Date.UTC(y,
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds())
  sd = y + (t - t0) / (t1 - t0)
  canonical: sd.toFixed(15)
  short: sd.toFixed(3)

saveDataStore = ->
  myVersion = ++dbVersion
  setTimeout (->
    if myVersion is dbVersion
      console.log 'Writing version ' + myVersion
      fs.writeFile 'data.json', JSON.stringify(dataStore, null, 2)
    else
      console.log [
          'My version = ',
          myVersion,
          ' but latest is ',
          dbVersion ].join('')
  ), 3000

app.all '/*', (req, res, next) ->
  res.header 'Access-Control-Allow-Origin', '*'
  res.header 'Access-Control-Allow-Headers', [
    'Cache-Control'
    'Content-Type'
    'Expires'
    'X-KVTDB-Version'
    'X-Requested-With'
  ].join(', ')
  res.header 'Access-Control-Allow-Methods', [
    'DELETE'
    'OPTIONS'
    'POST'
    'PUT'
  ].join(', ')
  res.header 'X-KVTDB-Version', programVersion
  next()

app.get '/db/get/*', (req, res, next) ->
  result = dataStore
  path = req.params[0].split('/')
  result = result[d]  while (d = path.shift()) and result
  if req.query
    for h in [
      'Content-Type'
      'Cache-Control'
      'Expires'
    ]
      res.header h, req.query[h]  if req.query[h]

    res.send 200, result
  else
    res.json result

app.get '/db/keys/*', (req, res, next) ->
  result = dataStore
  path = req.params[0].split('/')
  result = result[d]  while (d = path.shift()) and result
  res.json Object.keys(result)

app.get '/db/search/*', (req, res, next) ->
  result = []
  ptr1 = dataStore
  path = req.params[0].split('/')
  searchValue = path.pop()
  star = path.indexOf('*')
  assert star >= 0, 'Search field should be an asterisk'
  for j in [0...star]
    ptr1 = ptr1[path[j]] or {}
  possibleKeys = Object.keys(ptr1)
  for i in [0...possibleKeys.length]
    ptr2 = ptr1[possibleKeys[i]] or {}
    for j in [star + 1 ... path.length]
      ptr2 = ptr2[path[j]] or {}
    if ptr2 instanceof Array
      result.push possibleKeys[i]  if ptr2.indexOf(searchValue) >= 0
    else
      result.push possibleKeys[i]  if ptr2 is searchValue
  res.json result

app.post '/db/snapshot', (req, res, next) ->
  sd = starDate().canonical
  console.log 'Snapshotting ' + dbVersion + ' at ' + sd
  fs.writeFile 'data-' + sd + '.json', JSON.stringify(dataStore, null, 2)
  res.send 202

app.put '/db/set/*', (req, res, next) ->
  ptr = dataStore
  path = req.params[0].split('/')
  last = path.pop()
  while (d = path.shift())
    ptr[d] = {}  if typeof ptr[d] isnt 'object'
    ptr = ptr[d]
  ptr[last] = req.body
  saveDataStore()
  res.send 202

app.put '/db/push/*', (req, res, next) ->
  ptr = dataStore
  path = req.params[0].split('/')
  last = path.pop()
  while (d = path.shift())
    ptr[d] = {}  if typeof ptr[d] isnt 'object'
    ptr = ptr[d]
  ptr[last] = ptr[last] or []
  ptr[last].push req.body
  ptr[last] = _.uniq(ptr[last])  if req.query.unique
  saveDataStore()
  res.send 202

app.delete '/db/del/*', (req, res) ->
  ptr = dataStore
  path = req.params[0].split('/')
  last = path.pop()
  while d = path.shift()
    if typeof ptr[d] isnt 'object'
      res.send 202
      return
    ptr = ptr[d]
  delete ptr[last]
  saveDataStore()
  res.send 202

app.listen 63446
console.log 'Listening on port 63446'
