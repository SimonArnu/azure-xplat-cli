/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

var should = require('should');

var CLITest = require('../../../framework/arm-cli-test');
var testprefix = 'arm-cli-role-tests';

var requiredEnvironment = [
  'AZURE_AD_TEST_PRINCIPAL_NAME',
  'AZURE_AD_TEST_PRINCIPAL_ID'
];

function getTestPrincipalName() { return process.env.AZURE_AD_TEST_PRINCIPAL_NAME };
function getTestPrincipalId() { return process.env.AZURE_AD_TEST_PRINCIPAL_ID };

describe('arm', function () {
  describe('role', function () {
    var suite;
    var roleName = 'Operator';
    var subscriptionId = '358f3860-9dbe-4ace-b0c0-3d4f2d861014';

    before(function (done) {
      suite = new CLITest(testprefix, requiredEnvironment);
      suite.setupSuite(done);
    });

    after(function (done) {
      suite.teardownSuite(done);
    });

    beforeEach(function (done) {
      suite.setupTest(done);
    });

    afterEach(function (done) {
      suite.teardownTest(done);
    });

    describe('list all built-in roles', function () {
      it('should work', function (done) {
        suite.execute('role list --json', function (result) {
          result.exitStatus.should.equal(0);
          var roles = JSON.parse(result.text);
          roles.some(function (res) {
            return res.name === 'Operator';
          }).should.be.true;
          done();
        });
      });
    });

    describe('show a built-in role of Operator', function () {
      it('should work', function (done) {
        suite.execute('role show Operator --json', function (result) {
          result.exitStatus.should.equal(0);
          var roles = JSON.parse(result.text);
          roles.some(function (res) {
            return res.name === 'Operator';
          }).should.be.true;
          done();
        });
      });
    });

    describe('create role assignment using UPN and built-in Role of Operator and scope', function () {
      it('should work', function (done) {
        var scope = 'SDKXplatUnitTest';
        var principalId = getTestPrincipalId();//;'d4cabc17-0ae7-4855-8bec-89797db15fb0'; 
        var principal = getTestPrincipalName(); //;'admin@aad240.ccsctp.net';

        suite.execute('role assignment create -p %s -o %s -c %s --json', principal, roleName, scope, function (result) {
          result.exitStatus.should.equal(0);
          suite.execute('role assignment get -p %s -o %s -c %s --json', principal, roleName, scope, function (listAssignmentResult) {
            var assignments = JSON.parse(listAssignmentResult.text);
            assignments.some(function (res) {
              return (res.scope === scope && res.principalId === principalId);
            }).should.be.true;

            //clean up
            suite.execute('role assignment delete -p %s -o %s -c %s --json', principal, roleName, scope, function (result) {
              done();
            });
          });
        });
      });
    });

    describe('create role assignment using resource group as scope and use a role as principal', function () {
      it('should work', function (done) {
        var resourceGroup = 'rg1';
        var expectedScope = '/subscriptions/' + subscriptionId + '/resourcegroups/rg1';
        //The following 2 fields should have same values across all tenants
        var principalId = '729827e3-9c14-49f7-bb1b-9608f156bbb8';
        var principal = 'Helpdesk Administrator';

        suite.execute('role assignment create -p %s -o %s -g %s --json', principal, roleName, resourceGroup, function (result) {
          result.exitStatus.should.equal(0);
          suite.execute('role assignment get -p %s -o %s -g %s --json', principal, roleName, resourceGroup, function (listAssignmentResult) {
            var assignments = JSON.parse(listAssignmentResult.text);
            assignments.some(function (res) {
              return (res.scope === expectedScope && res.principalId === principalId);
            }).should.be.true;

            //clean up
            suite.execute('role assignment delete -p %s -o %s -g %s --json', principal, roleName, resourceGroup, function (result) {
              result.exitStatus.should.equal(0);
              done();
            });
          });
        });
      });
    });
  });
});