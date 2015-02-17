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

var Inputter = require('./inputter').Inputter;
var Completer = require('./completer').Completer;
var Tooltip = require('./tooltip').Tooltip;
var FocusManager = require('../ui/focus').FocusManager;

var cli = require('../cli');
var nodetype = require('../types/node');
var resource = require('../types/resource');

/**
 * FFDisplay is responsible for generating the UI for GCLI, this implementation
 * is a special case for use inside Firefox
 * @param options A configuration object containing the following:
 * - requisition
 * - contentDocument
 * - chromeDocument
 * - hintElement
 * - inputElement
 * - completeElement
 * - backgroundElement
 */
function FFDisplay(system, options) {
  this.setContentDocument(options.contentDocument);

  this.requisition = options.requisition;
  this.onOutput = this.requisition.commandOutputManager.onOutput;

  this.focusManager = new FocusManager(options.chromeDocument, system.settings);
  this.onVisibilityChange = this.focusManager.onVisibilityChange;

  this.inputter = new Inputter({
    requisition: this.requisition,
    focusManager: this.focusManager,
    element: options.inputElement
  });

  this.completer = new Completer({
    requisition: this.requisition,
    inputter: this.inputter,
    backgroundElement: options.backgroundElement,
    element: options.completeElement
  });

  this.tooltip = new Tooltip({
    requisition: this.requisition,
    focusManager: this.focusManager,
    inputter: this.inputter,
    element: options.hintElement
  });

  this.inputter.tooltip = this.tooltip;
}

/**
 * Handy utility to inject the content document (i.e. for the viewed page,
 * not for chrome) into the various components.
 */
FFDisplay.prototype.setContentDocument = function(document) {
  if (document) {
    nodetype.setDocument(document);
    resource.setDocument(document);
  }
  else {
    resource.unsetDocument();
    nodetype.unsetDocument();
  }
};

/**
 * Avoid memory leaks
 */
FFDisplay.prototype.destroy = function() {
  this.tooltip.destroy();
  this.completer.destroy();
  this.inputter.destroy();
  this.focusManager.destroy();

  this.setContentDocument(null);

  // We could also delete the following objects if we have hard-to-track-down
  // memory leaks, as a belt-and-braces approach, however this prevents our
  // DOM node hunter script from looking in all the nooks and crannies, so it's
  // better if we can be leak-free without deleting them:
  // - tooltip, completer, inputter,
  // - focusManager, onVisibilityChange, requisition
};

exports.FFDisplay = FFDisplay;
