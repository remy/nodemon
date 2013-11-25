# Nodemon as a required module

Note that the way that nodemon is written, it is expected that nodemon is only
used once.

This is because nodemon has a single bus for communication. I'd welcome a
re-factor on this recent re-factor, so for now, it's a limitation. Sorry.