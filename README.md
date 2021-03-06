# persist-size-snapshot

A lambda function that is triggered by an API gateway. The query parameter
`build-id` must point to a valid CircleCI build for `mui-org`.The build must not be a pull request.
The build must include a size-snapshot.json. The size-snapshot.json is uploaded
to a s3 bucket that includes branch and commit id of the snapshot. 

The goal is to be able to compare the bundle of two given commits. In our case
it is the snapshot created on a pull request (created in CI) and the snapshot
for the target branch (persisted on the s3 bucket). 

## use
```bash
# YOUR_AWS_PROFILE must be a valid profile name with access keys
# GITHUB_ORG is for testing purposes. Otherwise the tested build number might not be valid
# test
$ AWS_PROFILE=YOUR_AWS_PROFILE GITHUB_ORG=eps1lon yarn test
# pack a deploy package
$ AWS_PROFILE=YOUR_AWS_PROFILE GITHUB_ORG=eps1lon yarn rebuild
```

Be careful if you put this in a monorepo. The deploy package needs to include
all the required node_modules/. In a monorepo it is common to "hoist these away".

## TODO

- unfamiliar with
  - best practices for lambda functions in node (test, deploy)
  - testing practice to test fetch on a rest api and uploading to s3