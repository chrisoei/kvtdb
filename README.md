
```bash
# Set a value:
curl -H 'Content-Type: application/json' -d\"23.239.7.23\" -XPUT http://localhost:63446/db/set/dns/blog.oei.io

# Get a value:
curl http://localhost:63446/db/get/dns/blog.oei.io

# Everything is stored as a single JSON tree, so we can
# also get the value of the parent node:
curl http://localhost:63446/db/get/dns
```

</code>
