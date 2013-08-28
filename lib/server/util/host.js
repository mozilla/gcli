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

// Warning - gcli.js causes this version of host.js to be favored in NodeJS
// which means that it's also used in testing in NodeJS

var main = require('../../../gcli');
var promise = main.require('util/promise');

var childProcess = require('child_process');

var util = main.require('util/util');

var ATTR_NAME = '__gcli_border';
var HIGHLIGHT_STYLE = '1px dashed black';

function Highlighter(document) {
  this._document = document;
  this._nodes = util.createEmptyNodeList(this._document);
}

Object.defineProperty(Highlighter.prototype, 'nodelist', {
  set: function(nodes) {
    Array.prototype.forEach.call(this._nodes, this._unhighlightNode, this);
    this._nodes = (nodes == null) ?
        util.createEmptyNodeList(this._document) :
        nodes;
    Array.prototype.forEach.call(this._nodes, this._highlightNode, this);
  },
  get: function() {
    return this._nodes;
  },
  enumerable: true
});

Highlighter.prototype.destroy = function() {
  this.nodelist = null;
};

Highlighter.prototype._highlightNode = function(node) {
  if (node.hasAttribute(ATTR_NAME)) {
    return;
  }

  var styles = this._document.defaultView.getComputedStyle(node);
  node.setAttribute(ATTR_NAME, styles.border);
  node.style.border = HIGHLIGHT_STYLE;
};

Highlighter.prototype._unhighlightNode = function(node) {
  var previous = node.getAttribute(ATTR_NAME);
  node.style.border = previous;
  node.removeAttribute(ATTR_NAME);
};

exports.Highlighter = Highlighter;

/**
 * See docs in lib/util/host.js:exec
 */
exports.exec = function(execSpec) {
  var deferred = promise.defer();

  var output = { data: '' };
  var child = childProcess.spawn(execSpec.cmd, execSpec.args, {
    env: execSpec.env,
    cwd: execSpec.cwd
  });

  child.stdout.on('data', function(data) {
    output.data += data;
  });

  child.stderr.on('data', function(data) {
    output.data += data;
  });

  child.on('close', function(code) {
    output.code = code;
    if (code === 0) {
      deferred.resolve(output);
    }
    else {
      deferred.reject(output);
    }
  });

  return deferred.promise;
};
