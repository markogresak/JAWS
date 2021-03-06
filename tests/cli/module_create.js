'use strict';

/**
 * JAWS Test: New Action Command
 */

var Jaws = require('../../lib/index.js'),
    CmdNewAction = require('../../lib/commands/module_create'),
    JawsError = require('../../lib/jaws-error'),
    testUtils = require('../test_utils'),
    Promise = require('bluebird'),
    path = require('path'),
    assert = require('chai').assert;

var config = require('../config'),
    projPath,
    JAWS;

describe('Test "new module" command', function() {

  before(function(done) {
    this.timeout(0);

    // Tag All Lambdas & Endpoints
    return Promise.try(function() {

      // Create Test Project
      projPath = testUtils.createTestProject(
          config.name,
          config.region,
          config.stage,
          config.iamRoleArnLambda,
          config.iamRoleArnApiGateway,
          config.regionBucket);
      process.chdir(path.join(projPath, 'back'));

      // Instantiate JAWS
      JAWS = new Jaws();
    }).then(done);
  });

  describe('Positive tests', function() {

    it('Test "new module" command', function(done) {
      this.timeout(0);

      var module = {
        type: 'both',
        name: 'users',
        action: 'list',
        runtime: 'nodejs'
      };

      CmdNewAction.run(JAWS, module)
          .then(function() {
            var jawsJson = require(path.join(process.cwd(), 'aws_modules/users/list/awsm.json'));
            assert.isTrue(typeof jawsJson.lambda.cloudFormation !== 'undefined');
            assert.isTrue(typeof jawsJson.apiGateway.cloudFormation !== 'undefined');
            assert.isTrue(jawsJson.apiGateway.cloudFormation.Path === 'users/list');
            done();
          })
          .catch(JawsError, function(e) {
            done(e);
          })
          .error(function(e) {
            done(e);
          });
    });
  });
});