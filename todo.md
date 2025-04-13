# things to do

- [x] API endpoints to replace the PG view I look at
- [x] Add endpoint to get total storage usage
- [x] add start/end time to checkpoints (or alternatively, a total duration)
  - [x] add stats endpoint for render
- [x] add vertex normals for triangles
- [x] add support for manually specifying triangle normals outside of a model file
- [ ] add a user auth scheme
  - [ ] GitHub OAuth
  - [ ] Self-generated auth tokens (JWTs)
  - [ ] add quota limits per-user for storage? maybe based on total bytes stores? or renders? or checkpoints? idk, think about it some more
- [ ] ability to do a "rolling delete" of checkpoints, e.g. "only save the most recent X checkpoints"
- [ ] maybe add a "deletion job" system, since deleting things takes FOREVER.
  - the idea is that you "request" a deletion and it happens in the background, and you can check in on it later.
- [ ] support for uploading images to reference in scenes
- [ ] gradient texture ???
- [ ] switch to PDF model (Ray Tracing: The Rest of your Life)