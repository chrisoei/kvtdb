_ = require("lodash")
assert = require("assert")
fs = require("fs")
Q = require("q")
express = require("express")
app = express()

app.use express.json(
  strict: false
  limit: "50mb"
)

app.use express.urlencoded(limit: "50mb")

dataStore = undefined

if fs.existsSync("data.json")
  dataStore = JSON.parse(fs.readFileSync("data.json",
    encoding: "utf-8"
  ))
else
  dataStore = {}

dbVersion = 0
writeFile = Q.denodeify(fs.writeFile)

starDate = (dt) ->
  d = dt or new Date()
  y = d.getUTCFullYear()
  t0 = Date.UTC(y, 0, 1, 0, 0, 0, 0)
  t1 = Date.UTC(y + 1, 0, 1, 0, 0, 0, 0)
  t = Date.UTC(y, d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds())
  sd = y + (t - t0) / (t1 - t0)
  canonical: sd.toFixed(15)
  short: sd.toFixed(3)

saveDataStore = ->
  myVersion = ++dbVersion
  setTimeout (->
    if myVersion is dbVersion
      console.log "Writing version " + myVersion
      writeFile "data.json", JSON.stringify(dataStore, null, 2)
    else
      console.log "My version = " + myVersion + " but latest is " + dbVersion
  ), 3000

app.all "/*", (req, res, next) ->
  res.header "Access-Control-Allow-Origin", "*"
  res.header "Access-Control-Allow-Headers", "X-Requested-With, Content-Type"
  res.header "Access-Control-Allow-Methods", "PUT, DELETE, OPTIONS"
  next()

app.get "/db/get/*", (req, res, next) ->
  result = dataStore
  path = req.params[0].split("/")
  result = result[d]  while (d = path.shift()) and result
  if req.query
    _.forEach [
      "Content-Type"
      "Cache-Control"
      "Expires"
    ], (h) ->
      res.header h, req.query[h]  if req.query[h]

    res.send 200, result
  else
    res.json result

app.get "/db/keys/*", (req, res, next) ->
  result = dataStore
  path = req.params[0].split("/")
  result = result[d]  while (d = path.shift()) and result
  res.json Object.keys(result)

app.get "/db/search/*", (req, res, next) ->
  result = []
  ptr1 = dataStore
  path = req.params[0].split("/")
  searchValue = path.pop()
  star = path.indexOf("*")
  assert star >= 0, "Search field should be an asterisk"
  j = 0

  while j < star
    ptr1 = ptr1[path[j]] or {}
    j++
  possibleKeys = Object.keys(ptr1)
  i = 0

  while i < possibleKeys.length
    ptr2 = ptr1[possibleKeys[i]] or {}
    j = star + 1
    while j < path.length
      ptr2 = ptr2[path[j]] or {}
      j++
    if ptr2 instanceof Array
      result.push possibleKeys[i]  if ptr2.indexOf(searchValue) >= 0
    else
      result.push possibleKeys[i]  if ptr2 is searchValue
    i++
  res.json result

app.post "/db/snapshot", (req, res, next) ->
  sd = starDate().canonical
  console.log "Snapshotting " + dbVersion + " at " + sd
  writeFile "data-" + sd + ".json", JSON.stringify(dataStore, null, 2)
  res.send 202

app.put "/db/set/*", (req, res, next) ->
  ptr = dataStore
  path = req.params[0].split("/")
  last = path.pop()
  while (d = path.shift())
    ptr[d] = {}  if typeof ptr[d] isnt "object"
    ptr = ptr[d]
  ptr[last] = req.body
  saveDataStore()
  res.send 202

app.put "/db/push/*", (req, res, next) ->
  ptr = dataStore
  path = req.params[0].split("/")
  last = path.pop()
  while (d = path.shift())
    ptr[d] = {}  if typeof ptr[d] isnt "object"
    ptr = ptr[d]
  ptr[last] = ptr[last] or []
  ptr[last].push req.body
  ptr[last] = _.uniq(ptr[last])  if req.query.unique
  saveDataStore()
  res.send 202

app.delete "/db/del/*", (req, res) ->
  ptr = dataStore
  path = req.params[0].split("/")
  last = path.pop()
  while d = path.shift()
    if typeof ptr[d] isnt "object"
      res.send 202
      return
    ptr = ptr[d]
  delete ptr[last]

app.listen 63446
console.log "Listening on port 63446"
