/*
 * Copyright 2012, Mozilla Foundation and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var promise = require('../util/promise');

var gcli = require('../api').getApi();
var Canon = require('../commands/commands').Canon;
var Types = require('../types/types').Types;
var Requisition = require('../cli').Requisition;

var Remoter = require('./remoted').Remoter;
var Connection = require('./connectors').Connection;

gcli.types = new Types();
gcli.canon = new Canon({ types: gcli.types });

var items = [
  require('../types/delegate').items,
  require('../types/selection').items,

  require('../types/array').items,
  require('../types/boolean').items,
  require('../types/command').items,
  require('../types/date').items,
  require('../types/file').items,
  require('../types/javascript').items,
  require('../types/node').items,
  require('../types/number').items,
  require('../types/resource').items,
  require('../types/setting').items,
  require('../types/string').items,

  require('../cli').items,

  require('../commands/clear').items,
  require('../commands/connect').items,
  require('../commands/context').items,
  require('../commands/exec').items,
  require('../commands/global').items,
  require('../commands/help').items,
  require('../commands/intro').items,
  require('../commands/lang').items,
  require('../commands/mocks').items,
  require('../commands/preflist').items,
  require('../commands/pref').items,
  require('../commands/test').items,
  require('../commands/demo/alert').items,
  require('../commands/demo/echo').items,
  require('../commands/demo/sleep').items

].reduce(function(prev, curr) { return prev.concat(curr); }, []);

gcli.addItems(items);

var requisition = new Requisition({ types: gcli.types, canon: gcli.canon });

exports.items = [
  {
    // Communicate with a 'remote' server that isn't remote at all
    item: 'connector',
    name: 'direct',

    connect: function(url) {
      return promise.resolve(new DirectConnection());
    }
  }
];

/**
 * Direct connection is mostly for testing. Async is closer to what things like
 * websocket will actually give us, but sync gives us clearer stack traces.
 */
var asyncCall = false;

function DirectConnection() {
  this._emit = this._emit.bind(this);
  this.remoter = new Remoter(requisition);
  this.remoter.addListener(this._emit);
}

DirectConnection.prototype = Object.create(Connection.prototype);

DirectConnection.prototype.call = function(command, data) {
  var deferred = promise.defer();

  if (asyncCall) {
    setTimeout(function() {
      this._call(deferred, command, data);
    }, 1);
  }
  else {
    this._call(deferred, command, data);
  }

  return deferred.promise;
};

DirectConnection.prototype._call = function(deferred, command, data) {
  try {
    var func = this.remoter.exposed[command];
    var reply = func.call(this.remoter, data);
    deferred.resolve(reply);
  }
  catch (ex) {
    deferred.reject(ex);
  }
};

DirectConnection.prototype.disconnect = function() {
  this.remoter.removeListener(this._emit);
  delete this._emit;
};
