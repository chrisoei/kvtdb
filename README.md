
```bash
# Set a value:
curl -XPUT \
  -H'Content-Type: application/json' \
  -d\"23.239.7.23\" \
  http://localhost:63446/db/set/dns/blog.oei.io

# Get a value:
curl http://localhost:63446/db/get/dns/blog.oei.io

# Everything is stored as a single JSON tree, so we can
# also get the value of the parent node:
curl http://localhost:63446/db/get/dns

# We can also delete a node
curl -XDELETE http://localhost:63446/db/del/dns/blog.oei.io

# We can search for the key that contains a value
curl "http://localhost:63446/db/search/dns/*/23.239.7.23"

# To get a list of keys for a node
curl http://localhost:63446/db/keys/dns

# To save a snapshot of the database
curl -XPOST http://localhost:63446/db/snapshot

# We can also save UTF-8 data directly into the database:
curl -XPUT \
  -H'Content-Type: text/plain' \
  --data-binary @ember.debug.js \
  http://localhost:63446/db/set/ember.js

# We can also retrieve UTF-8 data and force the Content-Type,
# Cache-Control, and Expires headers
curl -v "http://localhost:63446/db/get/ember.js?Content-Type=application/javascript"

# In addition to map objects, we can also push items onto arrays.
# Setting unique=true pushes only if the item does not currently exist.
curl -XPUT \
  -H'Content-Type: text/plain' \
  -dbuild-essential \
  "http://localhost:63446/db/push/ubuntu/pkgs?unique=true"

```

</code>
