'use strict';

var fs = require('fs'),
    os = require('os'),
    wrench = require('wrench'),
    path = require('path'),
    Promise = require('bluebird'),
    uuid = require('node-uuid'),
    JawsError = require('../lib/jaws-error'),
    utils = require('../lib/utils');

/**
 * Create test project
 * @param projectName
 * @param projectRegion
 * @param projectStage
 * @param projectLambdaIAMRole
 * @param projectApiGIAMRole
 * @param projectEnvBucket
 * @param npmInstallDirs list of dirs relative to project root to execute npm install on
 * @returns {string} full path to proj temp dir
 */

module.exports.createTestProject = function(projectName,
                                            projectRegion,
                                            projectStage,
                                            projectLambdaIAMRole,
                                            projectApiGIAMRole,
                                            projectRegionBucket,
                                            npmInstallDirs) {
  // Create Test Project
  var tmpProjectPath = path.join(os.tmpdir(), projectName + '-' + uuid.v4());

  utils.logIfVerbose('Creating test proj in ' + tmpProjectPath + '\n');

  if (fs.existsSync(tmpProjectPath)) {
    throw new JawsError('Temp dir ' + tmpProjectPath + ' already exists');
  }

  // Copy test project to temp directory
  fs.mkdirSync(tmpProjectPath);
  wrench.copyDirSyncRecursive(path.join(__dirname, './test-prj'), tmpProjectPath, {
    forceDelete: true,
  });

  // Add jaws.json project data
  var projectJSON = require(path.join(tmpProjectPath, 'jaws.json'));
  projectJSON.name = projectName;
  projectJSON.stages = {};
  projectJSON.stages[projectStage] = [{
    region: projectRegion,
    iamRoleArnLambda: projectLambdaIAMRole,
    iamRoleArnApiGateway: projectApiGIAMRole,
  },];
  projectJSON.jawsBuckets = {};
  projectJSON.jawsBuckets[projectRegion] = projectRegionBucket;
  fs.writeFileSync(path.join(tmpProjectPath, 'jaws.json'), JSON.stringify(projectJSON, null, 2));

  // Create admin.env file
  fs.writeFileSync(path.join(tmpProjectPath, 'admin.env'), 'ADMIN_AWS_PROFILE=' + process.env.TEST_JAWS_PROFILE);

  //Need to run npm install on the test project, they recommend NOT doing this programatically
  //https://github.com/npm/npm#using-npm-programmatically
  if (npmInstallDirs) {
    npmInstallDirs.forEach(function(dir) {
      var fullPath = path.join(tmpProjectPath, dir);
      utils.logIfVerbose('Running NPM install on ' + fullPath);
      utils.npmInstall(fullPath);
    });
  }

  return tmpProjectPath;
};
