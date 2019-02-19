/* eslint-disable no-console */
const aws = require('aws-sdk');
const fetch = require('node-fetch');

const s3 = new aws.S3();

async function loadJson(url) {
  const response = await fetch(url, {
    encoding: 'utf8',
    headers: { 'Content-Type': 'application/json' },
  });

  return response.json();
}

function getBuildUrl(options) {
  const { id, org = 'eps1lon' } = options;

  return `https://circleci.com/api/v1.1/project/github/${org}/material-ui/${id}`;
}

function getArtifactsUrl(options) {
  return `${getBuildUrl(options)}/artifacts`;
}

async function loadSnapshotArtifact(build) {
  const artifactsUrl = getArtifactsUrl(build);
  const artifacts = await loadJson(artifactsUrl);
  const snapshotArtifact = artifacts.find(artifact =>
    artifact.path.endsWith('material-ui/size-snapshot.json'),
  );

  if (snapshotArtifact == null) {
    throw new Error(
      `size-snapshot.json artifact not found. Only ${artifacts.map(
        ({ path }) => path,
      )} are available`,
    );
  }

  return loadJson(snapshotArtifact.url);
}

async function loadBuild(desiredBuild) {
  const buildUrl = getBuildUrl(desiredBuild);
  return loadJson(buildUrl);
}

function uploadArtifact(artifact, options) {
  return new Promise(async (resolve, reject) => {
    s3.upload(
      {
        ...options,
        Body: JSON.stringify(artifact, null, 2),
        ContentType: 'application/json',
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      },
    );
  });
}

async function handler(event) {
  const buildId = +event.queryStringParameters['build-id'];
  const desiredBuild = { id: buildId };

  let build;
  try {
    build = await loadBuild(desiredBuild);
  } catch (err) {
    return { statusCode: 404, body: err };
  }

  const {
    all_commit_details: [commitDetails],
  } = build;
  if (commitDetails.branch.startsWith('pull/')) {
    return {
      statusCode: 403,
      reason: 'size snapshots are only permitted for non-fork pushes',
    };
  }

  let snapshotArtifact;
  try {
    snapshotArtifact = await loadSnapshotArtifact(desiredBuild);
  } catch (err) {
    console.error(err);
    return {
      statusCode: 404,
      reason: err,
    };
  }

  try {
    const uploadOptions = {
      Bucket: 'eps1lon-material-ui',
      Key: `artifacts/${commitDetails.branch}/${commitDetails.commit}/size-snapshot.json`,
    };
    const uploaded = await uploadArtifact(snapshotArtifact, uploadOptions);

    return {
      statusCode: 200,
      body: uploaded.Location,
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
    };
  }
}

module.exports = { handler };
