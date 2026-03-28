#!/usr/bin/env bun
// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = import.meta.require;

// node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.length > 3 && this._name.slice(-3) === "...") {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, helper.subcommandTerm(command).length);
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length);
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length);
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, helper.argumentTerm(argument).length);
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        return `${option.description} (${extraInfo.join(", ")})`;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescripton = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescripton}`;
        }
        return extraDescripton;
      }
      return argument.description;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth || 80;
      const itemIndentWidth = 2;
      const itemSeparatorWidth = 2;
      function formatItem(term, description) {
        if (description) {
          const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
          return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
        }
        return term;
      }
      function formatList(textArray) {
        return textArray.join(`
`).replace(/^/gm, " ".repeat(itemIndentWidth));
      }
      let output = [`Usage: ${helper.commandUsage(cmd)}`, ""];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.wrap(commandDescription, helpWidth, 0),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
      });
      if (argumentList.length > 0) {
        output = output.concat(["Arguments:", formatList(argumentList), ""]);
      }
      const optionList = helper.visibleOptions(cmd).map((option) => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option));
      });
      if (optionList.length > 0) {
        output = output.concat(["Options:", formatList(optionList), ""]);
      }
      if (this.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return formatItem(helper.optionTerm(option), helper.optionDescription(option));
        });
        if (globalOptionList.length > 0) {
          output = output.concat([
            "Global Options:",
            formatList(globalOptionList),
            ""
          ]);
        }
      }
      const commandList = helper.visibleCommands(cmd).map((cmd2) => {
        return formatItem(helper.subcommandTerm(cmd2), helper.subcommandDescription(cmd2));
      });
      if (commandList.length > 0) {
        output = output.concat(["Commands:", formatList(commandList), ""]);
      }
      return output.join(`
`);
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    wrap(str, width, indent, minColumnWidth = 40) {
      const indents = " \\f\\t\\v\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF";
      const manualIndent = new RegExp(`[\\n][${indents}]+`);
      if (str.match(manualIndent))
        return str;
      const columnWidth = width - indent;
      if (columnWidth < minColumnWidth)
        return str;
      const leadingStr = str.slice(0, indent);
      const columnText = str.slice(indent).replace(`\r
`, `
`);
      const indentString = " ".repeat(indent);
      const zeroWidthSpace = "\u200B";
      const breaks = `\\s${zeroWidthSpace}`;
      const regex = new RegExp(`
|.{1,${columnWidth - 1}}([${breaks}]|$)|[^${breaks}]+?([${breaks}]|$)`, "g");
      const lines = columnText.match(regex) || [];
      return leadingStr + lines.map((line, i) => {
        if (line === `
`)
          return "";
        return (i > 0 ? indentString : "") + line.trimEnd();
      }).join(`
`);
    }
  }
  exports.Help = Help;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      return camelcase(this.name().replace(/^no-/, ""));
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split("-").reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const flagParts = flags.split(/[ |,]+/);
    if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1]))
      shortFlag = flagParts.shift();
    longFlag = flagParts.shift();
    if (!shortFlag && /^-[^-]$/.test(longFlag)) {
      shortFlag = longFlag;
      longFlag = undefined;
    }
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return "";
  }
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require("events").EventEmitter;
  var childProcess = __require("child_process");
  var path = __require("path");
  var fs = __require("fs");
  var process2 = __require("process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = true;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        outputError: (str, write) => write(str)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      Object.assign(this._outputConfiguration, configuration);
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, fn, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof fn === "function") {
        argument.default(defaultValue).argParser(fn);
      } else {
        argument.default(fn);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument && previousArgument.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        return this;
      }
      enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {}
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._concatValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch (err) {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
          const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
          throw new Error(executableMissing);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise && promise.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent && this.parent.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(argv) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      const args = argv.slice();
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      let activeVariadicOption = null;
      while (args.length) {
        const arg = args.shift();
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args);
          break;
        }
        if (activeVariadicOption && !maybeOption(arg)) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args.shift();
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (args.length > 0 && !maybeOption(args[0])) {
                value = args.shift();
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              args.unshift(`-${arg.slice(2)}`);
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (maybeOption(arg)) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg);
            if (args.length > 0)
              operands.push(...args);
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg);
          if (args.length > 0)
            dest.push(...args);
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str, flags, description) {
      if (str === undefined)
        return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, "commander.version", str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined)
        return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined)
        return this._name;
      this._name = str;
      return this;
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      if (helper.helpWidth === undefined) {
        helper.helpWidth = contextOptions && contextOptions.error ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
      }
      return helper.formatHelp(this, helper);
    }
    _getHelpContext(contextOptions) {
      contextOptions = contextOptions || {};
      const context = { error: !!contextOptions.error };
      let write;
      if (context.error) {
        write = (arg) => this._outputConfiguration.writeErr(arg);
      } else {
        write = (arg) => this._outputConfiguration.writeOut(arg);
      }
      context.write = contextOptions.write || write;
      context.command = this;
      return context;
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const context = this._getHelpContext(contextOptions);
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", context));
      this.emit("beforeHelp", context);
      let helpInformation = this.helpInformation(context);
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      context.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", context);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", context));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          this._helpOption = this._helpOption ?? undefined;
        } else {
          this._helpOption = null;
        }
        return this;
      }
      flags = flags ?? "-h, --help";
      description = description ?? "display help for command";
      this._helpOption = this.createOption(flags, description);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = process2.exitCode || 0;
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  exports.Command = Command;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// src/parser/feature-discovery.ts
import { readdir, stat } from "fs/promises";
import { join, extname } from "path";

class FeatureDiscovery {
  async discover(featuresPath) {
    const featureFiles = [];
    try {
      const stats = await stat(featuresPath);
      if (stats.isFile()) {
        return extname(featuresPath) === ".feature" ? [featuresPath] : [];
      }
      const entries = await readdir(featuresPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(featuresPath, entry.name);
        if (entry.isDirectory()) {
          featureFiles.push(...await this.discover(fullPath));
        } else if (entry.isFile() && extname(entry.name) === ".feature") {
          featureFiles.push(fullPath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to read features directory: ${featuresPath}`);
    }
    return featureFiles;
  }
}
var init_feature_discovery = () => {};

// src/parser/data-table-parser.ts
var exports_data_table_parser = {};
__export(exports_data_table_parser, {
  DataTableParser: () => DataTableParser
});
import { readFile, stat as stat2 } from "fs/promises";
import { dirname, join as join2, resolve, extname as extname2 } from "path";

class DataTableParser {
  static async parseCsvFile(filePath, featureFilePath) {
    const baseDir = dirname(featureFilePath);
    const fullPath = join2(baseDir, filePath);
    try {
      const content = await readFile(fullPath, "utf-8");
      return DataTableParser.parseCsvContent(content);
    } catch (error) {
      throw new Error(`Failed to read CSV file '${filePath}': ${error instanceof Error ? error.message : error}`);
    }
  }
  static parseCsvContent(content) {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ";" : ",";
    const headers = DataTableParser.parseCsvLine(lines[0], delimiter);
    const rows = [];
    for (let i = 1;i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        rows.push(DataTableParser.parseCsvLine(line, delimiter));
      }
    }
    return { headers, rows };
  }
  static parseCsvLine(line, delimiter) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0;i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
  static async parseDataFile(filePath, featureFilePath) {
    const data = await DataTableParser.read(filePath, featureFilePath);
    if (Array.isArray(data)) {
      if (data.length === 0)
        return { headers: [], rows: [] };
      const headers = Object.keys(data[0]);
      const rows = data.map((obj) => headers.map((h) => String(obj[h] ?? "")));
      return { headers, rows };
    } else if (data && typeof data === "object" && "headers" in data && "rows" in data) {
      return data;
    }
    throw new Error(`Unsupported data file format for '${filePath}'. Expected JSON array or CSV.`);
  }
  static async read(filePath, featureFilePath) {
    const baseDir = featureFilePath ? dirname(featureFilePath) : process.cwd();
    const fullPath = resolve(baseDir, filePath);
    try {
      const stats = await stat2(fullPath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${fullPath}`);
      }
      const content = await readFile(fullPath, "utf-8");
      const ext = extname2(filePath).toLowerCase();
      if (ext === ".json") {
        return JSON.parse(content);
      } else if (ext === ".csv") {
        return DataTableParser.parseCsvContent(content);
      } else if (ext === ".yml" || ext === ".yaml") {
        return content;
      }
      return content;
    } catch (error) {
      throw new Error(`Failed to read file '${filePath}': ${error instanceof Error ? error.message : error}`);
    }
  }
}
var init_data_table_parser = () => {};

// src/parser/scenario-mapper.ts
class ScenarioMapper {
  convertStep(step) {
    const keyword = this.mapKeyword(step.keyword);
    const result = {
      keyword,
      text: step.text,
      line: step.location?.line || 0
    };
    if (step.docString) {
      result.docString = step.docString.content;
      if (step.docString.mediaType) {
        result.docStringContentType = step.docString.mediaType;
      } else if (step.docString.content?.trim().startsWith("{") || step.docString.content?.trim().startsWith("[")) {
        try {
          JSON.parse(step.docString.content.trim());
          result.docStringContentType = "application/json";
        } catch {}
      } else if (step.docString.content?.trim().startsWith("<")) {
        result.docStringContentType = "application/xml";
      }
    }
    if (step.dataTable)
      result.dataTable = this.convertDataTable(step.dataTable);
    return result;
  }
  convertDataTable(table) {
    const headers = table.rows?.[0]?.cells?.map((c) => c.value) || [];
    const rows = table.rows?.slice(1).map((row) => row.cells.map((c) => c.value)) || [];
    return { headers, rows };
  }
  async convertScenario(scenario, isOutline, filePath) {
    const result = {
      name: scenario.name,
      steps: scenario.steps.map((s) => this.convertStep(s)),
      tags: scenario.tags?.map((t) => t.name.replace(/^@/, "")) || [],
      outline: isOutline
    };
    if (isOutline && scenario.examples?.length > 0) {
      result.examples = [];
      for (const ex of scenario.examples) {
        const exampleName = ex.name || "Examples";
        const fileMatch = exampleName.match(/^@file\((.+)\)$/);
        if (fileMatch) {
          const dataFilePath = fileMatch[1].trim();
          result.examples.push({
            name: `Examples from ${dataFilePath}`,
            table: await DataTableParser.parseDataFile(dataFilePath, filePath)
          });
        } else {
          result.examples.push({
            name: exampleName,
            table: {
              headers: ex.tableHeader?.cells?.map((c) => c.value) || [],
              rows: ex.tableBody?.map((row) => row.cells.map((c) => c.value)) || []
            }
          });
        }
      }
    }
    return result;
  }
  convertRule(rule, filePath) {
    const scenarios = [];
    for (const child of rule.children || []) {
      if (child.scenario) {
        scenarios.push(this.convertScenarioSync(child.scenario, child.scenario.keyword === "Scenario Outline", filePath));
      }
    }
    return {
      name: rule.name,
      description: rule.description,
      scenarios,
      tags: rule.tags?.map((t) => t.name.replace(/^@/, "")) || []
    };
  }
  convertScenarioSync(scenario, isOutline, filePath) {
    const result = {
      name: scenario.name,
      steps: scenario.steps.map((s) => this.convertStep(s)),
      tags: scenario.tags?.map((t) => t.name.replace(/^@/, "")) || [],
      outline: isOutline
    };
    if (isOutline && scenario.examples?.length > 0) {
      result.examples = scenario.examples.map((ex) => ({
        name: ex.name || "Examples",
        table: {
          headers: ex.tableHeader?.cells?.map((c) => c.value) || [],
          rows: ex.tableBody?.map((row) => row.cells.map((c) => c.value)) || []
        }
      }));
    }
    return result;
  }
  mapKeyword(keyword) {
    const kw = keyword.trim().charAt(0).toUpperCase() + keyword.trim().slice(1).toLowerCase();
    const allowed = ["Given", "When", "Then", "And", "But"];
    return allowed.includes(kw) ? kw : "Given";
  }
}
var init_scenario_mapper = __esm(() => {
  init_data_table_parser();
});

// node_modules/@cucumber/gherkin/dist/src/Errors.js
var require_Errors = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NoSuchLanguageException = exports.AstBuilderException = exports.CompositeParserException = exports.ParserException = exports.GherkinException = undefined;

  class GherkinException extends Error {
    constructor(message) {
      super(message);
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(this, actualProto);
      } else {
        this.__proto__ = actualProto;
      }
    }
    static _create(message, location) {
      const column = location != null ? location.column || 0 : -1;
      const line = location != null ? location.line || 0 : -1;
      const m = `(${line}:${column}): ${message}`;
      const err = new this(m);
      err.location = location;
      return err;
    }
  }
  exports.GherkinException = GherkinException;

  class ParserException extends GherkinException {
    static create(message, line, column) {
      const err = new this(`(${line}:${column}): ${message}`);
      err.location = { line, column };
      return err;
    }
  }
  exports.ParserException = ParserException;

  class CompositeParserException extends GherkinException {
    static create(errors) {
      const message = `Parser errors:
` + errors.map((e) => e.message).join(`
`);
      const err = new this(message);
      err.errors = errors;
      return err;
    }
  }
  exports.CompositeParserException = CompositeParserException;

  class AstBuilderException extends GherkinException {
    static create(message, location) {
      return this._create(message, location);
    }
  }
  exports.AstBuilderException = AstBuilderException;

  class NoSuchLanguageException extends GherkinException {
    static create(language, location) {
      const message = "Language not supported: " + language;
      return this._create(message, location);
    }
  }
  exports.NoSuchLanguageException = NoSuchLanguageException;
});

// node_modules/@cucumber/gherkin/dist/src/TokenExceptions.js
var require_TokenExceptions = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.UnexpectedEOFException = exports.UnexpectedTokenException = undefined;
  var Errors_1 = require_Errors();

  class UnexpectedTokenException extends Errors_1.GherkinException {
    static create(token, expectedTokenTypes) {
      const message = `expected: ${expectedTokenTypes.join(", ")}, got '${token.getTokenValue().trim()}'`;
      const location = tokenLocation(token);
      return this._create(message, location);
    }
  }
  exports.UnexpectedTokenException = UnexpectedTokenException;

  class UnexpectedEOFException extends Errors_1.GherkinException {
    static create(token, expectedTokenTypes) {
      const message = `unexpected end of file, expected: ${expectedTokenTypes.join(", ")}`;
      const location = tokenLocation(token);
      return this._create(message, location);
    }
  }
  exports.UnexpectedEOFException = UnexpectedEOFException;
  function tokenLocation(token) {
    return token.location && token.location.line && token.line && token.line.indent !== undefined ? {
      line: token.location.line,
      column: token.line.indent + 1
    } : token.location;
  }
});

// node_modules/@cucumber/gherkin/dist/src/TokenScanner.js
var require_TokenScanner = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });

  class TokenScanner {
    constructor(source, makeToken) {
      this.makeToken = makeToken;
      this.lineNumber = 0;
      this.lines = source.split(/\r?\n/);
      if (this.lines.length > 0 && this.lines[this.lines.length - 1].trim() === "") {
        this.lines.pop();
      }
    }
    read() {
      const line = this.lines[this.lineNumber++];
      const location = {
        line: this.lineNumber
      };
      return this.makeToken(line, location);
    }
  }
  exports.default = TokenScanner;
});

// node_modules/@cucumber/gherkin/dist/src/countSymbols.js
var require_countSymbols = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  function countSymbols(s) {
    return s.replace(regexAstralSymbols, "_").length;
  }
  exports.default = countSymbols;
});

// node_modules/@cucumber/gherkin/dist/src/GherkinLine.js
var require_GherkinLine = __commonJS((exports, module) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var countSymbols_1 = __importDefault(require_countSymbols());

  class GherkinLine {
    constructor(lineText, lineNumber) {
      this.lineText = lineText;
      this.lineNumber = lineNumber;
      this.trimmedLineText = lineText.replace(/^\s+/g, "");
      this.isEmpty = this.trimmedLineText.length === 0;
      this.indent = (0, countSymbols_1.default)(lineText) - (0, countSymbols_1.default)(this.trimmedLineText);
    }
    startsWith(prefix) {
      return this.trimmedLineText.indexOf(prefix) === 0;
    }
    startsWithTitleKeyword(keyword) {
      return this.startsWith(keyword + ":");
    }
    match(regexp) {
      return this.trimmedLineText.match(regexp);
    }
    getLineText(indentToRemove) {
      if (indentToRemove < 0 || indentToRemove > this.indent) {
        return this.trimmedLineText;
      } else {
        return this.lineText.substring(indentToRemove);
      }
    }
    getRestTrimmed(length) {
      return this.trimmedLineText.substring(length).trim();
    }
    getTableCells() {
      const cells = [];
      let col = 0;
      let startCol = col + 1;
      let cell = "";
      let firstCell = true;
      while (col < this.trimmedLineText.length) {
        let chr = this.trimmedLineText[col];
        col++;
        if (chr === "|") {
          if (firstCell) {
            firstCell = false;
          } else {
            const trimmedLeft = cell.replace(/^[ \t\v\f\r\u0085\u00A0]*/g, "");
            const trimmed = trimmedLeft.replace(/[ \t\v\f\r\u0085\u00A0]*$/g, "");
            const cellIndent = cell.length - trimmedLeft.length;
            const span = {
              column: this.indent + startCol + cellIndent,
              text: trimmed
            };
            cells.push(span);
          }
          cell = "";
          startCol = col + 1;
        } else if (chr === "\\") {
          chr = this.trimmedLineText[col];
          col += 1;
          if (chr === "n") {
            cell += `
`;
          } else {
            if (chr !== "|" && chr !== "\\") {
              cell += "\\";
            }
            cell += chr;
          }
        } else {
          cell += chr;
        }
      }
      return cells;
    }
  }
  exports.default = GherkinLine;
  module.exports = GherkinLine;
});

// node_modules/@cucumber/gherkin/dist/src/Parser.js
var require_Parser = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RuleType = exports.TokenType = exports.Token = undefined;
  var Errors_1 = require_Errors();
  var TokenExceptions_1 = require_TokenExceptions();
  var TokenScanner_1 = __importDefault(require_TokenScanner());
  var GherkinLine_1 = __importDefault(require_GherkinLine());

  class Token {
    constructor(line, location) {
      this.line = line;
      this.location = location;
      this.isEof = !line;
    }
    getTokenValue() {
      return this.isEof ? "EOF" : this.line.getLineText(-1);
    }
    detach() {}
  }
  exports.Token = Token;
  var TokenType;
  (function(TokenType2) {
    TokenType2[TokenType2["None"] = 0] = "None";
    TokenType2[TokenType2["EOF"] = 1] = "EOF";
    TokenType2[TokenType2["Empty"] = 2] = "Empty";
    TokenType2[TokenType2["Comment"] = 3] = "Comment";
    TokenType2[TokenType2["TagLine"] = 4] = "TagLine";
    TokenType2[TokenType2["FeatureLine"] = 5] = "FeatureLine";
    TokenType2[TokenType2["RuleLine"] = 6] = "RuleLine";
    TokenType2[TokenType2["BackgroundLine"] = 7] = "BackgroundLine";
    TokenType2[TokenType2["ScenarioLine"] = 8] = "ScenarioLine";
    TokenType2[TokenType2["ExamplesLine"] = 9] = "ExamplesLine";
    TokenType2[TokenType2["StepLine"] = 10] = "StepLine";
    TokenType2[TokenType2["DocStringSeparator"] = 11] = "DocStringSeparator";
    TokenType2[TokenType2["TableRow"] = 12] = "TableRow";
    TokenType2[TokenType2["Language"] = 13] = "Language";
    TokenType2[TokenType2["Other"] = 14] = "Other";
  })(TokenType || (exports.TokenType = TokenType = {}));
  var RuleType;
  (function(RuleType2) {
    RuleType2[RuleType2["None"] = 0] = "None";
    RuleType2[RuleType2["_EOF"] = 1] = "_EOF";
    RuleType2[RuleType2["_Empty"] = 2] = "_Empty";
    RuleType2[RuleType2["_Comment"] = 3] = "_Comment";
    RuleType2[RuleType2["_TagLine"] = 4] = "_TagLine";
    RuleType2[RuleType2["_FeatureLine"] = 5] = "_FeatureLine";
    RuleType2[RuleType2["_RuleLine"] = 6] = "_RuleLine";
    RuleType2[RuleType2["_BackgroundLine"] = 7] = "_BackgroundLine";
    RuleType2[RuleType2["_ScenarioLine"] = 8] = "_ScenarioLine";
    RuleType2[RuleType2["_ExamplesLine"] = 9] = "_ExamplesLine";
    RuleType2[RuleType2["_StepLine"] = 10] = "_StepLine";
    RuleType2[RuleType2["_DocStringSeparator"] = 11] = "_DocStringSeparator";
    RuleType2[RuleType2["_TableRow"] = 12] = "_TableRow";
    RuleType2[RuleType2["_Language"] = 13] = "_Language";
    RuleType2[RuleType2["_Other"] = 14] = "_Other";
    RuleType2[RuleType2["GherkinDocument"] = 15] = "GherkinDocument";
    RuleType2[RuleType2["Feature"] = 16] = "Feature";
    RuleType2[RuleType2["FeatureHeader"] = 17] = "FeatureHeader";
    RuleType2[RuleType2["Rule"] = 18] = "Rule";
    RuleType2[RuleType2["RuleHeader"] = 19] = "RuleHeader";
    RuleType2[RuleType2["Background"] = 20] = "Background";
    RuleType2[RuleType2["ScenarioDefinition"] = 21] = "ScenarioDefinition";
    RuleType2[RuleType2["Scenario"] = 22] = "Scenario";
    RuleType2[RuleType2["ExamplesDefinition"] = 23] = "ExamplesDefinition";
    RuleType2[RuleType2["Examples"] = 24] = "Examples";
    RuleType2[RuleType2["ExamplesTable"] = 25] = "ExamplesTable";
    RuleType2[RuleType2["Step"] = 26] = "Step";
    RuleType2[RuleType2["StepArg"] = 27] = "StepArg";
    RuleType2[RuleType2["DataTable"] = 28] = "DataTable";
    RuleType2[RuleType2["DocString"] = 29] = "DocString";
    RuleType2[RuleType2["Tags"] = 30] = "Tags";
    RuleType2[RuleType2["DescriptionHelper"] = 31] = "DescriptionHelper";
    RuleType2[RuleType2["Description"] = 32] = "Description";
  })(RuleType || (exports.RuleType = RuleType = {}));

  class Parser {
    constructor(builder, tokenMatcher) {
      this.builder = builder;
      this.tokenMatcher = tokenMatcher;
      this.stopAtFirstError = false;
    }
    parse(gherkinSource) {
      const tokenScanner = new TokenScanner_1.default(gherkinSource, (line, location) => {
        const gherkinLine = line === null || line === undefined ? null : new GherkinLine_1.default(line, location.line);
        return new Token(gherkinLine, location);
      });
      this.builder.reset();
      this.tokenMatcher.reset();
      this.context = {
        tokenScanner,
        tokenQueue: [],
        errors: []
      };
      this.startRule(this.context, RuleType.GherkinDocument);
      let state = 0;
      let token = null;
      while (true) {
        token = this.readToken(this.context);
        state = this.matchToken(state, token, this.context);
        if (token.isEof)
          break;
      }
      this.endRule(this.context);
      if (this.context.errors.length > 0) {
        throw Errors_1.CompositeParserException.create(this.context.errors);
      }
      return this.getResult();
    }
    addError(context, error) {
      if (!context.errors.map((e) => {
        return e.message;
      }).includes(error.message)) {
        context.errors.push(error);
        if (context.errors.length > 10)
          throw Errors_1.CompositeParserException.create(context.errors);
      }
    }
    startRule(context, ruleType) {
      this.handleAstError(context, () => this.builder.startRule(ruleType));
    }
    endRule(context) {
      this.handleAstError(context, () => this.builder.endRule());
    }
    build(context, token) {
      this.handleAstError(context, () => this.builder.build(token));
    }
    getResult() {
      return this.builder.getResult();
    }
    handleAstError(context, action) {
      this.handleExternalError(context, true, action);
    }
    handleExternalError(context, defaultValue, action) {
      if (this.stopAtFirstError)
        return action();
      try {
        return action();
      } catch (e) {
        if (e instanceof Errors_1.CompositeParserException) {
          e.errors.forEach((error) => this.addError(context, error));
        } else if (e instanceof Errors_1.ParserException || e instanceof Errors_1.AstBuilderException || e instanceof TokenExceptions_1.UnexpectedTokenException || e instanceof Errors_1.NoSuchLanguageException) {
          this.addError(context, e);
        } else {
          throw e;
        }
      }
      return defaultValue;
    }
    readToken(context) {
      return context.tokenQueue.length > 0 ? context.tokenQueue.shift() : context.tokenScanner.read();
    }
    matchToken(state, token, context) {
      switch (state) {
        case 0:
          return this.matchTokenAt_0(token, context);
        case 1:
          return this.matchTokenAt_1(token, context);
        case 2:
          return this.matchTokenAt_2(token, context);
        case 3:
          return this.matchTokenAt_3(token, context);
        case 4:
          return this.matchTokenAt_4(token, context);
        case 5:
          return this.matchTokenAt_5(token, context);
        case 6:
          return this.matchTokenAt_6(token, context);
        case 7:
          return this.matchTokenAt_7(token, context);
        case 8:
          return this.matchTokenAt_8(token, context);
        case 9:
          return this.matchTokenAt_9(token, context);
        case 10:
          return this.matchTokenAt_10(token, context);
        case 11:
          return this.matchTokenAt_11(token, context);
        case 12:
          return this.matchTokenAt_12(token, context);
        case 13:
          return this.matchTokenAt_13(token, context);
        case 14:
          return this.matchTokenAt_14(token, context);
        case 15:
          return this.matchTokenAt_15(token, context);
        case 16:
          return this.matchTokenAt_16(token, context);
        case 17:
          return this.matchTokenAt_17(token, context);
        case 18:
          return this.matchTokenAt_18(token, context);
        case 19:
          return this.matchTokenAt_19(token, context);
        case 20:
          return this.matchTokenAt_20(token, context);
        case 21:
          return this.matchTokenAt_21(token, context);
        case 22:
          return this.matchTokenAt_22(token, context);
        case 23:
          return this.matchTokenAt_23(token, context);
        case 24:
          return this.matchTokenAt_24(token, context);
        case 25:
          return this.matchTokenAt_25(token, context);
        case 26:
          return this.matchTokenAt_26(token, context);
        case 27:
          return this.matchTokenAt_27(token, context);
        case 28:
          return this.matchTokenAt_28(token, context);
        case 29:
          return this.matchTokenAt_29(token, context);
        case 30:
          return this.matchTokenAt_30(token, context);
        case 31:
          return this.matchTokenAt_31(token, context);
        case 32:
          return this.matchTokenAt_32(token, context);
        case 33:
          return this.matchTokenAt_33(token, context);
        case 34:
          return this.matchTokenAt_34(token, context);
        case 35:
          return this.matchTokenAt_35(token, context);
        case 36:
          return this.matchTokenAt_36(token, context);
        case 37:
          return this.matchTokenAt_37(token, context);
        case 38:
          return this.matchTokenAt_38(token, context);
        case 39:
          return this.matchTokenAt_39(token, context);
        case 40:
          return this.matchTokenAt_40(token, context);
        case 41:
          return this.matchTokenAt_41(token, context);
        case 43:
          return this.matchTokenAt_43(token, context);
        case 44:
          return this.matchTokenAt_44(token, context);
        case 45:
          return this.matchTokenAt_45(token, context);
        case 46:
          return this.matchTokenAt_46(token, context);
        case 47:
          return this.matchTokenAt_47(token, context);
        case 48:
          return this.matchTokenAt_48(token, context);
        case 49:
          return this.matchTokenAt_49(token, context);
        case 50:
          return this.matchTokenAt_50(token, context);
        default:
          throw new Error("Unknown state: " + state);
      }
    }
    matchTokenAt_0(token, context) {
      if (this.match_EOF(context, token)) {
        this.build(context, token);
        return 42;
      }
      if (this.match_Language(context, token)) {
        this.startRule(context, RuleType.Feature);
        this.startRule(context, RuleType.FeatureHeader);
        this.build(context, token);
        return 1;
      }
      if (this.match_TagLine(context, token)) {
        this.startRule(context, RuleType.Feature);
        this.startRule(context, RuleType.FeatureHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 2;
      }
      if (this.match_FeatureLine(context, token)) {
        this.startRule(context, RuleType.Feature);
        this.startRule(context, RuleType.FeatureHeader);
        this.build(context, token);
        return 3;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 0;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 0;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Language", "#TagLine", "#FeatureLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 0;
    }
    matchTokenAt_1(token, context) {
      if (this.match_TagLine(context, token)) {
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 2;
      }
      if (this.match_FeatureLine(context, token)) {
        this.build(context, token);
        return 3;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 1;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 1;
      }
      token.detach();
      const expectedTokens = ["#TagLine", "#FeatureLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 1;
    }
    matchTokenAt_2(token, context) {
      if (this.match_TagLine(context, token)) {
        this.build(context, token);
        return 2;
      }
      if (this.match_FeatureLine(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 3;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 2;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 2;
      }
      token.detach();
      const expectedTokens = ["#TagLine", "#FeatureLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 2;
    }
    matchTokenAt_3(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 3;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 5;
      }
      if (this.match_BackgroundLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Background);
        this.build(context, token);
        return 6;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.startRule(context, RuleType.Description);
        this.build(context, token);
        return 4;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Empty", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 3;
    }
    matchTokenAt_4(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 5;
      }
      if (this.match_BackgroundLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Background);
        this.build(context, token);
        return 6;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 4;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 4;
    }
    matchTokenAt_5(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 5;
      }
      if (this.match_BackgroundLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Background);
        this.build(context, token);
        return 6;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 5;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 5;
    }
    matchTokenAt_6(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 6;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 8;
      }
      if (this.match_StepLine(context, token)) {
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 9;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.startRule(context, RuleType.Description);
        this.build(context, token);
        return 7;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Empty", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 6;
    }
    matchTokenAt_7(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 8;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 9;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 7;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 7;
    }
    matchTokenAt_8(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 8;
      }
      if (this.match_StepLine(context, token)) {
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 9;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 8;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 8;
    }
    matchTokenAt_9(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.startRule(context, RuleType.DataTable);
        this.build(context, token);
        return 10;
      }
      if (this.match_DocStringSeparator(context, token)) {
        this.startRule(context, RuleType.DocString);
        this.build(context, token);
        return 49;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 9;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 9;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 9;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#DocStringSeparator", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 9;
    }
    matchTokenAt_10(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.build(context, token);
        return 10;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 9;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 10;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 10;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 10;
    }
    matchTokenAt_11(token, context) {
      if (this.match_TagLine(context, token)) {
        this.build(context, token);
        return 11;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 11;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 11;
      }
      token.detach();
      const expectedTokens = ["#TagLine", "#ScenarioLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 11;
    }
    matchTokenAt_12(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 12;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 14;
      }
      if (this.match_StepLine(context, token)) {
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 15;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.startRule(context, RuleType.Description);
        this.build(context, token);
        return 13;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Empty", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 12;
    }
    matchTokenAt_13(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 14;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 15;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 13;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 13;
    }
    matchTokenAt_14(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 14;
      }
      if (this.match_StepLine(context, token)) {
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 15;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 14;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 14;
    }
    matchTokenAt_15(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.startRule(context, RuleType.DataTable);
        this.build(context, token);
        return 16;
      }
      if (this.match_DocStringSeparator(context, token)) {
        this.startRule(context, RuleType.DocString);
        this.build(context, token);
        return 47;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 15;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 15;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 15;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#DocStringSeparator", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 15;
    }
    matchTokenAt_16(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.build(context, token);
        return 16;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 15;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 16;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 16;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 16;
    }
    matchTokenAt_17(token, context) {
      if (this.match_TagLine(context, token)) {
        this.build(context, token);
        return 17;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 17;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 17;
      }
      token.detach();
      const expectedTokens = ["#TagLine", "#ExamplesLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 17;
    }
    matchTokenAt_18(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 18;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 20;
      }
      if (this.match_TableRow(context, token)) {
        this.startRule(context, RuleType.ExamplesTable);
        this.build(context, token);
        return 21;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.startRule(context, RuleType.Description);
        this.build(context, token);
        return 19;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Empty", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 18;
    }
    matchTokenAt_19(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 20;
      }
      if (this.match_TableRow(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesTable);
        this.build(context, token);
        return 21;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 19;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 19;
    }
    matchTokenAt_20(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 20;
      }
      if (this.match_TableRow(context, token)) {
        this.startRule(context, RuleType.ExamplesTable);
        this.build(context, token);
        return 21;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 20;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 20;
    }
    matchTokenAt_21(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.build(context, token);
        return 21;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 21;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 21;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 21;
    }
    matchTokenAt_22(token, context) {
      if (this.match_TagLine(context, token)) {
        this.build(context, token);
        return 22;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 22;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 22;
      }
      token.detach();
      const expectedTokens = ["#TagLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 22;
    }
    matchTokenAt_23(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 25;
      }
      if (this.match_BackgroundLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Background);
        this.build(context, token);
        return 26;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.startRule(context, RuleType.Description);
        this.build(context, token);
        return 24;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Empty", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 23;
    }
    matchTokenAt_24(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 25;
      }
      if (this.match_BackgroundLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Background);
        this.build(context, token);
        return 26;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 24;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 24;
    }
    matchTokenAt_25(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 25;
      }
      if (this.match_BackgroundLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Background);
        this.build(context, token);
        return 26;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 25;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#BackgroundLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 25;
    }
    matchTokenAt_26(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 26;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 28;
      }
      if (this.match_StepLine(context, token)) {
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 29;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.startRule(context, RuleType.Description);
        this.build(context, token);
        return 27;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Empty", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 26;
    }
    matchTokenAt_27(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 28;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 29;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 27;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 27;
    }
    matchTokenAt_28(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 28;
      }
      if (this.match_StepLine(context, token)) {
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 29;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 28;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 28;
    }
    matchTokenAt_29(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.startRule(context, RuleType.DataTable);
        this.build(context, token);
        return 30;
      }
      if (this.match_DocStringSeparator(context, token)) {
        this.startRule(context, RuleType.DocString);
        this.build(context, token);
        return 45;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 29;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 29;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 29;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#DocStringSeparator", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 29;
    }
    matchTokenAt_30(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.build(context, token);
        return 30;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 29;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 30;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 30;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 30;
    }
    matchTokenAt_31(token, context) {
      if (this.match_TagLine(context, token)) {
        this.build(context, token);
        return 31;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 31;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 31;
      }
      token.detach();
      const expectedTokens = ["#TagLine", "#ScenarioLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 31;
    }
    matchTokenAt_32(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 32;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 34;
      }
      if (this.match_StepLine(context, token)) {
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 35;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.startRule(context, RuleType.Description);
        this.build(context, token);
        return 33;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Empty", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 32;
    }
    matchTokenAt_33(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 34;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 35;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 33;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 33;
    }
    matchTokenAt_34(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 34;
      }
      if (this.match_StepLine(context, token)) {
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 35;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 34;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 34;
    }
    matchTokenAt_35(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.startRule(context, RuleType.DataTable);
        this.build(context, token);
        return 36;
      }
      if (this.match_DocStringSeparator(context, token)) {
        this.startRule(context, RuleType.DocString);
        this.build(context, token);
        return 43;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 35;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 35;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 35;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#DocStringSeparator", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 35;
    }
    matchTokenAt_36(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.build(context, token);
        return 36;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 35;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 36;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 36;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 36;
    }
    matchTokenAt_37(token, context) {
      if (this.match_TagLine(context, token)) {
        this.build(context, token);
        return 37;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 37;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 37;
      }
      token.detach();
      const expectedTokens = ["#TagLine", "#ExamplesLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 37;
    }
    matchTokenAt_38(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 38;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 40;
      }
      if (this.match_TableRow(context, token)) {
        this.startRule(context, RuleType.ExamplesTable);
        this.build(context, token);
        return 41;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.startRule(context, RuleType.Description);
        this.build(context, token);
        return 39;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Empty", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 38;
    }
    matchTokenAt_39(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.endRule(context);
        this.build(context, token);
        return 40;
      }
      if (this.match_TableRow(context, token)) {
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesTable);
        this.build(context, token);
        return 41;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 39;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 39;
    }
    matchTokenAt_40(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 40;
      }
      if (this.match_TableRow(context, token)) {
        this.startRule(context, RuleType.ExamplesTable);
        this.build(context, token);
        return 41;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 40;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#Comment", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 40;
    }
    matchTokenAt_41(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_TableRow(context, token)) {
        this.build(context, token);
        return 41;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 41;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 41;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#TableRow", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 41;
    }
    matchTokenAt_43(token, context) {
      if (this.match_DocStringSeparator(context, token)) {
        this.build(context, token);
        return 44;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 43;
      }
      token.detach();
      const expectedTokens = ["#DocStringSeparator", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 43;
    }
    matchTokenAt_44(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 35;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 37;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 38;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 44;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 44;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 44;
    }
    matchTokenAt_45(token, context) {
      if (this.match_DocStringSeparator(context, token)) {
        this.build(context, token);
        return 46;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 45;
      }
      token.detach();
      const expectedTokens = ["#DocStringSeparator", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 45;
    }
    matchTokenAt_46(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 29;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 31;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 32;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 46;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 46;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 46;
    }
    matchTokenAt_47(token, context) {
      if (this.match_DocStringSeparator(context, token)) {
        this.build(context, token);
        return 48;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 47;
      }
      token.detach();
      const expectedTokens = ["#DocStringSeparator", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 47;
    }
    matchTokenAt_48(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 15;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_1(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ExamplesDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 17;
        }
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ExamplesLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ExamplesDefinition);
        this.startRule(context, RuleType.Examples);
        this.build(context, token);
        return 18;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 48;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 48;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#StepLine", "#TagLine", "#ExamplesLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 48;
    }
    matchTokenAt_49(token, context) {
      if (this.match_DocStringSeparator(context, token)) {
        this.build(context, token);
        return 50;
      }
      if (this.match_Other(context, token)) {
        this.build(context, token);
        return 49;
      }
      token.detach();
      const expectedTokens = ["#DocStringSeparator", "#Other"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 49;
    }
    matchTokenAt_50(token, context) {
      if (this.match_EOF(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.build(context, token);
        return 42;
      }
      if (this.match_StepLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Step);
        this.build(context, token);
        return 9;
      }
      if (this.match_TagLine(context, token)) {
        if (this.lookahead_0(context, token)) {
          this.endRule(context);
          this.endRule(context);
          this.endRule(context);
          this.startRule(context, RuleType.ScenarioDefinition);
          this.startRule(context, RuleType.Tags);
          this.build(context, token);
          return 11;
        }
      }
      if (this.match_TagLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.startRule(context, RuleType.Tags);
        this.build(context, token);
        return 22;
      }
      if (this.match_ScenarioLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.ScenarioDefinition);
        this.startRule(context, RuleType.Scenario);
        this.build(context, token);
        return 12;
      }
      if (this.match_RuleLine(context, token)) {
        this.endRule(context);
        this.endRule(context);
        this.endRule(context);
        this.startRule(context, RuleType.Rule);
        this.startRule(context, RuleType.RuleHeader);
        this.build(context, token);
        return 23;
      }
      if (this.match_Comment(context, token)) {
        this.build(context, token);
        return 50;
      }
      if (this.match_Empty(context, token)) {
        this.build(context, token);
        return 50;
      }
      token.detach();
      const expectedTokens = ["#EOF", "#StepLine", "#TagLine", "#ScenarioLine", "#RuleLine", "#Comment", "#Empty"];
      const error = token.isEof ? TokenExceptions_1.UnexpectedEOFException.create(token, expectedTokens) : TokenExceptions_1.UnexpectedTokenException.create(token, expectedTokens);
      if (this.stopAtFirstError)
        throw error;
      this.addError(context, error);
      return 50;
    }
    match_EOF(context, token) {
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_EOF(token));
    }
    match_Empty(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_Empty(token));
    }
    match_Comment(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_Comment(token));
    }
    match_TagLine(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_TagLine(token));
    }
    match_FeatureLine(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_FeatureLine(token));
    }
    match_RuleLine(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_RuleLine(token));
    }
    match_BackgroundLine(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_BackgroundLine(token));
    }
    match_ScenarioLine(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_ScenarioLine(token));
    }
    match_ExamplesLine(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_ExamplesLine(token));
    }
    match_StepLine(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_StepLine(token));
    }
    match_DocStringSeparator(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_DocStringSeparator(token));
    }
    match_TableRow(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_TableRow(token));
    }
    match_Language(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_Language(token));
    }
    match_Other(context, token) {
      if (token.isEof)
        return false;
      return this.handleExternalError(context, false, () => this.tokenMatcher.match_Other(token));
    }
    lookahead_0(context, currentToken) {
      currentToken.detach();
      let token;
      const queue = [];
      let match = false;
      do {
        token = this.readToken(this.context);
        token.detach();
        queue.push(token);
        if (this.match_ScenarioLine(context, token)) {
          match = true;
          break;
        }
      } while (this.match_Empty(context, token) || this.match_Comment(context, token) || this.match_TagLine(context, token));
      context.tokenQueue = context.tokenQueue.concat(queue);
      return match;
    }
    lookahead_1(context, currentToken) {
      currentToken.detach();
      let token;
      const queue = [];
      let match = false;
      do {
        token = this.readToken(this.context);
        token.detach();
        queue.push(token);
        if (this.match_ExamplesLine(context, token)) {
          match = true;
          break;
        }
      } while (this.match_Empty(context, token) || this.match_Comment(context, token) || this.match_TagLine(context, token));
      context.tokenQueue = context.tokenQueue.concat(queue);
      return match;
    }
  }
  exports.default = Parser;
});

// node_modules/@cucumber/gherkin/dist/src/gherkin-languages.json
var require_gherkin_languages = __commonJS((exports, module) => {
  module.exports = {
    af: {
      and: [
        "* ",
        "En "
      ],
      background: [
        "Agtergrond"
      ],
      but: [
        "* ",
        "Maar "
      ],
      examples: [
        "Voorbeelde"
      ],
      feature: [
        "Funksie",
        "Besigheid Behoefte",
        "Vermo\xEB"
      ],
      given: [
        "* ",
        "Gegewe "
      ],
      name: "Afrikaans",
      native: "Afrikaans",
      rule: [
        "Regel"
      ],
      scenario: [
        "Voorbeeld",
        "Situasie"
      ],
      scenarioOutline: [
        "Situasie Uiteensetting"
      ],
      then: [
        "* ",
        "Dan "
      ],
      when: [
        "* ",
        "Wanneer "
      ]
    },
    am: {
      and: [
        "* ",
        "\u0535\u057E "
      ],
      background: [
        "\u053F\u0578\u0576\u057F\u0565\u0584\u057D\u057F"
      ],
      but: [
        "* ",
        "\u0532\u0561\u0575\u0581 "
      ],
      examples: [
        "\u0555\u0580\u056B\u0576\u0561\u056F\u0576\u0565\u0580"
      ],
      feature: [
        "\u0556\u0578\u0582\u0576\u056F\u0581\u056B\u0578\u0576\u0561\u056C\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
        "\u0540\u0561\u057F\u056F\u0578\u0582\u0569\u0575\u0578\u0582\u0576"
      ],
      given: [
        "* ",
        "\u0534\u056B\u0581\u0578\u0582\u0584 "
      ],
      name: "Armenian",
      native: "\u0570\u0561\u0575\u0565\u0580\u0565\u0576",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0555\u0580\u056B\u0576\u0561\u056F",
        "\u054D\u0581\u0565\u0576\u0561\u0580"
      ],
      scenarioOutline: [
        "\u054D\u0581\u0565\u0576\u0561\u0580\u056B \u056F\u0561\u057C\u0578\u0582\u0581\u057E\u0561\u0581\u0584\u0568"
      ],
      then: [
        "* ",
        "\u0531\u057A\u0561 "
      ],
      when: [
        "* ",
        "\u0535\u0569\u0565 ",
        "\u0535\u0580\u0562 "
      ]
    },
    an: {
      and: [
        "* ",
        "Y ",
        "E "
      ],
      background: [
        "Antecedents"
      ],
      but: [
        "* ",
        "Pero "
      ],
      examples: [
        "Eixemplos"
      ],
      feature: [
        "Caracteristica"
      ],
      given: [
        "* ",
        "Dau ",
        "Dada ",
        "Daus ",
        "Dadas "
      ],
      name: "Aragonese",
      native: "Aragon\xE9s",
      rule: [
        "Rule"
      ],
      scenario: [
        "Eixemplo",
        "Caso"
      ],
      scenarioOutline: [
        "Esquema del caso"
      ],
      then: [
        "* ",
        "Alavez ",
        "Allora ",
        "Antonces "
      ],
      when: [
        "* ",
        "Cuan "
      ]
    },
    ar: {
      and: [
        "* ",
        "\u0648 "
      ],
      background: [
        "\u0627\u0644\u062E\u0644\u0641\u064A\u0629"
      ],
      but: [
        "* ",
        "\u0644\u0643\u0646 "
      ],
      examples: [
        "\u0627\u0645\u062B\u0644\u0629"
      ],
      feature: [
        "\u062E\u0627\u0635\u064A\u0629"
      ],
      given: [
        "* ",
        "\u0628\u0641\u0631\u0636 "
      ],
      name: "Arabic",
      native: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0645\u062B\u0627\u0644",
        "\u0633\u064A\u0646\u0627\u0631\u064A\u0648"
      ],
      scenarioOutline: [
        "\u0633\u064A\u0646\u0627\u0631\u064A\u0648 \u0645\u062E\u0637\u0637"
      ],
      then: [
        "* ",
        "\u0627\u0630\u0627\u064B ",
        "\u062B\u0645 "
      ],
      when: [
        "* ",
        "\u0645\u062A\u0649 ",
        "\u0639\u0646\u062F\u0645\u0627 "
      ]
    },
    ast: {
      and: [
        "* ",
        "Y ",
        "Ya "
      ],
      background: [
        "Antecedentes"
      ],
      but: [
        "* ",
        "Peru "
      ],
      examples: [
        "Exemplos"
      ],
      feature: [
        "Carauter\xEDstica"
      ],
      given: [
        "* ",
        "D\xE1u ",
        "Dada ",
        "Daos ",
        "Daes "
      ],
      name: "Asturian",
      native: "asturianu",
      rule: [
        "Rule"
      ],
      scenario: [
        "Exemplo",
        "Casu"
      ],
      scenarioOutline: [
        "Esbozu del casu"
      ],
      then: [
        "* ",
        "Ent\xF3s "
      ],
      when: [
        "* ",
        "Cuando "
      ]
    },
    az: {
      and: [
        "* ",
        "V\u0259 ",
        "H\u0259m "
      ],
      background: [
        "Ke\xE7mi\u015F",
        "Kontekst"
      ],
      but: [
        "* ",
        "Amma ",
        "Ancaq "
      ],
      examples: [
        "N\xFCmun\u0259l\u0259r"
      ],
      feature: [
        "\xD6z\u0259llik"
      ],
      given: [
        "* ",
        "Tutaq ki ",
        "Verilir "
      ],
      name: "Azerbaijani",
      native: "Az\u0259rbaycanca",
      rule: [
        "Rule"
      ],
      scenario: [
        "N\xFCmun\u0259",
        "Ssenari"
      ],
      scenarioOutline: [
        "Ssenarinin strukturu"
      ],
      then: [
        "* ",
        "O halda "
      ],
      when: [
        "* ",
        "\u018Fg\u0259r ",
        "N\u0259 vaxt ki "
      ]
    },
    be: {
      and: [
        "* ",
        "I ",
        "\u0414\u044B ",
        "\u0422\u0430\u043A\u0441\u0430\u043C\u0430 "
      ],
      background: [
        "\u041A\u0430\u043D\u0442\u044D\u043A\u0441\u0442"
      ],
      but: [
        "* ",
        "\u0410\u043B\u0435 ",
        "\u0406\u043D\u0430\u043A\u0448 "
      ],
      examples: [
        "\u041F\u0440\u044B\u043A\u043B\u0430\u0434\u044B"
      ],
      feature: [
        "\u0424\u0443\u043D\u043A\u0446\u044B\u044F\u043D\u0430\u043B\u044C\u043D\u0430\u0441\u0446\u044C",
        "\u0424\u0456\u0447\u0430"
      ],
      given: [
        "* ",
        "\u041D\u044F\u0445\u0430\u0439 ",
        "\u0414\u0430\u0434\u0437\u0435\u043D\u0430 "
      ],
      name: "Belarusian",
      native: "\u0411\u0435\u043B\u0430\u0440\u0443\u0441\u043A\u0430\u044F",
      rule: [
        "\u041F\u0440\u0430\u0432\u0456\u043B\u044B"
      ],
      scenario: [
        "\u0421\u0446\u044D\u043D\u0430\u0440\u044B\u0439",
        "C\u0446\u044D\u043D\u0430\u0440"
      ],
      scenarioOutline: [
        "\u0428\u0430\u0431\u043B\u043E\u043D \u0441\u0446\u044D\u043D\u0430\u0440\u044B\u044F",
        "\u0423\u0437\u043E\u0440 \u0441\u0446\u044D\u043D\u0430\u0440\u0430"
      ],
      then: [
        "* ",
        "\u0422\u0430\u0434\u044B "
      ],
      when: [
        "* ",
        "\u041A\u0430\u043B\u0456 "
      ]
    },
    bg: {
      and: [
        "* ",
        "\u0418 "
      ],
      background: [
        "\u041F\u0440\u0435\u0434\u0438\u0441\u0442\u043E\u0440\u0438\u044F"
      ],
      but: [
        "* ",
        "\u041D\u043E "
      ],
      examples: [
        "\u041F\u0440\u0438\u043C\u0435\u0440\u0438"
      ],
      feature: [
        "\u0424\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B\u043D\u043E\u0441\u0442"
      ],
      given: [
        "* ",
        "\u0414\u0430\u0434\u0435\u043D\u043E "
      ],
      name: "Bulgarian",
      native: "\u0431\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438",
      rule: [
        "\u041F\u0440\u0430\u0432\u0438\u043B\u043E"
      ],
      scenario: [
        "\u041F\u0440\u0438\u043C\u0435\u0440",
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439"
      ],
      scenarioOutline: [
        "\u0420\u0430\u043C\u043A\u0430 \u043D\u0430 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439"
      ],
      then: [
        "* ",
        "\u0422\u043E "
      ],
      when: [
        "* ",
        "\u041A\u043E\u0433\u0430\u0442\u043E "
      ]
    },
    bm: {
      and: [
        "* ",
        "Dan "
      ],
      background: [
        "Latar Belakang"
      ],
      but: [
        "* ",
        "Tetapi ",
        "Tapi "
      ],
      examples: [
        "Contoh"
      ],
      feature: [
        "Fungsi"
      ],
      given: [
        "* ",
        "Diberi ",
        "Bagi "
      ],
      name: "Malay",
      native: "Bahasa Melayu",
      rule: [
        "Rule"
      ],
      scenario: [
        "Senario",
        "Situasi",
        "Keadaan"
      ],
      scenarioOutline: [
        "Kerangka Senario",
        "Kerangka Situasi",
        "Kerangka Keadaan",
        "Garis Panduan Senario"
      ],
      then: [
        "* ",
        "Maka ",
        "Kemudian "
      ],
      when: [
        "* ",
        "Apabila "
      ]
    },
    bs: {
      and: [
        "* ",
        "I ",
        "A "
      ],
      background: [
        "Pozadina"
      ],
      but: [
        "* ",
        "Ali "
      ],
      examples: [
        "Primjeri"
      ],
      feature: [
        "Karakteristika"
      ],
      given: [
        "* ",
        "Dato "
      ],
      name: "Bosnian",
      native: "Bosanski",
      rule: [
        "Rule"
      ],
      scenario: [
        "Primjer",
        "Scenariju",
        "Scenario"
      ],
      scenarioOutline: [
        "Scenariju-obris",
        "Scenario-outline"
      ],
      then: [
        "* ",
        "Zatim "
      ],
      when: [
        "* ",
        "Kada "
      ]
    },
    ca: {
      and: [
        "* ",
        "I "
      ],
      background: [
        "Rerefons",
        "Antecedents"
      ],
      but: [
        "* ",
        "Per\xF2 "
      ],
      examples: [
        "Exemples"
      ],
      feature: [
        "Caracter\xEDstica",
        "Funcionalitat"
      ],
      given: [
        "* ",
        "Donat ",
        "Donada ",
        "At\xE8s ",
        "Atesa "
      ],
      name: "Catalan",
      native: "catal\xE0",
      rule: [
        "Rule"
      ],
      scenario: [
        "Exemple",
        "Escenari"
      ],
      scenarioOutline: [
        "Esquema de l'escenari"
      ],
      then: [
        "* ",
        "Aleshores ",
        "Cal "
      ],
      when: [
        "* ",
        "Quan "
      ]
    },
    cs: {
      and: [
        "* ",
        "A tak\xE9 ",
        "A "
      ],
      background: [
        "Pozad\xED",
        "Kontext"
      ],
      but: [
        "* ",
        "Ale "
      ],
      examples: [
        "P\u0159\xEDklady"
      ],
      feature: [
        "Po\u017Eadavek"
      ],
      given: [
        "* ",
        "Pokud ",
        "Za p\u0159edpokladu "
      ],
      name: "Czech",
      native: "\u010Cesky",
      rule: [
        "Pravidlo"
      ],
      scenario: [
        "P\u0159\xEDklad",
        "Sc\xE9n\xE1\u0159"
      ],
      scenarioOutline: [
        "N\xE1\u010Drt Sc\xE9n\xE1\u0159e",
        "Osnova sc\xE9n\xE1\u0159e"
      ],
      then: [
        "* ",
        "Pak "
      ],
      when: [
        "* ",
        "Kdy\u017E "
      ]
    },
    "cy-GB": {
      and: [
        "* ",
        "A "
      ],
      background: [
        "Cefndir"
      ],
      but: [
        "* ",
        "Ond "
      ],
      examples: [
        "Enghreifftiau"
      ],
      feature: [
        "Arwedd"
      ],
      given: [
        "* ",
        "Anrhegedig a "
      ],
      name: "Welsh",
      native: "Cymraeg",
      rule: [
        "Rule"
      ],
      scenario: [
        "Enghraifft",
        "Scenario"
      ],
      scenarioOutline: [
        "Scenario Amlinellol"
      ],
      then: [
        "* ",
        "Yna "
      ],
      when: [
        "* ",
        "Pryd "
      ]
    },
    da: {
      and: [
        "* ",
        "Og "
      ],
      background: [
        "Baggrund"
      ],
      but: [
        "* ",
        "Men "
      ],
      examples: [
        "Eksempler"
      ],
      feature: [
        "Egenskab"
      ],
      given: [
        "* ",
        "Givet "
      ],
      name: "Danish",
      native: "dansk",
      rule: [
        "Regel"
      ],
      scenario: [
        "Eksempel",
        "Scenarie"
      ],
      scenarioOutline: [
        "Abstrakt Scenario"
      ],
      then: [
        "* ",
        "S\xE5 "
      ],
      when: [
        "* ",
        "N\xE5r "
      ]
    },
    de: {
      and: [
        "* ",
        "Und "
      ],
      background: [
        "Grundlage",
        "Hintergrund",
        "Voraussetzungen",
        "Vorbedingungen"
      ],
      but: [
        "* ",
        "Aber "
      ],
      examples: [
        "Beispiele"
      ],
      feature: [
        "Funktionalit\xE4t",
        "Funktion"
      ],
      given: [
        "* ",
        "Angenommen ",
        "Gegeben sei ",
        "Gegeben seien "
      ],
      name: "German",
      native: "Deutsch",
      rule: [
        "Rule",
        "Regel"
      ],
      scenario: [
        "Beispiel",
        "Szenario"
      ],
      scenarioOutline: [
        "Szenariogrundriss",
        "Szenarien"
      ],
      then: [
        "* ",
        "Dann "
      ],
      when: [
        "* ",
        "Wenn "
      ]
    },
    el: {
      and: [
        "* ",
        "\u039A\u03B1\u03B9 "
      ],
      background: [
        "\u03A5\u03C0\u03CC\u03B2\u03B1\u03B8\u03C1\u03BF"
      ],
      but: [
        "* ",
        "\u0391\u03BB\u03BB\u03AC "
      ],
      examples: [
        "\u03A0\u03B1\u03C1\u03B1\u03B4\u03B5\u03AF\u03B3\u03BC\u03B1\u03C4\u03B1",
        "\u03A3\u03B5\u03BD\u03AC\u03C1\u03B9\u03B1"
      ],
      feature: [
        "\u0394\u03C5\u03BD\u03B1\u03C4\u03CC\u03C4\u03B7\u03C4\u03B1",
        "\u039B\u03B5\u03B9\u03C4\u03BF\u03C5\u03C1\u03B3\u03AF\u03B1"
      ],
      given: [
        "* ",
        "\u0394\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03BF\u03C5 "
      ],
      name: "Greek",
      native: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u03A0\u03B1\u03C1\u03AC\u03B4\u03B5\u03B9\u03B3\u03BC\u03B1",
        "\u03A3\u03B5\u03BD\u03AC\u03C1\u03B9\u03BF"
      ],
      scenarioOutline: [
        "\u03A0\u03B5\u03C1\u03B9\u03B3\u03C1\u03B1\u03C6\u03AE \u03A3\u03B5\u03BD\u03B1\u03C1\u03AF\u03BF\u03C5",
        "\u03A0\u03B5\u03C1\u03AF\u03B3\u03C1\u03B1\u03BC\u03BC\u03B1 \u03A3\u03B5\u03BD\u03B1\u03C1\u03AF\u03BF\u03C5"
      ],
      then: [
        "* ",
        "\u03A4\u03CC\u03C4\u03B5 "
      ],
      when: [
        "* ",
        "\u038C\u03C4\u03B1\u03BD "
      ]
    },
    em: {
      and: [
        "* ",
        "\uD83D\uDE02"
      ],
      background: [
        "\uD83D\uDCA4"
      ],
      but: [
        "* ",
        "\uD83D\uDE14"
      ],
      examples: [
        "\uD83D\uDCD3"
      ],
      feature: [
        "\uD83D\uDCDA"
      ],
      given: [
        "* ",
        "\uD83D\uDE10"
      ],
      name: "Emoji",
      native: "\uD83D\uDE00",
      rule: [
        "Rule"
      ],
      scenario: [
        "\uD83E\uDD52",
        "\uD83D\uDCD5"
      ],
      scenarioOutline: [
        "\uD83D\uDCD6"
      ],
      then: [
        "* ",
        "\uD83D\uDE4F"
      ],
      when: [
        "* ",
        "\uD83C\uDFAC"
      ]
    },
    en: {
      and: [
        "* ",
        "And "
      ],
      background: [
        "Background"
      ],
      but: [
        "* ",
        "But "
      ],
      examples: [
        "Examples",
        "Scenarios"
      ],
      feature: [
        "Feature",
        "Business Need",
        "Ability"
      ],
      given: [
        "* ",
        "Given "
      ],
      name: "English",
      native: "English",
      rule: [
        "Rule"
      ],
      scenario: [
        "Example",
        "Scenario"
      ],
      scenarioOutline: [
        "Scenario Outline",
        "Scenario Template"
      ],
      then: [
        "* ",
        "Then "
      ],
      when: [
        "* ",
        "When "
      ]
    },
    "en-Scouse": {
      and: [
        "* ",
        "An "
      ],
      background: [
        "Dis is what went down"
      ],
      but: [
        "* ",
        "Buh "
      ],
      examples: [
        "Examples"
      ],
      feature: [
        "Feature"
      ],
      given: [
        "* ",
        "Givun ",
        "Youse know when youse got "
      ],
      name: "Scouse",
      native: "Scouse",
      rule: [
        "Rule"
      ],
      scenario: [
        "The thing of it is"
      ],
      scenarioOutline: [
        "Wharrimean is"
      ],
      then: [
        "* ",
        "Dun ",
        "Den youse gotta "
      ],
      when: [
        "* ",
        "Wun ",
        "Youse know like when "
      ]
    },
    "en-au": {
      and: [
        "* ",
        "Too right "
      ],
      background: [
        "First off"
      ],
      but: [
        "* ",
        "Yeah nah "
      ],
      examples: [
        "You'll wanna"
      ],
      feature: [
        "Pretty much"
      ],
      given: [
        "* ",
        "Y'know "
      ],
      name: "Australian",
      native: "Australian",
      rule: [
        "Rule"
      ],
      scenario: [
        "Awww, look mate"
      ],
      scenarioOutline: [
        "Reckon it's like"
      ],
      then: [
        "* ",
        "But at the end of the day I reckon "
      ],
      when: [
        "* ",
        "It's just unbelievable "
      ]
    },
    "en-lol": {
      and: [
        "* ",
        "AN "
      ],
      background: [
        "B4"
      ],
      but: [
        "* ",
        "BUT "
      ],
      examples: [
        "EXAMPLZ"
      ],
      feature: [
        "OH HAI"
      ],
      given: [
        "* ",
        "I CAN HAZ "
      ],
      name: "LOLCAT",
      native: "LOLCAT",
      rule: [
        "Rule"
      ],
      scenario: [
        "MISHUN"
      ],
      scenarioOutline: [
        "MISHUN SRSLY"
      ],
      then: [
        "* ",
        "DEN "
      ],
      when: [
        "* ",
        "WEN "
      ]
    },
    "en-old": {
      and: [
        "* ",
        "Ond ",
        "7 "
      ],
      background: [
        "Aer",
        "\xC6r"
      ],
      but: [
        "* ",
        "Ac "
      ],
      examples: [
        "Se the",
        "Se \xFEe",
        "Se \xF0e"
      ],
      feature: [
        "Hwaet",
        "Hw\xE6t"
      ],
      given: [
        "* ",
        "Thurh ",
        "\xDEurh ",
        "\xD0urh "
      ],
      name: "Old English",
      native: "Englisc",
      rule: [
        "Rule"
      ],
      scenario: [
        "Swa"
      ],
      scenarioOutline: [
        "Swa hwaer swa",
        "Swa hw\xE6r swa"
      ],
      then: [
        "* ",
        "Tha ",
        "\xDEa ",
        "\xD0a ",
        "Tha the ",
        "\xDEa \xFEe ",
        "\xD0a \xF0e "
      ],
      when: [
        "* ",
        "B\xE6\xFEsealf ",
        "B\xE6\xFEsealfa ",
        "B\xE6\xFEsealfe ",
        "Ciric\xE6w ",
        "Ciric\xE6we ",
        "Ciric\xE6wa "
      ]
    },
    "en-pirate": {
      and: [
        "* ",
        "Aye "
      ],
      background: [
        "Yo-ho-ho"
      ],
      but: [
        "* ",
        "Avast! "
      ],
      examples: [
        "Dead men tell no tales"
      ],
      feature: [
        "Ahoy matey!"
      ],
      given: [
        "* ",
        "Gangway! "
      ],
      name: "Pirate",
      native: "Pirate",
      rule: [
        "Rule"
      ],
      scenario: [
        "Heave to"
      ],
      scenarioOutline: [
        "Shiver me timbers"
      ],
      then: [
        "* ",
        "Let go and haul "
      ],
      when: [
        "* ",
        "Blimey! "
      ]
    },
    "en-tx": {
      and: [
        "Come hell or high water "
      ],
      background: [
        "Lemme tell y'all a story"
      ],
      but: [
        "Well now hold on, I'll you what "
      ],
      examples: [
        "Now that's a story longer than a cattle drive in July"
      ],
      feature: [
        "This ain\u2019t my first rodeo",
        "All gussied up"
      ],
      given: [
        "Fixin' to ",
        "All git out "
      ],
      name: "Texas",
      native: "Texas",
      rule: [
        "Rule "
      ],
      scenario: [
        "All hat and no cattle"
      ],
      scenarioOutline: [
        "Serious as a snake bite",
        "Busy as a hound in flea season"
      ],
      then: [
        "There\u2019s no tree but bears some fruit "
      ],
      when: [
        "Quick out of the chute "
      ]
    },
    eo: {
      and: [
        "* ",
        "Kaj "
      ],
      background: [
        "Fono"
      ],
      but: [
        "* ",
        "Sed "
      ],
      examples: [
        "Ekzemploj"
      ],
      feature: [
        "Trajto"
      ],
      given: [
        "* ",
        "Donita\u0135o ",
        "Komence "
      ],
      name: "Esperanto",
      native: "Esperanto",
      rule: [
        "Regulo"
      ],
      scenario: [
        "Ekzemplo",
        "Scenaro",
        "Kazo"
      ],
      scenarioOutline: [
        "Konturo de la scenaro",
        "Skizo",
        "Kazo-skizo"
      ],
      then: [
        "* ",
        "Do "
      ],
      when: [
        "* ",
        "Se "
      ]
    },
    es: {
      and: [
        "* ",
        "Y ",
        "E "
      ],
      background: [
        "Antecedentes"
      ],
      but: [
        "* ",
        "Pero "
      ],
      examples: [
        "Ejemplos"
      ],
      feature: [
        "Caracter\xEDstica",
        "Necesidad del negocio",
        "Requisito"
      ],
      given: [
        "* ",
        "Dado ",
        "Dada ",
        "Dados ",
        "Dadas "
      ],
      name: "Spanish",
      native: "espa\xF1ol",
      rule: [
        "Regla",
        "Regla de negocio"
      ],
      scenario: [
        "Ejemplo",
        "Escenario"
      ],
      scenarioOutline: [
        "Esquema del escenario"
      ],
      then: [
        "* ",
        "Entonces "
      ],
      when: [
        "* ",
        "Cuando "
      ]
    },
    et: {
      and: [
        "* ",
        "Ja "
      ],
      background: [
        "Taust"
      ],
      but: [
        "* ",
        "Kuid "
      ],
      examples: [
        "Juhtumid"
      ],
      feature: [
        "Omadus"
      ],
      given: [
        "* ",
        "Eeldades "
      ],
      name: "Estonian",
      native: "eesti keel",
      rule: [
        "Reegel"
      ],
      scenario: [
        "Juhtum",
        "Stsenaarium"
      ],
      scenarioOutline: [
        "Raamjuhtum",
        "Raamstsenaarium"
      ],
      then: [
        "* ",
        "Siis "
      ],
      when: [
        "* ",
        "Kui "
      ]
    },
    fa: {
      and: [
        "* ",
        "\u0648 "
      ],
      background: [
        "\u0632\u0645\u06CC\u0646\u0647"
      ],
      but: [
        "* ",
        "\u0627\u0645\u0627 "
      ],
      examples: [
        "\u0646\u0645\u0648\u0646\u0647 \u0647\u0627"
      ],
      feature: [
        "\u0648\u0650\u06CC\u0698\u06AF\u06CC"
      ],
      given: [
        "* ",
        "\u0628\u0627 \u0641\u0631\u0636 "
      ],
      name: "Persian",
      native: "\u0641\u0627\u0631\u0633\u06CC",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0645\u062B\u0627\u0644",
        "\u0633\u0646\u0627\u0631\u06CC\u0648"
      ],
      scenarioOutline: [
        "\u0627\u0644\u06AF\u0648\u06CC \u0633\u0646\u0627\u0631\u06CC\u0648"
      ],
      then: [
        "* ",
        "\u0622\u0646\u06AF\u0627\u0647 "
      ],
      when: [
        "* ",
        "\u0647\u0646\u06AF\u0627\u0645\u06CC "
      ]
    },
    fi: {
      and: [
        "* ",
        "Ja "
      ],
      background: [
        "Tausta"
      ],
      but: [
        "* ",
        "Mutta "
      ],
      examples: [
        "Tapaukset"
      ],
      feature: [
        "Ominaisuus"
      ],
      given: [
        "* ",
        "Oletetaan "
      ],
      name: "Finnish",
      native: "suomi",
      rule: [
        "Rule"
      ],
      scenario: [
        "Tapaus"
      ],
      scenarioOutline: [
        "Tapausaihio"
      ],
      then: [
        "* ",
        "Niin "
      ],
      when: [
        "* ",
        "Kun "
      ]
    },
    fr: {
      and: [
        "* ",
        "Et que ",
        "Et qu'",
        "Et "
      ],
      background: [
        "Contexte"
      ],
      but: [
        "* ",
        "Mais que ",
        "Mais qu'",
        "Mais "
      ],
      examples: [
        "Exemples"
      ],
      feature: [
        "Fonctionnalit\xE9"
      ],
      given: [
        "* ",
        "Soit ",
        "Sachant que ",
        "Sachant qu'",
        "Sachant ",
        "Etant donn\xE9 que ",
        "Etant donn\xE9 qu'",
        "Etant donn\xE9 ",
        "Etant donn\xE9e ",
        "Etant donn\xE9s ",
        "Etant donn\xE9es ",
        "\xC9tant donn\xE9 que ",
        "\xC9tant donn\xE9 qu'",
        "\xC9tant donn\xE9 ",
        "\xC9tant donn\xE9e ",
        "\xC9tant donn\xE9s ",
        "\xC9tant donn\xE9es "
      ],
      name: "French",
      native: "fran\xE7ais",
      rule: [
        "R\xE8gle"
      ],
      scenario: [
        "Exemple",
        "Sc\xE9nario"
      ],
      scenarioOutline: [
        "Plan du sc\xE9nario",
        "Plan du Sc\xE9nario"
      ],
      then: [
        "* ",
        "Alors ",
        "Donc "
      ],
      when: [
        "* ",
        "Quand ",
        "Lorsque ",
        "Lorsqu'"
      ]
    },
    ga: {
      and: [
        "* ",
        "Agus"
      ],
      background: [
        "C\xFAlra"
      ],
      but: [
        "* ",
        "Ach"
      ],
      examples: [
        "Sampla\xED"
      ],
      feature: [
        "Gn\xE9"
      ],
      given: [
        "* ",
        "Cuir i gc\xE1s go",
        "Cuir i gc\xE1s nach",
        "Cuir i gc\xE1s gur",
        "Cuir i gc\xE1s n\xE1r"
      ],
      name: "Irish",
      native: "Gaeilge",
      rule: [
        "Riail"
      ],
      scenario: [
        "Sampla",
        "C\xE1s"
      ],
      scenarioOutline: [
        "C\xE1s Achomair"
      ],
      then: [
        "* ",
        "Ansin"
      ],
      when: [
        "* ",
        "Nuair a",
        "Nuair nach",
        "Nuair ba",
        "Nuair n\xE1r"
      ]
    },
    gj: {
      and: [
        "* ",
        "\u0A85\u0AA8\u0AC7 "
      ],
      background: [
        "\u0AAC\u0AC7\u0A95\u0A97\u0ACD\u0AB0\u0ABE\u0A89\u0AA8\u0ACD\u0AA1"
      ],
      but: [
        "* ",
        "\u0AAA\u0AA3 "
      ],
      examples: [
        "\u0A89\u0AA6\u0ABE\u0AB9\u0AB0\u0AA3\u0ACB"
      ],
      feature: [
        "\u0AB2\u0A95\u0ACD\u0AB7\u0AA3",
        "\u0AB5\u0ACD\u0AAF\u0ABE\u0AAA\u0ABE\u0AB0 \u0A9C\u0AB0\u0AC2\u0AB0",
        "\u0A95\u0ACD\u0AB7\u0AAE\u0AA4\u0ABE"
      ],
      given: [
        "* ",
        "\u0A86\u0AAA\u0AC7\u0AB2 \u0A9B\u0AC7 "
      ],
      name: "Gujarati",
      native: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0A89\u0AA6\u0ABE\u0AB9\u0AB0\u0AA3",
        "\u0AB8\u0ACD\u0AA5\u0ABF\u0AA4\u0ABF"
      ],
      scenarioOutline: [
        "\u0AAA\u0AB0\u0ABF\u0AA6\u0ACD\u0AA6\u0AB6\u0ACD\u0AAF \u0AB0\u0AC2\u0AAA\u0AB0\u0AC7\u0A96\u0ABE",
        "\u0AAA\u0AB0\u0ABF\u0AA6\u0ACD\u0AA6\u0AB6\u0ACD\u0AAF \u0AA2\u0ABE\u0A82\u0A9A\u0ACB"
      ],
      then: [
        "* ",
        "\u0AAA\u0A9B\u0AC0 "
      ],
      when: [
        "* ",
        "\u0A95\u0ACD\u0AAF\u0ABE\u0AB0\u0AC7 "
      ]
    },
    gl: {
      and: [
        "* ",
        "E "
      ],
      background: [
        "Contexto"
      ],
      but: [
        "* ",
        "Mais ",
        "Pero "
      ],
      examples: [
        "Exemplos"
      ],
      feature: [
        "Caracter\xEDstica"
      ],
      given: [
        "* ",
        "Dado ",
        "Dada ",
        "Dados ",
        "Dadas "
      ],
      name: "Galician",
      native: "galego",
      rule: [
        "Rule"
      ],
      scenario: [
        "Exemplo",
        "Escenario"
      ],
      scenarioOutline: [
        "Esbozo do escenario"
      ],
      then: [
        "* ",
        "Ent\xF3n ",
        "Logo "
      ],
      when: [
        "* ",
        "Cando "
      ]
    },
    he: {
      and: [
        "* ",
        "\u05D5\u05D2\u05DD "
      ],
      background: [
        "\u05E8\u05E7\u05E2"
      ],
      but: [
        "* ",
        "\u05D0\u05D1\u05DC "
      ],
      examples: [
        "\u05D3\u05D5\u05D2\u05DE\u05D0\u05D5\u05EA"
      ],
      feature: [
        "\u05EA\u05DB\u05D5\u05E0\u05D4"
      ],
      given: [
        "* ",
        "\u05D1\u05D4\u05D9\u05E0\u05EA\u05DF "
      ],
      name: "Hebrew",
      native: "\u05E2\u05D1\u05E8\u05D9\u05EA",
      rule: [
        "\u05DB\u05DC\u05DC"
      ],
      scenario: [
        "\u05D3\u05D5\u05D2\u05DE\u05D0",
        "\u05EA\u05E8\u05D7\u05D9\u05E9"
      ],
      scenarioOutline: [
        "\u05EA\u05D1\u05E0\u05D9\u05EA \u05EA\u05E8\u05D7\u05D9\u05E9"
      ],
      then: [
        "* ",
        "\u05D0\u05D6 ",
        "\u05D0\u05D6\u05D9 "
      ],
      when: [
        "* ",
        "\u05DB\u05D0\u05E9\u05E8 "
      ]
    },
    hi: {
      and: [
        "* ",
        "\u0914\u0930 ",
        "\u0924\u0925\u093E "
      ],
      background: [
        "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u093F"
      ],
      but: [
        "* ",
        "\u092A\u0930 ",
        "\u092A\u0930\u0928\u094D\u0924\u0941 ",
        "\u0915\u093F\u0928\u094D\u0924\u0941 "
      ],
      examples: [
        "\u0909\u0926\u093E\u0939\u0930\u0923"
      ],
      feature: [
        "\u0930\u0942\u092A \u0932\u0947\u0916"
      ],
      given: [
        "* ",
        "\u0905\u0917\u0930 ",
        "\u092F\u0926\u093F ",
        "\u091A\u0942\u0902\u0915\u093F "
      ],
      name: "Hindi",
      native: "\u0939\u093F\u0902\u0926\u0940",
      rule: [
        "\u0928\u093F\u092F\u092E"
      ],
      scenario: [
        "\u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F"
      ],
      scenarioOutline: [
        "\u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F \u0930\u0942\u092A\u0930\u0947\u0916\u093E"
      ],
      then: [
        "* ",
        "\u0924\u092C ",
        "\u0924\u0926\u093E "
      ],
      when: [
        "* ",
        "\u091C\u092C ",
        "\u0915\u0926\u093E "
      ]
    },
    hr: {
      and: [
        "* ",
        "I "
      ],
      background: [
        "Pozadina"
      ],
      but: [
        "* ",
        "Ali "
      ],
      examples: [
        "Primjeri",
        "Scenariji"
      ],
      feature: [
        "Osobina",
        "Mogu\u0107nost",
        "Mogucnost"
      ],
      given: [
        "* ",
        "Zadan ",
        "Zadani ",
        "Zadano ",
        "Ukoliko "
      ],
      name: "Croatian",
      native: "hrvatski",
      rule: [
        "Rule"
      ],
      scenario: [
        "Primjer",
        "Scenarij"
      ],
      scenarioOutline: [
        "Skica",
        "Koncept"
      ],
      then: [
        "* ",
        "Onda "
      ],
      when: [
        "* ",
        "Kada ",
        "Kad "
      ]
    },
    ht: {
      and: [
        "* ",
        "Ak ",
        "Epi ",
        "E "
      ],
      background: [
        "Kont\xE8ks",
        "Istorik"
      ],
      but: [
        "* ",
        "Men "
      ],
      examples: [
        "Egzanp"
      ],
      feature: [
        "Karakteristik",
        "Mak",
        "Fonksyonalite"
      ],
      given: [
        "* ",
        "Sipoze ",
        "Sipoze ke ",
        "Sipoze Ke "
      ],
      name: "Creole",
      native: "krey\xF2l",
      rule: [
        "Rule"
      ],
      scenario: [
        "Senaryo"
      ],
      scenarioOutline: [
        "Plan senaryo",
        "Plan Senaryo",
        "Senaryo deskripsyon",
        "Senaryo Deskripsyon",
        "Dyagram senaryo",
        "Dyagram Senaryo"
      ],
      then: [
        "* ",
        "L\xE8 sa a ",
        "Le sa a "
      ],
      when: [
        "* ",
        "L\xE8 ",
        "Le "
      ]
    },
    hu: {
      and: [
        "* ",
        "\xC9s "
      ],
      background: [
        "H\xE1tt\xE9r"
      ],
      but: [
        "* ",
        "De "
      ],
      examples: [
        "P\xE9ld\xE1k"
      ],
      feature: [
        "Jellemz\u0151"
      ],
      given: [
        "* ",
        "Amennyiben ",
        "Adott "
      ],
      name: "Hungarian",
      native: "magyar",
      rule: [
        "Szab\xE1ly"
      ],
      scenario: [
        "P\xE9lda",
        "Forgat\xF3k\xF6nyv"
      ],
      scenarioOutline: [
        "Forgat\xF3k\xF6nyv v\xE1zlat"
      ],
      then: [
        "* ",
        "Akkor "
      ],
      when: [
        "* ",
        "Majd ",
        "Ha ",
        "Amikor "
      ]
    },
    id: {
      and: [
        "* ",
        "Dan "
      ],
      background: [
        "Dasar",
        "Latar Belakang"
      ],
      but: [
        "* ",
        "Tapi ",
        "Tetapi "
      ],
      examples: [
        "Contoh",
        "Misal"
      ],
      feature: [
        "Fitur"
      ],
      given: [
        "* ",
        "Dengan ",
        "Diketahui ",
        "Diasumsikan ",
        "Bila ",
        "Jika "
      ],
      name: "Indonesian",
      native: "Bahasa Indonesia",
      rule: [
        "Rule",
        "Aturan"
      ],
      scenario: [
        "Skenario"
      ],
      scenarioOutline: [
        "Skenario konsep",
        "Garis-Besar Skenario"
      ],
      then: [
        "* ",
        "Maka ",
        "Kemudian "
      ],
      when: [
        "* ",
        "Ketika "
      ]
    },
    is: {
      and: [
        "* ",
        "Og "
      ],
      background: [
        "Bakgrunnur"
      ],
      but: [
        "* ",
        "En "
      ],
      examples: [
        "D\xE6mi",
        "Atbur\xF0ar\xE1sir"
      ],
      feature: [
        "Eiginleiki"
      ],
      given: [
        "* ",
        "Ef "
      ],
      name: "Icelandic",
      native: "\xCDslenska",
      rule: [
        "Rule"
      ],
      scenario: [
        "Atbur\xF0ar\xE1s"
      ],
      scenarioOutline: [
        "L\xFDsing Atbur\xF0ar\xE1sar",
        "L\xFDsing D\xE6ma"
      ],
      then: [
        "* ",
        "\xDE\xE1 "
      ],
      when: [
        "* ",
        "\xDEegar "
      ]
    },
    it: {
      and: [
        "* ",
        "E ",
        "Ed "
      ],
      background: [
        "Contesto"
      ],
      but: [
        "* ",
        "Ma "
      ],
      examples: [
        "Esempi"
      ],
      feature: [
        "Funzionalit\xE0",
        "Esigenza di Business",
        "Abilit\xE0"
      ],
      given: [
        "* ",
        "Dato ",
        "Data ",
        "Dati ",
        "Date "
      ],
      name: "Italian",
      native: "italiano",
      rule: [
        "Regola"
      ],
      scenario: [
        "Esempio",
        "Scenario"
      ],
      scenarioOutline: [
        "Schema dello scenario"
      ],
      then: [
        "* ",
        "Allora "
      ],
      when: [
        "* ",
        "Quando "
      ]
    },
    ja: {
      and: [
        "* ",
        "\u4E14\u3064",
        "\u304B\u3064"
      ],
      background: [
        "\u80CC\u666F"
      ],
      but: [
        "* ",
        "\u7136\u3057",
        "\u3057\u304B\u3057",
        "\u4F46\u3057",
        "\u305F\u3060\u3057"
      ],
      examples: [
        "\u4F8B",
        "\u30B5\u30F3\u30D7\u30EB"
      ],
      feature: [
        "\u30D5\u30A3\u30FC\u30C1\u30E3",
        "\u6A5F\u80FD"
      ],
      given: [
        "* ",
        "\u524D\u63D0"
      ],
      name: "Japanese",
      native: "\u65E5\u672C\u8A9E",
      rule: [
        "\u30EB\u30FC\u30EB"
      ],
      scenario: [
        "\u30B7\u30CA\u30EA\u30AA"
      ],
      scenarioOutline: [
        "\u30B7\u30CA\u30EA\u30AA\u30A2\u30A6\u30C8\u30E9\u30A4\u30F3",
        "\u30B7\u30CA\u30EA\u30AA\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8",
        "\u30C6\u30F3\u30D7\u30EC",
        "\u30B7\u30CA\u30EA\u30AA\u30C6\u30F3\u30D7\u30EC"
      ],
      then: [
        "* ",
        "\u306A\u3089\u3070"
      ],
      when: [
        "* ",
        "\u3082\u3057"
      ]
    },
    jv: {
      and: [
        "* ",
        "Lan "
      ],
      background: [
        "Dasar"
      ],
      but: [
        "* ",
        "Tapi ",
        "Nanging ",
        "Ananging "
      ],
      examples: [
        "Conto",
        "Contone"
      ],
      feature: [
        "Fitur"
      ],
      given: [
        "* ",
        "Nalika ",
        "Nalikaning "
      ],
      name: "Javanese",
      native: "Basa Jawa",
      rule: [
        "Rule"
      ],
      scenario: [
        "Skenario"
      ],
      scenarioOutline: [
        "Konsep skenario"
      ],
      then: [
        "* ",
        "Njuk ",
        "Banjur "
      ],
      when: [
        "* ",
        "Manawa ",
        "Menawa "
      ]
    },
    ka: {
      and: [
        "* ",
        "\u10D3\u10D0 ",
        "\u10D0\u10E1\u10D4\u10D5\u10D4 "
      ],
      background: [
        "\u10D9\u10DD\u10DC\u10E2\u10D4\u10E5\u10E1\u10E2\u10D8"
      ],
      but: [
        "* ",
        "\u10DB\u10D0\u10D2\u10E0\u10D0\u10DB ",
        "\u10D7\u10E3\u10DB\u10EA\u10D0 "
      ],
      examples: [
        "\u10DB\u10D0\u10D2\u10D0\u10DA\u10D8\u10D7\u10D4\u10D1\u10D8"
      ],
      feature: [
        "\u10D7\u10D5\u10D8\u10E1\u10D4\u10D1\u10D0",
        "\u10DB\u10DD\u10D7\u10EE\u10DD\u10D5\u10DC\u10D0"
      ],
      given: [
        "* ",
        "\u10DB\u10DD\u10EA\u10D4\u10DB\u10E3\u10DA\u10D8 ",
        "\u10DB\u10DD\u10EA\u10D4\u10DB\u10E3\u10DA\u10D8\u10D0 ",
        "\u10D5\u10D7\u10E5\u10D5\u10D0\u10D7 "
      ],
      name: "Georgian",
      native: "\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8",
      rule: [
        "\u10EC\u10D4\u10E1\u10D8"
      ],
      scenario: [
        "\u10DB\u10D0\u10D2\u10D0\u10DA\u10D8\u10D7\u10D0\u10D3",
        "\u10DB\u10D0\u10D2\u10D0\u10DA\u10D8\u10D7\u10D8",
        "\u10DB\u10D0\u10D2",
        "\u10E1\u10EA\u10D4\u10DC\u10D0\u10E0\u10D8"
      ],
      scenarioOutline: [
        "\u10E1\u10EA\u10D4\u10DC\u10D0\u10E0\u10D8\u10E1 \u10DC\u10D8\u10DB\u10E3\u10E8\u10D8",
        "\u10E1\u10EA\u10D4\u10DC\u10D0\u10E0\u10D8\u10E1 \u10E8\u10D0\u10D1\u10DA\u10DD\u10DC\u10D8",
        "\u10DC\u10D8\u10DB\u10E3\u10E8\u10D8",
        "\u10E8\u10D0\u10D1\u10DA\u10DD\u10DC\u10D8"
      ],
      then: [
        "* ",
        "\u10DB\u10D0\u10E8\u10D8\u10DC "
      ],
      when: [
        "* ",
        "\u10E0\u10DD\u10D3\u10D4\u10E1\u10D0\u10EA ",
        "\u10E0\u10DD\u10EA\u10D0 ",
        "\u10E0\u10DD\u10D2\u10DD\u10E0\u10EA \u10D9\u10D8 ",
        "\u10D7\u10E3 "
      ]
    },
    kn: {
      and: [
        "* ",
        "\u0CAE\u0CA4\u0CCD\u0CA4\u0CC1 "
      ],
      background: [
        "\u0CB9\u0CBF\u0CA8\u0CCD\u0CA8\u0CC6\u0CB2\u0CC6"
      ],
      but: [
        "* ",
        "\u0C86\u0CA6\u0CB0\u0CC6 "
      ],
      examples: [
        "\u0C89\u0CA6\u0CBE\u0CB9\u0CB0\u0CA3\u0CC6\u0C97\u0CB3\u0CC1"
      ],
      feature: [
        "\u0CB9\u0CC6\u0C9A\u0CCD\u0C9A\u0CB3"
      ],
      given: [
        "* ",
        "\u0CA8\u0CBF\u0CD5\u0CA1\u0CBF\u0CA6 "
      ],
      name: "Kannada",
      native: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0C89\u0CA6\u0CBE\u0CB9\u0CB0\u0CA3\u0CC6",
        "\u0C95\u0CA5\u0CBE\u0CB8\u0CBE\u0CB0\u0CBE\u0C82\u0CB6"
      ],
      scenarioOutline: [
        "\u0CB5\u0CBF\u0CB5\u0CB0\u0CA3\u0CC6"
      ],
      then: [
        "* ",
        "\u0CA8\u0C82\u0CA4\u0CB0 "
      ],
      when: [
        "* ",
        "\u0CB8\u0CCD\u0CA5\u0CBF\u0CA4\u0CBF\u0CAF\u0CA8\u0CCD\u0CA8\u0CC1 "
      ]
    },
    ko: {
      and: [
        "* ",
        "\uADF8\uB9AC\uACE0"
      ],
      background: [
        "\uBC30\uACBD"
      ],
      but: [
        "* ",
        "\uD558\uC9C0\uB9CC",
        "\uB2E8"
      ],
      examples: [
        "\uC608"
      ],
      feature: [
        "\uAE30\uB2A5"
      ],
      given: [
        "* ",
        "\uC870\uAC74",
        "\uBA3C\uC800"
      ],
      name: "Korean",
      native: "\uD55C\uAD6D\uC5B4",
      rule: [
        "Rule"
      ],
      scenario: [
        "\uC2DC\uB098\uB9AC\uC624"
      ],
      scenarioOutline: [
        "\uC2DC\uB098\uB9AC\uC624 \uAC1C\uC694"
      ],
      then: [
        "* ",
        "\uADF8\uB7EC\uBA74"
      ],
      when: [
        "* ",
        "\uB9CC\uC77C",
        "\uB9CC\uC57D"
      ]
    },
    lt: {
      and: [
        "* ",
        "Ir "
      ],
      background: [
        "Kontekstas"
      ],
      but: [
        "* ",
        "Bet "
      ],
      examples: [
        "Pavyzd\u017Eiai",
        "Scenarijai",
        "Variantai"
      ],
      feature: [
        "Savyb\u0117"
      ],
      given: [
        "* ",
        "Duota "
      ],
      name: "Lithuanian",
      native: "lietuvi\u0173 kalba",
      rule: [
        "Rule"
      ],
      scenario: [
        "Pavyzdys",
        "Scenarijus"
      ],
      scenarioOutline: [
        "Scenarijaus \u0161ablonas"
      ],
      then: [
        "* ",
        "Tada "
      ],
      when: [
        "* ",
        "Kai "
      ]
    },
    lu: {
      and: [
        "* ",
        "an ",
        "a "
      ],
      background: [
        "Hannergrond"
      ],
      but: [
        "* ",
        "awer ",
        "m\xE4 "
      ],
      examples: [
        "Beispiller"
      ],
      feature: [
        "Funktionalit\xE9it"
      ],
      given: [
        "* ",
        "ugeholl "
      ],
      name: "Luxemburgish",
      native: "L\xEBtzebuergesch",
      rule: [
        "Rule"
      ],
      scenario: [
        "Beispill",
        "Szenario"
      ],
      scenarioOutline: [
        "Plang vum Szenario"
      ],
      then: [
        "* ",
        "dann "
      ],
      when: [
        "* ",
        "wann "
      ]
    },
    lv: {
      and: [
        "* ",
        "Un "
      ],
      background: [
        "Konteksts",
        "Situ\u0101cija"
      ],
      but: [
        "* ",
        "Bet "
      ],
      examples: [
        "Piem\u0113ri",
        "Paraugs"
      ],
      feature: [
        "Funkcionalit\u0101te",
        "F\u012B\u010Da"
      ],
      given: [
        "* ",
        "Kad "
      ],
      name: "Latvian",
      native: "latvie\u0161u",
      rule: [
        "Rule"
      ],
      scenario: [
        "Piem\u0113rs",
        "Scen\u0101rijs"
      ],
      scenarioOutline: [
        "Scen\u0101rijs p\u0113c parauga"
      ],
      then: [
        "* ",
        "Tad "
      ],
      when: [
        "* ",
        "Ja "
      ]
    },
    "mk-Cyrl": {
      and: [
        "* ",
        "\u0418 "
      ],
      background: [
        "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442",
        "\u0421\u043E\u0434\u0440\u0436\u0438\u043D\u0430"
      ],
      but: [
        "* ",
        "\u041D\u043E "
      ],
      examples: [
        "\u041F\u0440\u0438\u043C\u0435\u0440\u0438",
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0458\u0430"
      ],
      feature: [
        "\u0424\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B\u043D\u043E\u0441\u0442",
        "\u0411\u0438\u0437\u043D\u0438\u0441 \u043F\u043E\u0442\u0440\u0435\u0431\u0430",
        "\u041C\u043E\u0436\u043D\u043E\u0441\u0442"
      ],
      given: [
        "* ",
        "\u0414\u0430\u0434\u0435\u043D\u043E ",
        "\u0414\u0430\u0434\u0435\u043D\u0430 "
      ],
      name: "Macedonian",
      native: "\u041C\u0430\u043A\u0435\u0434\u043E\u043D\u0441\u043A\u0438",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u041F\u0440\u0438\u043C\u0435\u0440",
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u043E",
        "\u041D\u0430 \u043F\u0440\u0438\u043C\u0435\u0440"
      ],
      scenarioOutline: [
        "\u041F\u0440\u0435\u0433\u043B\u0435\u0434 \u043D\u0430 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0458\u0430",
        "\u0421\u043A\u0438\u0446\u0430",
        "\u041A\u043E\u043D\u0446\u0435\u043F\u0442"
      ],
      then: [
        "* ",
        "\u0422\u043E\u0433\u0430\u0448 "
      ],
      when: [
        "* ",
        "\u041A\u043E\u0433\u0430 "
      ]
    },
    "mk-Latn": {
      and: [
        "* ",
        "I "
      ],
      background: [
        "Kontekst",
        "Sodrzhina"
      ],
      but: [
        "* ",
        "No "
      ],
      examples: [
        "Primeri",
        "Scenaria"
      ],
      feature: [
        "Funkcionalnost",
        "Biznis potreba",
        "Mozhnost"
      ],
      given: [
        "* ",
        "Dadeno ",
        "Dadena "
      ],
      name: "Macedonian (Latin)",
      native: "Makedonski (Latinica)",
      rule: [
        "Rule"
      ],
      scenario: [
        "Scenario",
        "Na primer"
      ],
      scenarioOutline: [
        "Pregled na scenarija",
        "Skica",
        "Koncept"
      ],
      then: [
        "* ",
        "Togash "
      ],
      when: [
        "* ",
        "Koga "
      ]
    },
    mn: {
      and: [
        "* ",
        "\u041C\u04E9\u043D ",
        "\u0422\u044D\u0433\u044D\u044D\u0434 "
      ],
      background: [
        "\u0410\u0433\u0443\u0443\u043B\u0433\u0430"
      ],
      but: [
        "* ",
        "\u0413\u044D\u0445\u0434\u044D\u044D ",
        "\u0425\u0430\u0440\u0438\u043D "
      ],
      examples: [
        "\u0422\u0443\u0445\u0430\u0439\u043B\u0431\u0430\u043B"
      ],
      feature: [
        "\u0424\u0443\u043D\u043A\u0446",
        "\u0424\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B"
      ],
      given: [
        "* ",
        "\u04E8\u0433\u04E9\u0433\u0434\u0441\u04E9\u043D \u043D\u044C ",
        "\u0410\u043D\u0445 "
      ],
      name: "Mongolian",
      native: "\u043C\u043E\u043D\u0433\u043E\u043B",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0421\u0446\u0435\u043D\u0430\u0440"
      ],
      scenarioOutline: [
        "\u0421\u0446\u0435\u043D\u0430\u0440\u044B\u043D \u0442\u04E9\u043B\u04E9\u0432\u043B\u04E9\u0433\u04E9\u04E9"
      ],
      then: [
        "* ",
        "\u0422\u044D\u0433\u044D\u0445\u044D\u0434 ",
        "\u04AE\u04AF\u043D\u0438\u0439 \u0434\u0430\u0440\u0430\u0430 "
      ],
      when: [
        "* ",
        "\u0425\u044D\u0440\u044D\u0432 "
      ]
    },
    ne: {
      and: [
        "* ",
        "\u0930 ",
        "\u0905\u0928\u093F "
      ],
      background: [
        "\u092A\u0943\u0937\u094D\u0920\u092D\u0942\u092E\u0940"
      ],
      but: [
        "* ",
        "\u0924\u0930 "
      ],
      examples: [
        "\u0909\u0926\u093E\u0939\u0930\u0923",
        "\u0909\u0926\u093E\u0939\u0930\u0923\u0939\u0930\u0941"
      ],
      feature: [
        "\u0938\u0941\u0935\u093F\u0927\u093E",
        "\u0935\u093F\u0936\u0947\u0937\u0924\u093E"
      ],
      given: [
        "* ",
        "\u0926\u093F\u0907\u090F\u0915\u094B ",
        "\u0926\u093F\u090F\u0915\u094B ",
        "\u092F\u0926\u093F "
      ],
      name: "Nepali",
      native: "\u0928\u0947\u092A\u093E\u0932\u0940",
      rule: [
        "\u0928\u093F\u092F\u092E"
      ],
      scenario: [
        "\u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F"
      ],
      scenarioOutline: [
        "\u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F \u0930\u0942\u092A\u0930\u0947\u0916\u093E"
      ],
      then: [
        "* ",
        "\u0924\u094D\u092F\u0938\u092A\u091B\u093F ",
        "\u0905\u0928\u0940 "
      ],
      when: [
        "* ",
        "\u091C\u092C "
      ]
    },
    nl: {
      and: [
        "* ",
        "En "
      ],
      background: [
        "Achtergrond"
      ],
      but: [
        "* ",
        "Maar "
      ],
      examples: [
        "Voorbeelden"
      ],
      feature: [
        "Functionaliteit"
      ],
      given: [
        "* ",
        "Gegeven ",
        "Stel "
      ],
      name: "Dutch",
      native: "Nederlands",
      rule: [
        "Regel"
      ],
      scenario: [
        "Voorbeeld",
        "Scenario"
      ],
      scenarioOutline: [
        "Abstract Scenario"
      ],
      then: [
        "* ",
        "Dan "
      ],
      when: [
        "* ",
        "Als ",
        "Wanneer "
      ]
    },
    no: {
      and: [
        "* ",
        "Og "
      ],
      background: [
        "Bakgrunn"
      ],
      but: [
        "* ",
        "Men "
      ],
      examples: [
        "Eksempler"
      ],
      feature: [
        "Egenskap"
      ],
      given: [
        "* ",
        "Gitt "
      ],
      name: "Norwegian",
      native: "norsk",
      rule: [
        "Regel"
      ],
      scenario: [
        "Eksempel",
        "Scenario"
      ],
      scenarioOutline: [
        "Scenariomal",
        "Abstrakt Scenario"
      ],
      then: [
        "* ",
        "S\xE5 "
      ],
      when: [
        "* ",
        "N\xE5r "
      ]
    },
    pa: {
      and: [
        "* ",
        "\u0A05\u0A24\u0A47 "
      ],
      background: [
        "\u0A2A\u0A3F\u0A1B\u0A4B\u0A15\u0A5C"
      ],
      but: [
        "* ",
        "\u0A2A\u0A30 "
      ],
      examples: [
        "\u0A09\u0A26\u0A3E\u0A39\u0A30\u0A28\u0A3E\u0A02"
      ],
      feature: [
        "\u0A16\u0A3E\u0A38\u0A40\u0A05\u0A24",
        "\u0A2E\u0A41\u0A39\u0A3E\u0A02\u0A26\u0A30\u0A3E",
        "\u0A28\u0A15\u0A36 \u0A28\u0A41\u0A39\u0A3E\u0A30"
      ],
      given: [
        "* ",
        "\u0A1C\u0A47\u0A15\u0A30 ",
        "\u0A1C\u0A3F\u0A35\u0A47\u0A02 \u0A15\u0A3F "
      ],
      name: "Panjabi",
      native: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0A09\u0A26\u0A3E\u0A39\u0A30\u0A28",
        "\u0A2A\u0A1F\u0A15\u0A25\u0A3E"
      ],
      scenarioOutline: [
        "\u0A2A\u0A1F\u0A15\u0A25\u0A3E \u0A22\u0A3E\u0A02\u0A1A\u0A3E",
        "\u0A2A\u0A1F\u0A15\u0A25\u0A3E \u0A30\u0A42\u0A2A \u0A30\u0A47\u0A16\u0A3E"
      ],
      then: [
        "* ",
        "\u0A24\u0A26 "
      ],
      when: [
        "* ",
        "\u0A1C\u0A26\u0A4B\u0A02 "
      ]
    },
    pl: {
      and: [
        "* ",
        "Oraz ",
        "I "
      ],
      background: [
        "Za\u0142o\u017Cenia"
      ],
      but: [
        "* ",
        "Ale "
      ],
      examples: [
        "Przyk\u0142ady"
      ],
      feature: [
        "W\u0142a\u015Bciwo\u015B\u0107",
        "Funkcja",
        "Aspekt",
        "Potrzeba biznesowa"
      ],
      given: [
        "* ",
        "Zak\u0142adaj\u0105c ",
        "Maj\u0105c ",
        "Zak\u0142adaj\u0105c, \u017Ce "
      ],
      name: "Polish",
      native: "polski",
      rule: [
        "Zasada",
        "Regu\u0142a"
      ],
      scenario: [
        "Przyk\u0142ad",
        "Scenariusz"
      ],
      scenarioOutline: [
        "Szablon scenariusza"
      ],
      then: [
        "* ",
        "Wtedy "
      ],
      when: [
        "* ",
        "Je\u017Celi ",
        "Je\u015Bli ",
        "Gdy ",
        "Kiedy "
      ]
    },
    pt: {
      and: [
        "* ",
        "E "
      ],
      background: [
        "Contexto",
        "Cen\xE1rio de Fundo",
        "Cenario de Fundo",
        "Fundo"
      ],
      but: [
        "* ",
        "Mas "
      ],
      examples: [
        "Exemplos",
        "Cen\xE1rios",
        "Cenarios"
      ],
      feature: [
        "Funcionalidade",
        "Caracter\xEDstica",
        "Caracteristica"
      ],
      given: [
        "* ",
        "Dado ",
        "Dada ",
        "Dados ",
        "Dadas "
      ],
      name: "Portuguese",
      native: "portugu\xEAs",
      rule: [
        "Regra"
      ],
      scenario: [
        "Exemplo",
        "Cen\xE1rio",
        "Cenario"
      ],
      scenarioOutline: [
        "Esquema do Cen\xE1rio",
        "Esquema do Cenario",
        "Delinea\xE7\xE3o do Cen\xE1rio",
        "Delineacao do Cenario"
      ],
      then: [
        "* ",
        "Ent\xE3o ",
        "Entao "
      ],
      when: [
        "* ",
        "Quando "
      ]
    },
    ro: {
      and: [
        "* ",
        "Si ",
        "\u0218i ",
        "\u015Ei "
      ],
      background: [
        "Context"
      ],
      but: [
        "* ",
        "Dar "
      ],
      examples: [
        "Exemple"
      ],
      feature: [
        "Functionalitate",
        "Func\u021Bionalitate",
        "Func\u0163ionalitate"
      ],
      given: [
        "* ",
        "Date fiind ",
        "Dat fiind ",
        "Dat\u0103 fiind",
        "Dati fiind ",
        "Da\u021Bi fiind ",
        "Da\u0163i fiind "
      ],
      name: "Romanian",
      native: "rom\xE2n\u0103",
      rule: [
        "Rule"
      ],
      scenario: [
        "Exemplu",
        "Scenariu"
      ],
      scenarioOutline: [
        "Structura scenariu",
        "Structur\u0103 scenariu"
      ],
      then: [
        "* ",
        "Atunci "
      ],
      when: [
        "* ",
        "Cand ",
        "C\xE2nd "
      ]
    },
    ru: {
      and: [
        "* ",
        "\u0418 ",
        "\u041A \u0442\u043E\u043C\u0443 \u0436\u0435 ",
        "\u0422\u0430\u043A\u0436\u0435 "
      ],
      background: [
        "\u041F\u0440\u0435\u0434\u044B\u0441\u0442\u043E\u0440\u0438\u044F",
        "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442"
      ],
      but: [
        "* ",
        "\u041D\u043E ",
        "\u0410 ",
        "\u0418\u043D\u0430\u0447\u0435 "
      ],
      examples: [
        "\u041F\u0440\u0438\u043C\u0435\u0440\u044B"
      ],
      feature: [
        "\u0424\u0443\u043D\u043A\u0446\u0438\u044F",
        "\u0424\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
        "\u0424\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B",
        "\u0421\u0432\u043E\u0439\u0441\u0442\u0432\u043E",
        "\u0424\u0438\u0447\u0430"
      ],
      given: [
        "* ",
        "\u0414\u043E\u043F\u0443\u0441\u0442\u0438\u043C ",
        "\u0414\u0430\u043D\u043E ",
        "\u041F\u0443\u0441\u0442\u044C "
      ],
      name: "Russian",
      native: "\u0440\u0443\u0441\u0441\u043A\u0438\u0439",
      rule: [
        "\u041F\u0440\u0430\u0432\u0438\u043B\u043E"
      ],
      scenario: [
        "\u041F\u0440\u0438\u043C\u0435\u0440",
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439"
      ],
      scenarioOutline: [
        "\u0421\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u044F",
        "\u0428\u0430\u0431\u043B\u043E\u043D \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u044F"
      ],
      then: [
        "* ",
        "\u0422\u043E ",
        "\u0417\u0430\u0442\u0435\u043C ",
        "\u0422\u043E\u0433\u0434\u0430 "
      ],
      when: [
        "* ",
        "\u041A\u043E\u0433\u0434\u0430 ",
        "\u0415\u0441\u043B\u0438 "
      ]
    },
    sk: {
      and: [
        "* ",
        "A ",
        "A tie\u017E ",
        "A taktie\u017E ",
        "A z\xE1rove\u0148 "
      ],
      background: [
        "Pozadie"
      ],
      but: [
        "* ",
        "Ale "
      ],
      examples: [
        "Pr\xEDklady"
      ],
      feature: [
        "Po\u017Eiadavka",
        "Funkcia",
        "Vlastnos\u0165"
      ],
      given: [
        "* ",
        "Pokia\u013E ",
        "Za predpokladu "
      ],
      name: "Slovak",
      native: "Slovensky",
      rule: [
        "Rule"
      ],
      scenario: [
        "Pr\xEDklad",
        "Scen\xE1r"
      ],
      scenarioOutline: [
        "N\xE1\u010Drt Scen\xE1ru",
        "N\xE1\u010Drt Scen\xE1ra",
        "Osnova Scen\xE1ra"
      ],
      then: [
        "* ",
        "Tak ",
        "Potom "
      ],
      when: [
        "* ",
        "Ke\u010F ",
        "Ak "
      ]
    },
    sl: {
      and: [
        "In ",
        "Ter "
      ],
      background: [
        "Kontekst",
        "Osnova",
        "Ozadje"
      ],
      but: [
        "Toda ",
        "Ampak ",
        "Vendar "
      ],
      examples: [
        "Primeri",
        "Scenariji"
      ],
      feature: [
        "Funkcionalnost",
        "Funkcija",
        "Mo\u017Enosti",
        "Moznosti",
        "Lastnost",
        "Zna\u010Dilnost"
      ],
      given: [
        "Dano ",
        "Podano ",
        "Zaradi ",
        "Privzeto "
      ],
      name: "Slovenian",
      native: "Slovenski",
      rule: [
        "Rule"
      ],
      scenario: [
        "Primer",
        "Scenarij"
      ],
      scenarioOutline: [
        "Struktura scenarija",
        "Skica",
        "Koncept",
        "Oris scenarija",
        "Osnutek"
      ],
      then: [
        "Nato ",
        "Potem ",
        "Takrat "
      ],
      when: [
        "Ko ",
        "Ce ",
        "\u010Ce ",
        "Kadar "
      ]
    },
    "sr-Cyrl": {
      and: [
        "* ",
        "\u0418 "
      ],
      background: [
        "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442",
        "\u041E\u0441\u043D\u043E\u0432\u0430",
        "\u041F\u043E\u0437\u0430\u0434\u0438\u043D\u0430"
      ],
      but: [
        "* ",
        "\u0410\u043B\u0438 "
      ],
      examples: [
        "\u041F\u0440\u0438\u043C\u0435\u0440\u0438",
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0458\u0438"
      ],
      feature: [
        "\u0424\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B\u043D\u043E\u0441\u0442",
        "\u041C\u043E\u0433\u0443\u045B\u043D\u043E\u0441\u0442",
        "\u041E\u0441\u043E\u0431\u0438\u043D\u0430"
      ],
      given: [
        "* ",
        "\u0417\u0430 \u0434\u0430\u0442\u043E ",
        "\u0417\u0430 \u0434\u0430\u0442\u0435 ",
        "\u0417\u0430 \u0434\u0430\u0442\u0438 "
      ],
      name: "Serbian",
      native: "\u0421\u0440\u043F\u0441\u043A\u0438",
      rule: [
        "\u041F\u0440\u0430\u0432\u0438\u043B\u043E"
      ],
      scenario: [
        "\u041F\u0440\u0438\u043C\u0435\u0440",
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u043E",
        "\u041F\u0440\u0438\u043C\u0435\u0440"
      ],
      scenarioOutline: [
        "\u0421\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0458\u0430",
        "\u0421\u043A\u0438\u0446\u0430",
        "\u041A\u043E\u043D\u0446\u0435\u043F\u0442"
      ],
      then: [
        "* ",
        "\u041E\u043D\u0434\u0430 "
      ],
      when: [
        "* ",
        "\u041A\u0430\u0434\u0430 ",
        "\u041A\u0430\u0434 "
      ]
    },
    "sr-Latn": {
      and: [
        "* ",
        "I "
      ],
      background: [
        "Kontekst",
        "Osnova",
        "Pozadina"
      ],
      but: [
        "* ",
        "Ali "
      ],
      examples: [
        "Primeri",
        "Scenariji"
      ],
      feature: [
        "Funkcionalnost",
        "Mogu\u0107nost",
        "Mogucnost",
        "Osobina"
      ],
      given: [
        "* ",
        "Za dato ",
        "Za date ",
        "Za dati "
      ],
      name: "Serbian (Latin)",
      native: "Srpski (Latinica)",
      rule: [
        "Pravilo"
      ],
      scenario: [
        "Scenario",
        "Primer"
      ],
      scenarioOutline: [
        "Struktura scenarija",
        "Skica",
        "Koncept"
      ],
      then: [
        "* ",
        "Onda "
      ],
      when: [
        "* ",
        "Kada ",
        "Kad "
      ]
    },
    sv: {
      and: [
        "* ",
        "Och "
      ],
      background: [
        "Bakgrund"
      ],
      but: [
        "* ",
        "Men "
      ],
      examples: [
        "Exempel"
      ],
      feature: [
        "Egenskap"
      ],
      given: [
        "* ",
        "Givet "
      ],
      name: "Swedish",
      native: "Svenska",
      rule: [
        "Regel"
      ],
      scenario: [
        "Scenario"
      ],
      scenarioOutline: [
        "Abstrakt Scenario",
        "Scenariomall"
      ],
      then: [
        "* ",
        "S\xE5 "
      ],
      when: [
        "* ",
        "N\xE4r "
      ]
    },
    ta: {
      and: [
        "* ",
        "\u0BAE\u0BC7\u0BB2\u0BC1\u0BAE\u0BCD  ",
        "\u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD "
      ],
      background: [
        "\u0BAA\u0BBF\u0BA9\u0BCD\u0BA9\u0BA3\u0BBF"
      ],
      but: [
        "* ",
        "\u0B86\u0BA9\u0BBE\u0BB2\u0BCD  "
      ],
      examples: [
        "\u0B8E\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0B95\u0BCD\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0B95\u0BB3\u0BCD",
        "\u0B95\u0BBE\u0B9F\u0BCD\u0B9A\u0BBF\u0B95\u0BB3\u0BCD",
        "\u0BA8\u0BBF\u0BB2\u0BC8\u0BAE\u0BC8\u0B95\u0BB3\u0BBF\u0BB2\u0BCD"
      ],
      feature: [
        "\u0B85\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
        "\u0BB5\u0BA3\u0BBF\u0B95 \u0BA4\u0BC7\u0BB5\u0BC8",
        "\u0BA4\u0BBF\u0BB1\u0BA9\u0BCD"
      ],
      given: [
        "* ",
        "\u0B95\u0BC6\u0BBE\u0B9F\u0BC1\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F "
      ],
      name: "Tamil",
      native: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0B89\u0BA4\u0BBE\u0BB0\u0BA3\u0BAE\u0BBE\u0B95",
        "\u0B95\u0BBE\u0B9F\u0BCD\u0B9A\u0BBF"
      ],
      scenarioOutline: [
        "\u0B95\u0BBE\u0B9F\u0BCD\u0B9A\u0BBF \u0B9A\u0BC1\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BAE\u0BCD",
        "\u0B95\u0BBE\u0B9F\u0BCD\u0B9A\u0BBF \u0BB5\u0BBE\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BC1\u0BB0\u0BC1"
      ],
      then: [
        "* ",
        "\u0B85\u0BAA\u0BCD\u0BAA\u0BC6\u0BBE\u0BB4\u0BC1\u0BA4\u0BC1 "
      ],
      when: [
        "* ",
        "\u0B8E\u0BAA\u0BCD\u0BAA\u0BC7\u0BBE\u0BA4\u0BC1 "
      ]
    },
    th: {
      and: [
        "* ",
        "\u0E41\u0E25\u0E30 "
      ],
      background: [
        "\u0E41\u0E19\u0E27\u0E04\u0E34\u0E14"
      ],
      but: [
        "* ",
        "\u0E41\u0E15\u0E48 "
      ],
      examples: [
        "\u0E0A\u0E38\u0E14\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07",
        "\u0E0A\u0E38\u0E14\u0E02\u0E2D\u0E07\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E32\u0E23\u0E13\u0E4C"
      ],
      feature: [
        "\u0E42\u0E04\u0E23\u0E07\u0E2B\u0E25\u0E31\u0E01",
        "\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E17\u0E32\u0E07\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08",
        "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16"
      ],
      given: [
        "* ",
        "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E43\u0E2B\u0E49 "
      ],
      name: "Thai",
      native: "\u0E44\u0E17\u0E22",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E32\u0E23\u0E13\u0E4C"
      ],
      scenarioOutline: [
        "\u0E2A\u0E23\u0E38\u0E1B\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E32\u0E23\u0E13\u0E4C",
        "\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E32\u0E23\u0E13\u0E4C"
      ],
      then: [
        "* ",
        "\u0E14\u0E31\u0E07\u0E19\u0E31\u0E49\u0E19 "
      ],
      when: [
        "* ",
        "\u0E40\u0E21\u0E37\u0E48\u0E2D "
      ]
    },
    te: {
      and: [
        "* ",
        "\u0C2E\u0C30\u0C3F\u0C2F\u0C41 "
      ],
      background: [
        "\u0C28\u0C47\u0C2A\u0C25\u0C4D\u0C2F\u0C02"
      ],
      but: [
        "* ",
        "\u0C15\u0C3E\u0C28\u0C3F "
      ],
      examples: [
        "\u0C09\u0C26\u0C3E\u0C39\u0C30\u0C23\u0C32\u0C41"
      ],
      feature: [
        "\u0C17\u0C41\u0C23\u0C2E\u0C41"
      ],
      given: [
        "* ",
        "\u0C1A\u0C46\u0C2A\u0C4D\u0C2A\u0C2C\u0C21\u0C3F\u0C28\u0C26\u0C3F "
      ],
      name: "Telugu",
      native: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0C09\u0C26\u0C3E\u0C39\u0C30\u0C23",
        "\u0C38\u0C28\u0C4D\u0C28\u0C3F\u0C35\u0C47\u0C36\u0C02"
      ],
      scenarioOutline: [
        "\u0C15\u0C25\u0C28\u0C02"
      ],
      then: [
        "* ",
        "\u0C05\u0C2A\u0C4D\u0C2A\u0C41\u0C21\u0C41 "
      ],
      when: [
        "* ",
        "\u0C08 \u0C2A\u0C30\u0C3F\u0C38\u0C4D\u0C25\u0C3F\u0C24\u0C3F\u0C32\u0C4B "
      ]
    },
    tlh: {
      and: [
        "* ",
        "'ej ",
        "latlh "
      ],
      background: [
        "mo'"
      ],
      but: [
        "* ",
        "'ach ",
        "'a "
      ],
      examples: [
        "ghantoH",
        "lutmey"
      ],
      feature: [
        "Qap",
        "Qu'meH 'ut",
        "perbogh",
        "poQbogh malja'",
        "laH"
      ],
      given: [
        "* ",
        "ghu' noblu' ",
        "DaH ghu' bejlu' "
      ],
      name: "Klingon",
      native: "tlhIngan",
      rule: [
        "Rule"
      ],
      scenario: [
        "lut"
      ],
      scenarioOutline: [
        "lut chovnatlh"
      ],
      then: [
        "* ",
        "vaj "
      ],
      when: [
        "* ",
        "qaSDI' "
      ]
    },
    tr: {
      and: [
        "* ",
        "Ve "
      ],
      background: [
        "Ge\xE7mi\u015F"
      ],
      but: [
        "* ",
        "Fakat ",
        "Ama "
      ],
      examples: [
        "\xD6rnekler"
      ],
      feature: [
        "\xD6zellik"
      ],
      given: [
        "* ",
        "Diyelim ki "
      ],
      name: "Turkish",
      native: "T\xFCrk\xE7e",
      rule: [
        "Kural"
      ],
      scenario: [
        "\xD6rnek",
        "Senaryo"
      ],
      scenarioOutline: [
        "Senaryo tasla\u011F\u0131"
      ],
      then: [
        "* ",
        "O zaman "
      ],
      when: [
        "* ",
        "E\u011Fer ki "
      ]
    },
    tt: {
      and: [
        "* ",
        "\u04BA\u04D9\u043C ",
        "\u0412\u04D9 "
      ],
      background: [
        "\u041A\u0435\u0440\u0435\u0448"
      ],
      but: [
        "* ",
        "\u041B\u04D9\u043A\u0438\u043D ",
        "\u04D8\u043C\u043C\u0430 "
      ],
      examples: [
        "\u04AE\u0440\u043D\u04D9\u043A\u043B\u04D9\u0440",
        "\u041C\u0438\u0441\u0430\u043B\u043B\u0430\u0440"
      ],
      feature: [
        "\u041C\u04E9\u043C\u043A\u0438\u043D\u043B\u0435\u043A",
        "\u04AE\u0437\u0435\u043D\u0447\u04D9\u043B\u0435\u043A\u043B\u0435\u043B\u0435\u043A"
      ],
      given: [
        "* ",
        "\u04D8\u0439\u0442\u0438\u043A "
      ],
      name: "Tatar",
      native: "\u0422\u0430\u0442\u0430\u0440\u0447\u0430",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439"
      ],
      scenarioOutline: [
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439\u043D\u044B\u04A3 \u0442\u04E9\u0437\u0435\u043B\u0435\u0448\u0435"
      ],
      then: [
        "* ",
        "\u041D\u04D9\u0442\u0438\u0497\u04D9\u0434\u04D9 "
      ],
      when: [
        "* ",
        "\u04D8\u0433\u04D9\u0440 "
      ]
    },
    uk: {
      and: [
        "* ",
        "\u0406 ",
        "\u0410 \u0442\u0430\u043A\u043E\u0436 ",
        "\u0422\u0430 "
      ],
      background: [
        "\u041F\u0435\u0440\u0435\u0434\u0443\u043C\u043E\u0432\u0430"
      ],
      but: [
        "* ",
        "\u0410\u043B\u0435 "
      ],
      examples: [
        "\u041F\u0440\u0438\u043A\u043B\u0430\u0434\u0438"
      ],
      feature: [
        "\u0424\u0443\u043D\u043A\u0446\u0456\u043E\u043D\u0430\u043B"
      ],
      given: [
        "* ",
        "\u041F\u0440\u0438\u043F\u0443\u0441\u0442\u0438\u043C\u043E ",
        "\u041F\u0440\u0438\u043F\u0443\u0441\u0442\u0438\u043C\u043E, \u0449\u043E ",
        "\u041D\u0435\u0445\u0430\u0439 ",
        "\u0414\u0430\u043D\u043E "
      ],
      name: "Ukrainian",
      native: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u041F\u0440\u0438\u043A\u043B\u0430\u0434",
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0456\u0439"
      ],
      scenarioOutline: [
        "\u0421\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0441\u0446\u0435\u043D\u0430\u0440\u0456\u044E"
      ],
      then: [
        "* ",
        "\u0422\u043E ",
        "\u0422\u043E\u0434\u0456 "
      ],
      when: [
        "* ",
        "\u042F\u043A\u0449\u043E ",
        "\u041A\u043E\u043B\u0438 "
      ]
    },
    ur: {
      and: [
        "* ",
        "\u0627\u0648\u0631 "
      ],
      background: [
        "\u067E\u0633 \u0645\u0646\u0638\u0631"
      ],
      but: [
        "* ",
        "\u0644\u06CC\u06A9\u0646 "
      ],
      examples: [
        "\u0645\u062B\u0627\u0644\u06CC\u06BA"
      ],
      feature: [
        "\u0635\u0644\u0627\u062D\u06CC\u062A",
        "\u06A9\u0627\u0631\u0648\u0628\u0627\u0631 \u06A9\u06CC \u0636\u0631\u0648\u0631\u062A",
        "\u062E\u0635\u0648\u0635\u06CC\u062A"
      ],
      given: [
        "* ",
        "\u0627\u06AF\u0631 ",
        "\u0628\u0627\u0644\u0641\u0631\u0636 ",
        "\u0641\u0631\u0636 \u06A9\u06CC\u0627 "
      ],
      name: "Urdu",
      native: "\u0627\u0631\u062F\u0648",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0645\u0646\u0638\u0631\u0646\u0627\u0645\u06C1"
      ],
      scenarioOutline: [
        "\u0645\u0646\u0638\u0631 \u0646\u0627\u0645\u06D2 \u06A9\u0627 \u062E\u0627\u06A9\u06C1"
      ],
      then: [
        "* ",
        "\u067E\u06BE\u0631 ",
        "\u062A\u0628 "
      ],
      when: [
        "* ",
        "\u062C\u0628 "
      ]
    },
    uz: {
      and: [
        "* ",
        "\u0412\u0430 "
      ],
      background: [
        "\u0422\u0430\u0440\u0438\u0445"
      ],
      but: [
        "* ",
        "\u041B\u0435\u043A\u0438\u043D ",
        "\u0411\u0438\u0440\u043E\u043A ",
        "\u0410\u043C\u043C\u043E "
      ],
      examples: [
        "\u041C\u0438\u0441\u043E\u043B\u043B\u0430\u0440"
      ],
      feature: [
        "\u0424\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B"
      ],
      given: [
        "* ",
        "Belgilangan "
      ],
      name: "Uzbek",
      native: "\u0423\u0437\u0431\u0435\u043A\u0447\u0430",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439"
      ],
      scenarioOutline: [
        "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430\u0441\u0438"
      ],
      then: [
        "* ",
        "\u0423\u043D\u0434\u0430 "
      ],
      when: [
        "* ",
        "\u0410\u0433\u0430\u0440 "
      ]
    },
    vi: {
      and: [
        "* ",
        "V\xE0 "
      ],
      background: [
        "B\u1ED1i c\u1EA3nh"
      ],
      but: [
        "* ",
        "Nh\u01B0ng "
      ],
      examples: [
        "D\u1EEF li\u1EC7u"
      ],
      feature: [
        "T\xEDnh n\u0103ng"
      ],
      given: [
        "* ",
        "Bi\u1EBFt ",
        "Cho "
      ],
      name: "Vietnamese",
      native: "Ti\u1EBFng Vi\u1EC7t",
      rule: [
        "Quy t\u1EAFc"
      ],
      scenario: [
        "T\xECnh hu\u1ED1ng",
        "K\u1ECBch b\u1EA3n"
      ],
      scenarioOutline: [
        "Khung t\xECnh hu\u1ED1ng",
        "Khung k\u1ECBch b\u1EA3n"
      ],
      then: [
        "* ",
        "Th\xEC "
      ],
      when: [
        "* ",
        "Khi "
      ]
    },
    "zh-CN": {
      and: [
        "* ",
        "\u800C\u4E14",
        "\u5E76\u4E14",
        "\u540C\u65F6"
      ],
      background: [
        "\u80CC\u666F"
      ],
      but: [
        "* ",
        "\u4F46\u662F"
      ],
      examples: [
        "\u4F8B\u5B50"
      ],
      feature: [
        "\u529F\u80FD"
      ],
      given: [
        "* ",
        "\u5047\u5982",
        "\u5047\u8BBE",
        "\u5047\u5B9A"
      ],
      name: "Chinese simplified",
      native: "\u7B80\u4F53\u4E2D\u6587",
      rule: [
        "Rule",
        "\u89C4\u5219"
      ],
      scenario: [
        "\u573A\u666F",
        "\u5267\u672C"
      ],
      scenarioOutline: [
        "\u573A\u666F\u5927\u7EB2",
        "\u5267\u672C\u5927\u7EB2"
      ],
      then: [
        "* ",
        "\u90A3\u4E48"
      ],
      when: [
        "* ",
        "\u5F53"
      ]
    },
    ml: {
      and: [
        "* ",
        "\u0D12\u0D2A\u0D4D\u0D2A\u0D02"
      ],
      background: [
        "\u0D2A\u0D36\u0D4D\u0D1A\u0D3E\u0D24\u0D4D\u0D24\u0D32\u0D02"
      ],
      but: [
        "* ",
        "\u0D2A\u0D15\u0D4D\u0D37\u0D47"
      ],
      examples: [
        "\u0D09\u0D26\u0D3E\u0D39\u0D30\u0D23\u0D19\u0D4D\u0D19\u0D7E"
      ],
      feature: [
        "\u0D38\u0D35\u0D3F\u0D36\u0D47\u0D37\u0D24"
      ],
      given: [
        "* ",
        "\u0D28\u0D7D\u0D15\u0D3F\u0D2F\u0D24\u0D4D"
      ],
      name: "Malayalam",
      native: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02",
      rule: [
        "\u0D28\u0D3F\u0D2F\u0D2E\u0D02"
      ],
      scenario: [
        "\u0D30\u0D02\u0D17\u0D02"
      ],
      scenarioOutline: [
        "\u0D38\u0D3E\u0D39\u0D1A\u0D30\u0D4D\u0D2F\u0D24\u0D4D\u0D24\u0D3F\u0D28\u0D4D\u0D31\u0D46 \u0D30\u0D42\u0D2A\u0D30\u0D47\u0D16"
      ],
      then: [
        "* ",
        "\u0D2A\u0D3F\u0D28\u0D4D\u0D28\u0D46"
      ],
      when: [
        "\u0D0E\u0D2A\u0D4D\u0D2A\u0D47\u0D3E\u0D7E"
      ]
    },
    "zh-TW": {
      and: [
        "* ",
        "\u800C\u4E14",
        "\u4E26\u4E14",
        "\u540C\u6642"
      ],
      background: [
        "\u80CC\u666F"
      ],
      but: [
        "* ",
        "\u4F46\u662F"
      ],
      examples: [
        "\u4F8B\u5B50"
      ],
      feature: [
        "\u529F\u80FD"
      ],
      given: [
        "* ",
        "\u5047\u5982",
        "\u5047\u8A2D",
        "\u5047\u5B9A"
      ],
      name: "Chinese traditional",
      native: "\u7E41\u9AD4\u4E2D\u6587",
      rule: [
        "Rule"
      ],
      scenario: [
        "\u5834\u666F",
        "\u5287\u672C"
      ],
      scenarioOutline: [
        "\u5834\u666F\u5927\u7DB1",
        "\u5287\u672C\u5927\u7DB1"
      ],
      then: [
        "* ",
        "\u90A3\u9EBC"
      ],
      when: [
        "* ",
        "\u7576"
      ]
    },
    mr: {
      and: [
        "* ",
        "\u0906\u0923\u093F ",
        "\u0924\u0938\u0947\u091A "
      ],
      background: [
        "\u092A\u093E\u0930\u094D\u0936\u094D\u0935\u092D\u0942\u092E\u0940"
      ],
      but: [
        "* ",
        "\u092A\u0923 ",
        "\u092A\u0930\u0902\u0924\u0941 "
      ],
      examples: [
        "\u0909\u0926\u093E\u0939\u0930\u0923"
      ],
      feature: [
        "\u0935\u0948\u0936\u093F\u0937\u094D\u091F\u094D\u092F",
        "\u0938\u0941\u0935\u093F\u0927\u093E"
      ],
      given: [
        "* ",
        "\u091C\u0930",
        "\u0926\u093F\u0932\u0947\u0932\u094D\u092F\u093E \u092A\u094D\u0930\u092E\u093E\u0923\u0947 "
      ],
      name: "Marathi",
      native: "\u092E\u0930\u093E\u0920\u0940",
      rule: [
        "\u0928\u093F\u092F\u092E"
      ],
      scenario: [
        "\u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F"
      ],
      scenarioOutline: [
        "\u092A\u0930\u093F\u0926\u0943\u0936\u094D\u092F \u0930\u0942\u092A\u0930\u0947\u0916\u093E"
      ],
      then: [
        "* ",
        "\u092E\u0917 ",
        "\u0924\u0947\u0935\u094D\u0939\u093E "
      ],
      when: [
        "* ",
        "\u091C\u0947\u0935\u094D\u0939\u093E "
      ]
    },
    amh: {
      and: [
        "* ",
        "\u12A5\u1293 "
      ],
      background: [
        "\u1245\u12F5\u1218 \u1201\u1294\u1273",
        "\u1218\u1290\u123B",
        "\u1218\u1290\u123B \u1200\u1233\u1265"
      ],
      but: [
        "* ",
        "\u130D\u1295 "
      ],
      examples: [
        "\u121D\u1233\u120C\u12CE\u127D",
        "\u1201\u1293\u1274\u12CE\u127D"
      ],
      feature: [
        "\u1235\u122B",
        "\u12E8\u1270\u1348\u1208\u1308\u12CD \u1235\u122B",
        "\u12E8\u121A\u1348\u1208\u1308\u12CD \u12F5\u122D\u130A\u1275"
      ],
      given: [
        "* ",
        "\u12E8\u1270\u1230\u1320 "
      ],
      name: "Amharic",
      native: "\u12A0\u121B\u122D\u129B",
      rule: [
        "\u1205\u130D"
      ],
      scenario: [
        "\u121D\u1233\u120C",
        "\u1201\u1293\u1274"
      ],
      scenarioOutline: [
        "\u1201\u1293\u1274 \u12DD\u122D\u12DD\u122D",
        "\u1201\u1293\u1274 \u12A0\u1265\u1290\u1275"
      ],
      then: [
        "* ",
        "\u12A8\u12DA\u12EB "
      ],
      when: [
        "* ",
        "\u1218\u127C "
      ]
    }
  };
});

// node_modules/@cucumber/gherkin/node_modules/@cucumber/messages/dist/cjs/src/TimeConversion.js
var require_TimeConversion = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.addDurations = exports.durationToMilliseconds = exports.timestampToMillisecondsSinceEpoch = exports.millisecondsToDuration = exports.millisecondsSinceEpochToTimestamp = undefined;
  var MILLISECONDS_PER_SECOND = 1000;
  var NANOSECONDS_PER_MILLISECOND = 1e6;
  var NANOSECONDS_PER_SECOND = 1e9;
  function millisecondsSinceEpochToTimestamp(millisecondsSinceEpoch) {
    return toSecondsAndNanos(millisecondsSinceEpoch);
  }
  exports.millisecondsSinceEpochToTimestamp = millisecondsSinceEpochToTimestamp;
  function millisecondsToDuration(durationInMilliseconds) {
    return toSecondsAndNanos(durationInMilliseconds);
  }
  exports.millisecondsToDuration = millisecondsToDuration;
  function timestampToMillisecondsSinceEpoch(timestamp) {
    var { seconds, nanos } = timestamp;
    return toMillis(seconds, nanos);
  }
  exports.timestampToMillisecondsSinceEpoch = timestampToMillisecondsSinceEpoch;
  function durationToMilliseconds(duration) {
    var { seconds, nanos } = duration;
    return toMillis(seconds, nanos);
  }
  exports.durationToMilliseconds = durationToMilliseconds;
  function addDurations(durationA, durationB) {
    var seconds = +durationA.seconds + +durationB.seconds;
    var nanos = durationA.nanos + durationB.nanos;
    if (nanos >= NANOSECONDS_PER_SECOND) {
      seconds += 1;
      nanos -= NANOSECONDS_PER_SECOND;
    }
    return { seconds, nanos };
  }
  exports.addDurations = addDurations;
  function toSecondsAndNanos(milliseconds) {
    var seconds = Math.floor(milliseconds / MILLISECONDS_PER_SECOND);
    var nanos = Math.floor(milliseconds % MILLISECONDS_PER_SECOND * NANOSECONDS_PER_MILLISECOND);
    return { seconds, nanos };
  }
  function toMillis(seconds, nanos) {
    var secondMillis = +seconds * MILLISECONDS_PER_SECOND;
    var nanoMillis = nanos / NANOSECONDS_PER_MILLISECOND;
    return secondMillis + nanoMillis;
  }
});

// node_modules/uuid/dist/rng.js
var require_rng = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = rng;
  var _crypto = _interopRequireDefault(__require("crypto"));
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var rnds8Pool = new Uint8Array(256);
  var poolPtr = rnds8Pool.length;
  function rng() {
    if (poolPtr > rnds8Pool.length - 16) {
      _crypto.default.randomFillSync(rnds8Pool);
      poolPtr = 0;
    }
    return rnds8Pool.slice(poolPtr, poolPtr += 16);
  }
});

// node_modules/uuid/dist/regex.js
var require_regex = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
  exports.default = _default;
});

// node_modules/uuid/dist/validate.js
var require_validate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _regex = _interopRequireDefault(require_regex());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function validate(uuid) {
    return typeof uuid === "string" && _regex.default.test(uuid);
  }
  var _default = validate;
  exports.default = _default;
});

// node_modules/uuid/dist/stringify.js
var require_stringify = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  exports.unsafeStringify = unsafeStringify;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var byteToHex = [];
  for (let i = 0;i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  function unsafeStringify(arr, offset = 0) {
    return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
  }
  function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Stringified UUID is invalid");
    }
    return uuid;
  }
  var _default = stringify;
  exports.default = _default;
});

// node_modules/uuid/dist/v1.js
var require_v1 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _rng = _interopRequireDefault(require_rng());
  var _stringify = require_stringify();
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _nodeId;
  var _clockseq;
  var _lastMSecs = 0;
  var _lastNSecs = 0;
  function v1(options, buf, offset) {
    let i = buf && offset || 0;
    const b = buf || new Array(16);
    options = options || {};
    let node = options.node || _nodeId;
    let clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;
    if (node == null || clockseq == null) {
      const seedBytes = options.random || (options.rng || _rng.default)();
      if (node == null) {
        node = _nodeId = [seedBytes[0] | 1, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
      }
      if (clockseq == null) {
        clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
      }
    }
    let msecs = options.msecs !== undefined ? options.msecs : Date.now();
    let nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;
    const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
    if (dt < 0 && options.clockseq === undefined) {
      clockseq = clockseq + 1 & 16383;
    }
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
      nsecs = 0;
    }
    if (nsecs >= 1e4) {
      throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
    }
    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;
    msecs += 12219292800000;
    const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
    b[i++] = tl >>> 24 & 255;
    b[i++] = tl >>> 16 & 255;
    b[i++] = tl >>> 8 & 255;
    b[i++] = tl & 255;
    const tmh = msecs / 4294967296 * 1e4 & 268435455;
    b[i++] = tmh >>> 8 & 255;
    b[i++] = tmh & 255;
    b[i++] = tmh >>> 24 & 15 | 16;
    b[i++] = tmh >>> 16 & 255;
    b[i++] = clockseq >>> 8 | 128;
    b[i++] = clockseq & 255;
    for (let n = 0;n < 6; ++n) {
      b[i + n] = node[n];
    }
    return buf || (0, _stringify.unsafeStringify)(b);
  }
  var _default = v1;
  exports.default = _default;
});

// node_modules/uuid/dist/parse.js
var require_parse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function parse(uuid) {
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Invalid UUID");
    }
    let v;
    const arr = new Uint8Array(16);
    arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
    arr[1] = v >>> 16 & 255;
    arr[2] = v >>> 8 & 255;
    arr[3] = v & 255;
    arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
    arr[5] = v & 255;
    arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
    arr[7] = v & 255;
    arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
    arr[9] = v & 255;
    arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
    arr[11] = v / 4294967296 & 255;
    arr[12] = v >>> 24 & 255;
    arr[13] = v >>> 16 & 255;
    arr[14] = v >>> 8 & 255;
    arr[15] = v & 255;
    return arr;
  }
  var _default = parse;
  exports.default = _default;
});

// node_modules/uuid/dist/v35.js
var require_v35 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.URL = exports.DNS = undefined;
  exports.default = v35;
  var _stringify = require_stringify();
  var _parse = _interopRequireDefault(require_parse());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function stringToBytes(str) {
    str = unescape(encodeURIComponent(str));
    const bytes = [];
    for (let i = 0;i < str.length; ++i) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }
  var DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  exports.DNS = DNS;
  var URL2 = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
  exports.URL = URL2;
  function v35(name, version, hashfunc) {
    function generateUUID(value, namespace, buf, offset) {
      var _namespace;
      if (typeof value === "string") {
        value = stringToBytes(value);
      }
      if (typeof namespace === "string") {
        namespace = (0, _parse.default)(namespace);
      }
      if (((_namespace = namespace) === null || _namespace === undefined ? undefined : _namespace.length) !== 16) {
        throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
      }
      let bytes = new Uint8Array(16 + value.length);
      bytes.set(namespace);
      bytes.set(value, namespace.length);
      bytes = hashfunc(bytes);
      bytes[6] = bytes[6] & 15 | version;
      bytes[8] = bytes[8] & 63 | 128;
      if (buf) {
        offset = offset || 0;
        for (let i = 0;i < 16; ++i) {
          buf[offset + i] = bytes[i];
        }
        return buf;
      }
      return (0, _stringify.unsafeStringify)(bytes);
    }
    try {
      generateUUID.name = name;
    } catch (err) {}
    generateUUID.DNS = DNS;
    generateUUID.URL = URL2;
    return generateUUID;
  }
});

// node_modules/uuid/dist/md5.js
var require_md5 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _crypto = _interopRequireDefault(__require("crypto"));
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function md5(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _crypto.default.createHash("md5").update(bytes).digest();
  }
  var _default = md5;
  exports.default = _default;
});

// node_modules/uuid/dist/v3.js
var require_v3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _v = _interopRequireDefault(require_v35());
  var _md = _interopRequireDefault(require_md5());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var v3 = (0, _v.default)("v3", 48, _md.default);
  var _default = v3;
  exports.default = _default;
});

// node_modules/uuid/dist/native.js
var require_native = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _crypto = _interopRequireDefault(__require("crypto"));
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _default = {
    randomUUID: _crypto.default.randomUUID
  };
  exports.default = _default;
});

// node_modules/uuid/dist/v4.js
var require_v4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _native = _interopRequireDefault(require_native());
  var _rng = _interopRequireDefault(require_rng());
  var _stringify = require_stringify();
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function v4(options, buf, offset) {
    if (_native.default.randomUUID && !buf && !options) {
      return _native.default.randomUUID();
    }
    options = options || {};
    const rnds = options.random || (options.rng || _rng.default)();
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    if (buf) {
      offset = offset || 0;
      for (let i = 0;i < 16; ++i) {
        buf[offset + i] = rnds[i];
      }
      return buf;
    }
    return (0, _stringify.unsafeStringify)(rnds);
  }
  var _default = v4;
  exports.default = _default;
});

// node_modules/uuid/dist/sha1.js
var require_sha1 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _crypto = _interopRequireDefault(__require("crypto"));
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function sha1(bytes) {
    if (Array.isArray(bytes)) {
      bytes = Buffer.from(bytes);
    } else if (typeof bytes === "string") {
      bytes = Buffer.from(bytes, "utf8");
    }
    return _crypto.default.createHash("sha1").update(bytes).digest();
  }
  var _default = sha1;
  exports.default = _default;
});

// node_modules/uuid/dist/v5.js
var require_v5 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _v = _interopRequireDefault(require_v35());
  var _sha = _interopRequireDefault(require_sha1());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var v5 = (0, _v.default)("v5", 80, _sha.default);
  var _default = v5;
  exports.default = _default;
});

// node_modules/uuid/dist/nil.js
var require_nil = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _default = "00000000-0000-0000-0000-000000000000";
  exports.default = _default;
});

// node_modules/uuid/dist/version.js
var require_version = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _validate = _interopRequireDefault(require_validate());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function version(uuid) {
    if (!(0, _validate.default)(uuid)) {
      throw TypeError("Invalid UUID");
    }
    return parseInt(uuid.slice(14, 15), 16);
  }
  var _default = version;
  exports.default = _default;
});

// node_modules/uuid/dist/index.js
var require_dist = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "NIL", {
    enumerable: true,
    get: function() {
      return _nil.default;
    }
  });
  Object.defineProperty(exports, "parse", {
    enumerable: true,
    get: function() {
      return _parse.default;
    }
  });
  Object.defineProperty(exports, "stringify", {
    enumerable: true,
    get: function() {
      return _stringify.default;
    }
  });
  Object.defineProperty(exports, "v1", {
    enumerable: true,
    get: function() {
      return _v.default;
    }
  });
  Object.defineProperty(exports, "v3", {
    enumerable: true,
    get: function() {
      return _v2.default;
    }
  });
  Object.defineProperty(exports, "v4", {
    enumerable: true,
    get: function() {
      return _v3.default;
    }
  });
  Object.defineProperty(exports, "v5", {
    enumerable: true,
    get: function() {
      return _v4.default;
    }
  });
  Object.defineProperty(exports, "validate", {
    enumerable: true,
    get: function() {
      return _validate.default;
    }
  });
  Object.defineProperty(exports, "version", {
    enumerable: true,
    get: function() {
      return _version.default;
    }
  });
  var _v = _interopRequireDefault(require_v1());
  var _v2 = _interopRequireDefault(require_v3());
  var _v3 = _interopRequireDefault(require_v4());
  var _v4 = _interopRequireDefault(require_v5());
  var _nil = _interopRequireDefault(require_nil());
  var _version = _interopRequireDefault(require_version());
  var _validate = _interopRequireDefault(require_validate());
  var _stringify = _interopRequireDefault(require_stringify());
  var _parse = _interopRequireDefault(require_parse());
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
});

// node_modules/@cucumber/gherkin/node_modules/@cucumber/messages/dist/cjs/src/IdGenerator.js
var require_IdGenerator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.incrementing = exports.uuid = undefined;
  var uuid_1 = require_dist();
  function uuid() {
    return function() {
      return (0, uuid_1.v4)();
    };
  }
  exports.uuid = uuid;
  function incrementing() {
    var next = 0;
    return function() {
      return (next++).toString();
    };
  }
  exports.incrementing = incrementing;
});

// node_modules/class-transformer/cjs/enums/transformation-type.enum.js
var require_transformation_type_enum = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TransformationType = undefined;
  var TransformationType;
  (function(TransformationType2) {
    TransformationType2[TransformationType2["PLAIN_TO_CLASS"] = 0] = "PLAIN_TO_CLASS";
    TransformationType2[TransformationType2["CLASS_TO_PLAIN"] = 1] = "CLASS_TO_PLAIN";
    TransformationType2[TransformationType2["CLASS_TO_CLASS"] = 2] = "CLASS_TO_CLASS";
  })(TransformationType = exports.TransformationType || (exports.TransformationType = {}));
});

// node_modules/class-transformer/cjs/enums/index.js
var require_enums = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_transformation_type_enum(), exports);
});

// node_modules/class-transformer/cjs/MetadataStorage.js
var require_MetadataStorage = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MetadataStorage = undefined;
  var enums_1 = require_enums();

  class MetadataStorage {
    constructor() {
      this._typeMetadatas = new Map;
      this._transformMetadatas = new Map;
      this._exposeMetadatas = new Map;
      this._excludeMetadatas = new Map;
      this._ancestorsMap = new Map;
    }
    addTypeMetadata(metadata) {
      if (!this._typeMetadatas.has(metadata.target)) {
        this._typeMetadatas.set(metadata.target, new Map);
      }
      this._typeMetadatas.get(metadata.target).set(metadata.propertyName, metadata);
    }
    addTransformMetadata(metadata) {
      if (!this._transformMetadatas.has(metadata.target)) {
        this._transformMetadatas.set(metadata.target, new Map);
      }
      if (!this._transformMetadatas.get(metadata.target).has(metadata.propertyName)) {
        this._transformMetadatas.get(metadata.target).set(metadata.propertyName, []);
      }
      this._transformMetadatas.get(metadata.target).get(metadata.propertyName).push(metadata);
    }
    addExposeMetadata(metadata) {
      if (!this._exposeMetadatas.has(metadata.target)) {
        this._exposeMetadatas.set(metadata.target, new Map);
      }
      this._exposeMetadatas.get(metadata.target).set(metadata.propertyName, metadata);
    }
    addExcludeMetadata(metadata) {
      if (!this._excludeMetadatas.has(metadata.target)) {
        this._excludeMetadatas.set(metadata.target, new Map);
      }
      this._excludeMetadatas.get(metadata.target).set(metadata.propertyName, metadata);
    }
    findTransformMetadatas(target, propertyName, transformationType) {
      return this.findMetadatas(this._transformMetadatas, target, propertyName).filter((metadata) => {
        if (!metadata.options)
          return true;
        if (metadata.options.toClassOnly === true && metadata.options.toPlainOnly === true)
          return true;
        if (metadata.options.toClassOnly === true) {
          return transformationType === enums_1.TransformationType.CLASS_TO_CLASS || transformationType === enums_1.TransformationType.PLAIN_TO_CLASS;
        }
        if (metadata.options.toPlainOnly === true) {
          return transformationType === enums_1.TransformationType.CLASS_TO_PLAIN;
        }
        return true;
      });
    }
    findExcludeMetadata(target, propertyName) {
      return this.findMetadata(this._excludeMetadatas, target, propertyName);
    }
    findExposeMetadata(target, propertyName) {
      return this.findMetadata(this._exposeMetadatas, target, propertyName);
    }
    findExposeMetadataByCustomName(target, name) {
      return this.getExposedMetadatas(target).find((metadata) => {
        return metadata.options && metadata.options.name === name;
      });
    }
    findTypeMetadata(target, propertyName) {
      return this.findMetadata(this._typeMetadatas, target, propertyName);
    }
    getStrategy(target) {
      const excludeMap = this._excludeMetadatas.get(target);
      const exclude = excludeMap && excludeMap.get(undefined);
      const exposeMap = this._exposeMetadatas.get(target);
      const expose = exposeMap && exposeMap.get(undefined);
      if (exclude && expose || !exclude && !expose)
        return "none";
      return exclude ? "excludeAll" : "exposeAll";
    }
    getExposedMetadatas(target) {
      return this.getMetadata(this._exposeMetadatas, target);
    }
    getExcludedMetadatas(target) {
      return this.getMetadata(this._excludeMetadatas, target);
    }
    getExposedProperties(target, transformationType) {
      return this.getExposedMetadatas(target).filter((metadata) => {
        if (!metadata.options)
          return true;
        if (metadata.options.toClassOnly === true && metadata.options.toPlainOnly === true)
          return true;
        if (metadata.options.toClassOnly === true) {
          return transformationType === enums_1.TransformationType.CLASS_TO_CLASS || transformationType === enums_1.TransformationType.PLAIN_TO_CLASS;
        }
        if (metadata.options.toPlainOnly === true) {
          return transformationType === enums_1.TransformationType.CLASS_TO_PLAIN;
        }
        return true;
      }).map((metadata) => metadata.propertyName);
    }
    getExcludedProperties(target, transformationType) {
      return this.getExcludedMetadatas(target).filter((metadata) => {
        if (!metadata.options)
          return true;
        if (metadata.options.toClassOnly === true && metadata.options.toPlainOnly === true)
          return true;
        if (metadata.options.toClassOnly === true) {
          return transformationType === enums_1.TransformationType.CLASS_TO_CLASS || transformationType === enums_1.TransformationType.PLAIN_TO_CLASS;
        }
        if (metadata.options.toPlainOnly === true) {
          return transformationType === enums_1.TransformationType.CLASS_TO_PLAIN;
        }
        return true;
      }).map((metadata) => metadata.propertyName);
    }
    clear() {
      this._typeMetadatas.clear();
      this._exposeMetadatas.clear();
      this._excludeMetadatas.clear();
      this._ancestorsMap.clear();
    }
    getMetadata(metadatas, target) {
      const metadataFromTargetMap = metadatas.get(target);
      let metadataFromTarget;
      if (metadataFromTargetMap) {
        metadataFromTarget = Array.from(metadataFromTargetMap.values()).filter((meta) => meta.propertyName !== undefined);
      }
      const metadataFromAncestors = [];
      for (const ancestor of this.getAncestors(target)) {
        const ancestorMetadataMap = metadatas.get(ancestor);
        if (ancestorMetadataMap) {
          const metadataFromAncestor = Array.from(ancestorMetadataMap.values()).filter((meta) => meta.propertyName !== undefined);
          metadataFromAncestors.push(...metadataFromAncestor);
        }
      }
      return metadataFromAncestors.concat(metadataFromTarget || []);
    }
    findMetadata(metadatas, target, propertyName) {
      const metadataFromTargetMap = metadatas.get(target);
      if (metadataFromTargetMap) {
        const metadataFromTarget = metadataFromTargetMap.get(propertyName);
        if (metadataFromTarget) {
          return metadataFromTarget;
        }
      }
      for (const ancestor of this.getAncestors(target)) {
        const ancestorMetadataMap = metadatas.get(ancestor);
        if (ancestorMetadataMap) {
          const ancestorResult = ancestorMetadataMap.get(propertyName);
          if (ancestorResult) {
            return ancestorResult;
          }
        }
      }
      return;
    }
    findMetadatas(metadatas, target, propertyName) {
      const metadataFromTargetMap = metadatas.get(target);
      let metadataFromTarget;
      if (metadataFromTargetMap) {
        metadataFromTarget = metadataFromTargetMap.get(propertyName);
      }
      const metadataFromAncestorsTarget = [];
      for (const ancestor of this.getAncestors(target)) {
        const ancestorMetadataMap = metadatas.get(ancestor);
        if (ancestorMetadataMap) {
          if (ancestorMetadataMap.has(propertyName)) {
            metadataFromAncestorsTarget.push(...ancestorMetadataMap.get(propertyName));
          }
        }
      }
      return metadataFromAncestorsTarget.slice().reverse().concat((metadataFromTarget || []).slice().reverse());
    }
    getAncestors(target) {
      if (!target)
        return [];
      if (!this._ancestorsMap.has(target)) {
        const ancestors = [];
        for (let baseClass = Object.getPrototypeOf(target.prototype.constructor);typeof baseClass.prototype !== "undefined"; baseClass = Object.getPrototypeOf(baseClass.prototype.constructor)) {
          ancestors.push(baseClass);
        }
        this._ancestorsMap.set(target, ancestors);
      }
      return this._ancestorsMap.get(target);
    }
  }
  exports.MetadataStorage = MetadataStorage;
});

// node_modules/class-transformer/cjs/storage.js
var require_storage = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.defaultMetadataStorage = undefined;
  var MetadataStorage_1 = require_MetadataStorage();
  exports.defaultMetadataStorage = new MetadataStorage_1.MetadataStorage;
});

// node_modules/class-transformer/cjs/utils/get-global.util.js
var require_get_global_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getGlobal = undefined;
  function getGlobal() {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof global !== "undefined") {
      return global;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof self !== "undefined") {
      return self;
    }
  }
  exports.getGlobal = getGlobal;
});

// node_modules/class-transformer/cjs/utils/is-promise.util.js
var require_is_promise_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isPromise = undefined;
  function isPromise(p) {
    return p !== null && typeof p === "object" && typeof p.then === "function";
  }
  exports.isPromise = isPromise;
});

// node_modules/class-transformer/cjs/utils/index.js
var require_utils = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_get_global_util(), exports);
  __exportStar(require_is_promise_util(), exports);
});

// node_modules/class-transformer/cjs/TransformOperationExecutor.js
var require_TransformOperationExecutor = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TransformOperationExecutor = undefined;
  var storage_1 = require_storage();
  var enums_1 = require_enums();
  var utils_1 = require_utils();
  function instantiateArrayType(arrayType) {
    const array = new arrayType;
    if (!(array instanceof Set) && !("push" in array)) {
      return [];
    }
    return array;
  }

  class TransformOperationExecutor {
    constructor(transformationType, options) {
      this.transformationType = transformationType;
      this.options = options;
      this.recursionStack = new Set;
    }
    transform(source, value, targetType, arrayType, isMap, level = 0) {
      if (Array.isArray(value) || value instanceof Set) {
        const newValue = arrayType && this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS ? instantiateArrayType(arrayType) : [];
        value.forEach((subValue, index) => {
          const subSource = source ? source[index] : undefined;
          if (!this.options.enableCircularCheck || !this.isCircular(subValue)) {
            let realTargetType;
            if (typeof targetType !== "function" && targetType && targetType.options && targetType.options.discriminator && targetType.options.discriminator.property && targetType.options.discriminator.subTypes) {
              if (this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS) {
                realTargetType = targetType.options.discriminator.subTypes.find((subType) => subType.name === subValue[targetType.options.discriminator.property]);
                const options = { newObject: newValue, object: subValue, property: undefined };
                const newType = targetType.typeFunction(options);
                realTargetType === undefined ? realTargetType = newType : realTargetType = realTargetType.value;
                if (!targetType.options.keepDiscriminatorProperty)
                  delete subValue[targetType.options.discriminator.property];
              }
              if (this.transformationType === enums_1.TransformationType.CLASS_TO_CLASS) {
                realTargetType = subValue.constructor;
              }
              if (this.transformationType === enums_1.TransformationType.CLASS_TO_PLAIN) {
                subValue[targetType.options.discriminator.property] = targetType.options.discriminator.subTypes.find((subType) => subType.value === subValue.constructor).name;
              }
            } else {
              realTargetType = targetType;
            }
            const value2 = this.transform(subSource, subValue, realTargetType, undefined, subValue instanceof Map, level + 1);
            if (newValue instanceof Set) {
              newValue.add(value2);
            } else {
              newValue.push(value2);
            }
          } else if (this.transformationType === enums_1.TransformationType.CLASS_TO_CLASS) {
            if (newValue instanceof Set) {
              newValue.add(subValue);
            } else {
              newValue.push(subValue);
            }
          }
        });
        return newValue;
      } else if (targetType === String && !isMap) {
        if (value === null || value === undefined)
          return value;
        return String(value);
      } else if (targetType === Number && !isMap) {
        if (value === null || value === undefined)
          return value;
        return Number(value);
      } else if (targetType === Boolean && !isMap) {
        if (value === null || value === undefined)
          return value;
        return Boolean(value);
      } else if ((targetType === Date || value instanceof Date) && !isMap) {
        if (value instanceof Date) {
          return new Date(value.valueOf());
        }
        if (value === null || value === undefined)
          return value;
        return new Date(value);
      } else if (!!(0, utils_1.getGlobal)().Buffer && (targetType === Buffer || value instanceof Buffer) && !isMap) {
        if (value === null || value === undefined)
          return value;
        return Buffer.from(value);
      } else if ((0, utils_1.isPromise)(value) && !isMap) {
        return new Promise((resolve2, reject) => {
          value.then((data) => resolve2(this.transform(undefined, data, targetType, undefined, undefined, level + 1)), reject);
        });
      } else if (!isMap && value !== null && typeof value === "object" && typeof value.then === "function") {
        return value;
      } else if (typeof value === "object" && value !== null) {
        if (!targetType && value.constructor !== Object)
          if (!Array.isArray(value) && value.constructor === Array) {} else {
            targetType = value.constructor;
          }
        if (!targetType && source)
          targetType = source.constructor;
        if (this.options.enableCircularCheck) {
          this.recursionStack.add(value);
        }
        const keys = this.getKeys(targetType, value, isMap);
        let newValue = source ? source : {};
        if (!source && (this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS || this.transformationType === enums_1.TransformationType.CLASS_TO_CLASS)) {
          if (isMap) {
            newValue = new Map;
          } else if (targetType) {
            newValue = new targetType;
          } else {
            newValue = {};
          }
        }
        for (const key of keys) {
          if (key === "__proto__" || key === "constructor") {
            continue;
          }
          const valueKey = key;
          let newValueKey = key, propertyName = key;
          if (!this.options.ignoreDecorators && targetType) {
            if (this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS) {
              const exposeMetadata = storage_1.defaultMetadataStorage.findExposeMetadataByCustomName(targetType, key);
              if (exposeMetadata) {
                propertyName = exposeMetadata.propertyName;
                newValueKey = exposeMetadata.propertyName;
              }
            } else if (this.transformationType === enums_1.TransformationType.CLASS_TO_PLAIN || this.transformationType === enums_1.TransformationType.CLASS_TO_CLASS) {
              const exposeMetadata = storage_1.defaultMetadataStorage.findExposeMetadata(targetType, key);
              if (exposeMetadata && exposeMetadata.options && exposeMetadata.options.name) {
                newValueKey = exposeMetadata.options.name;
              }
            }
          }
          let subValue = undefined;
          if (this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS) {
            subValue = value[valueKey];
          } else {
            if (value instanceof Map) {
              subValue = value.get(valueKey);
            } else if (value[valueKey] instanceof Function) {
              subValue = value[valueKey]();
            } else {
              subValue = value[valueKey];
            }
          }
          let type = undefined, isSubValueMap = subValue instanceof Map;
          if (targetType && isMap) {
            type = targetType;
          } else if (targetType) {
            const metadata = storage_1.defaultMetadataStorage.findTypeMetadata(targetType, propertyName);
            if (metadata) {
              const options = { newObject: newValue, object: value, property: propertyName };
              const newType = metadata.typeFunction ? metadata.typeFunction(options) : metadata.reflectedType;
              if (metadata.options && metadata.options.discriminator && metadata.options.discriminator.property && metadata.options.discriminator.subTypes) {
                if (!(value[valueKey] instanceof Array)) {
                  if (this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS) {
                    type = metadata.options.discriminator.subTypes.find((subType) => {
                      if (subValue && subValue instanceof Object && metadata.options.discriminator.property in subValue) {
                        return subType.name === subValue[metadata.options.discriminator.property];
                      }
                    });
                    type === undefined ? type = newType : type = type.value;
                    if (!metadata.options.keepDiscriminatorProperty) {
                      if (subValue && subValue instanceof Object && metadata.options.discriminator.property in subValue) {
                        delete subValue[metadata.options.discriminator.property];
                      }
                    }
                  }
                  if (this.transformationType === enums_1.TransformationType.CLASS_TO_CLASS) {
                    type = subValue.constructor;
                  }
                  if (this.transformationType === enums_1.TransformationType.CLASS_TO_PLAIN) {
                    if (subValue) {
                      subValue[metadata.options.discriminator.property] = metadata.options.discriminator.subTypes.find((subType) => subType.value === subValue.constructor).name;
                    }
                  }
                } else {
                  type = metadata;
                }
              } else {
                type = newType;
              }
              isSubValueMap = isSubValueMap || metadata.reflectedType === Map;
            } else if (this.options.targetMaps) {
              this.options.targetMaps.filter((map) => map.target === targetType && !!map.properties[propertyName]).forEach((map) => type = map.properties[propertyName]);
            } else if (this.options.enableImplicitConversion && this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS) {
              const reflectedType = Reflect.getMetadata("design:type", targetType.prototype, propertyName);
              if (reflectedType) {
                type = reflectedType;
              }
            }
          }
          const arrayType2 = Array.isArray(value[valueKey]) ? this.getReflectedType(targetType, propertyName) : undefined;
          const subSource = source ? source[valueKey] : undefined;
          if (newValue.constructor.prototype) {
            const descriptor = Object.getOwnPropertyDescriptor(newValue.constructor.prototype, newValueKey);
            if ((this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS || this.transformationType === enums_1.TransformationType.CLASS_TO_CLASS) && (descriptor && !descriptor.set || newValue[newValueKey] instanceof Function))
              continue;
          }
          if (!this.options.enableCircularCheck || !this.isCircular(subValue)) {
            const transformKey = this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS ? newValueKey : key;
            let finalValue;
            if (this.transformationType === enums_1.TransformationType.CLASS_TO_PLAIN) {
              finalValue = value[transformKey];
              finalValue = this.applyCustomTransformations(finalValue, targetType, transformKey, value, this.transformationType);
              finalValue = value[transformKey] === finalValue ? subValue : finalValue;
              finalValue = this.transform(subSource, finalValue, type, arrayType2, isSubValueMap, level + 1);
            } else {
              if (subValue === undefined && this.options.exposeDefaultValues) {
                finalValue = newValue[newValueKey];
              } else {
                finalValue = this.transform(subSource, subValue, type, arrayType2, isSubValueMap, level + 1);
                finalValue = this.applyCustomTransformations(finalValue, targetType, transformKey, value, this.transformationType);
              }
            }
            if (finalValue !== undefined || this.options.exposeUnsetFields) {
              if (newValue instanceof Map) {
                newValue.set(newValueKey, finalValue);
              } else {
                newValue[newValueKey] = finalValue;
              }
            }
          } else if (this.transformationType === enums_1.TransformationType.CLASS_TO_CLASS) {
            let finalValue = subValue;
            finalValue = this.applyCustomTransformations(finalValue, targetType, key, value, this.transformationType);
            if (finalValue !== undefined || this.options.exposeUnsetFields) {
              if (newValue instanceof Map) {
                newValue.set(newValueKey, finalValue);
              } else {
                newValue[newValueKey] = finalValue;
              }
            }
          }
        }
        if (this.options.enableCircularCheck) {
          this.recursionStack.delete(value);
        }
        return newValue;
      } else {
        return value;
      }
    }
    applyCustomTransformations(value, target, key, obj, transformationType) {
      let metadatas = storage_1.defaultMetadataStorage.findTransformMetadatas(target, key, this.transformationType);
      if (this.options.version !== undefined) {
        metadatas = metadatas.filter((metadata) => {
          if (!metadata.options)
            return true;
          return this.checkVersion(metadata.options.since, metadata.options.until);
        });
      }
      if (this.options.groups && this.options.groups.length) {
        metadatas = metadatas.filter((metadata) => {
          if (!metadata.options)
            return true;
          return this.checkGroups(metadata.options.groups);
        });
      } else {
        metadatas = metadatas.filter((metadata) => {
          return !metadata.options || !metadata.options.groups || !metadata.options.groups.length;
        });
      }
      metadatas.forEach((metadata) => {
        value = metadata.transformFn({ value, key, obj, type: transformationType, options: this.options });
      });
      return value;
    }
    isCircular(object) {
      return this.recursionStack.has(object);
    }
    getReflectedType(target, propertyName) {
      if (!target)
        return;
      const meta = storage_1.defaultMetadataStorage.findTypeMetadata(target, propertyName);
      return meta ? meta.reflectedType : undefined;
    }
    getKeys(target, object, isMap) {
      let strategy = storage_1.defaultMetadataStorage.getStrategy(target);
      if (strategy === "none")
        strategy = this.options.strategy || "exposeAll";
      let keys = [];
      if (strategy === "exposeAll" || isMap) {
        if (object instanceof Map) {
          keys = Array.from(object.keys());
        } else {
          keys = Object.keys(object);
        }
      }
      if (isMap) {
        return keys;
      }
      if (this.options.ignoreDecorators && this.options.excludeExtraneousValues && target) {
        const exposedProperties = storage_1.defaultMetadataStorage.getExposedProperties(target, this.transformationType);
        const excludedProperties = storage_1.defaultMetadataStorage.getExcludedProperties(target, this.transformationType);
        keys = [...exposedProperties, ...excludedProperties];
      }
      if (!this.options.ignoreDecorators && target) {
        let exposedProperties = storage_1.defaultMetadataStorage.getExposedProperties(target, this.transformationType);
        if (this.transformationType === enums_1.TransformationType.PLAIN_TO_CLASS) {
          exposedProperties = exposedProperties.map((key) => {
            const exposeMetadata = storage_1.defaultMetadataStorage.findExposeMetadata(target, key);
            if (exposeMetadata && exposeMetadata.options && exposeMetadata.options.name) {
              return exposeMetadata.options.name;
            }
            return key;
          });
        }
        if (this.options.excludeExtraneousValues) {
          keys = exposedProperties;
        } else {
          keys = keys.concat(exposedProperties);
        }
        const excludedProperties = storage_1.defaultMetadataStorage.getExcludedProperties(target, this.transformationType);
        if (excludedProperties.length > 0) {
          keys = keys.filter((key) => {
            return !excludedProperties.includes(key);
          });
        }
        if (this.options.version !== undefined) {
          keys = keys.filter((key) => {
            const exposeMetadata = storage_1.defaultMetadataStorage.findExposeMetadata(target, key);
            if (!exposeMetadata || !exposeMetadata.options)
              return true;
            return this.checkVersion(exposeMetadata.options.since, exposeMetadata.options.until);
          });
        }
        if (this.options.groups && this.options.groups.length) {
          keys = keys.filter((key) => {
            const exposeMetadata = storage_1.defaultMetadataStorage.findExposeMetadata(target, key);
            if (!exposeMetadata || !exposeMetadata.options)
              return true;
            return this.checkGroups(exposeMetadata.options.groups);
          });
        } else {
          keys = keys.filter((key) => {
            const exposeMetadata = storage_1.defaultMetadataStorage.findExposeMetadata(target, key);
            return !exposeMetadata || !exposeMetadata.options || !exposeMetadata.options.groups || !exposeMetadata.options.groups.length;
          });
        }
      }
      if (this.options.excludePrefixes && this.options.excludePrefixes.length) {
        keys = keys.filter((key) => this.options.excludePrefixes.every((prefix) => {
          return key.substr(0, prefix.length) !== prefix;
        }));
      }
      keys = keys.filter((key, index, self2) => {
        return self2.indexOf(key) === index;
      });
      return keys;
    }
    checkVersion(since, until) {
      let decision = true;
      if (decision && since)
        decision = this.options.version >= since;
      if (decision && until)
        decision = this.options.version < until;
      return decision;
    }
    checkGroups(groups) {
      if (!groups)
        return true;
      return this.options.groups.some((optionGroup) => groups.includes(optionGroup));
    }
  }
  exports.TransformOperationExecutor = TransformOperationExecutor;
});

// node_modules/class-transformer/cjs/constants/default-options.constant.js
var require_default_options_constant = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.defaultOptions = undefined;
  exports.defaultOptions = {
    enableCircularCheck: false,
    enableImplicitConversion: false,
    excludeExtraneousValues: false,
    excludePrefixes: undefined,
    exposeDefaultValues: false,
    exposeUnsetFields: true,
    groups: undefined,
    ignoreDecorators: false,
    strategy: undefined,
    targetMaps: undefined,
    version: undefined
  };
});

// node_modules/class-transformer/cjs/ClassTransformer.js
var require_ClassTransformer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ClassTransformer = undefined;
  var TransformOperationExecutor_1 = require_TransformOperationExecutor();
  var enums_1 = require_enums();
  var default_options_constant_1 = require_default_options_constant();

  class ClassTransformer {
    instanceToPlain(object, options) {
      const executor = new TransformOperationExecutor_1.TransformOperationExecutor(enums_1.TransformationType.CLASS_TO_PLAIN, {
        ...default_options_constant_1.defaultOptions,
        ...options
      });
      return executor.transform(undefined, object, undefined, undefined, undefined, undefined);
    }
    classToPlainFromExist(object, plainObject, options) {
      const executor = new TransformOperationExecutor_1.TransformOperationExecutor(enums_1.TransformationType.CLASS_TO_PLAIN, {
        ...default_options_constant_1.defaultOptions,
        ...options
      });
      return executor.transform(plainObject, object, undefined, undefined, undefined, undefined);
    }
    plainToInstance(cls, plain, options) {
      const executor = new TransformOperationExecutor_1.TransformOperationExecutor(enums_1.TransformationType.PLAIN_TO_CLASS, {
        ...default_options_constant_1.defaultOptions,
        ...options
      });
      return executor.transform(undefined, plain, cls, undefined, undefined, undefined);
    }
    plainToClassFromExist(clsObject, plain, options) {
      const executor = new TransformOperationExecutor_1.TransformOperationExecutor(enums_1.TransformationType.PLAIN_TO_CLASS, {
        ...default_options_constant_1.defaultOptions,
        ...options
      });
      return executor.transform(clsObject, plain, undefined, undefined, undefined, undefined);
    }
    instanceToInstance(object, options) {
      const executor = new TransformOperationExecutor_1.TransformOperationExecutor(enums_1.TransformationType.CLASS_TO_CLASS, {
        ...default_options_constant_1.defaultOptions,
        ...options
      });
      return executor.transform(undefined, object, undefined, undefined, undefined, undefined);
    }
    classToClassFromExist(object, fromObject, options) {
      const executor = new TransformOperationExecutor_1.TransformOperationExecutor(enums_1.TransformationType.CLASS_TO_CLASS, {
        ...default_options_constant_1.defaultOptions,
        ...options
      });
      return executor.transform(fromObject, object, undefined, undefined, undefined, undefined);
    }
    serialize(object, options) {
      return JSON.stringify(this.instanceToPlain(object, options));
    }
    deserialize(cls, json, options) {
      const jsonObject = JSON.parse(json);
      return this.plainToInstance(cls, jsonObject, options);
    }
    deserializeArray(cls, json, options) {
      const jsonObject = JSON.parse(json);
      return this.plainToInstance(cls, jsonObject, options);
    }
  }
  exports.ClassTransformer = ClassTransformer;
});

// node_modules/class-transformer/cjs/decorators/exclude.decorator.js
var require_exclude_decorator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Exclude = undefined;
  var storage_1 = require_storage();
  function Exclude(options = {}) {
    return function(object, propertyName) {
      storage_1.defaultMetadataStorage.addExcludeMetadata({
        target: object instanceof Function ? object : object.constructor,
        propertyName,
        options
      });
    };
  }
  exports.Exclude = Exclude;
});

// node_modules/class-transformer/cjs/decorators/expose.decorator.js
var require_expose_decorator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Expose = undefined;
  var storage_1 = require_storage();
  function Expose(options = {}) {
    return function(object, propertyName) {
      storage_1.defaultMetadataStorage.addExposeMetadata({
        target: object instanceof Function ? object : object.constructor,
        propertyName,
        options
      });
    };
  }
  exports.Expose = Expose;
});

// node_modules/class-transformer/cjs/decorators/transform-instance-to-instance.decorator.js
var require_transform_instance_to_instance_decorator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TransformInstanceToInstance = undefined;
  var ClassTransformer_1 = require_ClassTransformer();
  function TransformInstanceToInstance(params) {
    return function(target, propertyKey, descriptor) {
      const classTransformer = new ClassTransformer_1.ClassTransformer;
      const originalMethod = descriptor.value;
      descriptor.value = function(...args) {
        const result = originalMethod.apply(this, args);
        const isPromise = !!result && (typeof result === "object" || typeof result === "function") && typeof result.then === "function";
        return isPromise ? result.then((data) => classTransformer.instanceToInstance(data, params)) : classTransformer.instanceToInstance(result, params);
      };
    };
  }
  exports.TransformInstanceToInstance = TransformInstanceToInstance;
});

// node_modules/class-transformer/cjs/decorators/transform-instance-to-plain.decorator.js
var require_transform_instance_to_plain_decorator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TransformInstanceToPlain = undefined;
  var ClassTransformer_1 = require_ClassTransformer();
  function TransformInstanceToPlain(params) {
    return function(target, propertyKey, descriptor) {
      const classTransformer = new ClassTransformer_1.ClassTransformer;
      const originalMethod = descriptor.value;
      descriptor.value = function(...args) {
        const result = originalMethod.apply(this, args);
        const isPromise = !!result && (typeof result === "object" || typeof result === "function") && typeof result.then === "function";
        return isPromise ? result.then((data) => classTransformer.instanceToPlain(data, params)) : classTransformer.instanceToPlain(result, params);
      };
    };
  }
  exports.TransformInstanceToPlain = TransformInstanceToPlain;
});

// node_modules/class-transformer/cjs/decorators/transform-plain-to-instance.decorator.js
var require_transform_plain_to_instance_decorator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TransformPlainToInstance = undefined;
  var ClassTransformer_1 = require_ClassTransformer();
  function TransformPlainToInstance(classType, params) {
    return function(target, propertyKey, descriptor) {
      const classTransformer = new ClassTransformer_1.ClassTransformer;
      const originalMethod = descriptor.value;
      descriptor.value = function(...args) {
        const result = originalMethod.apply(this, args);
        const isPromise = !!result && (typeof result === "object" || typeof result === "function") && typeof result.then === "function";
        return isPromise ? result.then((data) => classTransformer.plainToInstance(classType, data, params)) : classTransformer.plainToInstance(classType, result, params);
      };
    };
  }
  exports.TransformPlainToInstance = TransformPlainToInstance;
});

// node_modules/class-transformer/cjs/decorators/transform.decorator.js
var require_transform_decorator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Transform = undefined;
  var storage_1 = require_storage();
  function Transform(transformFn, options = {}) {
    return function(target, propertyName) {
      storage_1.defaultMetadataStorage.addTransformMetadata({
        target: target.constructor,
        propertyName,
        transformFn,
        options
      });
    };
  }
  exports.Transform = Transform;
});

// node_modules/class-transformer/cjs/decorators/type.decorator.js
var require_type_decorator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Type = undefined;
  var storage_1 = require_storage();
  function Type(typeFunction, options = {}) {
    return function(target, propertyName) {
      const reflectedType = Reflect.getMetadata("design:type", target, propertyName);
      storage_1.defaultMetadataStorage.addTypeMetadata({
        target: target.constructor,
        propertyName,
        reflectedType,
        typeFunction,
        options
      });
    };
  }
  exports.Type = Type;
});

// node_modules/class-transformer/cjs/decorators/index.js
var require_decorators = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_exclude_decorator(), exports);
  __exportStar(require_expose_decorator(), exports);
  __exportStar(require_transform_instance_to_instance_decorator(), exports);
  __exportStar(require_transform_instance_to_plain_decorator(), exports);
  __exportStar(require_transform_plain_to_instance_decorator(), exports);
  __exportStar(require_transform_decorator(), exports);
  __exportStar(require_type_decorator(), exports);
});

// node_modules/class-transformer/cjs/interfaces/decorator-options/expose-options.interface.js
var require_expose_options_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/decorator-options/exclude-options.interface.js
var require_exclude_options_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/decorator-options/transform-options.interface.js
var require_transform_options_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/decorator-options/type-discriminator-descriptor.interface.js
var require_type_discriminator_descriptor_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/decorator-options/type-options.interface.js
var require_type_options_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/metadata/exclude-metadata.interface.js
var require_exclude_metadata_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/metadata/expose-metadata.interface.js
var require_expose_metadata_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/metadata/transform-metadata.interface.js
var require_transform_metadata_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/metadata/transform-fn-params.interface.js
var require_transform_fn_params_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/metadata/type-metadata.interface.js
var require_type_metadata_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/class-constructor.type.js
var require_class_constructor_type = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/class-transformer-options.interface.js
var require_class_transformer_options_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/target-map.interface.js
var require_target_map_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/type-help-options.interface.js
var require_type_help_options_interface = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/class-transformer/cjs/interfaces/index.js
var require_interfaces = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_expose_options_interface(), exports);
  __exportStar(require_exclude_options_interface(), exports);
  __exportStar(require_transform_options_interface(), exports);
  __exportStar(require_type_discriminator_descriptor_interface(), exports);
  __exportStar(require_type_options_interface(), exports);
  __exportStar(require_exclude_metadata_interface(), exports);
  __exportStar(require_expose_metadata_interface(), exports);
  __exportStar(require_transform_metadata_interface(), exports);
  __exportStar(require_transform_fn_params_interface(), exports);
  __exportStar(require_type_metadata_interface(), exports);
  __exportStar(require_class_constructor_type(), exports);
  __exportStar(require_class_transformer_options_interface(), exports);
  __exportStar(require_target_map_interface(), exports);
  __exportStar(require_type_help_options_interface(), exports);
});

// node_modules/class-transformer/cjs/index.js
var require_cjs = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.deserializeArray = exports.deserialize = exports.serialize = exports.classToClassFromExist = exports.instanceToInstance = exports.plainToClassFromExist = exports.plainToInstance = exports.plainToClass = exports.classToPlainFromExist = exports.instanceToPlain = exports.classToPlain = exports.ClassTransformer = undefined;
  var ClassTransformer_1 = require_ClassTransformer();
  var ClassTransformer_2 = require_ClassTransformer();
  Object.defineProperty(exports, "ClassTransformer", { enumerable: true, get: function() {
    return ClassTransformer_2.ClassTransformer;
  } });
  __exportStar(require_decorators(), exports);
  __exportStar(require_interfaces(), exports);
  __exportStar(require_enums(), exports);
  var classTransformer = new ClassTransformer_1.ClassTransformer;
  function classToPlain(object, options) {
    return classTransformer.instanceToPlain(object, options);
  }
  exports.classToPlain = classToPlain;
  function instanceToPlain(object, options) {
    return classTransformer.instanceToPlain(object, options);
  }
  exports.instanceToPlain = instanceToPlain;
  function classToPlainFromExist(object, plainObject, options) {
    return classTransformer.classToPlainFromExist(object, plainObject, options);
  }
  exports.classToPlainFromExist = classToPlainFromExist;
  function plainToClass(cls, plain, options) {
    return classTransformer.plainToInstance(cls, plain, options);
  }
  exports.plainToClass = plainToClass;
  function plainToInstance(cls, plain, options) {
    return classTransformer.plainToInstance(cls, plain, options);
  }
  exports.plainToInstance = plainToInstance;
  function plainToClassFromExist(clsObject, plain, options) {
    return classTransformer.plainToClassFromExist(clsObject, plain, options);
  }
  exports.plainToClassFromExist = plainToClassFromExist;
  function instanceToInstance(object, options) {
    return classTransformer.instanceToInstance(object, options);
  }
  exports.instanceToInstance = instanceToInstance;
  function classToClassFromExist(object, fromObject, options) {
    return classTransformer.classToClassFromExist(object, fromObject, options);
  }
  exports.classToClassFromExist = classToClassFromExist;
  function serialize(object, options) {
    return classTransformer.serialize(object, options);
  }
  exports.serialize = serialize;
  function deserialize(cls, json, options) {
    return classTransformer.deserialize(cls, json, options);
  }
  exports.deserialize = deserialize;
  function deserializeArray(cls, json, options) {
    return classTransformer.deserializeArray(cls, json, options);
  }
  exports.deserializeArray = deserializeArray;
});

// node_modules/@cucumber/gherkin/node_modules/@cucumber/messages/node_modules/reflect-metadata/Reflect.js
var require_Reflect = __commonJS(() => {
  /*! *****************************************************************************
  Copyright (C) Microsoft. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
  
  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
  
  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  var Reflect2;
  (function(Reflect3) {
    (function(factory) {
      var root = typeof globalThis === "object" ? globalThis : typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : sloppyModeThis();
      var exporter = makeExporter(Reflect3);
      if (typeof root.Reflect !== "undefined") {
        exporter = makeExporter(root.Reflect, exporter);
      }
      factory(exporter, root);
      if (typeof root.Reflect === "undefined") {
        root.Reflect = Reflect3;
      }
      function makeExporter(target, previous) {
        return function(key, value) {
          Object.defineProperty(target, key, { configurable: true, writable: true, value });
          if (previous)
            previous(key, value);
        };
      }
      function functionThis() {
        try {
          return Function("return this;")();
        } catch (_) {}
      }
      function indirectEvalThis() {
        try {
          return (undefined, eval)("(function() { return this; })()");
        } catch (_) {}
      }
      function sloppyModeThis() {
        return functionThis() || indirectEvalThis();
      }
    })(function(exporter, root) {
      var hasOwn = Object.prototype.hasOwnProperty;
      var supportsSymbol = typeof Symbol === "function";
      var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
      var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
      var supportsCreate = typeof Object.create === "function";
      var supportsProto = { __proto__: [] } instanceof Array;
      var downLevel = !supportsCreate && !supportsProto;
      var HashMap = {
        create: supportsCreate ? function() {
          return MakeDictionary(Object.create(null));
        } : supportsProto ? function() {
          return MakeDictionary({ __proto__: null });
        } : function() {
          return MakeDictionary({});
        },
        has: downLevel ? function(map, key) {
          return hasOwn.call(map, key);
        } : function(map, key) {
          return key in map;
        },
        get: downLevel ? function(map, key) {
          return hasOwn.call(map, key) ? map[key] : undefined;
        } : function(map, key) {
          return map[key];
        }
      };
      var functionPrototype = Object.getPrototypeOf(Function);
      var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
      var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
      var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
      var registrySymbol = supportsSymbol ? Symbol.for("@reflect-metadata:registry") : undefined;
      var metadataRegistry = GetOrCreateMetadataRegistry();
      var metadataProvider = CreateMetadataProvider(metadataRegistry);
      function decorate(decorators, target, propertyKey, attributes) {
        if (!IsUndefined(propertyKey)) {
          if (!IsArray(decorators))
            throw new TypeError;
          if (!IsObject(target))
            throw new TypeError;
          if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
            throw new TypeError;
          if (IsNull(attributes))
            attributes = undefined;
          propertyKey = ToPropertyKey(propertyKey);
          return DecorateProperty(decorators, target, propertyKey, attributes);
        } else {
          if (!IsArray(decorators))
            throw new TypeError;
          if (!IsConstructor(target))
            throw new TypeError;
          return DecorateConstructor(decorators, target);
        }
      }
      exporter("decorate", decorate);
      function metadata(metadataKey, metadataValue) {
        function decorator(target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError;
          if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
            throw new TypeError;
          OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
        }
        return decorator;
      }
      exporter("metadata", metadata);
      function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
      }
      exporter("defineMetadata", defineMetadata);
      function hasMetadata(metadataKey, target, propertyKey) {
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        return OrdinaryHasMetadata(metadataKey, target, propertyKey);
      }
      exporter("hasMetadata", hasMetadata);
      function hasOwnMetadata(metadataKey, target, propertyKey) {
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
      }
      exporter("hasOwnMetadata", hasOwnMetadata);
      function getMetadata(metadataKey, target, propertyKey) {
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        return OrdinaryGetMetadata(metadataKey, target, propertyKey);
      }
      exporter("getMetadata", getMetadata);
      function getOwnMetadata(metadataKey, target, propertyKey) {
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
      }
      exporter("getOwnMetadata", getOwnMetadata);
      function getMetadataKeys(target, propertyKey) {
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        return OrdinaryMetadataKeys(target, propertyKey);
      }
      exporter("getMetadataKeys", getMetadataKeys);
      function getOwnMetadataKeys(target, propertyKey) {
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        return OrdinaryOwnMetadataKeys(target, propertyKey);
      }
      exporter("getOwnMetadataKeys", getOwnMetadataKeys);
      function deleteMetadata(metadataKey, target, propertyKey) {
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        if (!IsObject(target))
          throw new TypeError;
        if (!IsUndefined(propertyKey))
          propertyKey = ToPropertyKey(propertyKey);
        var provider = GetMetadataProvider(target, propertyKey, false);
        if (IsUndefined(provider))
          return false;
        return provider.OrdinaryDeleteMetadata(metadataKey, target, propertyKey);
      }
      exporter("deleteMetadata", deleteMetadata);
      function DecorateConstructor(decorators, target) {
        for (var i = decorators.length - 1;i >= 0; --i) {
          var decorator = decorators[i];
          var decorated = decorator(target);
          if (!IsUndefined(decorated) && !IsNull(decorated)) {
            if (!IsConstructor(decorated))
              throw new TypeError;
            target = decorated;
          }
        }
        return target;
      }
      function DecorateProperty(decorators, target, propertyKey, descriptor) {
        for (var i = decorators.length - 1;i >= 0; --i) {
          var decorator = decorators[i];
          var decorated = decorator(target, propertyKey, descriptor);
          if (!IsUndefined(decorated) && !IsNull(decorated)) {
            if (!IsObject(decorated))
              throw new TypeError;
            descriptor = decorated;
          }
        }
        return descriptor;
      }
      function OrdinaryHasMetadata(MetadataKey, O, P) {
        var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
        if (hasOwn2)
          return true;
        var parent = OrdinaryGetPrototypeOf(O);
        if (!IsNull(parent))
          return OrdinaryHasMetadata(MetadataKey, parent, P);
        return false;
      }
      function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
        var provider = GetMetadataProvider(O, P, false);
        if (IsUndefined(provider))
          return false;
        return ToBoolean(provider.OrdinaryHasOwnMetadata(MetadataKey, O, P));
      }
      function OrdinaryGetMetadata(MetadataKey, O, P) {
        var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
        if (hasOwn2)
          return OrdinaryGetOwnMetadata(MetadataKey, O, P);
        var parent = OrdinaryGetPrototypeOf(O);
        if (!IsNull(parent))
          return OrdinaryGetMetadata(MetadataKey, parent, P);
        return;
      }
      function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
        var provider = GetMetadataProvider(O, P, false);
        if (IsUndefined(provider))
          return;
        return provider.OrdinaryGetOwnMetadata(MetadataKey, O, P);
      }
      function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
        var provider = GetMetadataProvider(O, P, true);
        provider.OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P);
      }
      function OrdinaryMetadataKeys(O, P) {
        var ownKeys = OrdinaryOwnMetadataKeys(O, P);
        var parent = OrdinaryGetPrototypeOf(O);
        if (parent === null)
          return ownKeys;
        var parentKeys = OrdinaryMetadataKeys(parent, P);
        if (parentKeys.length <= 0)
          return ownKeys;
        if (ownKeys.length <= 0)
          return parentKeys;
        var set = new _Set;
        var keys = [];
        for (var _i = 0, ownKeys_1 = ownKeys;_i < ownKeys_1.length; _i++) {
          var key = ownKeys_1[_i];
          var hasKey = set.has(key);
          if (!hasKey) {
            set.add(key);
            keys.push(key);
          }
        }
        for (var _a = 0, parentKeys_1 = parentKeys;_a < parentKeys_1.length; _a++) {
          var key = parentKeys_1[_a];
          var hasKey = set.has(key);
          if (!hasKey) {
            set.add(key);
            keys.push(key);
          }
        }
        return keys;
      }
      function OrdinaryOwnMetadataKeys(O, P) {
        var provider = GetMetadataProvider(O, P, false);
        if (!provider) {
          return [];
        }
        return provider.OrdinaryOwnMetadataKeys(O, P);
      }
      function Type(x) {
        if (x === null)
          return 1;
        switch (typeof x) {
          case "undefined":
            return 0;
          case "boolean":
            return 2;
          case "string":
            return 3;
          case "symbol":
            return 4;
          case "number":
            return 5;
          case "object":
            return x === null ? 1 : 6;
          default:
            return 6;
        }
      }
      function IsUndefined(x) {
        return x === undefined;
      }
      function IsNull(x) {
        return x === null;
      }
      function IsSymbol(x) {
        return typeof x === "symbol";
      }
      function IsObject(x) {
        return typeof x === "object" ? x !== null : typeof x === "function";
      }
      function ToPrimitive(input, PreferredType) {
        switch (Type(input)) {
          case 0:
            return input;
          case 1:
            return input;
          case 2:
            return input;
          case 3:
            return input;
          case 4:
            return input;
          case 5:
            return input;
        }
        var hint = PreferredType === 3 ? "string" : PreferredType === 5 ? "number" : "default";
        var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
        if (exoticToPrim !== undefined) {
          var result = exoticToPrim.call(input, hint);
          if (IsObject(result))
            throw new TypeError;
          return result;
        }
        return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
      }
      function OrdinaryToPrimitive(O, hint) {
        if (hint === "string") {
          var toString_1 = O.toString;
          if (IsCallable(toString_1)) {
            var result = toString_1.call(O);
            if (!IsObject(result))
              return result;
          }
          var valueOf = O.valueOf;
          if (IsCallable(valueOf)) {
            var result = valueOf.call(O);
            if (!IsObject(result))
              return result;
          }
        } else {
          var valueOf = O.valueOf;
          if (IsCallable(valueOf)) {
            var result = valueOf.call(O);
            if (!IsObject(result))
              return result;
          }
          var toString_2 = O.toString;
          if (IsCallable(toString_2)) {
            var result = toString_2.call(O);
            if (!IsObject(result))
              return result;
          }
        }
        throw new TypeError;
      }
      function ToBoolean(argument) {
        return !!argument;
      }
      function ToString(argument) {
        return "" + argument;
      }
      function ToPropertyKey(argument) {
        var key = ToPrimitive(argument, 3);
        if (IsSymbol(key))
          return key;
        return ToString(key);
      }
      function IsArray(argument) {
        return Array.isArray ? Array.isArray(argument) : argument instanceof Object ? argument instanceof Array : Object.prototype.toString.call(argument) === "[object Array]";
      }
      function IsCallable(argument) {
        return typeof argument === "function";
      }
      function IsConstructor(argument) {
        return typeof argument === "function";
      }
      function IsPropertyKey(argument) {
        switch (Type(argument)) {
          case 3:
            return true;
          case 4:
            return true;
          default:
            return false;
        }
      }
      function SameValueZero(x, y) {
        return x === y || x !== x && y !== y;
      }
      function GetMethod(V, P) {
        var func = V[P];
        if (func === undefined || func === null)
          return;
        if (!IsCallable(func))
          throw new TypeError;
        return func;
      }
      function GetIterator(obj) {
        var method = GetMethod(obj, iteratorSymbol);
        if (!IsCallable(method))
          throw new TypeError;
        var iterator = method.call(obj);
        if (!IsObject(iterator))
          throw new TypeError;
        return iterator;
      }
      function IteratorValue(iterResult) {
        return iterResult.value;
      }
      function IteratorStep(iterator) {
        var result = iterator.next();
        return result.done ? false : result;
      }
      function IteratorClose(iterator) {
        var f = iterator["return"];
        if (f)
          f.call(iterator);
      }
      function OrdinaryGetPrototypeOf(O) {
        var proto = Object.getPrototypeOf(O);
        if (typeof O !== "function" || O === functionPrototype)
          return proto;
        if (proto !== functionPrototype)
          return proto;
        var prototype = O.prototype;
        var prototypeProto = prototype && Object.getPrototypeOf(prototype);
        if (prototypeProto == null || prototypeProto === Object.prototype)
          return proto;
        var constructor = prototypeProto.constructor;
        if (typeof constructor !== "function")
          return proto;
        if (constructor === O)
          return proto;
        return constructor;
      }
      function CreateMetadataRegistry() {
        var fallback;
        if (!IsUndefined(registrySymbol) && typeof root.Reflect !== "undefined" && !(registrySymbol in root.Reflect) && typeof root.Reflect.defineMetadata === "function") {
          fallback = CreateFallbackProvider(root.Reflect);
        }
        var first;
        var second;
        var rest;
        var targetProviderMap = new _WeakMap;
        var registry = {
          registerProvider,
          getProvider,
          setProvider
        };
        return registry;
        function registerProvider(provider) {
          if (!Object.isExtensible(registry)) {
            throw new Error("Cannot add provider to a frozen registry.");
          }
          switch (true) {
            case fallback === provider:
              break;
            case IsUndefined(first):
              first = provider;
              break;
            case first === provider:
              break;
            case IsUndefined(second):
              second = provider;
              break;
            case second === provider:
              break;
            default:
              if (rest === undefined)
                rest = new _Set;
              rest.add(provider);
              break;
          }
        }
        function getProviderNoCache(O, P) {
          if (!IsUndefined(first)) {
            if (first.isProviderFor(O, P))
              return first;
            if (!IsUndefined(second)) {
              if (second.isProviderFor(O, P))
                return first;
              if (!IsUndefined(rest)) {
                var iterator = GetIterator(rest);
                while (true) {
                  var next = IteratorStep(iterator);
                  if (!next) {
                    return;
                  }
                  var provider = IteratorValue(next);
                  if (provider.isProviderFor(O, P)) {
                    IteratorClose(iterator);
                    return provider;
                  }
                }
              }
            }
          }
          if (!IsUndefined(fallback) && fallback.isProviderFor(O, P)) {
            return fallback;
          }
          return;
        }
        function getProvider(O, P) {
          var providerMap = targetProviderMap.get(O);
          var provider;
          if (!IsUndefined(providerMap)) {
            provider = providerMap.get(P);
          }
          if (!IsUndefined(provider)) {
            return provider;
          }
          provider = getProviderNoCache(O, P);
          if (!IsUndefined(provider)) {
            if (IsUndefined(providerMap)) {
              providerMap = new _Map;
              targetProviderMap.set(O, providerMap);
            }
            providerMap.set(P, provider);
          }
          return provider;
        }
        function hasProvider(provider) {
          if (IsUndefined(provider))
            throw new TypeError;
          return first === provider || second === provider || !IsUndefined(rest) && rest.has(provider);
        }
        function setProvider(O, P, provider) {
          if (!hasProvider(provider)) {
            throw new Error("Metadata provider not registered.");
          }
          var existingProvider = getProvider(O, P);
          if (existingProvider !== provider) {
            if (!IsUndefined(existingProvider)) {
              return false;
            }
            var providerMap = targetProviderMap.get(O);
            if (IsUndefined(providerMap)) {
              providerMap = new _Map;
              targetProviderMap.set(O, providerMap);
            }
            providerMap.set(P, provider);
          }
          return true;
        }
      }
      function GetOrCreateMetadataRegistry() {
        var metadataRegistry2;
        if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
          metadataRegistry2 = root.Reflect[registrySymbol];
        }
        if (IsUndefined(metadataRegistry2)) {
          metadataRegistry2 = CreateMetadataRegistry();
        }
        if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
          Object.defineProperty(root.Reflect, registrySymbol, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: metadataRegistry2
          });
        }
        return metadataRegistry2;
      }
      function CreateMetadataProvider(registry) {
        var metadata2 = new _WeakMap;
        var provider = {
          isProviderFor: function(O, P) {
            var targetMetadata = metadata2.get(O);
            if (IsUndefined(targetMetadata))
              return false;
            return targetMetadata.has(P);
          },
          OrdinaryDefineOwnMetadata: OrdinaryDefineOwnMetadata2,
          OrdinaryHasOwnMetadata: OrdinaryHasOwnMetadata2,
          OrdinaryGetOwnMetadata: OrdinaryGetOwnMetadata2,
          OrdinaryOwnMetadataKeys: OrdinaryOwnMetadataKeys2,
          OrdinaryDeleteMetadata
        };
        metadataRegistry.registerProvider(provider);
        return provider;
        function GetOrCreateMetadataMap(O, P, Create) {
          var targetMetadata = metadata2.get(O);
          var createdTargetMetadata = false;
          if (IsUndefined(targetMetadata)) {
            if (!Create)
              return;
            targetMetadata = new _Map;
            metadata2.set(O, targetMetadata);
            createdTargetMetadata = true;
          }
          var metadataMap = targetMetadata.get(P);
          if (IsUndefined(metadataMap)) {
            if (!Create)
              return;
            metadataMap = new _Map;
            targetMetadata.set(P, metadataMap);
            if (!registry.setProvider(O, P, provider)) {
              targetMetadata.delete(P);
              if (createdTargetMetadata) {
                metadata2.delete(O);
              }
              throw new Error("Wrong provider for target.");
            }
          }
          return metadataMap;
        }
        function OrdinaryHasOwnMetadata2(MetadataKey, O, P) {
          var metadataMap = GetOrCreateMetadataMap(O, P, false);
          if (IsUndefined(metadataMap))
            return false;
          return ToBoolean(metadataMap.has(MetadataKey));
        }
        function OrdinaryGetOwnMetadata2(MetadataKey, O, P) {
          var metadataMap = GetOrCreateMetadataMap(O, P, false);
          if (IsUndefined(metadataMap))
            return;
          return metadataMap.get(MetadataKey);
        }
        function OrdinaryDefineOwnMetadata2(MetadataKey, MetadataValue, O, P) {
          var metadataMap = GetOrCreateMetadataMap(O, P, true);
          metadataMap.set(MetadataKey, MetadataValue);
        }
        function OrdinaryOwnMetadataKeys2(O, P) {
          var keys = [];
          var metadataMap = GetOrCreateMetadataMap(O, P, false);
          if (IsUndefined(metadataMap))
            return keys;
          var keysObj = metadataMap.keys();
          var iterator = GetIterator(keysObj);
          var k = 0;
          while (true) {
            var next = IteratorStep(iterator);
            if (!next) {
              keys.length = k;
              return keys;
            }
            var nextValue = IteratorValue(next);
            try {
              keys[k] = nextValue;
            } catch (e) {
              try {
                IteratorClose(iterator);
              } finally {
                throw e;
              }
            }
            k++;
          }
        }
        function OrdinaryDeleteMetadata(MetadataKey, O, P) {
          var metadataMap = GetOrCreateMetadataMap(O, P, false);
          if (IsUndefined(metadataMap))
            return false;
          if (!metadataMap.delete(MetadataKey))
            return false;
          if (metadataMap.size === 0) {
            var targetMetadata = metadata2.get(O);
            if (!IsUndefined(targetMetadata)) {
              targetMetadata.delete(P);
              if (targetMetadata.size === 0) {
                metadata2.delete(targetMetadata);
              }
            }
          }
          return true;
        }
      }
      function CreateFallbackProvider(reflect) {
        var { defineMetadata: defineMetadata2, hasOwnMetadata: hasOwnMetadata2, getOwnMetadata: getOwnMetadata2, getOwnMetadataKeys: getOwnMetadataKeys2, deleteMetadata: deleteMetadata2 } = reflect;
        var metadataOwner = new _WeakMap;
        var provider = {
          isProviderFor: function(O, P) {
            var metadataPropertySet = metadataOwner.get(O);
            if (!IsUndefined(metadataPropertySet)) {
              return metadataPropertySet.has(P);
            }
            if (getOwnMetadataKeys2(O, P).length) {
              if (IsUndefined(metadataPropertySet)) {
                metadataPropertySet = new _Set;
                metadataOwner.set(O, metadataPropertySet);
              }
              metadataPropertySet.add(P);
              return true;
            }
            return false;
          },
          OrdinaryDefineOwnMetadata: defineMetadata2,
          OrdinaryHasOwnMetadata: hasOwnMetadata2,
          OrdinaryGetOwnMetadata: getOwnMetadata2,
          OrdinaryOwnMetadataKeys: getOwnMetadataKeys2,
          OrdinaryDeleteMetadata: deleteMetadata2
        };
        return provider;
      }
      function GetMetadataProvider(O, P, Create) {
        var registeredProvider = metadataRegistry.getProvider(O, P);
        if (!IsUndefined(registeredProvider)) {
          return registeredProvider;
        }
        if (Create) {
          if (metadataRegistry.setProvider(O, P, metadataProvider)) {
            return metadataProvider;
          }
          throw new Error("Illegal state.");
        }
        return;
      }
      function CreateMapPolyfill() {
        var cacheSentinel = {};
        var arraySentinel = [];
        var MapIterator = function() {
          function MapIterator2(keys, values, selector) {
            this._index = 0;
            this._keys = keys;
            this._values = values;
            this._selector = selector;
          }
          MapIterator2.prototype["@@iterator"] = function() {
            return this;
          };
          MapIterator2.prototype[iteratorSymbol] = function() {
            return this;
          };
          MapIterator2.prototype.next = function() {
            var index = this._index;
            if (index >= 0 && index < this._keys.length) {
              var result = this._selector(this._keys[index], this._values[index]);
              if (index + 1 >= this._keys.length) {
                this._index = -1;
                this._keys = arraySentinel;
                this._values = arraySentinel;
              } else {
                this._index++;
              }
              return { value: result, done: false };
            }
            return { value: undefined, done: true };
          };
          MapIterator2.prototype.throw = function(error) {
            if (this._index >= 0) {
              this._index = -1;
              this._keys = arraySentinel;
              this._values = arraySentinel;
            }
            throw error;
          };
          MapIterator2.prototype.return = function(value) {
            if (this._index >= 0) {
              this._index = -1;
              this._keys = arraySentinel;
              this._values = arraySentinel;
            }
            return { value, done: true };
          };
          return MapIterator2;
        }();
        var Map2 = function() {
          function Map3() {
            this._keys = [];
            this._values = [];
            this._cacheKey = cacheSentinel;
            this._cacheIndex = -2;
          }
          Object.defineProperty(Map3.prototype, "size", {
            get: function() {
              return this._keys.length;
            },
            enumerable: true,
            configurable: true
          });
          Map3.prototype.has = function(key) {
            return this._find(key, false) >= 0;
          };
          Map3.prototype.get = function(key) {
            var index = this._find(key, false);
            return index >= 0 ? this._values[index] : undefined;
          };
          Map3.prototype.set = function(key, value) {
            var index = this._find(key, true);
            this._values[index] = value;
            return this;
          };
          Map3.prototype.delete = function(key) {
            var index = this._find(key, false);
            if (index >= 0) {
              var size = this._keys.length;
              for (var i = index + 1;i < size; i++) {
                this._keys[i - 1] = this._keys[i];
                this._values[i - 1] = this._values[i];
              }
              this._keys.length--;
              this._values.length--;
              if (SameValueZero(key, this._cacheKey)) {
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
              }
              return true;
            }
            return false;
          };
          Map3.prototype.clear = function() {
            this._keys.length = 0;
            this._values.length = 0;
            this._cacheKey = cacheSentinel;
            this._cacheIndex = -2;
          };
          Map3.prototype.keys = function() {
            return new MapIterator(this._keys, this._values, getKey);
          };
          Map3.prototype.values = function() {
            return new MapIterator(this._keys, this._values, getValue);
          };
          Map3.prototype.entries = function() {
            return new MapIterator(this._keys, this._values, getEntry);
          };
          Map3.prototype["@@iterator"] = function() {
            return this.entries();
          };
          Map3.prototype[iteratorSymbol] = function() {
            return this.entries();
          };
          Map3.prototype._find = function(key, insert) {
            if (!SameValueZero(this._cacheKey, key)) {
              this._cacheIndex = -1;
              for (var i = 0;i < this._keys.length; i++) {
                if (SameValueZero(this._keys[i], key)) {
                  this._cacheIndex = i;
                  break;
                }
              }
            }
            if (this._cacheIndex < 0 && insert) {
              this._cacheIndex = this._keys.length;
              this._keys.push(key);
              this._values.push(undefined);
            }
            return this._cacheIndex;
          };
          return Map3;
        }();
        return Map2;
        function getKey(key, _) {
          return key;
        }
        function getValue(_, value) {
          return value;
        }
        function getEntry(key, value) {
          return [key, value];
        }
      }
      function CreateSetPolyfill() {
        var Set2 = function() {
          function Set3() {
            this._map = new _Map;
          }
          Object.defineProperty(Set3.prototype, "size", {
            get: function() {
              return this._map.size;
            },
            enumerable: true,
            configurable: true
          });
          Set3.prototype.has = function(value) {
            return this._map.has(value);
          };
          Set3.prototype.add = function(value) {
            return this._map.set(value, value), this;
          };
          Set3.prototype.delete = function(value) {
            return this._map.delete(value);
          };
          Set3.prototype.clear = function() {
            this._map.clear();
          };
          Set3.prototype.keys = function() {
            return this._map.keys();
          };
          Set3.prototype.values = function() {
            return this._map.keys();
          };
          Set3.prototype.entries = function() {
            return this._map.entries();
          };
          Set3.prototype["@@iterator"] = function() {
            return this.keys();
          };
          Set3.prototype[iteratorSymbol] = function() {
            return this.keys();
          };
          return Set3;
        }();
        return Set2;
      }
      function CreateWeakMapPolyfill() {
        var UUID_SIZE = 16;
        var keys = HashMap.create();
        var rootKey = CreateUniqueKey();
        return function() {
          function WeakMap2() {
            this._key = CreateUniqueKey();
          }
          WeakMap2.prototype.has = function(target) {
            var table = GetOrCreateWeakMapTable(target, false);
            return table !== undefined ? HashMap.has(table, this._key) : false;
          };
          WeakMap2.prototype.get = function(target) {
            var table = GetOrCreateWeakMapTable(target, false);
            return table !== undefined ? HashMap.get(table, this._key) : undefined;
          };
          WeakMap2.prototype.set = function(target, value) {
            var table = GetOrCreateWeakMapTable(target, true);
            table[this._key] = value;
            return this;
          };
          WeakMap2.prototype.delete = function(target) {
            var table = GetOrCreateWeakMapTable(target, false);
            return table !== undefined ? delete table[this._key] : false;
          };
          WeakMap2.prototype.clear = function() {
            this._key = CreateUniqueKey();
          };
          return WeakMap2;
        }();
        function CreateUniqueKey() {
          var key;
          do
            key = "@@WeakMap@@" + CreateUUID();
          while (HashMap.has(keys, key));
          keys[key] = true;
          return key;
        }
        function GetOrCreateWeakMapTable(target, create) {
          if (!hasOwn.call(target, rootKey)) {
            if (!create)
              return;
            Object.defineProperty(target, rootKey, { value: HashMap.create() });
          }
          return target[rootKey];
        }
        function FillRandomBytes(buffer, size) {
          for (var i = 0;i < size; ++i)
            buffer[i] = Math.random() * 255 | 0;
          return buffer;
        }
        function GenRandomBytes(size) {
          if (typeof Uint8Array === "function") {
            if (typeof crypto !== "undefined")
              return crypto.getRandomValues(new Uint8Array(size));
            if (typeof msCrypto !== "undefined")
              return msCrypto.getRandomValues(new Uint8Array(size));
            return FillRandomBytes(new Uint8Array(size), size);
          }
          return FillRandomBytes(new Array(size), size);
        }
        function CreateUUID() {
          var data = GenRandomBytes(UUID_SIZE);
          data[6] = data[6] & 79 | 64;
          data[8] = data[8] & 191 | 128;
          var result = "";
          for (var offset = 0;offset < UUID_SIZE; ++offset) {
            var byte = data[offset];
            if (offset === 4 || offset === 6 || offset === 8)
              result += "-";
            if (byte < 16)
              result += "0";
            result += byte.toString(16).toLowerCase();
          }
          return result;
        }
      }
      function MakeDictionary(obj) {
        obj.__ = undefined;
        delete obj.__;
        return obj;
      }
    });
  })(Reflect2 || (Reflect2 = {}));
});

// node_modules/@cucumber/gherkin/node_modules/@cucumber/messages/dist/cjs/src/messages.js
var require_messages = __commonJS((exports) => {
  var __decorate = exports && exports.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1;i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TestRunStarted = exports.TestRunFinished = exports.TestCaseStarted = exports.TestCaseFinished = exports.TestStep = exports.StepMatchArgumentsList = exports.StepMatchArgument = exports.Group = exports.TestCase = exports.StepDefinitionPattern = exports.StepDefinition = exports.JavaStackTraceElement = exports.JavaMethod = exports.SourceReference = exports.Source = exports.PickleTag = exports.PickleTableRow = exports.PickleTableCell = exports.PickleTable = exports.PickleStepArgument = exports.PickleStep = exports.PickleDocString = exports.Pickle = exports.ParseError = exports.ParameterType = exports.Product = exports.Git = exports.Ci = exports.Meta = exports.Location = exports.Hook = exports.Tag = exports.TableRow = exports.TableCell = exports.Step = exports.Scenario = exports.RuleChild = exports.Rule = exports.FeatureChild = exports.Feature = exports.Examples = exports.DocString = exports.DataTable = exports.Comment = exports.Background = exports.GherkinDocument = exports.Exception = exports.Envelope = exports.Duration = exports.Attachment = undefined;
  exports.TestStepResultStatus = exports.StepKeywordType = exports.StepDefinitionPatternType = exports.SourceMediaType = exports.PickleStepType = exports.AttachmentContentEncoding = exports.UndefinedParameterType = exports.Timestamp = exports.TestStepStarted = exports.TestStepResult = exports.TestStepFinished = undefined;
  var class_transformer_1 = require_cjs();
  require_Reflect();
  var Attachment = function() {
    function Attachment2() {
      this.body = "";
      this.contentEncoding = AttachmentContentEncoding.IDENTITY;
      this.mediaType = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Source;
      })
    ], Attachment2.prototype, "source", undefined);
    return Attachment2;
  }();
  exports.Attachment = Attachment;
  var Duration = function() {
    function Duration2() {
      this.seconds = 0;
      this.nanos = 0;
    }
    return Duration2;
  }();
  exports.Duration = Duration;
  var Envelope = function() {
    function Envelope2() {}
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Attachment;
      })
    ], Envelope2.prototype, "attachment", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return GherkinDocument;
      })
    ], Envelope2.prototype, "gherkinDocument", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Hook;
      })
    ], Envelope2.prototype, "hook", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Meta;
      })
    ], Envelope2.prototype, "meta", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return ParameterType;
      })
    ], Envelope2.prototype, "parameterType", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return ParseError;
      })
    ], Envelope2.prototype, "parseError", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Pickle;
      })
    ], Envelope2.prototype, "pickle", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Source;
      })
    ], Envelope2.prototype, "source", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return StepDefinition;
      })
    ], Envelope2.prototype, "stepDefinition", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestCase;
      })
    ], Envelope2.prototype, "testCase", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestCaseFinished;
      })
    ], Envelope2.prototype, "testCaseFinished", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestCaseStarted;
      })
    ], Envelope2.prototype, "testCaseStarted", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestRunFinished;
      })
    ], Envelope2.prototype, "testRunFinished", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestRunStarted;
      })
    ], Envelope2.prototype, "testRunStarted", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestStepFinished;
      })
    ], Envelope2.prototype, "testStepFinished", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestStepStarted;
      })
    ], Envelope2.prototype, "testStepStarted", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return UndefinedParameterType;
      })
    ], Envelope2.prototype, "undefinedParameterType", undefined);
    return Envelope2;
  }();
  exports.Envelope = Envelope;
  var Exception = function() {
    function Exception2() {
      this.type = "";
    }
    return Exception2;
  }();
  exports.Exception = Exception;
  var GherkinDocument = function() {
    function GherkinDocument2() {
      this.comments = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Feature;
      })
    ], GherkinDocument2.prototype, "feature", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Comment;
      })
    ], GherkinDocument2.prototype, "comments", undefined);
    return GherkinDocument2;
  }();
  exports.GherkinDocument = GherkinDocument;
  var Background = function() {
    function Background2() {
      this.location = new Location;
      this.keyword = "";
      this.name = "";
      this.description = "";
      this.steps = [];
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], Background2.prototype, "location", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Step;
      })
    ], Background2.prototype, "steps", undefined);
    return Background2;
  }();
  exports.Background = Background;
  var Comment = function() {
    function Comment2() {
      this.location = new Location;
      this.text = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], Comment2.prototype, "location", undefined);
    return Comment2;
  }();
  exports.Comment = Comment;
  var DataTable = function() {
    function DataTable2() {
      this.location = new Location;
      this.rows = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], DataTable2.prototype, "location", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TableRow;
      })
    ], DataTable2.prototype, "rows", undefined);
    return DataTable2;
  }();
  exports.DataTable = DataTable;
  var DocString = function() {
    function DocString2() {
      this.location = new Location;
      this.content = "";
      this.delimiter = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], DocString2.prototype, "location", undefined);
    return DocString2;
  }();
  exports.DocString = DocString;
  var Examples = function() {
    function Examples2() {
      this.location = new Location;
      this.tags = [];
      this.keyword = "";
      this.name = "";
      this.description = "";
      this.tableBody = [];
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], Examples2.prototype, "location", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Tag;
      })
    ], Examples2.prototype, "tags", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TableRow;
      })
    ], Examples2.prototype, "tableHeader", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TableRow;
      })
    ], Examples2.prototype, "tableBody", undefined);
    return Examples2;
  }();
  exports.Examples = Examples;
  var Feature = function() {
    function Feature2() {
      this.location = new Location;
      this.tags = [];
      this.language = "";
      this.keyword = "";
      this.name = "";
      this.description = "";
      this.children = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], Feature2.prototype, "location", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Tag;
      })
    ], Feature2.prototype, "tags", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return FeatureChild;
      })
    ], Feature2.prototype, "children", undefined);
    return Feature2;
  }();
  exports.Feature = Feature;
  var FeatureChild = function() {
    function FeatureChild2() {}
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Rule;
      })
    ], FeatureChild2.prototype, "rule", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Background;
      })
    ], FeatureChild2.prototype, "background", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Scenario;
      })
    ], FeatureChild2.prototype, "scenario", undefined);
    return FeatureChild2;
  }();
  exports.FeatureChild = FeatureChild;
  var Rule = function() {
    function Rule2() {
      this.location = new Location;
      this.tags = [];
      this.keyword = "";
      this.name = "";
      this.description = "";
      this.children = [];
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], Rule2.prototype, "location", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Tag;
      })
    ], Rule2.prototype, "tags", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return RuleChild;
      })
    ], Rule2.prototype, "children", undefined);
    return Rule2;
  }();
  exports.Rule = Rule;
  var RuleChild = function() {
    function RuleChild2() {}
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Background;
      })
    ], RuleChild2.prototype, "background", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Scenario;
      })
    ], RuleChild2.prototype, "scenario", undefined);
    return RuleChild2;
  }();
  exports.RuleChild = RuleChild;
  var Scenario = function() {
    function Scenario2() {
      this.location = new Location;
      this.tags = [];
      this.keyword = "";
      this.name = "";
      this.description = "";
      this.steps = [];
      this.examples = [];
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], Scenario2.prototype, "location", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Tag;
      })
    ], Scenario2.prototype, "tags", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Step;
      })
    ], Scenario2.prototype, "steps", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Examples;
      })
    ], Scenario2.prototype, "examples", undefined);
    return Scenario2;
  }();
  exports.Scenario = Scenario;
  var Step = function() {
    function Step2() {
      this.location = new Location;
      this.keyword = "";
      this.text = "";
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], Step2.prototype, "location", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return DocString;
      })
    ], Step2.prototype, "docString", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return DataTable;
      })
    ], Step2.prototype, "dataTable", undefined);
    return Step2;
  }();
  exports.Step = Step;
  var TableCell = function() {
    function TableCell2() {
      this.location = new Location;
      this.value = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], TableCell2.prototype, "location", undefined);
    return TableCell2;
  }();
  exports.TableCell = TableCell;
  var TableRow = function() {
    function TableRow2() {
      this.location = new Location;
      this.cells = [];
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], TableRow2.prototype, "location", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TableCell;
      })
    ], TableRow2.prototype, "cells", undefined);
    return TableRow2;
  }();
  exports.TableRow = TableRow;
  var Tag = function() {
    function Tag2() {
      this.location = new Location;
      this.name = "";
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], Tag2.prototype, "location", undefined);
    return Tag2;
  }();
  exports.Tag = Tag;
  var Hook = function() {
    function Hook2() {
      this.id = "";
      this.sourceReference = new SourceReference;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return SourceReference;
      })
    ], Hook2.prototype, "sourceReference", undefined);
    return Hook2;
  }();
  exports.Hook = Hook;
  var Location = function() {
    function Location2() {
      this.line = 0;
    }
    return Location2;
  }();
  exports.Location = Location;
  var Meta = function() {
    function Meta2() {
      this.protocolVersion = "";
      this.implementation = new Product;
      this.runtime = new Product;
      this.os = new Product;
      this.cpu = new Product;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Product;
      })
    ], Meta2.prototype, "implementation", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Product;
      })
    ], Meta2.prototype, "runtime", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Product;
      })
    ], Meta2.prototype, "os", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Product;
      })
    ], Meta2.prototype, "cpu", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Ci;
      })
    ], Meta2.prototype, "ci", undefined);
    return Meta2;
  }();
  exports.Meta = Meta;
  var Ci = function() {
    function Ci2() {
      this.name = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Git;
      })
    ], Ci2.prototype, "git", undefined);
    return Ci2;
  }();
  exports.Ci = Ci;
  var Git = function() {
    function Git2() {
      this.remote = "";
      this.revision = "";
    }
    return Git2;
  }();
  exports.Git = Git;
  var Product = function() {
    function Product2() {
      this.name = "";
    }
    return Product2;
  }();
  exports.Product = Product;
  var ParameterType = function() {
    function ParameterType2() {
      this.name = "";
      this.regularExpressions = [];
      this.preferForRegularExpressionMatch = false;
      this.useForSnippets = false;
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return SourceReference;
      })
    ], ParameterType2.prototype, "sourceReference", undefined);
    return ParameterType2;
  }();
  exports.ParameterType = ParameterType;
  var ParseError = function() {
    function ParseError2() {
      this.source = new SourceReference;
      this.message = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return SourceReference;
      })
    ], ParseError2.prototype, "source", undefined);
    return ParseError2;
  }();
  exports.ParseError = ParseError;
  var Pickle = function() {
    function Pickle2() {
      this.id = "";
      this.uri = "";
      this.name = "";
      this.language = "";
      this.steps = [];
      this.tags = [];
      this.astNodeIds = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return PickleStep;
      })
    ], Pickle2.prototype, "steps", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return PickleTag;
      })
    ], Pickle2.prototype, "tags", undefined);
    return Pickle2;
  }();
  exports.Pickle = Pickle;
  var PickleDocString = function() {
    function PickleDocString2() {
      this.content = "";
    }
    return PickleDocString2;
  }();
  exports.PickleDocString = PickleDocString;
  var PickleStep = function() {
    function PickleStep2() {
      this.astNodeIds = [];
      this.id = "";
      this.text = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return PickleStepArgument;
      })
    ], PickleStep2.prototype, "argument", undefined);
    return PickleStep2;
  }();
  exports.PickleStep = PickleStep;
  var PickleStepArgument = function() {
    function PickleStepArgument2() {}
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return PickleDocString;
      })
    ], PickleStepArgument2.prototype, "docString", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return PickleTable;
      })
    ], PickleStepArgument2.prototype, "dataTable", undefined);
    return PickleStepArgument2;
  }();
  exports.PickleStepArgument = PickleStepArgument;
  var PickleTable = function() {
    function PickleTable2() {
      this.rows = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return PickleTableRow;
      })
    ], PickleTable2.prototype, "rows", undefined);
    return PickleTable2;
  }();
  exports.PickleTable = PickleTable;
  var PickleTableCell = function() {
    function PickleTableCell2() {
      this.value = "";
    }
    return PickleTableCell2;
  }();
  exports.PickleTableCell = PickleTableCell;
  var PickleTableRow = function() {
    function PickleTableRow2() {
      this.cells = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return PickleTableCell;
      })
    ], PickleTableRow2.prototype, "cells", undefined);
    return PickleTableRow2;
  }();
  exports.PickleTableRow = PickleTableRow;
  var PickleTag = function() {
    function PickleTag2() {
      this.name = "";
      this.astNodeId = "";
    }
    return PickleTag2;
  }();
  exports.PickleTag = PickleTag;
  var Source = function() {
    function Source2() {
      this.uri = "";
      this.data = "";
      this.mediaType = SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN;
    }
    return Source2;
  }();
  exports.Source = Source;
  var SourceReference = function() {
    function SourceReference2() {}
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return JavaMethod;
      })
    ], SourceReference2.prototype, "javaMethod", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return JavaStackTraceElement;
      })
    ], SourceReference2.prototype, "javaStackTraceElement", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Location;
      })
    ], SourceReference2.prototype, "location", undefined);
    return SourceReference2;
  }();
  exports.SourceReference = SourceReference;
  var JavaMethod = function() {
    function JavaMethod2() {
      this.className = "";
      this.methodName = "";
      this.methodParameterTypes = [];
    }
    return JavaMethod2;
  }();
  exports.JavaMethod = JavaMethod;
  var JavaStackTraceElement = function() {
    function JavaStackTraceElement2() {
      this.className = "";
      this.fileName = "";
      this.methodName = "";
    }
    return JavaStackTraceElement2;
  }();
  exports.JavaStackTraceElement = JavaStackTraceElement;
  var StepDefinition = function() {
    function StepDefinition2() {
      this.id = "";
      this.pattern = new StepDefinitionPattern;
      this.sourceReference = new SourceReference;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return StepDefinitionPattern;
      })
    ], StepDefinition2.prototype, "pattern", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return SourceReference;
      })
    ], StepDefinition2.prototype, "sourceReference", undefined);
    return StepDefinition2;
  }();
  exports.StepDefinition = StepDefinition;
  var StepDefinitionPattern = function() {
    function StepDefinitionPattern2() {
      this.source = "";
      this.type = StepDefinitionPatternType.CUCUMBER_EXPRESSION;
    }
    return StepDefinitionPattern2;
  }();
  exports.StepDefinitionPattern = StepDefinitionPattern;
  var TestCase = function() {
    function TestCase2() {
      this.id = "";
      this.pickleId = "";
      this.testSteps = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestStep;
      })
    ], TestCase2.prototype, "testSteps", undefined);
    return TestCase2;
  }();
  exports.TestCase = TestCase;
  var Group = function() {
    function Group2() {
      this.children = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Group2;
      })
    ], Group2.prototype, "children", undefined);
    return Group2;
  }();
  exports.Group = Group;
  var StepMatchArgument = function() {
    function StepMatchArgument2() {
      this.group = new Group;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Group;
      })
    ], StepMatchArgument2.prototype, "group", undefined);
    return StepMatchArgument2;
  }();
  exports.StepMatchArgument = StepMatchArgument;
  var StepMatchArgumentsList = function() {
    function StepMatchArgumentsList2() {
      this.stepMatchArguments = [];
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return StepMatchArgument;
      })
    ], StepMatchArgumentsList2.prototype, "stepMatchArguments", undefined);
    return StepMatchArgumentsList2;
  }();
  exports.StepMatchArgumentsList = StepMatchArgumentsList;
  var TestStep = function() {
    function TestStep2() {
      this.id = "";
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return StepMatchArgumentsList;
      })
    ], TestStep2.prototype, "stepMatchArgumentsLists", undefined);
    return TestStep2;
  }();
  exports.TestStep = TestStep;
  var TestCaseFinished = function() {
    function TestCaseFinished2() {
      this.testCaseStartedId = "";
      this.timestamp = new Timestamp;
      this.willBeRetried = false;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Timestamp;
      })
    ], TestCaseFinished2.prototype, "timestamp", undefined);
    return TestCaseFinished2;
  }();
  exports.TestCaseFinished = TestCaseFinished;
  var TestCaseStarted = function() {
    function TestCaseStarted2() {
      this.attempt = 0;
      this.id = "";
      this.testCaseId = "";
      this.timestamp = new Timestamp;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Timestamp;
      })
    ], TestCaseStarted2.prototype, "timestamp", undefined);
    return TestCaseStarted2;
  }();
  exports.TestCaseStarted = TestCaseStarted;
  var TestRunFinished = function() {
    function TestRunFinished2() {
      this.success = false;
      this.timestamp = new Timestamp;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Timestamp;
      })
    ], TestRunFinished2.prototype, "timestamp", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Exception;
      })
    ], TestRunFinished2.prototype, "exception", undefined);
    return TestRunFinished2;
  }();
  exports.TestRunFinished = TestRunFinished;
  var TestRunStarted = function() {
    function TestRunStarted2() {
      this.timestamp = new Timestamp;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Timestamp;
      })
    ], TestRunStarted2.prototype, "timestamp", undefined);
    return TestRunStarted2;
  }();
  exports.TestRunStarted = TestRunStarted;
  var TestStepFinished = function() {
    function TestStepFinished2() {
      this.testCaseStartedId = "";
      this.testStepId = "";
      this.testStepResult = new TestStepResult;
      this.timestamp = new Timestamp;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return TestStepResult;
      })
    ], TestStepFinished2.prototype, "testStepResult", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Timestamp;
      })
    ], TestStepFinished2.prototype, "timestamp", undefined);
    return TestStepFinished2;
  }();
  exports.TestStepFinished = TestStepFinished;
  var TestStepResult = function() {
    function TestStepResult2() {
      this.duration = new Duration;
      this.status = TestStepResultStatus.UNKNOWN;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Duration;
      })
    ], TestStepResult2.prototype, "duration", undefined);
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Exception;
      })
    ], TestStepResult2.prototype, "exception", undefined);
    return TestStepResult2;
  }();
  exports.TestStepResult = TestStepResult;
  var TestStepStarted = function() {
    function TestStepStarted2() {
      this.testCaseStartedId = "";
      this.testStepId = "";
      this.timestamp = new Timestamp;
    }
    __decorate([
      (0, class_transformer_1.Type)(function() {
        return Timestamp;
      })
    ], TestStepStarted2.prototype, "timestamp", undefined);
    return TestStepStarted2;
  }();
  exports.TestStepStarted = TestStepStarted;
  var Timestamp = function() {
    function Timestamp2() {
      this.seconds = 0;
      this.nanos = 0;
    }
    return Timestamp2;
  }();
  exports.Timestamp = Timestamp;
  var UndefinedParameterType = function() {
    function UndefinedParameterType2() {
      this.expression = "";
      this.name = "";
    }
    return UndefinedParameterType2;
  }();
  exports.UndefinedParameterType = UndefinedParameterType;
  var AttachmentContentEncoding;
  (function(AttachmentContentEncoding2) {
    AttachmentContentEncoding2["IDENTITY"] = "IDENTITY";
    AttachmentContentEncoding2["BASE64"] = "BASE64";
  })(AttachmentContentEncoding || (exports.AttachmentContentEncoding = AttachmentContentEncoding = {}));
  var PickleStepType;
  (function(PickleStepType2) {
    PickleStepType2["UNKNOWN"] = "Unknown";
    PickleStepType2["CONTEXT"] = "Context";
    PickleStepType2["ACTION"] = "Action";
    PickleStepType2["OUTCOME"] = "Outcome";
  })(PickleStepType || (exports.PickleStepType = PickleStepType = {}));
  var SourceMediaType;
  (function(SourceMediaType2) {
    SourceMediaType2["TEXT_X_CUCUMBER_GHERKIN_PLAIN"] = "text/x.cucumber.gherkin+plain";
    SourceMediaType2["TEXT_X_CUCUMBER_GHERKIN_MARKDOWN"] = "text/x.cucumber.gherkin+markdown";
  })(SourceMediaType || (exports.SourceMediaType = SourceMediaType = {}));
  var StepDefinitionPatternType;
  (function(StepDefinitionPatternType2) {
    StepDefinitionPatternType2["CUCUMBER_EXPRESSION"] = "CUCUMBER_EXPRESSION";
    StepDefinitionPatternType2["REGULAR_EXPRESSION"] = "REGULAR_EXPRESSION";
  })(StepDefinitionPatternType || (exports.StepDefinitionPatternType = StepDefinitionPatternType = {}));
  var StepKeywordType;
  (function(StepKeywordType2) {
    StepKeywordType2["UNKNOWN"] = "Unknown";
    StepKeywordType2["CONTEXT"] = "Context";
    StepKeywordType2["ACTION"] = "Action";
    StepKeywordType2["OUTCOME"] = "Outcome";
    StepKeywordType2["CONJUNCTION"] = "Conjunction";
  })(StepKeywordType || (exports.StepKeywordType = StepKeywordType = {}));
  var TestStepResultStatus;
  (function(TestStepResultStatus2) {
    TestStepResultStatus2["UNKNOWN"] = "UNKNOWN";
    TestStepResultStatus2["PASSED"] = "PASSED";
    TestStepResultStatus2["SKIPPED"] = "SKIPPED";
    TestStepResultStatus2["PENDING"] = "PENDING";
    TestStepResultStatus2["UNDEFINED"] = "UNDEFINED";
    TestStepResultStatus2["AMBIGUOUS"] = "AMBIGUOUS";
    TestStepResultStatus2["FAILED"] = "FAILED";
  })(TestStepResultStatus || (exports.TestStepResultStatus = TestStepResultStatus = {}));
});

// node_modules/@cucumber/gherkin/node_modules/@cucumber/messages/dist/cjs/src/parseEnvelope.js
var require_parseEnvelope = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parseEnvelope = undefined;
  var messages_js_1 = require_messages();
  var class_transformer_1 = require_cjs();
  function parseEnvelope(json) {
    var plain = JSON.parse(json);
    return (0, class_transformer_1.plainToClass)(messages_js_1.Envelope, plain);
  }
  exports.parseEnvelope = parseEnvelope;
});

// node_modules/@cucumber/gherkin/node_modules/@cucumber/messages/dist/cjs/src/getWorstTestStepResult.js
var require_getWorstTestStepResult = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getWorstTestStepResult = undefined;
  var messages_js_1 = require_messages();
  var TimeConversion_js_1 = require_TimeConversion();
  function getWorstTestStepResult(testStepResults) {
    return testStepResults.slice().sort(function(r1, r2) {
      return ordinal(r2.status) - ordinal(r1.status);
    })[0] || {
      status: messages_js_1.TestStepResultStatus.UNKNOWN,
      duration: (0, TimeConversion_js_1.millisecondsToDuration)(0)
    };
  }
  exports.getWorstTestStepResult = getWorstTestStepResult;
  function ordinal(status) {
    return [
      messages_js_1.TestStepResultStatus.UNKNOWN,
      messages_js_1.TestStepResultStatus.PASSED,
      messages_js_1.TestStepResultStatus.SKIPPED,
      messages_js_1.TestStepResultStatus.PENDING,
      messages_js_1.TestStepResultStatus.UNDEFINED,
      messages_js_1.TestStepResultStatus.AMBIGUOUS,
      messages_js_1.TestStepResultStatus.FAILED
    ].indexOf(status);
  }
});

// node_modules/@cucumber/gherkin/node_modules/@cucumber/messages/dist/cjs/src/version.js
var require_version2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.version = undefined;
  exports.version = "24.1.0";
});

// node_modules/@cucumber/gherkin/node_modules/@cucumber/messages/dist/cjs/src/index.js
var require_src = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getWorstTestStepResult = exports.parseEnvelope = exports.version = exports.IdGenerator = exports.TimeConversion = undefined;
  var TimeConversion = __importStar(require_TimeConversion());
  exports.TimeConversion = TimeConversion;
  var IdGenerator = __importStar(require_IdGenerator());
  exports.IdGenerator = IdGenerator;
  var parseEnvelope_js_1 = require_parseEnvelope();
  Object.defineProperty(exports, "parseEnvelope", { enumerable: true, get: function() {
    return parseEnvelope_js_1.parseEnvelope;
  } });
  var getWorstTestStepResult_js_1 = require_getWorstTestStepResult();
  Object.defineProperty(exports, "getWorstTestStepResult", { enumerable: true, get: function() {
    return getWorstTestStepResult_js_1.getWorstTestStepResult;
  } });
  var version_js_1 = require_version2();
  Object.defineProperty(exports, "version", { enumerable: true, get: function() {
    return version_js_1.version;
  } });
  __exportStar(require_messages(), exports);
});

// node_modules/@cucumber/gherkin/dist/src/GherkinClassicTokenMatcher.js
var require_GherkinClassicTokenMatcher = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var gherkin_languages_json_1 = __importDefault(require_gherkin_languages());
  var Errors_1 = require_Errors();
  var messages = __importStar(require_src());
  var Parser_1 = require_Parser();
  var countSymbols_1 = __importDefault(require_countSymbols());
  var DIALECT_DICT = gherkin_languages_json_1.default;
  var LANGUAGE_PATTERN = /^\s*#\s*language\s*:\s*([a-zA-Z\-_]+)\s*$/;
  function addKeywordTypeMappings(h, keywords, keywordType) {
    for (const k of keywords) {
      if (!(k in h)) {
        h[k] = [];
      }
      h[k].push(keywordType);
    }
  }

  class GherkinClassicTokenMatcher {
    constructor(defaultDialectName = "en") {
      this.defaultDialectName = defaultDialectName;
      this.reset();
    }
    changeDialect(newDialectName, location) {
      const newDialect = DIALECT_DICT[newDialectName];
      if (!newDialect) {
        throw Errors_1.NoSuchLanguageException.create(newDialectName, location);
      }
      this.dialectName = newDialectName;
      this.dialect = newDialect;
      this.initializeKeywordTypes();
    }
    reset() {
      if (this.dialectName !== this.defaultDialectName) {
        this.changeDialect(this.defaultDialectName);
      }
      this.activeDocStringSeparator = null;
      this.indentToRemove = 0;
    }
    initializeKeywordTypes() {
      this.keywordTypesMap = {};
      addKeywordTypeMappings(this.keywordTypesMap, this.dialect.given, messages.StepKeywordType.CONTEXT);
      addKeywordTypeMappings(this.keywordTypesMap, this.dialect.when, messages.StepKeywordType.ACTION);
      addKeywordTypeMappings(this.keywordTypesMap, this.dialect.then, messages.StepKeywordType.OUTCOME);
      addKeywordTypeMappings(this.keywordTypesMap, [].concat(this.dialect.and).concat(this.dialect.but), messages.StepKeywordType.CONJUNCTION);
    }
    match_TagLine(token) {
      if (token.line.startsWith("@")) {
        this.setTokenMatched(token, Parser_1.TokenType.TagLine, null, null, null, null, this.getTags(token.line));
        return true;
      }
      return false;
    }
    match_FeatureLine(token) {
      return this.matchTitleLine(token, Parser_1.TokenType.FeatureLine, this.dialect.feature);
    }
    match_ScenarioLine(token) {
      return this.matchTitleLine(token, Parser_1.TokenType.ScenarioLine, this.dialect.scenario) || this.matchTitleLine(token, Parser_1.TokenType.ScenarioLine, this.dialect.scenarioOutline);
    }
    match_BackgroundLine(token) {
      return this.matchTitleLine(token, Parser_1.TokenType.BackgroundLine, this.dialect.background);
    }
    match_ExamplesLine(token) {
      return this.matchTitleLine(token, Parser_1.TokenType.ExamplesLine, this.dialect.examples);
    }
    match_RuleLine(token) {
      return this.matchTitleLine(token, Parser_1.TokenType.RuleLine, this.dialect.rule);
    }
    match_TableRow(token) {
      if (token.line.startsWith("|")) {
        this.setTokenMatched(token, Parser_1.TokenType.TableRow, null, null, null, null, token.line.getTableCells());
        return true;
      }
      return false;
    }
    match_Empty(token) {
      if (token.line.isEmpty) {
        this.setTokenMatched(token, Parser_1.TokenType.Empty, null, null, 0);
        return true;
      }
      return false;
    }
    match_Comment(token) {
      if (token.line.startsWith("#")) {
        const text = token.line.getLineText(0);
        this.setTokenMatched(token, Parser_1.TokenType.Comment, text, null, 0);
        return true;
      }
      return false;
    }
    match_Language(token) {
      const match = token.line.trimmedLineText.match(LANGUAGE_PATTERN);
      if (match) {
        const newDialectName = match[1];
        this.setTokenMatched(token, Parser_1.TokenType.Language, newDialectName);
        this.changeDialect(newDialectName, token.location);
        return true;
      }
      return false;
    }
    match_DocStringSeparator(token) {
      return this.activeDocStringSeparator == null ? this._match_DocStringSeparator(token, '"""', true) || this._match_DocStringSeparator(token, "```", true) : this._match_DocStringSeparator(token, this.activeDocStringSeparator, false);
    }
    _match_DocStringSeparator(token, separator, isOpen) {
      if (token.line.startsWith(separator)) {
        let mediaType = null;
        if (isOpen) {
          mediaType = token.line.getRestTrimmed(separator.length);
          this.activeDocStringSeparator = separator;
          this.indentToRemove = token.line.indent;
        } else {
          this.activeDocStringSeparator = null;
          this.indentToRemove = 0;
        }
        this.setTokenMatched(token, Parser_1.TokenType.DocStringSeparator, mediaType, separator);
        return true;
      }
      return false;
    }
    match_EOF(token) {
      if (token.isEof) {
        this.setTokenMatched(token, Parser_1.TokenType.EOF);
        return true;
      }
      return false;
    }
    match_StepLine(token) {
      const keywords = [].concat(this.dialect.given).concat(this.dialect.when).concat(this.dialect.then).concat(this.dialect.and).concat(this.dialect.but);
      for (const keyword of keywords) {
        if (token.line.startsWith(keyword)) {
          const title = token.line.getRestTrimmed(keyword.length);
          const keywordTypes = this.keywordTypesMap[keyword];
          let keywordType = keywordTypes[0];
          if (keywordTypes.length > 1) {
            keywordType = messages.StepKeywordType.UNKNOWN;
          }
          this.setTokenMatched(token, Parser_1.TokenType.StepLine, title, keyword, null, keywordType);
          return true;
        }
      }
      return false;
    }
    match_Other(token) {
      const text = token.line.getLineText(this.indentToRemove);
      this.setTokenMatched(token, Parser_1.TokenType.Other, this.unescapeDocString(text), null, 0);
      return true;
    }
    getTags(line) {
      const uncommentedLine = line.trimmedLineText.split(/\s#/g, 2)[0];
      let column = line.indent + 1;
      const items = uncommentedLine.split("@");
      const tags = [];
      for (let i = 0;i < items.length; i++) {
        const item = items[i].trimRight();
        if (item.length == 0) {
          continue;
        }
        if (!item.match(/^\S+$/)) {
          throw Errors_1.ParserException.create("A tag may not contain whitespace", line.lineNumber, column);
        }
        const span = { column, text: "@" + item };
        tags.push(span);
        column += (0, countSymbols_1.default)(items[i]) + 1;
      }
      return tags;
    }
    matchTitleLine(token, tokenType, keywords) {
      for (const keyword of keywords) {
        if (token.line.startsWithTitleKeyword(keyword)) {
          const title = token.line.getRestTrimmed(keyword.length + ":".length);
          this.setTokenMatched(token, tokenType, title, keyword);
          return true;
        }
      }
      return false;
    }
    setTokenMatched(token, matchedType, text, keyword, indent, keywordType, items) {
      token.matchedType = matchedType;
      token.matchedText = text;
      token.matchedKeyword = keyword;
      token.matchedKeywordType = keywordType;
      token.matchedIndent = typeof indent === "number" ? indent : token.line == null ? 0 : token.line.indent;
      token.matchedItems = items || [];
      token.location.column = token.matchedIndent + 1;
      token.matchedGherkinDialect = this.dialectName;
    }
    unescapeDocString(text) {
      if (this.activeDocStringSeparator === '"""') {
        return text.replace("\\\"\\\"\\\"", '"""');
      }
      if (this.activeDocStringSeparator === "```") {
        return text.replace("\\`\\`\\`", "```");
      }
      return text;
    }
  }
  exports.default = GherkinClassicTokenMatcher;
});

// node_modules/@cucumber/gherkin/dist/src/pickles/compile.js
var require_compile = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var messages = __importStar(require_src());
  var pickleStepTypeFromKeyword = {
    [messages.StepKeywordType.UNKNOWN]: messages.PickleStepType.UNKNOWN,
    [messages.StepKeywordType.CONTEXT]: messages.PickleStepType.CONTEXT,
    [messages.StepKeywordType.ACTION]: messages.PickleStepType.ACTION,
    [messages.StepKeywordType.OUTCOME]: messages.PickleStepType.OUTCOME,
    [messages.StepKeywordType.CONJUNCTION]: null
  };
  function compile(gherkinDocument, uri, newId) {
    const pickles = [];
    if (gherkinDocument.feature == null) {
      return pickles;
    }
    const feature = gherkinDocument.feature;
    const language = feature.language;
    const featureTags = feature.tags;
    let featureBackgroundSteps = [];
    feature.children.forEach((stepsContainer) => {
      if (stepsContainer.background) {
        featureBackgroundSteps = [].concat(stepsContainer.background.steps);
      } else if (stepsContainer.rule) {
        compileRule(featureTags, featureBackgroundSteps, stepsContainer.rule, language, pickles, uri, newId);
      } else if (stepsContainer.scenario.examples.length === 0) {
        compileScenario(featureTags, featureBackgroundSteps, stepsContainer.scenario, language, pickles, uri, newId);
      } else {
        compileScenarioOutline(featureTags, featureBackgroundSteps, stepsContainer.scenario, language, pickles, uri, newId);
      }
    });
    return pickles;
  }
  exports.default = compile;
  function compileRule(featureTags, featureBackgroundSteps, rule, language, pickles, uri, newId) {
    let ruleBackgroundSteps = [].concat(featureBackgroundSteps);
    const tags = [].concat(featureTags).concat(rule.tags);
    rule.children.forEach((stepsContainer) => {
      if (stepsContainer.background) {
        ruleBackgroundSteps = ruleBackgroundSteps.concat(stepsContainer.background.steps);
      } else if (stepsContainer.scenario.examples.length === 0) {
        compileScenario(tags, ruleBackgroundSteps, stepsContainer.scenario, language, pickles, uri, newId);
      } else {
        compileScenarioOutline(tags, ruleBackgroundSteps, stepsContainer.scenario, language, pickles, uri, newId);
      }
    });
  }
  function compileScenario(inheritedTags, backgroundSteps, scenario, language, pickles, uri, newId) {
    let lastKeywordType = messages.StepKeywordType.UNKNOWN;
    const steps = [];
    if (scenario.steps.length !== 0) {
      backgroundSteps.forEach((step) => {
        lastKeywordType = step.keywordType === messages.StepKeywordType.CONJUNCTION ? lastKeywordType : step.keywordType;
        steps.push(pickleStep(step, [], null, newId, lastKeywordType));
      });
    }
    const tags = [].concat(inheritedTags).concat(scenario.tags);
    scenario.steps.forEach((step) => {
      lastKeywordType = step.keywordType === messages.StepKeywordType.CONJUNCTION ? lastKeywordType : step.keywordType;
      steps.push(pickleStep(step, [], null, newId, lastKeywordType));
    });
    const pickle = {
      id: newId(),
      uri,
      astNodeIds: [scenario.id],
      tags: pickleTags(tags),
      name: scenario.name,
      language,
      steps
    };
    pickles.push(pickle);
  }
  function compileScenarioOutline(inheritedTags, backgroundSteps, scenario, language, pickles, uri, newId) {
    scenario.examples.filter((e) => e.tableHeader).forEach((examples) => {
      const variableCells = examples.tableHeader.cells;
      examples.tableBody.forEach((valuesRow) => {
        let lastKeywordType = messages.StepKeywordType.UNKNOWN;
        const steps = [];
        if (scenario.steps.length !== 0) {
          backgroundSteps.forEach((step) => {
            lastKeywordType = step.keywordType === messages.StepKeywordType.CONJUNCTION ? lastKeywordType : step.keywordType;
            steps.push(pickleStep(step, [], null, newId, lastKeywordType));
          });
        }
        scenario.steps.forEach((scenarioOutlineStep) => {
          lastKeywordType = scenarioOutlineStep.keywordType === messages.StepKeywordType.CONJUNCTION ? lastKeywordType : scenarioOutlineStep.keywordType;
          const step = pickleStep(scenarioOutlineStep, variableCells, valuesRow, newId, lastKeywordType);
          steps.push(step);
        });
        const id = newId();
        const tags = pickleTags([].concat(inheritedTags).concat(scenario.tags).concat(examples.tags));
        pickles.push({
          id,
          uri,
          astNodeIds: [scenario.id, valuesRow.id],
          name: interpolate(scenario.name, variableCells, valuesRow.cells),
          language,
          steps,
          tags
        });
      });
    });
  }
  function createPickleArguments(step, variableCells, valueCells) {
    if (step.dataTable) {
      const argument = step.dataTable;
      const table = {
        rows: argument.rows.map((row) => {
          return {
            cells: row.cells.map((cell) => {
              return {
                value: interpolate(cell.value, variableCells, valueCells)
              };
            })
          };
        })
      };
      return { dataTable: table };
    } else if (step.docString) {
      const argument = step.docString;
      const docString = {
        content: interpolate(argument.content, variableCells, valueCells)
      };
      if (argument.mediaType) {
        docString.mediaType = interpolate(argument.mediaType, variableCells, valueCells);
      }
      return { docString };
    }
  }
  function interpolate(name, variableCells, valueCells) {
    variableCells.forEach((variableCell, n) => {
      const valueCell = valueCells[n];
      const valuePattern = "<" + variableCell.value + ">";
      const escapedPattern = valuePattern.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regexp = new RegExp(escapedPattern, "g");
      const replacement = valueCell.value.replace(new RegExp("\\$", "g"), "$$$$");
      name = name.replace(regexp, replacement);
    });
    return name;
  }
  function pickleStep(step, variableCells, valuesRow, newId, keywordType) {
    const astNodeIds = [step.id];
    if (valuesRow) {
      astNodeIds.push(valuesRow.id);
    }
    const valueCells = valuesRow ? valuesRow.cells : [];
    return {
      id: newId(),
      text: interpolate(step.text, variableCells, valueCells),
      type: pickleStepTypeFromKeyword[keywordType],
      argument: createPickleArguments(step, variableCells, valueCells),
      astNodeIds
    };
  }
  function pickleTags(tags) {
    return tags.map(pickleTag);
  }
  function pickleTag(tag) {
    return {
      name: tag.name,
      astNodeId: tag.id
    };
  }
});

// node_modules/@cucumber/gherkin/dist/src/AstNode.js
var require_AstNode = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });

  class AstNode {
    constructor(ruleType) {
      this.ruleType = ruleType;
      this.subItems = new Map;
    }
    add(type, obj) {
      let items = this.subItems.get(type);
      if (items === undefined) {
        items = [];
        this.subItems.set(type, items);
      }
      items.push(obj);
    }
    getSingle(ruleType) {
      return (this.subItems.get(ruleType) || [])[0];
    }
    getItems(ruleType) {
      return this.subItems.get(ruleType) || [];
    }
    getToken(tokenType) {
      return (this.subItems.get(tokenType) || [])[0];
    }
    getTokens(tokenType) {
      return this.subItems.get(tokenType) || [];
    }
  }
  exports.default = AstNode;
});

// node_modules/@cucumber/gherkin/dist/src/AstBuilder.js
var require_AstBuilder = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var AstNode_1 = __importDefault(require_AstNode());
  var Parser_1 = require_Parser();
  var Errors_1 = require_Errors();

  class AstBuilder {
    constructor(newId) {
      this.newId = newId;
      if (!newId) {
        throw new Error("No newId");
      }
      this.reset();
    }
    reset() {
      this.stack = [new AstNode_1.default(Parser_1.RuleType.None)];
      this.comments = [];
    }
    startRule(ruleType) {
      this.stack.push(new AstNode_1.default(ruleType));
    }
    endRule() {
      const node = this.stack.pop();
      const transformedNode = this.transformNode(node);
      this.currentNode().add(node.ruleType, transformedNode);
    }
    build(token) {
      if (token.matchedType === Parser_1.TokenType.Comment) {
        this.comments.push({
          location: this.getLocation(token),
          text: token.matchedText
        });
      } else {
        this.currentNode().add(token.matchedType, token);
      }
    }
    getResult() {
      return this.currentNode().getSingle(Parser_1.RuleType.GherkinDocument);
    }
    currentNode() {
      return this.stack[this.stack.length - 1];
    }
    getLocation(token, column) {
      return !column ? token.location : { line: token.location.line, column };
    }
    getTags(node) {
      const tags = [];
      const tagsNode = node.getSingle(Parser_1.RuleType.Tags);
      if (!tagsNode) {
        return tags;
      }
      const tokens = tagsNode.getTokens(Parser_1.TokenType.TagLine);
      for (const token of tokens) {
        for (const tagItem of token.matchedItems) {
          tags.push({
            location: this.getLocation(token, tagItem.column),
            name: tagItem.text,
            id: this.newId()
          });
        }
      }
      return tags;
    }
    getCells(tableRowToken) {
      return tableRowToken.matchedItems.map((cellItem) => ({
        location: this.getLocation(tableRowToken, cellItem.column),
        value: cellItem.text
      }));
    }
    getDescription(node) {
      return node.getSingle(Parser_1.RuleType.Description) || "";
    }
    getSteps(node) {
      return node.getItems(Parser_1.RuleType.Step);
    }
    getTableRows(node) {
      const rows = node.getTokens(Parser_1.TokenType.TableRow).map((token) => ({
        id: this.newId(),
        location: this.getLocation(token),
        cells: this.getCells(token)
      }));
      this.ensureCellCount(rows);
      return rows.length === 0 ? [] : rows;
    }
    ensureCellCount(rows) {
      if (rows.length === 0) {
        return;
      }
      const cellCount = rows[0].cells.length;
      rows.forEach((row) => {
        if (row.cells.length !== cellCount) {
          throw Errors_1.AstBuilderException.create("inconsistent cell count within the table", row.location);
        }
      });
    }
    transformNode(node) {
      switch (node.ruleType) {
        case Parser_1.RuleType.Step: {
          const stepLine = node.getToken(Parser_1.TokenType.StepLine);
          const dataTable = node.getSingle(Parser_1.RuleType.DataTable);
          const docString = node.getSingle(Parser_1.RuleType.DocString);
          const location = this.getLocation(stepLine);
          const step = {
            id: this.newId(),
            location,
            keyword: stepLine.matchedKeyword,
            keywordType: stepLine.matchedKeywordType,
            text: stepLine.matchedText,
            dataTable,
            docString
          };
          return step;
        }
        case Parser_1.RuleType.DocString: {
          const separatorToken = node.getTokens(Parser_1.TokenType.DocStringSeparator)[0];
          const mediaType = separatorToken.matchedText.length > 0 ? separatorToken.matchedText : undefined;
          const lineTokens = node.getTokens(Parser_1.TokenType.Other);
          const content = lineTokens.map((t) => t.matchedText).join(`
`);
          const result = {
            location: this.getLocation(separatorToken),
            content,
            delimiter: separatorToken.matchedKeyword
          };
          if (mediaType) {
            result.mediaType = mediaType;
          }
          return result;
        }
        case Parser_1.RuleType.DataTable: {
          const rows = this.getTableRows(node);
          const dataTable = {
            location: rows[0].location,
            rows
          };
          return dataTable;
        }
        case Parser_1.RuleType.Background: {
          const backgroundLine = node.getToken(Parser_1.TokenType.BackgroundLine);
          const description = this.getDescription(node);
          const steps = this.getSteps(node);
          const background = {
            id: this.newId(),
            location: this.getLocation(backgroundLine),
            keyword: backgroundLine.matchedKeyword,
            name: backgroundLine.matchedText,
            description,
            steps
          };
          return background;
        }
        case Parser_1.RuleType.ScenarioDefinition: {
          const tags = this.getTags(node);
          const scenarioNode = node.getSingle(Parser_1.RuleType.Scenario);
          const scenarioLine = scenarioNode.getToken(Parser_1.TokenType.ScenarioLine);
          const description = this.getDescription(scenarioNode);
          const steps = this.getSteps(scenarioNode);
          const examples = scenarioNode.getItems(Parser_1.RuleType.ExamplesDefinition);
          const scenario = {
            id: this.newId(),
            tags,
            location: this.getLocation(scenarioLine),
            keyword: scenarioLine.matchedKeyword,
            name: scenarioLine.matchedText,
            description,
            steps,
            examples
          };
          return scenario;
        }
        case Parser_1.RuleType.ExamplesDefinition: {
          const tags = this.getTags(node);
          const examplesNode = node.getSingle(Parser_1.RuleType.Examples);
          const examplesLine = examplesNode.getToken(Parser_1.TokenType.ExamplesLine);
          const description = this.getDescription(examplesNode);
          const examplesTable = examplesNode.getSingle(Parser_1.RuleType.ExamplesTable);
          const examples = {
            id: this.newId(),
            tags,
            location: this.getLocation(examplesLine),
            keyword: examplesLine.matchedKeyword,
            name: examplesLine.matchedText,
            description,
            tableHeader: examplesTable ? examplesTable[0] : undefined,
            tableBody: examplesTable ? examplesTable.slice(1) : []
          };
          return examples;
        }
        case Parser_1.RuleType.ExamplesTable: {
          return this.getTableRows(node);
        }
        case Parser_1.RuleType.Description: {
          let lineTokens = node.getTokens(Parser_1.TokenType.Other);
          let end = lineTokens.length;
          while (end > 0 && lineTokens[end - 1].line.trimmedLineText === "") {
            end--;
          }
          lineTokens = lineTokens.slice(0, end);
          return lineTokens.map((token) => token.matchedText).join(`
`);
        }
        case Parser_1.RuleType.Feature: {
          const header = node.getSingle(Parser_1.RuleType.FeatureHeader);
          if (!header) {
            return null;
          }
          const tags = this.getTags(header);
          const featureLine = header.getToken(Parser_1.TokenType.FeatureLine);
          if (!featureLine) {
            return null;
          }
          const children = [];
          const background = node.getSingle(Parser_1.RuleType.Background);
          if (background) {
            children.push({
              background
            });
          }
          for (const scenario of node.getItems(Parser_1.RuleType.ScenarioDefinition)) {
            children.push({
              scenario
            });
          }
          for (const rule of node.getItems(Parser_1.RuleType.Rule)) {
            children.push({
              rule
            });
          }
          const description = this.getDescription(header);
          const language = featureLine.matchedGherkinDialect;
          const feature = {
            tags,
            location: this.getLocation(featureLine),
            language,
            keyword: featureLine.matchedKeyword,
            name: featureLine.matchedText,
            description,
            children
          };
          return feature;
        }
        case Parser_1.RuleType.Rule: {
          const header = node.getSingle(Parser_1.RuleType.RuleHeader);
          if (!header) {
            return null;
          }
          const ruleLine = header.getToken(Parser_1.TokenType.RuleLine);
          if (!ruleLine) {
            return null;
          }
          const tags = this.getTags(header);
          const children = [];
          const background = node.getSingle(Parser_1.RuleType.Background);
          if (background) {
            children.push({
              background
            });
          }
          for (const scenario of node.getItems(Parser_1.RuleType.ScenarioDefinition)) {
            children.push({
              scenario
            });
          }
          const description = this.getDescription(header);
          const rule = {
            id: this.newId(),
            location: this.getLocation(ruleLine),
            keyword: ruleLine.matchedKeyword,
            name: ruleLine.matchedText,
            description,
            children,
            tags
          };
          return rule;
        }
        case Parser_1.RuleType.GherkinDocument: {
          const feature = node.getSingle(Parser_1.RuleType.Feature);
          const gherkinDocument = {
            feature,
            comments: this.comments
          };
          return gherkinDocument;
        }
        default:
          return node;
      }
    }
  }
  exports.default = AstBuilder;
});

// node_modules/@cucumber/gherkin/dist/src/makeSourceEnvelope.js
var require_makeSourceEnvelope = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var messages = __importStar(require_src());
  function makeSourceEnvelope(data, uri) {
    let mediaType;
    if (uri.endsWith(".feature")) {
      mediaType = messages.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN;
    } else if (uri.endsWith(".md")) {
      mediaType = messages.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_MARKDOWN;
    }
    if (!mediaType)
      throw new Error(`The uri (${uri}) must end with .feature or .md`);
    return {
      source: {
        data,
        uri,
        mediaType
      }
    };
  }
  exports.default = makeSourceEnvelope;
});

// node_modules/@cucumber/gherkin/dist/src/GherkinInMarkdownTokenMatcher.js
var require_GherkinInMarkdownTokenMatcher = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var Parser_1 = require_Parser();
  var gherkin_languages_json_1 = __importDefault(require_gherkin_languages());
  var messages = __importStar(require_src());
  var Errors_1 = require_Errors();
  var DIALECT_DICT = gherkin_languages_json_1.default;
  var DEFAULT_DOC_STRING_SEPARATOR = /^(```[`]*)(.*)/;
  function addKeywordTypeMappings(h, keywords, keywordType) {
    for (const k of keywords) {
      if (!(k in h)) {
        h[k] = [];
      }
      h[k].push(keywordType);
    }
  }

  class GherkinInMarkdownTokenMatcher {
    constructor(defaultDialectName = "en") {
      this.defaultDialectName = defaultDialectName;
      this.dialect = DIALECT_DICT[defaultDialectName];
      this.nonStarStepKeywords = [].concat(this.dialect.given).concat(this.dialect.when).concat(this.dialect.then).concat(this.dialect.and).concat(this.dialect.but).filter((value, index, self2) => value !== "* " && self2.indexOf(value) === index);
      this.initializeKeywordTypes();
      this.stepRegexp = new RegExp(`${KeywordPrefix.BULLET}(${this.nonStarStepKeywords.map(escapeRegExp).join("|")})`);
      const headerKeywords = [].concat(this.dialect.feature).concat(this.dialect.background).concat(this.dialect.rule).concat(this.dialect.scenarioOutline).concat(this.dialect.scenario).concat(this.dialect.examples).filter((value, index, self2) => self2.indexOf(value) === index);
      this.headerRegexp = new RegExp(`${KeywordPrefix.HEADER}(${headerKeywords.map(escapeRegExp).join("|")})`);
      this.reset();
    }
    changeDialect(newDialectName, location) {
      const newDialect = DIALECT_DICT[newDialectName];
      if (!newDialect) {
        throw Errors_1.NoSuchLanguageException.create(newDialectName, location);
      }
      this.dialectName = newDialectName;
      this.dialect = newDialect;
      this.initializeKeywordTypes();
    }
    initializeKeywordTypes() {
      this.keywordTypesMap = {};
      addKeywordTypeMappings(this.keywordTypesMap, this.dialect.given, messages.StepKeywordType.CONTEXT);
      addKeywordTypeMappings(this.keywordTypesMap, this.dialect.when, messages.StepKeywordType.ACTION);
      addKeywordTypeMappings(this.keywordTypesMap, this.dialect.then, messages.StepKeywordType.OUTCOME);
      addKeywordTypeMappings(this.keywordTypesMap, [].concat(this.dialect.and).concat(this.dialect.but), messages.StepKeywordType.CONJUNCTION);
    }
    match_Language(token) {
      if (!token)
        throw new Error("no token");
      return false;
    }
    match_Empty(token) {
      let result = false;
      if (token.line.isEmpty) {
        result = true;
      }
      if (!this.match_TagLine(token) && !this.match_FeatureLine(token) && !this.match_ScenarioLine(token) && !this.match_BackgroundLine(token) && !this.match_ExamplesLine(token) && !this.match_RuleLine(token) && !this.match_TableRow(token) && !this.match_Comment(token) && !this.match_Language(token) && !this.match_DocStringSeparator(token) && !this.match_EOF(token) && !this.match_StepLine(token)) {
        result = true;
      }
      if (result) {
        token.matchedType = Parser_1.TokenType.Empty;
      }
      return this.setTokenMatched(token, null, result);
    }
    match_Other(token) {
      const text = token.line.getLineText(this.indentToRemove);
      token.matchedType = Parser_1.TokenType.Other;
      token.matchedText = text;
      token.matchedIndent = 0;
      return this.setTokenMatched(token, null, true);
    }
    match_Comment(token) {
      let result = false;
      if (token.line.startsWith("|")) {
        const tableCells = token.line.getTableCells();
        if (this.isGfmTableSeparator(tableCells))
          result = true;
      }
      return this.setTokenMatched(token, null, result);
    }
    match_DocStringSeparator(token) {
      const match = token.line.trimmedLineText.match(this.activeDocStringSeparator);
      const [, newSeparator, mediaType] = match || [];
      let result = false;
      if (newSeparator) {
        if (this.activeDocStringSeparator === DEFAULT_DOC_STRING_SEPARATOR) {
          this.activeDocStringSeparator = new RegExp(`^(${newSeparator})$`);
          this.indentToRemove = token.line.indent;
        } else {
          this.activeDocStringSeparator = DEFAULT_DOC_STRING_SEPARATOR;
        }
        token.matchedKeyword = newSeparator;
        token.matchedType = Parser_1.TokenType.DocStringSeparator;
        token.matchedText = mediaType || "";
        result = true;
      }
      return this.setTokenMatched(token, null, result);
    }
    match_EOF(token) {
      let result = false;
      if (token.isEof) {
        token.matchedType = Parser_1.TokenType.EOF;
        result = true;
      }
      return this.setTokenMatched(token, null, result);
    }
    match_FeatureLine(token) {
      if (this.matchedFeatureLine) {
        return this.setTokenMatched(token, null, false);
      }
      let result = this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.feature, ":", token, Parser_1.TokenType.FeatureLine);
      if (!result) {
        token.matchedType = Parser_1.TokenType.FeatureLine;
        token.matchedText = token.line.trimmedLineText;
        result = this.setTokenMatched(token, null, true);
      }
      this.matchedFeatureLine = result;
      return result;
    }
    match_BackgroundLine(token) {
      return this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.background, ":", token, Parser_1.TokenType.BackgroundLine);
    }
    match_RuleLine(token) {
      return this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.rule, ":", token, Parser_1.TokenType.RuleLine);
    }
    match_ScenarioLine(token) {
      return this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.scenario, ":", token, Parser_1.TokenType.ScenarioLine) || this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.scenarioOutline, ":", token, Parser_1.TokenType.ScenarioLine);
    }
    match_ExamplesLine(token) {
      return this.matchTitleLine(KeywordPrefix.HEADER, this.dialect.examples, ":", token, Parser_1.TokenType.ExamplesLine);
    }
    match_StepLine(token) {
      return this.matchTitleLine(KeywordPrefix.BULLET, this.nonStarStepKeywords, "", token, Parser_1.TokenType.StepLine);
    }
    matchTitleLine(prefix, keywords, keywordSuffix, token, matchedType) {
      const regexp = new RegExp(`${prefix}(${keywords.map(escapeRegExp).join("|")})${keywordSuffix}(.*)`);
      const match = token.line.match(regexp);
      let indent = token.line.indent;
      let result = false;
      if (match) {
        token.matchedType = matchedType;
        token.matchedKeyword = match[2];
        if (match[2] in this.keywordTypesMap) {
          if (this.keywordTypesMap[match[2]].length > 1) {
            token.matchedKeywordType = messages.StepKeywordType.UNKNOWN;
          } else {
            token.matchedKeywordType = this.keywordTypesMap[match[2]][0];
          }
        }
        token.matchedText = match[3].trim();
        indent += match[1].length;
        result = true;
      }
      return this.setTokenMatched(token, indent, result);
    }
    setTokenMatched(token, indent, matched) {
      token.matchedGherkinDialect = this.dialectName;
      token.matchedIndent = indent !== null ? indent : token.line == null ? 0 : token.line.indent;
      token.location.column = token.matchedIndent + 1;
      return matched;
    }
    match_TableRow(token) {
      if (token.line.lineText.match(/^\s\s\s?\s?\s?\|/)) {
        const tableCells = token.line.getTableCells();
        if (this.isGfmTableSeparator(tableCells))
          return false;
        token.matchedKeyword = "|";
        token.matchedType = Parser_1.TokenType.TableRow;
        token.matchedItems = tableCells;
        return true;
      }
      return false;
    }
    isGfmTableSeparator(tableCells) {
      const separatorValues = tableCells.map((item) => item.text).filter((value) => value.match(/^:?-+:?$/));
      return separatorValues.length > 0;
    }
    match_TagLine(token) {
      const tags = [];
      let m;
      const re = /`(@[^`]+)`/g;
      do {
        m = re.exec(token.line.trimmedLineText);
        if (m) {
          tags.push({
            column: token.line.indent + m.index + 2,
            text: m[1]
          });
        }
      } while (m);
      if (tags.length === 0)
        return false;
      token.matchedType = Parser_1.TokenType.TagLine;
      token.matchedItems = tags;
      return true;
    }
    reset() {
      if (this.dialectName !== this.defaultDialectName) {
        this.changeDialect(this.defaultDialectName);
      }
      this.activeDocStringSeparator = DEFAULT_DOC_STRING_SEPARATOR;
    }
  }
  exports.default = GherkinInMarkdownTokenMatcher;
  var KeywordPrefix;
  (function(KeywordPrefix2) {
    KeywordPrefix2["BULLET"] = "^(\\s*[*+-]\\s*)";
    KeywordPrefix2["HEADER"] = "^(#{1,6}\\s)";
  })(KeywordPrefix || (KeywordPrefix = {}));
  function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }
});

// node_modules/@cucumber/gherkin/dist/src/generateMessages.js
var require_generateMessages = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  var Parser_1 = __importDefault(require_Parser());
  var GherkinClassicTokenMatcher_1 = __importDefault(require_GherkinClassicTokenMatcher());
  var messages = __importStar(require_src());
  var compile_1 = __importDefault(require_compile());
  var AstBuilder_1 = __importDefault(require_AstBuilder());
  var makeSourceEnvelope_1 = __importDefault(require_makeSourceEnvelope());
  var GherkinInMarkdownTokenMatcher_1 = __importDefault(require_GherkinInMarkdownTokenMatcher());
  function generateMessages(data, uri, mediaType, options) {
    let tokenMatcher;
    switch (mediaType) {
      case messages.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN:
        tokenMatcher = new GherkinClassicTokenMatcher_1.default(options.defaultDialect);
        break;
      case messages.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_MARKDOWN:
        tokenMatcher = new GherkinInMarkdownTokenMatcher_1.default(options.defaultDialect);
        break;
      default:
        throw new Error(`Unsupported media type: ${mediaType}`);
    }
    const result = [];
    try {
      if (options.includeSource) {
        result.push((0, makeSourceEnvelope_1.default)(data, uri));
      }
      if (!options.includeGherkinDocument && !options.includePickles) {
        return result;
      }
      const parser = new Parser_1.default(new AstBuilder_1.default(options.newId), tokenMatcher);
      parser.stopAtFirstError = false;
      const gherkinDocument = parser.parse(data);
      if (options.includeGherkinDocument) {
        result.push({
          gherkinDocument: { ...gherkinDocument, uri }
        });
      }
      if (options.includePickles) {
        const pickles = (0, compile_1.default)(gherkinDocument, uri, options.newId);
        for (const pickle of pickles) {
          result.push({
            pickle
          });
        }
      }
    } catch (err) {
      const errors = err.errors || [err];
      for (const error of errors) {
        if (!error.location) {
          throw error;
        }
        result.push({
          parseError: {
            source: {
              uri,
              location: {
                line: error.location.line,
                column: error.location.column
              }
            },
            message: error.message
          }
        });
      }
    }
    return result;
  }
  exports.default = generateMessages;
});

// node_modules/@cucumber/gherkin/dist/src/index.js
var require_src2 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    }
    __setModuleDefault(result, mod);
    return result;
  };
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.compile = exports.GherkinInMarkdownTokenMatcher = exports.GherkinClassicTokenMatcher = exports.Errors = exports.TokenScanner = exports.AstBuilder = exports.Parser = exports.dialects = exports.makeSourceEnvelope = exports.generateMessages = undefined;
  var generateMessages_1 = __importDefault(require_generateMessages());
  exports.generateMessages = generateMessages_1.default;
  var makeSourceEnvelope_1 = __importDefault(require_makeSourceEnvelope());
  exports.makeSourceEnvelope = makeSourceEnvelope_1.default;
  var Parser_1 = __importDefault(require_Parser());
  exports.Parser = Parser_1.default;
  var AstBuilder_1 = __importDefault(require_AstBuilder());
  exports.AstBuilder = AstBuilder_1.default;
  var TokenScanner_1 = __importDefault(require_TokenScanner());
  exports.TokenScanner = TokenScanner_1.default;
  var Errors = __importStar(require_Errors());
  exports.Errors = Errors;
  var compile_1 = __importDefault(require_compile());
  exports.compile = compile_1.default;
  var gherkin_languages_json_1 = __importDefault(require_gherkin_languages());
  var GherkinClassicTokenMatcher_1 = __importDefault(require_GherkinClassicTokenMatcher());
  exports.GherkinClassicTokenMatcher = GherkinClassicTokenMatcher_1.default;
  var GherkinInMarkdownTokenMatcher_1 = __importDefault(require_GherkinInMarkdownTokenMatcher());
  exports.GherkinInMarkdownTokenMatcher = GherkinInMarkdownTokenMatcher_1.default;
  var dialects = gherkin_languages_json_1.default;
  exports.dialects = dialects;
});

// src/parser/gherkin-parser.ts
import { readFile as readFile2 } from "fs/promises";

class GherkinParser {
  discovery;
  mapper;
  constructor() {
    this.discovery = new FeatureDiscovery;
    this.mapper = new ScenarioMapper;
  }
  async discoverFeatures(featuresPath) {
    return this.discovery.discover(featuresPath);
  }
  async parseFeatures(featureFiles) {
    const features = [];
    for (const filePath of featureFiles) {
      try {
        const content = await readFile2(filePath, "utf-8");
        features.push(await this.parse(content, filePath));
      } catch (error) {
        throw new Error(`Failed to parse feature file ${filePath}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return features;
  }
  async parse(gherkinContent, filePath) {
    const { Parser, AstBuilder, GherkinClassicTokenMatcher } = await Promise.resolve().then(() => __toESM(require_src2(), 1));
    const builder = new AstBuilder(() => crypto.randomUUID());
    const tokenMatcher = new GherkinClassicTokenMatcher;
    const parser = new Parser(builder, tokenMatcher);
    const doc = parser.parse(gherkinContent);
    if (!doc || !doc.feature)
      throw new Error("Invalid Gherkin document: no feature found");
    return await this.convertToFeature(doc, filePath);
  }
  async convertToFeature(doc, filePath) {
    const feature = doc.feature;
    const result = {
      name: feature.name,
      description: feature.description,
      scenarios: [],
      tags: feature.tags?.map((t) => t.name.replace(/^@/, "")) || [],
      filePath
    };
    for (const child of feature.children || []) {
      if (child.background) {
        result.background = { steps: child.background.steps.map((s) => this.mapper.convertStep(s)) };
      } else if (child.rule) {
        const rule = this.mapper.convertRule(child.rule, filePath);
        result.rules = result.rules || [];
        result.rules.push(rule);
        result.scenarios.push(...rule.scenarios);
      } else if (child.scenario) {
        result.scenarios.push(await this.mapper.convertScenario(child.scenario, child.scenario.keyword === "Scenario Outline", filePath));
      }
    }
    return result;
  }
  async read(filePath, featureFilePath) {
    const { DataTableParser: DataTableParser2 } = await Promise.resolve().then(() => (init_data_table_parser(), exports_data_table_parser));
    return DataTableParser2.read(filePath, featureFilePath);
  }
}
var init_gherkin_parser = __esm(() => {
  init_feature_discovery();
  init_scenario_mapper();
});

// src/utils/env-loader.ts
import * as fs2 from "fs";
import * as path2 from "path";
function loadEnv(env = "test", options = {}) {
  const config = {};
  const envName = options.env || env;
  const envFilePaths = [
    path2.resolve(process.cwd(), ".env"),
    path2.resolve(process.cwd(), `.env.${envName}`),
    path2.resolve(process.cwd(), ".env.local"),
    path2.resolve(process.cwd(), `.env.${envName}.local`)
  ];
  for (const envFilePath of envFilePaths) {
    if (fs2.existsSync(envFilePath)) {
      if (!options.silent) {
        console.log(`\uD83D\uDCC4 Loading environment from: ${path2.basename(envFilePath)}`);
      }
      const content = fs2.readFileSync(envFilePath, "utf-8");
      parseEnvFile(content, config);
    }
  }
  for (const key of Object.keys(process.env)) {
    if (process.env[key]) {
      config[key] = process.env[key];
    }
  }
  if (options.override) {
    for (const [key, value] of Object.entries(options.override)) {
      config[key] = value;
    }
  }
  return config;
}
function parseEnvFile(content, config) {
  const lines = content.split(`
`);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();
      if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      config[key] = value;
    }
  }
}
function resolveEnvVariables(value, env) {
  return value.replace(/\$\{(\w+)\}/g, (_, name) => {
    return env[name] ?? process.env[name] ?? "";
  }).replace(/\$(\w+)/g, (_, name) => {
    return env[name] ?? process.env[name] ?? "";
  });
}
var init_env_loader = () => {};

// src/engine/cucumber-expression.ts
function parseCucumberExpression(expression) {
  const parameterNames = [];
  const parameterTypes = [];
  let regexStr = expression;
  let typeIndex = 0;
  const typePattern = /\{([^}]+)\}/g;
  let match;
  while ((match = typePattern.exec(expression)) !== null) {
    const fullMatch = match[0];
    const content = match[1];
    let typeName;
    let paramName;
    if (content.includes(":")) {
      const parts = content.split(":");
      paramName = parts[0];
      typeName = parts[1];
    } else {
      paramName = `param${typeIndex}`;
      typeName = content;
    }
    const typeKey = `{${typeName}}`;
    const pattern = TYPE_PATTERNS[typeKey] || ".*";
    parameterNames.push(paramName);
    parameterTypes.push(typeName);
    regexStr = regexStr.replace(fullMatch, `(${pattern})`);
    typeIndex++;
  }
  regexStr = buildEscapedRegex(expression, parameterNames, parameterTypes);
  return {
    regex: new RegExp(`^${regexStr}$`, "i"),
    parameterNames,
    parameterTypes
  };
}
function buildEscapedRegex(expression, paramNames, paramTypes) {
  let result = "";
  let paramIndex = 0;
  let inBrace = false;
  let currentParam = "";
  for (let i = 0;i < expression.length; i++) {
    const char = expression[i];
    if (char === "{") {
      inBrace = true;
      currentParam = "";
      continue;
    }
    if (char === "}") {
      inBrace = false;
      const typeName = currentParam.includes(":") ? currentParam.split(":")[1] : currentParam;
      const typeKey = `{${typeName}}`;
      const pattern = TYPE_PATTERNS[typeKey] || ".*";
      result += `(${pattern})`;
      paramIndex++;
      continue;
    }
    if (inBrace) {
      currentParam += char;
      continue;
    }
    if (char === "^" || char === "$" || char === "\\" || char === "." || char === "*" || char === "+" || char === "?" || char === "(" || char === ")" || char === "[" || char === "]" || char === "|" || char === "/") {
      result += "\\" + char;
    } else {
      result += char;
    }
  }
  return result;
}
function matchExpression(expression, stepText) {
  const parsed = parseCucumberExpression(expression);
  const match = parsed.regex.exec(stepText);
  if (!match) {
    return { matched: false, parameters: {} };
  }
  const parameters = {};
  for (let i = 0;i < parsed.parameterNames.length; i++) {
    const name = parsed.parameterNames[i];
    const type = parsed.parameterTypes[i];
    const value = match[i + 1];
    const typeKey = `{${type}}`;
    const converter = TYPE_CONVERTERS[typeKey];
    if (converter) {
      parameters[name] = converter(value);
    } else {
      parameters[name] = value;
    }
  }
  return { matched: true, parameters };
}
function getSupportedTypes() {
  return Object.keys(TYPE_PATTERNS);
}
var TYPE_PATTERNS, TYPE_CONVERTERS;
var init_cucumber_expression = __esm(() => {
  TYPE_PATTERNS = {
    "{int}": "-?\\d+",
    "{float}": "-?\\d+\\.\\d+",
    "{boolean}": "(true|false|yes|no)",
    "{word}": "\\w+",
    "{string}": `"[^"]+"|'[^']+'|\\S+`
  };
  TYPE_CONVERTERS = {
    "{int}": (value) => parseInt(value, 10),
    "{float}": (value) => parseFloat(value),
    "{boolean}": (value) => {
      const lower = value.toLowerCase();
      return lower === "true" || lower === "yes" || lower === "1";
    },
    "{word}": (value) => value,
    "{string}": (value) => {
      if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
        return value.slice(1, -1);
      }
      return value;
    }
  };
});

// src/http/retry-manager.ts
class RetryManager {
  async execute(operation, retryOptions, isRetryableError) {
    let attempt = 0;
    const maxAttempts = retryOptions.maxRetries + 1;
    let lastError = null;
    while (attempt < maxAttempts) {
      try {
        return await operation(attempt);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt >= maxAttempts - 1 || !isRetryableError(lastError))
          throw lastError;
        attempt++;
        await new Promise((resolve4) => setTimeout(resolve4, this.calculateDelay(retryOptions, attempt)));
      }
    }
    throw lastError;
  }
  calculateDelay(options, attempt) {
    const baseDelay = options.delay;
    return options.backoff === "exponential" ? baseDelay * Math.pow(2, attempt - 1) : baseDelay * attempt;
  }
  async executeWithRetry(operation, stepText, defaultOptions) {
    const retryOptions = this.parseRetryAnnotation(stepText) || defaultOptions;
    let attempt = 0;
    const maxAttempts = retryOptions.maxRetries + 1;
    let lastError = null;
    while (attempt < maxAttempts) {
      try {
        return await operation(attempt);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt >= maxAttempts - 1) {
          throw lastError;
        }
        attempt++;
        const delay = this.calculateStepDelay(retryOptions, attempt);
        if (retryOptions.onRetry) {
          retryOptions.onRetry(attempt, retryOptions.maxRetries, lastError);
        }
        await new Promise((resolve4) => setTimeout(resolve4, delay));
      }
    }
    throw lastError;
  }
  parseRetryAnnotation(stepText) {
    const match = stepText.match(/@retry\((\d+)(?:,\s*(\d+))?\)/i);
    if (!match)
      return null;
    return {
      maxRetries: parseInt(match[1]),
      delay: parseInt(match[2]) || 1000,
      backoff: "exponential"
    };
  }
  calculateStepDelay(options, attempt) {
    const baseDelay = options.delay;
    const multiplier = options.backoffMultiplier || 2;
    return options.backoff === "exponential" ? baseDelay * Math.pow(multiplier, attempt - 1) : baseDelay * attempt;
  }
}

// src/http/interceptor-manager.ts
class InterceptorManager {
  interceptors = [];
  add(interceptor) {
    this.interceptors.push(interceptor);
  }
  remove(interceptor) {
    const index = this.interceptors.indexOf(interceptor);
    if (index > -1)
      this.interceptors.splice(index, 1);
  }
  async runRequestInterceptors(options) {
    let processed = { ...options };
    for (const interceptor of this.interceptors) {
      if (interceptor.request)
        processed = await interceptor.request(processed);
    }
    return processed;
  }
  async runResponseInterceptors(response, options) {
    let result = response;
    for (const interceptor of this.interceptors) {
      if (interceptor.response)
        result = await interceptor.response(result, options);
    }
    return result;
  }
  async runErrorInterceptors(error, options) {
    let lastError = error;
    for (const interceptor of this.interceptors) {
      if (interceptor.error)
        lastError = await interceptor.error(lastError, options);
    }
    return lastError;
  }
}

// src/http/http-client.ts
class HttpClient {
  timeout;
  verbose;
  retryManager;
  interceptorManager;
  defaultRetry;
  logger;
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.verbose = options.verbose || false;
    this.defaultRetry = options.retry;
    this.logger = options.logger || console;
    this.retryManager = new RetryManager;
    this.interceptorManager = new InterceptorManager;
  }
  addInterceptor(interceptor) {
    this.interceptorManager.add(interceptor);
  }
  removeInterceptor(interceptor) {
    this.interceptorManager.remove(interceptor);
  }
  setDefaultRetry(retry) {
    this.defaultRetry = retry;
  }
  toFormUrlEncoded(data) {
    const params = new URLSearchParams;
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }
  toFormData(data) {
    const formData = new FormData;
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Blob || value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, String(v)));
      } else {
        formData.append(key, String(value));
      }
    }
    return formData;
  }
  async request(options) {
    const retryOptions = options.retry || this.defaultRetry;
    if (!retryOptions)
      return this.executeRequestWithInterceptors(options);
    return this.retryManager.execute(async (attempt) => {
      const result = await this.executeRequestWithInterceptors(options);
      if (retryOptions.retriesOnStatus?.includes(result.status)) {
        throw new Error(`Retryable status: ${result.status}`);
      }
      return result;
    }, retryOptions, this.isRetryableError);
  }
  async executeRequestWithInterceptors(options) {
    try {
      const processedOptions = await this.interceptorManager.runRequestInterceptors(options);
      const result = await this.executeActualRequest(processedOptions);
      return await this.interceptorManager.runResponseInterceptors(result, processedOptions);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw await this.interceptorManager.runErrorInterceptors(err, options);
    }
  }
  isRetryableError(error) {
    const msg = error.message.toLowerCase();
    return ["network", "timeout", "econnreset", "econnrefused", "socket"].some((term) => msg.includes(term));
  }
  async executeActualRequest(options) {
    const { method, url, headers = {}, body, verbose, formData } = options;
    const isVerbose = verbose || this.verbose;
    const requestHeaders = { ...headers };
    if ((body || formData) && !requestHeaders["Content-Type"]) {
      if (requestHeaders["Content-Type"] === "application/x-www-form-urlencoded") {} else if (requestHeaders["Content-Type"]?.includes("multipart/form-data")) {
        delete requestHeaders["Content-Type"];
      } else if (typeof body === "object") {
        requestHeaders["Content-Type"] = "application/json";
      } else {
        requestHeaders["Content-Type"] = "text/plain";
      }
    }
    const fetchOptions = { method, headers: requestHeaders };
    if (body && !["GET", "HEAD"].includes(method)) {
      fetchOptions.body = requestHeaders["Content-Type"] === "application/x-www-form-urlencoded" && typeof body === "object" ? this.toFormUrlEncoded(body) : typeof body === "object" ? JSON.stringify(body) : body;
    }
    if (formData && !["GET", "HEAD"].includes(method))
      fetchOptions.body = this.toFormData(formData);
    if (isVerbose)
      this.logger.log(`
\uD83D\uDCE4 HTTP Request: ${method} ${url}`);
    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;
    const responseHeaders = {};
    response.headers.forEach((v, k) => responseHeaders[k] = v);
    const responseText = await response.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
    const cookies = {};
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const cookieStrings = setCookie.split(/,(?=[^\s])/);
      for (const cookieStr of cookieStrings) {
        const parts = cookieStr.split(";");
        if (parts.length > 0) {
          const [n, v] = parts[0].split("=");
          if (n && v) {
            cookies[n.trim()] = v.trim();
          }
        }
      }
    }
    if (isVerbose)
      this.logger.log(`\uD83D\uDCE5 HTTP Response: ${response.status} (${duration}ms)`);
    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      cookies,
      responseTime: duration
    };
  }
  setVerbose(verbose) {
    this.verbose = verbose;
  }
  setLogger(logger) {
    this.logger = logger;
  }
  async get(url, options) {
    return this.request({ method: "GET", url, ...options });
  }
  async post(url, body, options) {
    return this.request({ method: "POST", url, body, ...options });
  }
  async put(url, body, options) {
    return this.request({ method: "PUT", url, body, ...options });
  }
  async patch(url, body, options) {
    return this.request({ method: "PATCH", url, body, ...options });
  }
  async delete(url, options) {
    return this.request({ method: "DELETE", url, ...options });
  }
}
var init_http_client = () => {};

// src/validation/fuzzy-matcher.ts
class FuzzyMatcher {
  static isFuzzyMatch(expected) {
    return typeof expected === "string" && expected.startsWith("#");
  }
  static validate(actual, matcher, context) {
    const type = matcher.slice(1);
    switch (type) {
      case "number":
      case "#number":
        if (typeof actual !== "number") {
          throw new Error(`Expected number, but got ${typeof actual}: ${actual}`);
        }
        break;
      case "string":
      case "#string":
        if (typeof actual !== "string") {
          throw new Error(`Expected string, but got ${typeof actual}: ${actual}`);
        }
        break;
      case "boolean":
      case "#boolean":
        if (typeof actual !== "boolean") {
          throw new Error(`Expected boolean, but got ${typeof actual}: ${actual}`);
        }
        break;
      case "array":
      case "#array":
        if (!Array.isArray(actual)) {
          throw new Error(`Expected array, but got ${typeof actual}: ${actual}`);
        }
        break;
      case "object":
      case "#object":
        if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
          throw new Error(`Expected object, but got ${typeof actual}: ${actual}`);
        }
        break;
      case "ignore":
      case "#ignore":
        break;
      case "null":
        if (actual !== null) {
          throw new Error(`Expected null, but got ${actual}`);
        }
        break;
      case "notnull":
      case "#notnull":
        if (actual === null || actual === undefined) {
          throw new Error(`Expected not null, but got ${actual}`);
        }
        break;
      case "uuid":
      case "#uuid":
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(actual)) {
          throw new Error(`Expected UUID, but got: ${actual}`);
        }
        break;
      case "email":
      case "#email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(actual)) {
          throw new Error(`Expected email, but got: ${actual}`);
        }
        break;
      case "date":
      case "#date":
        const dateRegex = /^\d{4}-\d{2}-\d{2}/;
        if (!dateRegex.test(actual) || isNaN(Date.parse(actual))) {
          throw new Error(`Expected date (YYYY-MM-DD), but got: ${actual}`);
        }
        break;
      default:
        if (matcher.startsWith("#[")) {
          if (!Array.isArray(actual)) {
            throw new Error(`Expected array for length match, but got ${typeof actual}`);
          }
          const lengthExpr = matcher.match(/#\[(.+)\]/)?.[1];
          if (!lengthExpr)
            break;
          if (lengthExpr.startsWith(">") || lengthExpr.startsWith("<") || lengthExpr.startsWith("=") || lengthExpr.startsWith("!")) {
            const operatorMatch = lengthExpr.match(/^([><=!]+)\s*(\d+)$/);
            if (operatorMatch) {
              const op = operatorMatch[1];
              const val = parseInt(operatorMatch[2]);
              let passed = false;
              if (op === ">")
                passed = actual.length > val;
              else if (op === ">=")
                passed = actual.length >= val;
              else if (op === "<")
                passed = actual.length < val;
              else if (op === "<=")
                passed = actual.length <= val;
              else if (op === "==" || op === "=")
                passed = actual.length === val;
              else if (op === "!=")
                passed = actual.length !== val;
              if (!passed)
                throw new Error(`Expected array length ${op} ${val}, but got ${actual.length}`);
            }
          } else if (!isNaN(parseInt(lengthExpr))) {
            const expectedLength = parseInt(lengthExpr);
            if (actual.length !== expectedLength) {
              throw new Error(`Expected array length ${expectedLength}, but got ${actual.length}`);
            }
          }
          break;
        }
        if (matcher.startsWith("#regex")) {
          const regexMatch = matcher.match(/#regex<(.+)>$/);
          const pattern = regexMatch ? regexMatch[1] : context.variables["__regex_pattern__"] || ".*";
          if (typeof actual !== "string") {
            throw new Error(`Expected string for regex match, but got ${typeof actual}`);
          }
          try {
            const regex = new RegExp(pattern);
            if (!regex.test(actual)) {
              throw new Error(`String '${actual}' does not match pattern '${pattern}'`);
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes("does not match"))
              throw e;
            throw new Error(`Invalid regex pattern: ${pattern}`);
          }
          break;
        }
        if (actual !== matcher && actual !== type) {
          throw new Error(`Expected ${matcher}, but got ${actual}`);
        }
    }
  }
}

// src/validation/schema-validator.ts
class SchemaValidator {
  static async validateWithJsonSchema(actual, schema) {
    try {
      const errors = [];
      SchemaValidator.validateSchema(actual, schema, "", errors);
      if (errors.length > 0) {
        return { valid: false, errors };
      }
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  static validateSchema(actual, schema, path3, errors) {
    if (!schema)
      return;
    if (schema.type) {
      switch (schema.type) {
        case "string":
          if (typeof actual !== "string")
            errors.push(`${path3}: expected string, got ${typeof actual}`);
          break;
        case "number":
        case "integer":
          if (typeof actual !== "number")
            errors.push(`${path3}: expected number, got ${typeof actual}`);
          break;
        case "boolean":
          if (typeof actual !== "boolean")
            errors.push(`${path3}: expected boolean, got ${typeof actual}`);
          break;
        case "array":
          if (!Array.isArray(actual))
            errors.push(`${path3}: expected array, got ${typeof actual}`);
          break;
        case "object":
          if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
            errors.push(`${path3}: expected object, got ${typeof actual}`);
          }
          break;
        case "null":
          if (actual !== null)
            errors.push(`${path3}: expected null, got ${actual}`);
          break;
      }
    }
    if (schema.minLength && typeof actual === "string" && actual.length < schema.minLength) {
      errors.push(`${path3}: string length ${actual.length} is less than minLength ${schema.minLength}`);
    }
    if (schema.maxLength && typeof actual === "string" && actual.length > schema.maxLength) {
      errors.push(`${path3}: string length ${actual.length} is greater than maxLength ${schema.maxLength}`);
    }
    if (schema.pattern && typeof actual === "string") {
      try {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(actual)) {
          errors.push(`${path3}: string '${actual}' does not match pattern ${schema.pattern}`);
        }
      } catch (e) {
        errors.push(`${path3}: invalid pattern ${schema.pattern}`);
      }
    }
    if (schema.minimum !== undefined && typeof actual === "number" && actual < schema.minimum) {
      errors.push(`${path3}: ${actual} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && typeof actual === "number" && actual > schema.maximum) {
      errors.push(`${path3}: ${actual} is greater than maximum ${schema.maximum}`);
    }
    if (schema.minItems && Array.isArray(actual) && actual.length < schema.minItems) {
      errors.push(`${path3}: array length ${actual.length} is less than minItems ${schema.minItems}`);
    }
    if (schema.maxItems && Array.isArray(actual) && actual.length > schema.maxItems) {
      errors.push(`${path3}: array length ${actual.length} is greater than maxItems ${schema.maxItems}`);
    }
    if (schema.items && Array.isArray(actual)) {
      actual.forEach((item, index) => {
        SchemaValidator.validateSchema(item, schema.items, `${path3}[${index}]`, errors);
      });
    }
    if (schema.properties && typeof actual === "object" && actual !== null) {
      for (const key of Object.keys(schema.properties)) {
        if (actual[key] !== undefined) {
          SchemaValidator.validateSchema(actual[key], schema.properties[key], `${path3}.${key}`, errors);
        }
      }
    }
    if (schema.required && typeof actual === "object" && actual !== null) {
      for (const requiredKey of schema.required) {
        if (actual[requiredKey] === undefined) {
          errors.push(`${path3}: missing required property '${requiredKey}'`);
        }
      }
    }
  }
  static async validateWithFuzzyType(actual, fuzzyType) {
    try {
      const result = SchemaValidator.checkFuzzyType(actual, fuzzyType);
      return { valid: result.valid, errors: result.errors };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  static checkFuzzyType(actual, fuzzyType) {
    if (fuzzyType.startsWith("#")) {
      switch (fuzzyType.toLowerCase()) {
        case "#string":
          return { valid: typeof actual === "string" };
        case "#number":
          return { valid: typeof actual === "number" && !isNaN(actual) };
        case "#boolean":
          return { valid: typeof actual === "boolean" };
        case "#array":
          return { valid: Array.isArray(actual) };
        case "#object":
          return { valid: typeof actual === "object" && actual !== null && !Array.isArray(actual) };
        case "#null":
          return { valid: actual === null };
        case "#present":
          return { valid: actual !== undefined };
        case "#uuid": {
          if (typeof actual !== "string")
            return { valid: false, errors: ["Expected string for UUID"] };
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return { valid: uuidRegex.test(actual) };
        }
        case "#email": {
          if (typeof actual !== "string")
            return { valid: false, errors: ["Expected string for email"] };
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return { valid: emailRegex.test(actual) };
        }
        case "#url": {
          if (typeof actual !== "string")
            return { valid: false, errors: ["Expected string for URL"] };
          try {
            new URL(actual);
            return { valid: true };
          } catch {
            return { valid: false, errors: ["Invalid URL format"] };
          }
        }
        case "#regex":
          return { valid: typeof actual === "string" };
        case "#date":
          return { valid: actual instanceof Date && !isNaN(actual.getTime()) };
        case "#integer":
          if (typeof actual !== "number")
            return { valid: false, errors: ["Expected number"] };
          return { valid: Number.isInteger(actual) };
        case "#positive":
          if (typeof actual !== "number")
            return { valid: false, errors: ["Expected number"] };
          return { valid: actual > 0 };
        case "#negative":
          if (typeof actual !== "number")
            return { valid: false, errors: ["Expected number"] };
          return { valid: actual < 0 };
        case "#any":
          return { valid: true };
        default:
          return { valid: false, errors: [`Unknown fuzzy type: ${fuzzyType}`] };
      }
    }
    return { valid: false, errors: [`Unknown fuzzy type: ${fuzzyType}`] };
  }
  static async validateWithArkType(actual, schema) {
    return this.validateWithFuzzyType(actual, schema);
  }
}

// src/validation/response-validator.ts
class ResponseValidator {
  validate(actual, expected, context) {
    if (FuzzyMatcher.isFuzzyMatch(expected)) {
      FuzzyMatcher.validate(actual, expected, context);
    } else if (typeof expected === "object" && expected !== null) {
      this.validateObject(actual, expected, context);
    } else {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    }
  }
  validateContains(actual, expected, context) {
    if (Array.isArray(actual)) {
      const found = actual.some((item) => {
        try {
          if (typeof expected === "object" && expected !== null) {
            this.validateObject(item, expected, context);
          } else {
            this.validate(item, expected, context);
          }
          return true;
        } catch {
          return false;
        }
      });
      if (!found) {
        throw new Error(`Expected array to contain ${JSON.stringify(expected)}, but no match was found.
Actual: ${JSON.stringify(actual, null, 2)}`);
      }
    } else if (typeof actual === "object" && actual !== null) {
      this.validateObject(actual, expected, context);
    } else {
      throw new Error(`'contains' matcher only works on Objects or Arrays, but got ${typeof actual}`);
    }
  }
  validateAny(actual, expected, context) {
    if (!Array.isArray(expected)) {
      throw new Error(`'any' matcher expects an array of possible values, but got ${typeof expected}`);
    }
    const found = expected.some((option) => {
      try {
        this.validate(actual, option, context);
        return true;
      } catch {
        return false;
      }
    });
    if (!found) {
      throw new Error(`Expected any of ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
    }
  }
  validateObject(actual, expected, context) {
    if (actual === null || actual === undefined) {
      throw new Error(`Expected object, but got ${actual}`);
    }
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        throw new Error(`Expected array, but got ${typeof actual}`);
      }
      for (let i = 0;i < expected.length; i++) {
        if (i >= actual.length) {
          throw new Error(`Expected array of length ${expected.length}, but got ${actual.length}`);
        }
        this.validate(actual[i], expected[i], context);
      }
      return;
    }
    if (typeof actual !== "object") {
      throw new Error(`Expected object, but got ${typeof actual}`);
    }
    for (const key of Object.keys(expected)) {
      const expectedValue = expected[key];
      if (FuzzyMatcher.isFuzzyMatch(expectedValue)) {
        FuzzyMatcher.validate(actual[key], expectedValue, context);
      } else if (typeof expectedValue === "object" && expectedValue !== null) {
        this.validateObject(actual[key], expectedValue, context);
      } else {
        if (actual[key] !== expectedValue) {
          throw new Error(`Expected ${key}=${JSON.stringify(expectedValue)}, but got ${JSON.stringify(actual[key])}`);
        }
      }
    }
  }
  async validateWithJsonSchema(actual, schema) {
    return await SchemaValidator.validateWithJsonSchema(actual, schema);
  }
  async validateWithArkType(actual, schema) {
    return await SchemaValidator.validateWithArkType(actual, schema);
  }
}
var init_response_validator = () => {};

// src/engine/step-registry.ts
class StepRegistry {
  mappings = new Map;
  stepsPath;
  constructor(stepsPath) {
    this.stepsPath = stepsPath;
    this.registerBuiltInSteps();
  }
  registerBuiltInSteps() {}
  async loadCustomSteps() {
    try {
      const customSteps = await import(this.stepsPath + "/custom-steps.js").catch(() => null);
      if (customSteps && customSteps.default) {
        this.registerSteps(customSteps.default);
      }
    } catch {}
  }
  registerSteps(steps) {
    for (const [pattern, handler] of Object.entries(steps)) {
      const [keyword, ...patternParts] = pattern.split(" ");
      const patternStr = patternParts.join(" ");
      const isCucumberExpression = /\{[^}]+\}/.test(patternStr);
      let regex;
      let parsedExpression;
      if (isCucumberExpression) {
        parsedExpression = parseCucumberExpression(patternStr);
        regex = parsedExpression.regex;
      } else {
        regex = this.convertToRegex(patternStr);
      }
      if (!this.mappings.has(keyword)) {
        this.mappings.set(keyword, []);
      }
      this.mappings.get(keyword).push({
        pattern: regex,
        expression: parsedExpression,
        handler,
        originalPattern: patternStr
      });
    }
  }
  findHandler(keyword, text) {
    const mappings = this.mappings.get(keyword) || [];
    for (const mapping of mappings) {
      if (mapping.expression) {
        const result = matchExpression(mapping.originalPattern, text);
        if (result.matched) {
          return { handler: mapping.handler, params: result.parameters };
        }
      } else {
        mapping.pattern.lastIndex = 0;
        if (mapping.pattern.test(text)) {
          return { handler: mapping.handler };
        }
      }
    }
    return null;
  }
  convertToRegex(pattern) {
    let regexStr = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\(([^)]+)\)/g, (_, p) => `(${p})`).replace(/'([^']+)'/g, "($1)").replace(/"([^"]+)"/g, "($1)");
    return new RegExp(`^${regexStr}$`, "i");
  }
}
var init_step_registry = __esm(() => {
  init_cucumber_expression();
});

// src/auth/auth-manager.ts
import * as fs3 from "fs";
import * as path3 from "path";

class AuthManager {
  authDir = ".hop";
  defaultAuthFile;
  constructor(authDir) {
    this.authDir = authDir || this.authDir;
    this.defaultAuthFile = path3.join(this.authDir, "auth.json");
    this.ensureAuthDir();
  }
  ensureAuthDir() {
    if (!fs3.existsSync(this.authDir)) {
      fs3.mkdirSync(this.authDir, { recursive: true });
    }
  }
  saveAuth(auth, filePath) {
    const targetPath = filePath || this.defaultAuthPath();
    const dir = path3.dirname(targetPath);
    if (!fs3.existsSync(dir)) {
      fs3.mkdirSync(dir, { recursive: true });
    }
    if (!auth.createdAt) {
      auth.createdAt = Date.now();
    }
    fs3.writeFileSync(targetPath, JSON.stringify(auth, null, 2), "utf-8");
    console.log(`\uD83D\uDD10 Auth saved to: ${targetPath}`);
  }
  loadAuth(filePath) {
    const targetPath = filePath || this.defaultAuthPath();
    if (!fs3.existsSync(targetPath)) {
      console.log(`\u26A0\uFE0F  Auth file not found: ${targetPath}`);
      return null;
    }
    try {
      const content = fs3.readFileSync(targetPath, "utf-8");
      const auth = JSON.parse(content);
      if (auth.expiresAt && Date.now() > auth.expiresAt) {
        console.log("\u26A0\uFE0F  Auth has expired");
        return null;
      }
      console.log(`\uD83D\uDD10 Auth loaded from: ${targetPath}`);
      return auth;
    } catch (error) {
      console.error(`\u274C Failed to load auth: ${error}`);
      return null;
    }
  }
  hasValidAuth(filePath) {
    const auth = this.loadAuth(filePath);
    return auth !== null;
  }
  clearAuth(filePath) {
    const targetPath = filePath || this.defaultAuthPath();
    if (fs3.existsSync(targetPath)) {
      fs3.unlinkSync(targetPath);
      console.log(`\uD83D\uDD10 Auth cleared: ${targetPath}`);
    }
  }
  createAuthFromLogin(response, options = {}) {
    const auth = {
      createdAt: Date.now()
    };
    if (response.headers) {
      const tokenHeader = response.headers["authorization"] || response.headers["Authorization"] || response.headers["x-auth-token"];
      if (tokenHeader) {
        auth.token = tokenHeader.replace(/^Bearer\s+/i, "");
      }
      const setCookie = response.headers["set-cookie"] || response.headers["Set-Cookie"];
      if (setCookie) {
        auth.cookies = this.parseCookies(setCookie);
      }
    }
    if (response.body) {
      if (typeof response.body === "object") {
        auth.token = auth.token || response.body.token || response.body.access_token || response.body.authToken || response.body.jwt;
        auth.userId = response.body.userId || response.body.user_id || response.body.id;
        auth.username = response.body.username || response.body.email || response.body.name;
      }
    }
    if (options.expiresIn) {
      auth.expiresAt = Date.now() + options.expiresIn;
    }
    return auth;
  }
  parseCookies(setCookie) {
    const cookies = {};
    const cookieParts = setCookie.split(/,(?=\s*(?:Path|Domain|Expires|Secure|HttpOnly|SameSite|[A-Z])[=])/i);
    for (const part of cookieParts) {
      const [nameValue] = part.split(";");
      const [name, value] = nameValue.split("=");
      if (name && value) {
        cookies[name.trim()] = value.trim();
      }
    }
    return cookies;
  }
  defaultAuthPath() {
    return this.defaultAuthFile;
  }
  setAuthDir(dir) {
    this.authDir = dir;
    this.defaultAuthFile = path3.join(dir, "auth.json");
    this.ensureAuthDir();
  }
  getAuthPath(name) {
    if (name) {
      return path3.join(this.authDir, `${name}.json`);
    }
    return this.defaultAuthFile;
  }
  decodeJWT(token) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3)
        return null;
      const decode = (str) => {
        const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(Buffer.from(base64, "base64").toString());
      };
      return {
        header: decode(parts[0]),
        payload: decode(parts[1])
      };
    } catch (error) {
      return null;
    }
  }
  isJWTExpiringSoon(auth, bufferSeconds = 60) {
    if (!auth.jwtExpiresAt)
      return false;
    const bufferMs = bufferSeconds * 1000;
    return Date.now() + bufferMs >= auth.jwtExpiresAt;
  }
  createAuthFromJWT(token, refreshToken) {
    const decoded = this.decodeJWT(token);
    const auth = {
      token,
      createdAt: Date.now(),
      refreshToken
    };
    if (decoded?.payload) {
      auth.jwtPayload = decoded.payload;
      if (decoded.payload.exp) {
        auth.jwtExpiresAt = decoded.payload.exp * 1000;
        auth.expiresAt = auth.jwtExpiresAt;
      }
      if (decoded.payload.iat) {
        auth.createdAt = decoded.payload.iat * 1000;
      }
    }
    return auth;
  }
  async refreshJWTIfNeeded(auth, refreshFn) {
    if (!this.isJWTExpiringSoon(auth)) {
      return auth;
    }
    if (!auth.refreshToken) {
      throw new Error("No refresh token available");
    }
    const newTokens = await refreshFn();
    return this.createAuthFromJWT(newTokens.token, newTokens.refreshToken || auth.refreshToken);
  }
  async performOAuth2Flow(config) {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret || "",
      code: config.code,
      redirect_uri: config.redirectUri
    });
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: params.toString()
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth token exchange failed: ${error}`);
    }
    const tokens = await response.json();
    return {
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      oauthTokenType: tokens.token_type || "Bearer",
      expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
      createdAt: Date.now()
    };
  }
  async refreshOAuth2Token(tokenUrl, clientId, refreshToken, clientSecret) {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: refreshToken
    });
    if (clientSecret) {
      params.append("client_secret", clientSecret);
    }
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: params.toString()
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth token refresh failed: ${error}`);
    }
    const tokens = await response.json();
    return {
      token: tokens.access_token,
      refreshToken: tokens.refresh_token || refreshToken,
      oauthTokenType: tokens.token_type || "Bearer",
      expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
      createdAt: Date.now()
    };
  }
}
var init_auth_manager = () => {};

// src/engine/feature-caller.ts
import { join as join5 } from "path";

class FeatureCaller {
  parser;
  basePath;
  stepExecutor = null;
  featureCache = new Map;
  constructor(basePath = "./features") {
    this.basePath = basePath;
    this.parser = new GherkinParser;
  }
  setStepExecutor(executor) {
    this.stepExecutor = executor;
  }
  async call(featurePath, options = {}) {
    const startTime = Date.now();
    const { scenarioName, args = {}, backgroundOnly = false } = options;
    try {
      const fullPath = this.resolvePath(featurePath);
      const feature = await this.loadFeature(fullPath);
      if (!feature) {
        return {
          success: false,
          error: `Feature not found: ${featurePath}`,
          duration: Date.now() - startTime,
          variables: {}
        };
      }
      const context = this.createContext(args);
      if (feature.background) {
        for (const step of feature.background.steps) {
          await this.executeStep(step, context);
        }
      }
      if (backgroundOnly) {
        return {
          success: true,
          duration: Date.now() - startTime,
          variables: context.variables
        };
      }
      const scenariosToRun = scenarioName ? feature.scenarios.filter((s) => s.name === scenarioName) : feature.scenarios;
      if (scenariosToRun.length === 0 && scenarioName) {
        return {
          success: false,
          error: `Scenario not found: ${scenarioName}`,
          duration: Date.now() - startTime,
          variables: context.variables
        };
      }
      let lastResult;
      for (const scenario of scenariosToRun) {
        const scenarioContext = this.cloneContext(context);
        for (const step of scenario.steps) {
          await this.executeStep(step, scenarioContext);
        }
        lastResult = scenarioContext.response?.body;
      }
      return {
        success: true,
        result: lastResult,
        duration: Date.now() - startTime,
        variables: context.variables
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        variables: {}
      };
    }
  }
  async callShared(featurePath, args = {}) {
    const result = await this.call(featurePath, { scenarioName: undefined, args, backgroundOnly: false });
    if (!result.success) {
      throw new Error(`Failed to call feature ${featurePath}: ${result.error}`);
    }
    return result.variables;
  }
  resolvePath(featurePath) {
    if (featurePath.endsWith(".feature")) {
      featurePath = featurePath.slice(0, -8);
    }
    return join5(this.basePath, featurePath + ".feature");
  }
  async loadFeature(featurePath) {
    if (this.featureCache.has(featurePath)) {
      return this.featureCache.get(featurePath);
    }
    try {
      const content = await import("fs/promises").then((fs4) => fs4.readFile(featurePath, "utf-8"));
      const feature = await this.parser.parse(content, featurePath);
      this.featureCache.set(featurePath, feature);
      return feature;
    } catch (error) {
      console.error(`Failed to load feature: ${featurePath}`, error);
      return null;
    }
  }
  createContext(args = {}) {
    return {
      baseUrl: "",
      path: "",
      method: "GET",
      headers: {},
      queryParams: {},
      body: undefined,
      variables: { ...args },
      cookies: {},
      read: async (filePath) => {
        return await this.parser.read(filePath);
      },
      logger: console
    };
  }
  cloneContext(context) {
    return {
      ...context,
      headers: { ...context.headers },
      queryParams: { ...context.queryParams },
      variables: { ...context.variables },
      cookies: { ...context.cookies }
    };
  }
  async executeStep(step, context) {
    if (!this.stepExecutor) {
      throw new Error("StepExecutor not set. Call setStepExecutor() first.");
    }
    await this.stepExecutor.executeStep(step, context);
  }
  clearCache() {
    this.featureCache.clear();
  }
  getCacheSize() {
    return this.featureCache.size;
  }
}
var init_feature_caller = __esm(() => {
  init_gherkin_parser();
});

// src/db/db-manager.ts
import { Database } from "bun:sqlite";

class DbManager {
  connection = null;
  config = null;
  connect(config) {
    this.config = config;
    const type = config.type || "sqlite";
    if (type === "sqlite") {
      try {
        this.connection = new Database(config.url);
        console.log(`\uD83D\uDDC4\uFE0F  Connected to SQLite database: ${config.url}`);
      } catch (error) {
        throw new Error(`Failed to connect to SQLite: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      throw new Error(`Database type '${type}' is not yet supported. Only 'sqlite' is currently available.`);
    }
  }
  execute(sql, params = []) {
    this.ensureConnected();
    try {
      const query = this.connection.prepare(sql);
      query.run(...params);
    } catch (error) {
      throw new Error(`SQL execution failed: ${error instanceof Error ? error.message : error}
SQL: ${sql}`);
    }
  }
  query(sql, params = []) {
    this.ensureConnected();
    try {
      const query = this.connection.prepare(sql);
      return query.all(...params);
    } catch (error) {
      throw new Error(`SQL query failed: ${error instanceof Error ? error.message : error}
SQL: ${sql}`);
    }
  }
  close() {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
      console.log("\uD83D\uDDC4\uFE0F  Database connection closed");
    }
  }
  ensureConnected() {
    if (!this.connection) {
      throw new Error("Database not connected. Call db.connect(config) first.");
    }
  }
}
var init_db_manager = () => {};

// src/engine/handlers/http-handler.ts
class HttpHandler {
  canHandle(text) {
    return text.match(/^(?:\*|Given|When|Then|And|But)?\s*url ['"]/i) !== null || text.match(/^(?:\*|Given|When|Then|And|But)?\s*path ['"]/i) !== null || text.match(/^(?:\*|Given|When|Then|And|But)?\s*header .+ =/i) !== null || text.match(/^(?:\*|Given|When|Then|And|But)?\s*headers\s+(\{[\s\S]*\})/i) !== null || text.match(/^(?:\*|Given|When|Then|And|But)?\s*(query param |param )/i) !== null || text.match(/^(?:\*|Given|When|Then|And|But)?\s*params\s+(\{[\s\S]*\})/i) !== null || text.match(/^(Given|When|Then|And|But)?\s*request/i) !== null || text.match(/^(?:\*|Given|When|Then|And|But)?\s*method (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/i) !== null || text.match(/^(Given|When|Then|And|But)?\s*form field (\w+)\s*=\s*(.+)$/i) !== null;
  }
  async handle(text, step, context, executor) {
    if (text.match(/^(?:\*|Given|When|Then|And|But)?\s*url ['"](.+)['"]/i)) {
      const url = executor.extractValue(text, /^(?:\*|Given|When|Then|And|But)?\s*url ['"](.+)['"]/i);
      context.baseUrl = resolveEnvVariables(url, executor.getEnvConfig());
      return;
    }
    if (text.match(/^(?:\*|Given|When|Then|And|But)?\s*path ['"](.+)['"]/i)) {
      const path4 = executor.extractValue(text, /^(?:\*|Given|When|Then|And|But)?\s*path ['"](.+)['"]/i);
      context.path = executor.resolveVariables(resolveEnvVariables(path4, executor.getEnvConfig()), context);
      return;
    }
    if (text.match(/^(?:\*|Given|When|Then|And|But)?\s*header .+ =/i)) {
      const [key, value] = executor.parseKeyValue(text.replace(/^(?:\*|Given|When|Then|And|But)?\s*header /i, ""));
      context.headers[key] = executor.resolveVariables(value, context);
      return;
    }
    const headersJsonMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*headers\s+(\{[\s\S]*\})/i);
    if (headersJsonMatch) {
      try {
        const headersObj = JSON.parse(headersJsonMatch[1]);
        for (const [key, value] of Object.entries(headersObj)) {
          context.headers[key] = executor.resolveVariables(value, context);
        }
      } catch {}
      return;
    }
    if (text.match(/^(?:\*|Given|When|Then|And|But)?\s*(query param |param )/i)) {
      const [key, value] = executor.parseKeyValue(text.replace(/^(?:\*|Given|When|Then|And|But)?\s*(?:query param |param )/i, ""));
      context.queryParams[key] = executor.resolveVariables(value, context);
      return;
    }
    const paramsJsonMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*params\s+(\{[\s\S]*\})/i);
    if (paramsJsonMatch) {
      try {
        const paramsObj = JSON.parse(paramsJsonMatch[1]);
        for (const [key, value] of Object.entries(paramsObj)) {
          context.queryParams[key] = executor.resolveVariables(value, context);
        }
      } catch {}
      return;
    }
    if (text.match(/^(Given|When|Then|And|But)?\s*request/i)) {
      if (text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request \{|request ['"]/i)) {
        const body = executor.extractJsonBody(text);
        context.body = executor.resolveVariables(body, context);
        return;
      }
      if (text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request #(.*)/i)) {
        const varName = text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request #(.*)/i)?.[1];
        if (varName) {
          context.body = context.variables[varName.trim()];
        }
        return;
      }
      if (step.docString) {
        if (step.docStringContentType === "application/json") {
          try {
            context.body = JSON.parse(step.docString.trim());
          } catch {
            context.body = step.docString;
          }
        } else if (step.docStringContentType === "application/xml" || step.docString?.trim().startsWith("<")) {
          context.body = step.docString;
        } else {
          try {
            context.body = JSON.parse(step.docString);
          } catch {
            context.body = step.docString;
          }
        }
        return;
      }
      if (step.dataTable) {
        context.body = executor.convertDataTable(step.dataTable);
        return;
      }
      return;
    }
    const methodMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*method (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/i);
    if (methodMatch) {
      context.method = methodMatch[1].toUpperCase();
      const fullUrl = executor.buildUrl(context.baseUrl, context.path, context.queryParams);
      const response = await executor.getHttpClient().request({
        method: context.method,
        url: fullUrl,
        headers: context.headers,
        body: context.body,
        formData: context.formData
      });
      context.response = response;
      context.variables["response"] = response.body;
      context.variables["status"] = response.status;
      context.variables["responseTime"] = response.responseTime || 0;
      if (response.cookies) {
        context.cookies = { ...context.cookies, ...response.cookies };
      }
      return;
    }
    const formFieldMatch = text.match(/^(Given|When|Then|And|But)?\s*form field (\w+)\s*=\s*(.+)$/i);
    if (formFieldMatch) {
      const fieldName = formFieldMatch[2];
      const fieldValue = executor.resolveVariables(formFieldMatch[3], context);
      if (!context.formData) {
        context.formData = {};
      }
      context.formData[fieldName] = fieldValue;
      return;
    }
  }
}
var init_http_handler = __esm(() => {
  init_env_loader();
});

// src/ui/browser-manager.ts
import { chromium, firefox, webkit } from "playwright-core";
import { join as join6 } from "path";

class BrowserManager {
  options;
  browser = null;
  context = null;
  page = null;
  requestInterceptors = [];
  responseInterceptors = [];
  constructor(options) {
    this.options = options;
  }
  async launch() {
    if (this.browser)
      return;
    const type = this.options.browser === "firefox" ? firefox : this.options.browser === "webkit" ? webkit : chromium;
    this.browser = await type.launch({ headless: this.options.headless });
    const contextOptions = {
      viewport: this.options.viewport
    };
    if (this.options.video) {
      contextOptions.recordVideo = {
        dir: join6("reports", "videos"),
        size: this.options.viewport || { width: 1280, height: 720 }
      };
    }
    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.options.timeout || 30000);
    this.setupInterceptors();
  }
  setupInterceptors() {
    if (!this.page)
      return;
    this.page.on("request", (req) => this.requestInterceptors.forEach((h) => h(req)));
    this.page.on("response", (res) => this.responseInterceptors.forEach((h) => h(res)));
  }
  addRequestInterceptor(h) {
    this.requestInterceptors.push(h);
  }
  addResponseInterceptor(h) {
    this.responseInterceptors.push(h);
  }
  getPage() {
    return this.page;
  }
  getContext() {
    return this.context;
  }
  getOptions() {
    return this.options;
  }
  async close() {
    await this.browser?.close();
    this.browser = null;
    this.context = null;
    this.page = null;
  }
}
var init_browser_manager = () => {};

// src/ui/browser-interactions.ts
import * as fs4 from "fs";
import * as path4 from "path";

class BrowserInteractions {
  manager;
  screenshotsDir = "./screenshots";
  constructor(manager) {
    this.manager = manager;
  }
  async navigate(url) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.goto(String(url), { timeout: this.manager.getOptions().timeout });
  }
  async click(selector) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.click(selector);
  }
  async type(selector, text, clear = false) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    if (clear) {
      await page.fill(selector, "");
    }
    await page.type(selector, text);
  }
  async fill(selector, text) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.fill(selector, text);
  }
  async setCookie(name, value, domain) {
    const context = this.manager.getContext();
    if (!context)
      throw new Error("Browser context not created. Call launch() first.");
    await context.addCookies([{
      name,
      value,
      domain: domain || "",
      path: "/"
    }]);
  }
  async setCookies(cookies) {
    const context = this.manager.getContext();
    if (!context)
      throw new Error("Browser context not created. Call launch() first.");
    const cookieArray = Object.entries(cookies).map(([name, value]) => ({
      name,
      value,
      path: "/"
    }));
    await context.addCookies(cookieArray);
  }
  async refresh() {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.reload();
  }
  async evaluate(fn) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    return await page.evaluate(fn);
  }
  async mockResponse(urlPattern, response, status = 200) {
    const context = this.manager.getContext();
    if (!context)
      throw new Error("Browser context not created. Call launch() first.");
    await context.route(urlPattern, async (route) => {
      await route.fulfill({
        status,
        body: JSON.stringify(response),
        headers: { "Content-Type": "application/json" }
      });
    });
  }
  async abortRequests(urlPattern) {
    const context = this.manager.getContext();
    if (!context)
      throw new Error("Browser context not created. Call launch() first.");
    await context.route(urlPattern, async (route) => {
      await route.abort("failed");
    });
  }
  async screenshot(options) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    const screenshotOptions = {
      fullPage: options?.fullPage || false
    };
    if (options?.path) {
      const dir = path4.dirname(options.path);
      if (!fs4.existsSync(dir)) {
        fs4.mkdirSync(dir, { recursive: true });
      }
      await page.screenshot({ ...screenshotOptions, path: options.path });
      return options.path;
    }
    return await page.screenshot(screenshotOptions);
  }
  async screenshotOnFailure(scenarioName) {
    const page = this.manager.getPage();
    if (!page)
      return null;
    if (!fs4.existsSync(this.screenshotsDir)) {
      fs4.mkdirSync(this.screenshotsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${scenarioName}-${timestamp}.png`;
    const filepath = path4.join(this.screenshotsDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }
}
var init_browser_interactions = () => {};

// src/ui/browser-assertions.ts
class BrowserAssertions {
  manager;
  constructor(manager) {
    this.manager = manager;
  }
  async isVisible(selector) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    return await page.isVisible(selector);
  }
  async getText(selector) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    return await page.textContent(selector) || "";
  }
  async containsText(selector, text) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    const element = await page.$(selector);
    if (!element)
      return false;
    const elementText = await element.textContent();
    return elementText?.includes(text) || false;
  }
  async waitForSelector(selector, timeout) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.waitForSelector(selector, { timeout });
  }
  async waitForElementVisible(selector, timeout) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.waitForSelector(selector, { state: "visible", timeout });
  }
  async waitForElementHidden(selector, timeout) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.waitForSelector(selector, { state: "hidden", timeout });
  }
  async waitForElementDetached(selector, timeout) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.waitForSelector(selector, { state: "detached", timeout });
  }
  async waitForNavigation(timeout) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.waitForLoadState("networkidle", { timeout });
  }
  async waitForUrl(urlPattern, timeout) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    await page.waitForURL(urlPattern, { timeout });
  }
  async waitForResponse(urlPattern, timeout) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    return await page.waitForResponse((response) => response.url().match(urlPattern) !== null, { timeout });
  }
  async waitForRequest(urlPattern, timeout) {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    return await page.waitForRequest((request) => request.url().match(urlPattern) !== null, { timeout });
  }
  async getUrl() {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    return page.url();
  }
  async getTitle() {
    const page = this.manager.getPage();
    if (!page)
      throw new Error("Browser not launched. Call launch() first.");
    return await page.title();
  }
  async getCookies() {
    const context = this.manager.getContext();
    if (!context)
      throw new Error("Browser context not created. Call launch() first.");
    const cookies = await context.cookies();
    const result = {};
    for (const cookie of cookies) {
      result[cookie.name] = cookie.value;
    }
    return result;
  }
}
// src/ui/playwright-client.ts
class PlaywrightClient {
  manager;
  interactions;
  assertions;
  constructor(options = {}) {
    const timeout = typeof options.timeout === "string" ? parseInt(options.timeout, 10) : options.timeout || 30000;
    this.manager = new BrowserManager({ headless: true, browser: "chromium", viewport: { width: 1280, height: 720 }, ...options, timeout });
    this.interactions = new BrowserInteractions(this.manager);
    this.assertions = new BrowserAssertions(this.manager);
  }
  async launch() {
    await this.manager.launch();
  }
  async close() {
    await this.manager.close();
  }
  addRequestInterceptor(h) {
    this.manager.addRequestInterceptor(h);
  }
  addResponseInterceptor(h) {
    this.manager.addResponseInterceptor(h);
  }
  getPage() {
    return this.manager.getPage();
  }
  getContext() {
    return this.manager.getContext();
  }
  async mockResponse(url, res, status = 200) {
    await this.interactions.mockResponse(url, res, status);
  }
  async abortRequests(url) {
    await this.interactions.abortRequests(url);
  }
  async navigate(url) {
    await this.interactions.navigate(url);
  }
  async click(selector) {
    await this.interactions.click(selector);
  }
  async type(selector, text, clear = false) {
    await this.interactions.type(selector, text, clear);
  }
  async fill(selector, text) {
    await this.interactions.fill(selector, text);
  }
  async refresh() {
    await this.interactions.refresh();
  }
  async evaluate(fn) {
    return await this.interactions.evaluate(fn);
  }
  async setCookie(n, v, d) {
    await this.interactions.setCookie(n, v, d);
  }
  async skipModal() {
    await this.interactions.refresh();
  }
  async screenshot(opts) {
    return await this.interactions.screenshot(opts);
  }
  async waitForResponse(url, t) {
    return await this.assertions.waitForResponse(url, t);
  }
  async waitForUrl(url, t) {
    await this.assertions.waitForUrl(url, t);
  }
  async isVisible(selector) {
    return await this.assertions.isVisible(selector);
  }
  async getText(selector) {
    return await this.assertions.getText(selector);
  }
  async containsText(selector, text) {
    return await this.assertions.containsText(selector, text);
  }
  async getCookies() {
    return await this.assertions.getCookies();
  }
  async getUrl() {
    return await this.assertions.getUrl();
  }
  async getTitle() {
    return await this.assertions.getTitle();
  }
}
var init_playwright_client = __esm(() => {
  init_browser_manager();
  init_browser_interactions();
});

// src/engine/handlers/ui-handler.ts
class UiHandler {
  canHandle(text) {
    return text.match(/^user opens browser/i) !== null || text.match(/^user navigates to ['"]/i) !== null || text.match(/^user clicks? ['"]/i) !== null || text.match(/^user types? ['"](.+)['"] into ['"]/i) !== null || text.match(/^user should see element ['"]/i) !== null || text.match(/^user should see text ['"]/i) !== null || text.match(/^user refreshes page/i) !== null || text.match(/^user sets cookie ['"](.+)['"] to ['"]/i) !== null;
  }
  async handle(text, step, context, executor) {
    if (text.match(/^user opens browser/i)) {
      let playwright = executor.getPlaywright();
      if (!playwright) {
        playwright = new PlaywrightClient({
          headless: true,
          timeout: executor.getOptions().timeout,
          video: executor.getOptions().video
        });
        executor.setPlaywright(playwright);
      }
      await playwright.launch();
      context.variables["__playwright"] = playwright;
      return;
    }
    const navigateMatch = text.match(/^user navigates to ['"](.+)['"]/i);
    if (navigateMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw)
        throw new Error('Browser not opened. Use "user opens browser" first.');
      const url = resolveEnvVariables(navigateMatch[1], executor.getEnvConfig());
      const resolvedUrl = executor.resolveVariables(url, context);
      await pw.navigate(resolvedUrl);
      return;
    }
    const clickMatch = text.match(/^user clicks? ['"](.+)['"]/i);
    if (clickMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw)
        throw new Error('Browser not opened. Use "user opens browser" first.');
      await pw.click(clickMatch[1]);
      return;
    }
    const typeMatch = text.match(/^user types? ['"](.+)['"] into ['"](.+)['"]/i);
    if (typeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw)
        throw new Error('Browser not opened. Use "user opens browser" first.');
      const resolvedText = executor.resolveVariables(typeMatch[1], context);
      await pw.type(typeMatch[2], resolvedText);
      return;
    }
    const shouldSeeMatch = text.match(/^user should see element ['"](.+)['"]/i);
    if (shouldSeeMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw)
        throw new Error('Browser not opened. Use "user opens browser" first.');
      const isVisible = await pw.isVisible(shouldSeeMatch[1]);
      if (!isVisible) {
        throw new Error(`Element '${shouldSeeMatch[1]}' is not visible`);
      }
      return;
    }
    const shouldSeeTextMatch = text.match(/^user should see text ['"](.+)['"]/i);
    if (shouldSeeTextMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw)
        throw new Error('Browser not opened. Use "user opens browser" first.');
      const resolvedText = executor.resolveVariables(shouldSeeTextMatch[1], context);
      const page = pw.getPage();
      if (!page)
        throw new Error("Page not available");
      const content = await page.content();
      if (!content.includes(resolvedText)) {
        throw new Error(`Text '${resolvedText}' not found on page`);
      }
      return;
    }
    if (text.match(/^user refreshes page/i)) {
      const pw = executor.getPlaywright(context);
      if (!pw)
        throw new Error('Browser not opened. Use "user opens browser" first.');
      await pw.refresh();
      return;
    }
    const cookieMatch = text.match(/^user sets cookie ['"](.+)['"] to ['"](.+)['"]/i);
    if (cookieMatch) {
      const pw = executor.getPlaywright(context);
      if (!pw)
        throw new Error('Browser not opened. Use "user opens browser" first.');
      const resolvedValue = executor.resolveVariables(cookieMatch[2], context);
      await pw.setCookie(cookieMatch[1], resolvedValue);
      return;
    }
  }
}
var init_ui_handler = __esm(() => {
  init_env_loader();
  init_playwright_client();
});

// src/engine/handlers/auth-handler.ts
class AuthHandler {
  canHandle(text) {
    return text.match(/^save auth to ['"]/i) !== null || text.match(/^load auth from ['"]/i) !== null || text.match(/^clear auth/i) !== null;
  }
  async handle(text, step, context, executor) {
    const logger = executor.getLogger();
    const authManager = executor.getAuthManager();
    const saveAuthMatch = text.match(/^save auth to ['"](.+)['"]/i);
    if (saveAuthMatch) {
      if (!context.response) {
        throw new Error("No response available. Make an API call first.");
      }
      const filePath = saveAuthMatch[1];
      const auth = authManager.createAuthFromLogin(context.response);
      authManager.saveAuth(auth, filePath);
      context.variables["auth"] = auth;
      if (auth.token) {
        context.headers["Authorization"] = `Bearer ${auth.token}`;
      }
      if (auth.cookies) {
        context.cookies = { ...context.cookies, ...auth.cookies };
      }
      return;
    }
    const loadAuthMatch = text.match(/^load auth from ['"](.+)['"]/i);
    if (loadAuthMatch) {
      const filePath = loadAuthMatch[1];
      const auth = authManager.loadAuth(filePath);
      if (!auth) {
        throw new Error(`Failed to load auth from: ${filePath}`);
      }
      context.variables["auth"] = auth;
      if (auth.token) {
        context.headers["Authorization"] = `Bearer ${auth.token}`;
      }
      if (auth.cookies) {
        context.cookies = { ...context.cookies, ...auth.cookies };
      }
      logger.log(`\uD83D\uDD10 Auth loaded and applied to requests`);
      return;
    }
    if (text.match(/^clear auth/i)) {
      authManager.clearAuth();
      delete context.variables["auth"];
      delete context.headers["Authorization"];
      logger.log(`\uD83D\uDD10 Auth cleared`);
      return;
    }
  }
}

// src/engine/handlers/db-handler.ts
class DbHandler {
  canHandle(text) {
    return text.match(/^(?:Given|When|Then|And|But|\*)?\s*(?:def\s+\w+\s*=\s*)?db\./i) !== null;
  }
  async handle(text, step, context, executor) {
    const db = executor.getDbManager();
    const logger = executor.getLogger();
    const options = executor.getOptions();
    const connectMatch = text.match(/db\.connect\(\s*(.+)\s*\)/i);
    if (connectMatch) {
      const config = executor.parseValue(connectMatch[1].trim(), context);
      db.connect(config);
      return;
    }
    const executeMatch = text.match(/db\.execute\(\s*(['"])([\s\S]+?)\1\s*(?:,\s*(\[[\s\S]+?\]))?\s*\)/i);
    if (executeMatch) {
      const sql = executeMatch[2];
      const params = executeMatch[3] ? executor.parseValue(executeMatch[3].trim(), context) : [];
      db.execute(sql, params);
      return;
    }
    const queryMatch = text.match(/^(?:Given|When|Then|And|But|\*)?\s*(?:def\s+(\w+)\s*=\s*)?db\.query\(\s*(['"])([\s\S]+?)\2\s*(?:,\s*(\[[\s\S]+?\]))?\s*\)/i);
    if (queryMatch) {
      const varName = queryMatch[1];
      const sql = queryMatch[3];
      const params = queryMatch[4] ? executor.parseValue(queryMatch[4].trim(), context) : [];
      const result = db.query(sql, params);
      if (varName) {
        if (options.verbose) {
          logger.log(`\uD83D\uDCCA Storing result in variable '${varName}' (${Array.isArray(result) ? "array" : typeof result}):`, JSON.stringify(result).substring(0, 100));
        }
        context.variables[varName] = result;
      }
      return;
    }
  }
}

// src/engine/handlers/assertion-handler.ts
class AssertionHandler {
  canHandle(text) {
    return text.match(/^(?:\*|Given|When|Then|And|But)?\s*status (\d+)/i) !== null || text.match(/^(?:\*|Given|When|Then|And|But)?\s*match responseTime\s*(<|>|==|!=)\s*(\d+)/i) !== null || text.match(/^(Given|When|Then|And|But|\*)?\s*match\s+(each\s+)?(.+?)\s+(==|contains|any)\s+(.+)$/i) !== null;
  }
  async handle(text, step, context, executor) {
    const validator = executor.getValidator();
    const logger = executor.getLogger();
    const options = executor.getOptions();
    const statusMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*status (\d+)/i);
    if (statusMatch) {
      const expectedStatus = parseInt(statusMatch[1]);
      if (context.response?.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, but got ${context.response?.status}`);
      }
      return;
    }
    const responseTimeMatch = text.match(/^(?:\*|Given|When|Then|And|But)?\s*match responseTime\s*(<|>|==|!=)\s*(\d+)/i);
    if (responseTimeMatch) {
      const operator = responseTimeMatch[1];
      const expectedValue = parseInt(responseTimeMatch[2]);
      const actualTime = context.response?.responseTime || 0;
      let passed = false;
      switch (operator) {
        case "<":
          passed = actualTime < expectedValue;
          break;
        case ">":
          passed = actualTime > expectedValue;
          break;
        case "==":
          passed = actualTime === expectedValue;
          break;
        case "!=":
          passed = actualTime !== expectedValue;
          break;
      }
      if (!passed) {
        throw new Error(`Expected responseTime ${operator} ${expectedValue}ms, but got ${actualTime}ms`);
      }
      return;
    }
    const matchMatch = text.match(/^(Given|When|Then|And|But|\*)?\s*match\s+(each\s+)?(.+?)\s+(==|contains|any)\s+(.+)$/i);
    if (matchMatch) {
      const isEach = !!matchMatch[2];
      const target = (matchMatch[3] || "").trim();
      const operator = matchMatch[4].toLowerCase();
      let expected = (matchMatch[5] || "").trim();
      expected = executor.stripQuotes(expected);
      let actual;
      if (target === "response") {
        actual = context.response?.body;
      } else if (target.startsWith("response.")) {
        actual = executor.getNestedValue(context.response?.body, target.substring(9));
      } else {
        const dotIndex = target.indexOf(".");
        const bracketIndex = target.indexOf("[");
        const splitIndex = dotIndex > -1 && bracketIndex > -1 ? Math.min(dotIndex, bracketIndex) : dotIndex > -1 ? dotIndex : bracketIndex;
        if (splitIndex > -1) {
          const varName = target.substring(0, splitIndex);
          const path5 = target.substring(splitIndex).startsWith(".") ? target.substring(splitIndex + 1) : target.substring(splitIndex);
          actual = executor.getNestedValue(context.variables[varName], path5);
        } else {
          actual = context.variables[target];
        }
      }
      let expectedParsed;
      if (expected.startsWith("{") && expected.endsWith("}") || expected.startsWith("[") && expected.endsWith("]")) {
        try {
          expectedParsed = JSON.parse(expected);
        } catch {
          expectedParsed = executor.parseGherkinJson(expected);
        }
      } else {
        expectedParsed = executor.parseValue(expected, context);
      }
      if (options.verbose) {
        logger.log(`\uD83D\uDD0D Asserting: ${target} [${typeof actual}] ${operator} expected [${typeof expectedParsed}]`);
      }
      if (isEach) {
        if (!Array.isArray(actual)) {
          throw new Error(`'each' matcher expects an array, but got ${typeof actual}`);
        }
        for (let i = 0;i < actual.length; i++) {
          try {
            if (operator === "contains") {
              validator.validateContains(actual[i], expectedParsed, context);
            } else if (operator === "any") {
              validator.validateAny(actual[i], expectedParsed, context);
            } else {
              validator.validate(actual[i], expectedParsed, context);
            }
          } catch (e) {
            throw new Error(`Array match failed at index ${i}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
      } else {
        if (operator === "contains") {
          validator.validateContains(actual, expectedParsed, context);
        } else if (operator === "any") {
          validator.validateAny(actual, expectedParsed, context);
        } else {
          validator.validate(actual, expectedParsed, context);
        }
      }
      return;
    }
  }
}

// src/mock/mock-engine.ts
class MockEngine {
  feature = null;
  state = {};
  stepExecutor;
  verbose;
  constructor(verbose = false) {
    this.verbose = verbose;
    this.stepExecutor = new StepExecutor({
      stepsPath: "",
      env: "",
      verbose: this.verbose,
      timeout: 5000,
      envConfig: {}
    });
  }
  async loadFeature(filePath) {
    const parser = new GherkinParser;
    const features = await parser.parseFeatures([filePath]);
    if (features.length === 0) {
      throw new Error(`Could not parse mock feature at ${filePath}`);
    }
    this.feature = features[0];
    if (this.feature?.background) {
      const context = this.createInitialContext();
      for (const step of this.feature.background.steps) {
        await this.stepExecutor.executeStep(step, context);
      }
      this.state = context.variables;
    }
  }
  async handleRequest(req) {
    if (!this.feature) {
      throw new Error("Mock feature not loaded");
    }
    for (const scenario of this.feature.scenarios) {
      if (this.matches(scenario, req)) {
        if (this.verbose) {
          console.log(`\uD83C\uDFAF Matched scenario: ${scenario.name}`);
        }
        return await this.executeScenario(scenario, req);
      }
    }
    return {
      status: 404,
      headers: { "Content-Type": "application/json" },
      body: { error: "No matching mock scenario found", path: req.path, method: req.method }
    };
  }
  matches(scenario, req) {
    const name = scenario.name.trim();
    try {
      const sandbox = {
        pathMatches: (p) => req.path === p || req.path.startsWith(p),
        methodIs: (m) => req.method.toUpperCase() === m.toUpperCase(),
        headerContains: (h, v) => req.headers[h.toLowerCase()]?.includes(v),
        bodyPath: (p) => {
          return true;
        },
        request: req.body,
        method: req.method,
        path: req.path
      };
      if (name.includes("pathMatches") || name.includes("methodIs") || name.includes("&&")) {
        const fn = new Function(...Object.keys(sandbox), `return ${name}`);
        return fn(...Object.values(sandbox));
      }
      return name.includes(req.path) && name.toLowerCase().includes(req.method.toLowerCase());
    } catch (e) {
      if (this.verbose) {
        console.error(`\u274C Error matching scenario "${name}":`, e);
      }
      return false;
    }
  }
  async executeScenario(scenario, req) {
    const context = this.createInitialContext(req);
    context.variables = { ...this.state };
    context.variables["request"] = req.body;
    context.variables["requestHeaders"] = req.headers;
    context.variables["requestParams"] = req.queryParams;
    context.variables["requestMethod"] = req.method;
    context.variables["requestPath"] = req.path;
    for (const step of scenario.steps) {
      await this.stepExecutor.executeStep(step, context);
    }
    this.state = { ...context.variables };
    const responseStatus = context.variables["responseStatus"] || 200;
    const responseHeaders = context.variables["responseHeaders"] || { "Content-Type": "application/json" };
    const responseBody = context.variables["response"];
    return {
      status: Number(responseStatus),
      headers: responseHeaders,
      body: responseBody
    };
  }
  createInitialContext(req) {
    return {
      baseUrl: "",
      path: req?.path || "",
      method: req?.method || "GET",
      headers: req?.headers || {},
      queryParams: req?.queryParams || {},
      body: req?.body,
      variables: {},
      cookies: {},
      read: async (filePath) => {
        const parser = new GherkinParser;
        return await parser.read(filePath, this.feature?.filePath);
      },
      logger: this.verbose ? console : {
        log: () => {},
        error: console.error,
        warn: console.warn
      }
    };
  }
}
var init_mock_engine = __esm(() => {
  init_gherkin_parser();
  init_step_executor();
});

// src/mock/mock-server.ts
var exports_mock_server = {};
__export(exports_mock_server, {
  MockServer: () => MockServer
});

class MockServer {
  engine;
  port;
  featurePath;
  verbose;
  constructor(featurePath, port = 8080, verbose = false) {
    this.engine = new MockEngine(verbose);
    this.port = port;
    this.featurePath = featurePath;
    this.verbose = verbose;
  }
  async start() {
    await this.engine.loadFeature(this.featurePath);
    const server = Bun.serve({
      port: this.port,
      fetch: async (req) => {
        if (this.verbose) {
          console.log(`\uD83D\uDCE1 Incoming request: ${req.method} ${req.url}`);
        }
        const url = new URL(req.url);
        let body;
        try {
          const contentType = req.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            body = await req.json();
          } else {
            const text = await req.text();
            try {
              body = JSON.parse(text);
            } catch {
              body = text;
            }
          }
        } catch (e) {
          body = undefined;
        }
        const mockReq = {
          path: url.pathname,
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
          queryParams: Object.fromEntries(url.searchParams.entries()),
          body
        };
        const res = await this.engine.handleRequest(mockReq);
        return new Response(typeof res.body === "object" ? JSON.stringify(res.body, null, 2) : String(res.body || ""), {
          status: res.status,
          headers: res.headers
        });
      },
      error: (error) => {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    });
    console.log(`
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`);
    console.log(`\uD83D\uDE80 Hop Mock Server is running!`);
    console.log(`\uD83D\uDD17 URL: http://localhost:${server.port}`);
    console.log(`\uD83D\uDCD6 Feature: ${this.featurePath}`);
    console.log(`\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`);
    return server;
  }
}
var init_mock_server = __esm(() => {
  init_mock_engine();
});

// src/engine/handlers/core-handler.ts
import { join as join8 } from "path";

class CoreHandler {
  canHandle(text) {
    return text.match(/^(?:Given|When|Then|And|But|\*)?\s*start\s+mock\s+['"]/i) !== null || text.match(/^(\*|Given|When|Then|And|But)?\s*def\s+(\w+)\s*=\s*(.+)$/i) !== null || text.match(/^(Given|When|Then|And|But)?\s*load\s+csv\s+['"](.+)['"]\s+into\s+(\w+)$/i) !== null || text.match(/^(Given|When|Then|And|But)?\s*call\s+([\w\-\/]+)\.feature/i) !== null || text.match(/^(Given|When|Then|And|But)?\s*print\s+(.+)$/i) !== null || text.match(/^(Given|When|Then|And|But|\*)?\s*eval\s+(.+)$/i) !== null;
  }
  async handle(text, step, context, executor) {
    const logger = executor.getLogger();
    const mockMatch = text.match(/^(?:Given|When|Then|And|But|\*)?\s*start\s+mock\s+['"](.+)['"](?:\s+on\s+port\s+(\d+))?/i);
    if (mockMatch) {
      const featureName = mockMatch[1];
      const port = mockMatch[2] ? parseInt(mockMatch[2]) : 8080;
      const featurePath = featureName.endsWith(".feature") ? featureName : `${featureName}.feature`;
      const fullPath = join8(executor.getOptions().featuresPath || ".", featurePath);
      const server = new MockServer(fullPath, port, executor.getOptions().verbose);
      await server.start();
      executor.addMockServer(server);
      return;
    }
    const setMatch = text.match(/^(\*|Given|When|Then|And|But)?\s*def\s+(\w+)\s*=\s*(.+)$/i);
    if (setMatch) {
      const varName = setMatch[2];
      const valuePart = setMatch[3].trim();
      const value = valuePart;
      if (value.startsWith("read(")) {
        const filePath = value.match(/read\(['"](.+)['"]\)/)?.[1];
        if (filePath) {
          context.variables[varName] = await context.read(filePath);
        }
      } else if (value.startsWith("response")) {
        if (value === "response") {
          context.variables[varName] = context.response?.body;
        } else if (value.startsWith("response.")) {
          context.variables[varName] = executor.getNestedValue(context.response?.body, value.replace("response.", ""));
        } else if (value === "response.status" || value === "response.statusCode") {
          context.variables[varName] = context.response?.status;
        }
      } else if (value.startsWith("'") || value.startsWith('"')) {
        context.variables[varName] = executor.stripQuotes(value);
      } else {
        context.variables[varName] = executor.parseValue(value, context);
      }
      return;
    }
    const csvMatch = text.match(/^(Given|When|Then|And|But)?\s*load\s+csv\s+['"](.+)['"]\s+into\s+(\w+)$/i);
    if (csvMatch) {
      const csvPath = csvMatch[2];
      const varName = csvMatch[3];
      await executor.loadCsvFile(csvPath, varName, context);
      return;
    }
    const callWithArgsMatch = text.match(/^(Given|When|Then|And|But)?\s*call\s+([\w\-\/]+)\.feature\s+with\s+(\{[\s\S]+\})/i);
    if (callWithArgsMatch) {
      const featurePath = callWithArgsMatch[2];
      const argsJson = callWithArgsMatch[3];
      const args = JSON.parse(argsJson);
      await executor.handleCallFeature(featurePath, context, args);
      return;
    }
    const callBackgroundMatch = text.match(/^(Given|When|Then|And|But)?\s*call\s+([\w\-\/]+)\.feature\s+background/i);
    if (callBackgroundMatch) {
      const featurePath = callBackgroundMatch[2];
      await executor.handleCallFeature(featurePath, context, {}, true);
      return;
    }
    const callMatch = text.match(/^(Given|When|Then|And|But)?\s*call\s+([\w\-\/]+)\.feature/i);
    if (callMatch) {
      const featurePath = callMatch[2];
      await executor.handleCallFeature(featurePath, context);
      return;
    }
    const printMatch = text.match(/^(Given|When|Then|And|But)?\s*print\s+(.+)$/i);
    if (printMatch) {
      const message = printMatch[2];
      const resolvedMessage = executor.resolveVariables(message, context);
      logger.log(`\uD83D\uDCDD ${resolvedMessage}`);
      return;
    }
    const evalMatch = text.match(/^(Given|When|Then|And|But|\*)?\s*eval\s+(.+)$/i);
    if (evalMatch) {
      const expression = evalMatch[2];
      try {
        const fn = new Function(...Object.keys(context.variables), `return ${expression}`);
        fn(...Object.values(context.variables));
      } catch (e) {
        throw new Error(`Failed to evaluate expression: ${expression}. Error: ${e instanceof Error ? e.message : e}`);
      }
      return;
    }
  }
}
var init_core_handler = __esm(() => {
  init_mock_server();
});

// node_modules/fast-xml-parser/src/util.js
function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0;index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}
function isExist(v) {
  return typeof v !== "undefined";
}
var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", nameChar, nameRegexp, regexName, isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === "undefined");
}, DANGEROUS_PROPERTY_NAMES, criticalProperties;
var init_util = __esm(() => {
  nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
  nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
  regexName = new RegExp("^" + nameRegexp + "$");
  DANGEROUS_PROPERTY_NAMES = [
    "hasOwnProperty",
    "toString",
    "valueOf",
    "__defineGetter__",
    "__defineSetter__",
    "__lookupGetter__",
    "__lookupSetter__"
  ];
  criticalProperties = ["__proto__", "constructor", "prototype"];
});

// node_modules/fast-xml-parser/src/validator.js
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions, options);
  const tags = [];
  let tagFound = false;
  let reachedRoot = false;
  if (xmlData[0] === "\uFEFF") {
    xmlData = xmlData.substr(1);
  }
  for (let i = 0;i < xmlData.length; i++) {
    if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err)
        return i;
    } else if (xmlData[i] === "<") {
      let tagStartPos = i;
      i++;
      if (xmlData[i] === "!") {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === "/") {
          closingTag = true;
          i++;
        }
        let tagName = "";
        for (;i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "\t" && xmlData[i] !== `
` && xmlData[i] !== "\r"; i++) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        if (tagName[tagName.length - 1] === "/") {
          tagName = tagName.substring(0, tagName.length - 1);
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
        }
        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;
        if (attrStr[attrStr.length - 1] === "/") {
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
          } else {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject("InvalidTag", "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.", getLineNumberForPosition(xmlData, tagStartPos));
            }
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }
          if (reachedRoot === true) {
            return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
          } else if (options.unpairedTags.indexOf(tagName) !== -1) {} else {
            tags.push({ tagName, tagStartPos });
          }
          tagFound = true;
        }
        for (i++;i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            if (xmlData[i + 1] === "!") {
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === "?") {
              i = readPI(xmlData, ++i);
              if (i.err)
                return i;
            } else {
              break;
            }
          } else if (xmlData[i] === "&") {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          } else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        }
        if (xmlData[i] === "<") {
          i--;
        }
      }
    } else {
      if (isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }
  if (!tagFound) {
    return getErrorObject("InvalidXml", "Start tag expected.", 1);
  } else if (tags.length == 1) {
    return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  } else if (tags.length > 0) {
    return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
  }
  return true;
}
function isWhiteSpace(char) {
  return char === " " || char === "\t" || char === `
` || char === "\r";
}
function readPI(xmlData, i) {
  const start = i;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] == "?" || xmlData[i] == " ") {
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === "xml") {
        return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}
function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
    for (i += 3;i < xmlData.length; i++) {
      if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
    let angleBracketsCount = 1;
    for (i += 8;i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        angleBracketsCount++;
      } else if (xmlData[i] === ">") {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
    for (i += 8;i < xmlData.length; i++) {
      if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  }
  return i;
}
function readAttributeStr(xmlData, i) {
  let attrStr = "";
  let startChar = "";
  let tagClosed = false;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === "") {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {} else {
        startChar = "";
      }
    } else if (xmlData[i] === ">") {
      if (startChar === "") {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== "") {
    return false;
  }
  return {
    value: attrStr,
    index: i,
    tagClosed
  };
}
function validateAttributeString(attrStr, options) {
  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};
  for (let i = 0;i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
    }
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!Object.prototype.hasOwnProperty.call(attrNames, attrName)) {
      attrNames[attrName] = 1;
    } else {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
    }
  }
  return true;
}
function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === "x") {
    i++;
    re = /[\da-fA-F]/;
  }
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === ";")
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  i++;
  if (xmlData[i] === ";")
    return -1;
  if (xmlData[i] === "#") {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (;i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ";")
      break;
    return -1;
  }
  return i;
}
function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col
    }
  };
}
function validateAttrName(attrName) {
  return isName(attrName);
}
function validateTagName(tagname) {
  return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  };
}
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}
var defaultOptions, doubleQuote = '"', singleQuote = "'", validAttrStrRegxp;
var init_validator = __esm(() => {
  init_util();
  defaultOptions = {
    allowBooleanAttributes: false,
    unpairedTags: []
  };
  validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
});

// node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
function validatePropertyName(propertyName, optionName) {
  if (typeof propertyName !== "string") {
    return;
  }
  const normalized = propertyName.toLowerCase();
  if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) {
    throw new Error(`[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`);
  }
  if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) {
    throw new Error(`[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`);
  }
}
function normalizeProcessEntities(value) {
  if (typeof value === "boolean") {
    return {
      enabled: value,
      maxEntitySize: 1e4,
      maxExpansionDepth: 10,
      maxTotalExpansions: 1000,
      maxExpandedLength: 1e5,
      maxEntityCount: 100,
      allowedTags: null,
      tagFilter: null
    };
  }
  if (typeof value === "object" && value !== null) {
    return {
      enabled: value.enabled !== false,
      maxEntitySize: value.maxEntitySize ?? 1e4,
      maxExpansionDepth: value.maxExpansionDepth ?? 10,
      maxTotalExpansions: value.maxTotalExpansions ?? 1000,
      maxExpandedLength: value.maxExpandedLength ?? 1e5,
      maxEntityCount: value.maxEntityCount ?? 100,
      allowedTags: value.allowedTags ?? null,
      tagFilter: value.tagFilter ?? null
    };
  }
  return normalizeProcessEntities(true);
}
var defaultOnDangerousProperty = (name) => {
  if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
    return "__" + name;
  }
  return name;
}, defaultOptions2, buildOptions = function(options) {
  const built = Object.assign({}, defaultOptions2, options);
  const propertyNameOptions = [
    { value: built.attributeNamePrefix, name: "attributeNamePrefix" },
    { value: built.attributesGroupName, name: "attributesGroupName" },
    { value: built.textNodeName, name: "textNodeName" },
    { value: built.cdataPropName, name: "cdataPropName" },
    { value: built.commentPropName, name: "commentPropName" }
  ];
  for (const { value, name } of propertyNameOptions) {
    if (value) {
      validatePropertyName(value, name);
    }
  }
  if (built.onDangerousProperty === null) {
    built.onDangerousProperty = defaultOnDangerousProperty;
  }
  built.processEntities = normalizeProcessEntities(built.processEntities);
  if (built.stopNodes && Array.isArray(built.stopNodes)) {
    built.stopNodes = built.stopNodes.map((node) => {
      if (typeof node === "string" && node.startsWith("*.")) {
        return ".." + node.substring(2);
      }
      return node;
    });
  }
  return built;
};
var init_OptionsBuilder = __esm(() => {
  init_util();
  defaultOptions2 = {
    preserveOrder: false,
    attributeNamePrefix: "@_",
    attributesGroupName: false,
    textNodeName: "#text",
    ignoreAttributes: true,
    removeNSPrefix: false,
    allowBooleanAttributes: false,
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataPropName: false,
    numberParseOptions: {
      hex: true,
      leadingZeros: true,
      eNotation: true
    },
    tagValueProcessor: function(tagName, val) {
      return val;
    },
    attributeValueProcessor: function(attrName, val) {
      return val;
    },
    stopNodes: [],
    alwaysCreateTextNode: false,
    isArray: () => false,
    commentPropName: false,
    unpairedTags: [],
    processEntities: true,
    htmlEntities: false,
    ignoreDeclaration: false,
    ignorePiTags: false,
    transformTagName: false,
    transformAttributeName: false,
    updateTag: function(tagName, jPath, attrs) {
      return tagName;
    },
    captureMetaData: false,
    maxNestedTags: 100,
    strictReservedNames: true,
    jPath: true,
    onDangerousProperty: defaultOnDangerousProperty
  };
});

// node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
class XmlNode {
  constructor(tagname) {
    this.tagname = tagname;
    this.child = [];
    this[":@"] = Object.create(null);
  }
  add(key, val) {
    if (key === "__proto__")
      key = "#__proto__";
    this.child.push({ [key]: val });
  }
  addChild(node, startIndex) {
    if (node.tagname === "__proto__")
      node.tagname = "#__proto__";
    if (node[":@"] && Object.keys(node[":@"]).length > 0) {
      this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
    } else {
      this.child.push({ [node.tagname]: node.child });
    }
    if (startIndex !== undefined) {
      this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
    }
  }
  static getMetaDataSymbol() {
    return METADATA_SYMBOL;
  }
}
var METADATA_SYMBOL;
var init_xmlNode = __esm(() => {
  if (typeof Symbol !== "function") {
    METADATA_SYMBOL = "@@xmlMetadata";
  } else {
    METADATA_SYMBOL = Symbol("XML Node Metadata");
  }
});

// node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
class DocTypeReader {
  constructor(options) {
    this.suppressValidationErr = !options;
    this.options = options;
  }
  readDocType(xmlData, i) {
    const entities = Object.create(null);
    let entityCount = 0;
    if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
      i = i + 9;
      let angleBracketsCount = 1;
      let hasBody = false, comment = false;
      let exp = "";
      for (;i < xmlData.length; i++) {
        if (xmlData[i] === "<" && !comment) {
          if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
            i += 7;
            let entityName, val;
            [entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
            if (val.indexOf("&") === -1) {
              if (this.options.enabled !== false && this.options.maxEntityCount && entityCount >= this.options.maxEntityCount) {
                throw new Error(`Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`);
              }
              const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              entities[entityName] = {
                regx: RegExp(`&${escaped};`, "g"),
                val
              };
              entityCount++;
            }
          } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
            i += 8;
            const { index } = this.readElementExp(xmlData, i + 1);
            i = index;
          } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
            i += 8;
          } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
            i += 9;
            const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
            i = index;
          } else if (hasSeq(xmlData, "!--", i))
            comment = true;
          else
            throw new Error(`Invalid DOCTYPE`);
          angleBracketsCount++;
          exp = "";
        } else if (xmlData[i] === ">") {
          if (comment) {
            if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
              comment = false;
              angleBracketsCount--;
            }
          } else {
            angleBracketsCount--;
          }
          if (angleBracketsCount === 0) {
            break;
          }
        } else if (xmlData[i] === "[") {
          hasBody = true;
        } else {
          exp += xmlData[i];
        }
      }
      if (angleBracketsCount !== 0) {
        throw new Error(`Unclosed DOCTYPE`);
      }
    } else {
      throw new Error(`Invalid Tag instead of DOCTYPE`);
    }
    return { entities, i };
  }
  readEntityExp(xmlData, i) {
    i = skipWhitespace(xmlData, i);
    let entityName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
      entityName += xmlData[i];
      i++;
    }
    validateEntityName(entityName);
    i = skipWhitespace(xmlData, i);
    if (!this.suppressValidationErr) {
      if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
        throw new Error("External entities are not supported");
      } else if (xmlData[i] === "%") {
        throw new Error("Parameter entities are not supported");
      }
    }
    let entityValue = "";
    [i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
    if (this.options.enabled !== false && this.options.maxEntitySize && entityValue.length > this.options.maxEntitySize) {
      throw new Error(`Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`);
    }
    i--;
    return [entityName, entityValue, i];
  }
  readNotationExp(xmlData, i) {
    i = skipWhitespace(xmlData, i);
    let notationName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      notationName += xmlData[i];
      i++;
    }
    !this.suppressValidationErr && validateEntityName(notationName);
    i = skipWhitespace(xmlData, i);
    const identifierType = xmlData.substring(i, i + 6).toUpperCase();
    if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
      throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
    }
    i += identifierType.length;
    i = skipWhitespace(xmlData, i);
    let publicIdentifier = null;
    let systemIdentifier = null;
    if (identifierType === "PUBLIC") {
      [i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
      i = skipWhitespace(xmlData, i);
      if (xmlData[i] === '"' || xmlData[i] === "'") {
        [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
      }
    } else if (identifierType === "SYSTEM") {
      [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
      if (!this.suppressValidationErr && !systemIdentifier) {
        throw new Error("Missing mandatory system identifier for SYSTEM notation");
      }
    }
    return { notationName, publicIdentifier, systemIdentifier, index: --i };
  }
  readIdentifierVal(xmlData, i, type) {
    let identifierVal = "";
    const startChar = xmlData[i];
    if (startChar !== '"' && startChar !== "'") {
      throw new Error(`Expected quoted string, found "${startChar}"`);
    }
    i++;
    while (i < xmlData.length && xmlData[i] !== startChar) {
      identifierVal += xmlData[i];
      i++;
    }
    if (xmlData[i] !== startChar) {
      throw new Error(`Unterminated ${type} value`);
    }
    i++;
    return [i, identifierVal];
  }
  readElementExp(xmlData, i) {
    i = skipWhitespace(xmlData, i);
    let elementName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      elementName += xmlData[i];
      i++;
    }
    if (!this.suppressValidationErr && !isName(elementName)) {
      throw new Error(`Invalid element name: "${elementName}"`);
    }
    i = skipWhitespace(xmlData, i);
    let contentModel = "";
    if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i))
      i += 4;
    else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i))
      i += 2;
    else if (xmlData[i] === "(") {
      i++;
      while (i < xmlData.length && xmlData[i] !== ")") {
        contentModel += xmlData[i];
        i++;
      }
      if (xmlData[i] !== ")") {
        throw new Error("Unterminated content model");
      }
    } else if (!this.suppressValidationErr) {
      throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
    }
    return {
      elementName,
      contentModel: contentModel.trim(),
      index: i
    };
  }
  readAttlistExp(xmlData, i) {
    i = skipWhitespace(xmlData, i);
    let elementName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      elementName += xmlData[i];
      i++;
    }
    validateEntityName(elementName);
    i = skipWhitespace(xmlData, i);
    let attributeName = "";
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      attributeName += xmlData[i];
      i++;
    }
    if (!validateEntityName(attributeName)) {
      throw new Error(`Invalid attribute name: "${attributeName}"`);
    }
    i = skipWhitespace(xmlData, i);
    let attributeType = "";
    if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
      attributeType = "NOTATION";
      i += 8;
      i = skipWhitespace(xmlData, i);
      if (xmlData[i] !== "(") {
        throw new Error(`Expected '(', found "${xmlData[i]}"`);
      }
      i++;
      let allowedNotations = [];
      while (i < xmlData.length && xmlData[i] !== ")") {
        let notation = "";
        while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
          notation += xmlData[i];
          i++;
        }
        notation = notation.trim();
        if (!validateEntityName(notation)) {
          throw new Error(`Invalid notation name: "${notation}"`);
        }
        allowedNotations.push(notation);
        if (xmlData[i] === "|") {
          i++;
          i = skipWhitespace(xmlData, i);
        }
      }
      if (xmlData[i] !== ")") {
        throw new Error("Unterminated list of notations");
      }
      i++;
      attributeType += " (" + allowedNotations.join("|") + ")";
    } else {
      while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        attributeType += xmlData[i];
        i++;
      }
      const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
      if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
        throw new Error(`Invalid attribute type: "${attributeType}"`);
      }
    }
    i = skipWhitespace(xmlData, i);
    let defaultValue = "";
    if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
      defaultValue = "#REQUIRED";
      i += 8;
    } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
      defaultValue = "#IMPLIED";
      i += 7;
    } else {
      [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
    }
    return {
      elementName,
      attributeName,
      attributeType,
      defaultValue,
      index: i
    };
  }
}
function hasSeq(data, seq, i) {
  for (let j = 0;j < seq.length; j++) {
    if (seq[j] !== data[i + j + 1])
      return false;
  }
  return true;
}
function validateEntityName(name) {
  if (isName(name))
    return name;
  else
    throw new Error(`Invalid entity name ${name}`);
}
var skipWhitespace = (data, index) => {
  while (index < data.length && /\s/.test(data[index])) {
    index++;
  }
  return index;
};
var init_DocTypeReader = __esm(() => {
  init_util();
});

// node_modules/strnum/strnum.js
function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== "string")
    return str;
  let trimmedStr = str.trim();
  if (options.skipLike !== undefined && options.skipLike.test(trimmedStr))
    return str;
  else if (str === "0")
    return 0;
  else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
  } else if (!isFinite(trimmedStr)) {
    return handleInfinity(str, Number(trimmedStr), options);
  } else if (trimmedStr.includes("e") || trimmedStr.includes("E")) {
    return resolveEnotation(str, trimmedStr, options);
  } else {
    const match = numRegex.exec(trimmedStr);
    if (match) {
      const sign = match[1] || "";
      const leadingZeros = match[2];
      let numTrimmedByZeros = trimZeros(match[3]);
      const decimalAdjacentToLeadingZeros = sign ? str[leadingZeros.length + 1] === "." : str[leadingZeros.length] === ".";
      if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) {
        return str;
      } else {
        const num = Number(trimmedStr);
        const parsedStr = String(num);
        if (num === 0)
          return num;
        if (parsedStr.search(/[eE]/) !== -1) {
          if (options.eNotation)
            return num;
          else
            return str;
        } else if (trimmedStr.indexOf(".") !== -1) {
          if (parsedStr === "0")
            return num;
          else if (parsedStr === numTrimmedByZeros)
            return num;
          else if (parsedStr === `${sign}${numTrimmedByZeros}`)
            return num;
          else
            return str;
        }
        let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
        if (leadingZeros) {
          return n === parsedStr || sign + n === parsedStr ? num : str;
        } else {
          return n === parsedStr || n === sign + parsedStr ? num : str;
        }
      }
    } else {
      return str;
    }
  }
}
function resolveEnotation(str, trimmedStr, options) {
  if (!options.eNotation)
    return str;
  const notation = trimmedStr.match(eNotationRegx);
  if (notation) {
    let sign = notation[1] || "";
    const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
    const leadingZeros = notation[2];
    const eAdjacentToLeadingZeros = sign ? str[leadingZeros.length + 1] === eChar : str[leadingZeros.length] === eChar;
    if (leadingZeros.length > 1 && eAdjacentToLeadingZeros)
      return str;
    else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
      return Number(trimmedStr);
    } else if (options.leadingZeros && !eAdjacentToLeadingZeros) {
      trimmedStr = (notation[1] || "") + notation[3];
      return Number(trimmedStr);
    } else
      return str;
  } else {
    return str;
  }
}
function trimZeros(numStr) {
  if (numStr && numStr.indexOf(".") !== -1) {
    numStr = numStr.replace(/0+$/, "");
    if (numStr === ".")
      numStr = "0";
    else if (numStr[0] === ".")
      numStr = "0" + numStr;
    else if (numStr[numStr.length - 1] === ".")
      numStr = numStr.substring(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}
function parse_int(numStr, base) {
  if (parseInt)
    return parseInt(numStr, base);
  else if (Number.parseInt)
    return Number.parseInt(numStr, base);
  else if (window && window.parseInt)
    return window.parseInt(numStr, base);
  else
    throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}
function handleInfinity(str, num, options) {
  const isPositive = num === Infinity;
  switch (options.infinity.toLowerCase()) {
    case "null":
      return null;
    case "infinity":
      return num;
    case "string":
      return isPositive ? "Infinity" : "-Infinity";
    case "original":
    default:
      return str;
  }
}
var hexRegex, numRegex, consider, eNotationRegx;
var init_strnum = __esm(() => {
  hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
  numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
  consider = {
    hex: true,
    leadingZeros: true,
    decimalPoint: ".",
    eNotation: true,
    infinity: "original"
  };
  eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
});

// node_modules/fast-xml-parser/src/ignoreAttributes.js
function getIgnoreAttributesFn(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

// node_modules/path-expression-matcher/src/Expression.js
class Expression {
  constructor(pattern, options = {}) {
    this.pattern = pattern;
    this.separator = options.separator || ".";
    this.segments = this._parse(pattern);
    this._hasDeepWildcard = this.segments.some((seg) => seg.type === "deep-wildcard");
    this._hasAttributeCondition = this.segments.some((seg) => seg.attrName !== undefined);
    this._hasPositionSelector = this.segments.some((seg) => seg.position !== undefined);
  }
  _parse(pattern) {
    const segments = [];
    let i = 0;
    let currentPart = "";
    while (i < pattern.length) {
      if (pattern[i] === this.separator) {
        if (i + 1 < pattern.length && pattern[i + 1] === this.separator) {
          if (currentPart.trim()) {
            segments.push(this._parseSegment(currentPart.trim()));
            currentPart = "";
          }
          segments.push({ type: "deep-wildcard" });
          i += 2;
        } else {
          if (currentPart.trim()) {
            segments.push(this._parseSegment(currentPart.trim()));
          }
          currentPart = "";
          i++;
        }
      } else {
        currentPart += pattern[i];
        i++;
      }
    }
    if (currentPart.trim()) {
      segments.push(this._parseSegment(currentPart.trim()));
    }
    return segments;
  }
  _parseSegment(part) {
    const segment = { type: "tag" };
    let bracketContent = null;
    let withoutBrackets = part;
    const bracketMatch = part.match(/^([^\[]+)(\[[^\]]*\])(.*)$/);
    if (bracketMatch) {
      withoutBrackets = bracketMatch[1] + bracketMatch[3];
      if (bracketMatch[2]) {
        const content = bracketMatch[2].slice(1, -1);
        if (content) {
          bracketContent = content;
        }
      }
    }
    let namespace = undefined;
    let tagAndPosition = withoutBrackets;
    if (withoutBrackets.includes("::")) {
      const nsIndex = withoutBrackets.indexOf("::");
      namespace = withoutBrackets.substring(0, nsIndex).trim();
      tagAndPosition = withoutBrackets.substring(nsIndex + 2).trim();
      if (!namespace) {
        throw new Error(`Invalid namespace in pattern: ${part}`);
      }
    }
    let tag = undefined;
    let positionMatch = null;
    if (tagAndPosition.includes(":")) {
      const colonIndex = tagAndPosition.lastIndexOf(":");
      const tagPart = tagAndPosition.substring(0, colonIndex).trim();
      const posPart = tagAndPosition.substring(colonIndex + 1).trim();
      const isPositionKeyword = ["first", "last", "odd", "even"].includes(posPart) || /^nth\(\d+\)$/.test(posPart);
      if (isPositionKeyword) {
        tag = tagPart;
        positionMatch = posPart;
      } else {
        tag = tagAndPosition;
      }
    } else {
      tag = tagAndPosition;
    }
    if (!tag) {
      throw new Error(`Invalid segment pattern: ${part}`);
    }
    segment.tag = tag;
    if (namespace) {
      segment.namespace = namespace;
    }
    if (bracketContent) {
      if (bracketContent.includes("=")) {
        const eqIndex = bracketContent.indexOf("=");
        segment.attrName = bracketContent.substring(0, eqIndex).trim();
        segment.attrValue = bracketContent.substring(eqIndex + 1).trim();
      } else {
        segment.attrName = bracketContent.trim();
      }
    }
    if (positionMatch) {
      const nthMatch = positionMatch.match(/^nth\((\d+)\)$/);
      if (nthMatch) {
        segment.position = "nth";
        segment.positionValue = parseInt(nthMatch[1], 10);
      } else {
        segment.position = positionMatch;
      }
    }
    return segment;
  }
  get length() {
    return this.segments.length;
  }
  hasDeepWildcard() {
    return this._hasDeepWildcard;
  }
  hasAttributeCondition() {
    return this._hasAttributeCondition;
  }
  hasPositionSelector() {
    return this._hasPositionSelector;
  }
  toString() {
    return this.pattern;
  }
}

// node_modules/path-expression-matcher/src/Matcher.js
class Matcher {
  constructor(options = {}) {
    this.separator = options.separator || ".";
    this.path = [];
    this.siblingStacks = [];
  }
  push(tagName, attrValues = null, namespace = null) {
    if (this.path.length > 0) {
      const prev = this.path[this.path.length - 1];
      prev.values = undefined;
    }
    const currentLevel = this.path.length;
    if (!this.siblingStacks[currentLevel]) {
      this.siblingStacks[currentLevel] = new Map;
    }
    const siblings = this.siblingStacks[currentLevel];
    const siblingKey = namespace ? `${namespace}:${tagName}` : tagName;
    const counter = siblings.get(siblingKey) || 0;
    let position = 0;
    for (const count of siblings.values()) {
      position += count;
    }
    siblings.set(siblingKey, counter + 1);
    const node = {
      tag: tagName,
      position,
      counter
    };
    if (namespace !== null && namespace !== undefined) {
      node.namespace = namespace;
    }
    if (attrValues !== null && attrValues !== undefined) {
      node.values = attrValues;
    }
    this.path.push(node);
  }
  pop() {
    if (this.path.length === 0) {
      return;
    }
    const node = this.path.pop();
    if (this.siblingStacks.length > this.path.length + 1) {
      this.siblingStacks.length = this.path.length + 1;
    }
    return node;
  }
  updateCurrent(attrValues) {
    if (this.path.length > 0) {
      const current = this.path[this.path.length - 1];
      if (attrValues !== null && attrValues !== undefined) {
        current.values = attrValues;
      }
    }
  }
  getCurrentTag() {
    return this.path.length > 0 ? this.path[this.path.length - 1].tag : undefined;
  }
  getCurrentNamespace() {
    return this.path.length > 0 ? this.path[this.path.length - 1].namespace : undefined;
  }
  getAttrValue(attrName) {
    if (this.path.length === 0)
      return;
    const current = this.path[this.path.length - 1];
    return current.values?.[attrName];
  }
  hasAttr(attrName) {
    if (this.path.length === 0)
      return false;
    const current = this.path[this.path.length - 1];
    return current.values !== undefined && attrName in current.values;
  }
  getPosition() {
    if (this.path.length === 0)
      return -1;
    return this.path[this.path.length - 1].position ?? 0;
  }
  getCounter() {
    if (this.path.length === 0)
      return -1;
    return this.path[this.path.length - 1].counter ?? 0;
  }
  getIndex() {
    return this.getPosition();
  }
  getDepth() {
    return this.path.length;
  }
  toString(separator, includeNamespace = true) {
    const sep = separator || this.separator;
    return this.path.map((n) => {
      if (includeNamespace && n.namespace) {
        return `${n.namespace}:${n.tag}`;
      }
      return n.tag;
    }).join(sep);
  }
  toArray() {
    return this.path.map((n) => n.tag);
  }
  reset() {
    this.path = [];
    this.siblingStacks = [];
  }
  matches(expression) {
    const segments = expression.segments;
    if (segments.length === 0) {
      return false;
    }
    if (expression.hasDeepWildcard()) {
      return this._matchWithDeepWildcard(segments);
    }
    return this._matchSimple(segments);
  }
  _matchSimple(segments) {
    if (this.path.length !== segments.length) {
      return false;
    }
    for (let i = 0;i < segments.length; i++) {
      const segment = segments[i];
      const node = this.path[i];
      const isCurrentNode = i === this.path.length - 1;
      if (!this._matchSegment(segment, node, isCurrentNode)) {
        return false;
      }
    }
    return true;
  }
  _matchWithDeepWildcard(segments) {
    let pathIdx = this.path.length - 1;
    let segIdx = segments.length - 1;
    while (segIdx >= 0 && pathIdx >= 0) {
      const segment = segments[segIdx];
      if (segment.type === "deep-wildcard") {
        segIdx--;
        if (segIdx < 0) {
          return true;
        }
        const nextSeg = segments[segIdx];
        let found = false;
        for (let i = pathIdx;i >= 0; i--) {
          const isCurrentNode = i === this.path.length - 1;
          if (this._matchSegment(nextSeg, this.path[i], isCurrentNode)) {
            pathIdx = i - 1;
            segIdx--;
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      } else {
        const isCurrentNode = pathIdx === this.path.length - 1;
        if (!this._matchSegment(segment, this.path[pathIdx], isCurrentNode)) {
          return false;
        }
        pathIdx--;
        segIdx--;
      }
    }
    return segIdx < 0;
  }
  _matchSegment(segment, node, isCurrentNode) {
    if (segment.tag !== "*" && segment.tag !== node.tag) {
      return false;
    }
    if (segment.namespace !== undefined) {
      if (segment.namespace !== "*" && segment.namespace !== node.namespace) {
        return false;
      }
    }
    if (segment.attrName !== undefined) {
      if (!isCurrentNode) {
        return false;
      }
      if (!node.values || !(segment.attrName in node.values)) {
        return false;
      }
      if (segment.attrValue !== undefined) {
        const actualValue = node.values[segment.attrName];
        if (String(actualValue) !== String(segment.attrValue)) {
          return false;
        }
      }
    }
    if (segment.position !== undefined) {
      if (!isCurrentNode) {
        return false;
      }
      const counter = node.counter ?? 0;
      if (segment.position === "first" && counter !== 0) {
        return false;
      } else if (segment.position === "odd" && counter % 2 !== 1) {
        return false;
      } else if (segment.position === "even" && counter % 2 !== 0) {
        return false;
      } else if (segment.position === "nth") {
        if (counter !== segment.positionValue) {
          return false;
        }
      }
    }
    return true;
  }
  snapshot() {
    return {
      path: this.path.map((node) => ({ ...node })),
      siblingStacks: this.siblingStacks.map((map) => new Map(map))
    };
  }
  restore(snapshot) {
    this.path = snapshot.path.map((node) => ({ ...node }));
    this.siblingStacks = snapshot.siblingStacks.map((map) => new Map(map));
  }
}

// node_modules/path-expression-matcher/src/index.js
var init_src = () => {};

// node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
function extractRawAttributes(prefixedAttrs, options) {
  if (!prefixedAttrs)
    return {};
  const attrs = options.attributesGroupName ? prefixedAttrs[options.attributesGroupName] : prefixedAttrs;
  if (!attrs)
    return {};
  const rawAttrs = {};
  for (const key in attrs) {
    if (key.startsWith(options.attributeNamePrefix)) {
      const rawName = key.substring(options.attributeNamePrefix.length);
      rawAttrs[rawName] = attrs[key];
    } else {
      rawAttrs[key] = attrs[key];
    }
  }
  return rawAttrs;
}
function extractNamespace(rawTagName) {
  if (!rawTagName || typeof rawTagName !== "string")
    return;
  const colonIndex = rawTagName.indexOf(":");
  if (colonIndex !== -1 && colonIndex > 0) {
    const ns = rawTagName.substring(0, colonIndex);
    if (ns !== "xmlns") {
      return ns;
    }
  }
  return;
}

class OrderedObjParser {
  constructor(options) {
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      apos: { regex: /&(apos|#39|#x27);/g, val: "'" },
      gt: { regex: /&(gt|#62|#x3E);/g, val: ">" },
      lt: { regex: /&(lt|#60|#x3C);/g, val: "<" },
      quot: { regex: /&(quot|#34|#x22);/g, val: '"' }
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
    this.htmlEntities = {
      space: { regex: /&(nbsp|#160);/g, val: " " },
      cent: { regex: /&(cent|#162);/g, val: "\xA2" },
      pound: { regex: /&(pound|#163);/g, val: "\xA3" },
      yen: { regex: /&(yen|#165);/g, val: "\xA5" },
      euro: { regex: /&(euro|#8364);/g, val: "\u20AC" },
      copyright: { regex: /&(copy|#169);/g, val: "\xA9" },
      reg: { regex: /&(reg|#174);/g, val: "\xAE" },
      inr: { regex: /&(inr|#8377);/g, val: "\u20B9" },
      num_dec: { regex: /&#([0-9]{1,7});/g, val: (_, str) => fromCodePoint(str, 10, "&#") },
      num_hex: { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => fromCodePoint(str, 16, "&#x") }
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
    this.entityExpansionCount = 0;
    this.currentExpandedLength = 0;
    this.matcher = new Matcher;
    this.isCurrentNodeStopNode = false;
    if (this.options.stopNodes && this.options.stopNodes.length > 0) {
      this.stopNodeExpressions = [];
      for (let i = 0;i < this.options.stopNodes.length; i++) {
        const stopNodeExp = this.options.stopNodes[i];
        if (typeof stopNodeExp === "string") {
          this.stopNodeExpressions.push(new Expression(stopNodeExp));
        } else if (stopNodeExp instanceof Expression) {
          this.stopNodeExpressions.push(stopNodeExp);
        }
      }
    }
  }
}
function addExternalEntities(externalEntities) {
  const entKeys = Object.keys(externalEntities);
  for (let i = 0;i < entKeys.length; i++) {
    const ent = entKeys[i];
    const escaped = ent.replace(/[.\-+*:]/g, "\\.");
    this.lastEntities[ent] = {
      regex: new RegExp("&" + escaped + ";", "g"),
      val: externalEntities[ent]
    };
  }
}
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== undefined) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if (val.length > 0) {
      if (!escapeEntities)
        val = this.replaceEntitiesValue(val, tagName, jPath);
      const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
      const newval = this.options.tagValueProcessor(tagName, val, jPathOrMatcher, hasAttributes, isLeafNode);
      if (newval === null || newval === undefined) {
        return val;
      } else if (typeof newval !== typeof val || newval !== val) {
        return newval;
      } else if (this.options.trimValues) {
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      } else {
        const trimmedVal = val.trim();
        if (trimmedVal === val) {
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          return val;
        }
      }
    }
  }
}
function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(":");
    const prefix = tagname.charAt(0) === "/" ? "/" : "";
    if (tags[0] === "xmlns") {
      return "";
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}
function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length;
    const attrs = {};
    const rawAttrsForMatcher = {};
    for (let i = 0;i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      const oldVal = matches[i][4];
      if (attrName.length && oldVal !== undefined) {
        let parsedVal = oldVal;
        if (this.options.trimValues) {
          parsedVal = parsedVal.trim();
        }
        parsedVal = this.replaceEntitiesValue(parsedVal, tagName, jPath);
        rawAttrsForMatcher[attrName] = parsedVal;
      }
    }
    if (Object.keys(rawAttrsForMatcher).length > 0 && typeof jPath === "object" && jPath.updateCurrent) {
      jPath.updateCurrent(rawAttrsForMatcher);
    }
    for (let i = 0;i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      const jPathStr = this.options.jPath ? jPath.toString() : jPath;
      if (this.ignoreAttributesFn(attrName, jPathStr)) {
        continue;
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        aName = sanitizeName(aName, this.options);
        if (oldVal !== undefined) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
          const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPathOrMatcher);
          if (newVal === null || newVal === undefined) {
            attrs[aName] = oldVal;
          } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
            attrs[aName] = newVal;
          } else {
            attrs[aName] = parseValue(oldVal, this.options.parseAttributeValue, this.options.numberParseOptions);
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
function addChild(currentNode, childNode, matcher, startIndex) {
  if (!this.options.captureMetaData)
    startIndex = undefined;
  const jPathOrMatcher = this.options.jPath ? matcher.toString() : matcher;
  const result = this.options.updateTag(childNode.tagname, jPathOrMatcher, childNode[":@"]);
  if (result === false) {} else if (typeof result === "string") {
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  } else {
    currentNode.addChild(childNode, startIndex);
  }
}
function replaceEntitiesValue(val, tagName, jPath) {
  const entityConfig = this.options.processEntities;
  if (!entityConfig || !entityConfig.enabled) {
    return val;
  }
  if (entityConfig.allowedTags) {
    const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
    const allowed = Array.isArray(entityConfig.allowedTags) ? entityConfig.allowedTags.includes(tagName) : entityConfig.allowedTags(tagName, jPathOrMatcher);
    if (!allowed) {
      return val;
    }
  }
  if (entityConfig.tagFilter) {
    const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
    if (!entityConfig.tagFilter(tagName, jPathOrMatcher)) {
      return val;
    }
  }
  for (const entityName of Object.keys(this.docTypeEntities)) {
    const entity = this.docTypeEntities[entityName];
    const matches = val.match(entity.regx);
    if (matches) {
      this.entityExpansionCount += matches.length;
      if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
        throw new Error(`Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`);
      }
      const lengthBefore = val.length;
      val = val.replace(entity.regx, entity.val);
      if (entityConfig.maxExpandedLength) {
        this.currentExpandedLength += val.length - lengthBefore;
        if (this.currentExpandedLength > entityConfig.maxExpandedLength) {
          throw new Error(`Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`);
        }
      }
    }
  }
  for (const entityName of Object.keys(this.lastEntities)) {
    const entity = this.lastEntities[entityName];
    const matches = val.match(entity.regex);
    if (matches) {
      this.entityExpansionCount += matches.length;
      if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
        throw new Error(`Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`);
      }
    }
    val = val.replace(entity.regex, entity.val);
  }
  if (val.indexOf("&") === -1)
    return val;
  if (this.options.htmlEntities) {
    for (const entityName of Object.keys(this.htmlEntities)) {
      const entity = this.htmlEntities[entityName];
      const matches = val.match(entity.regex);
      if (matches) {
        this.entityExpansionCount += matches.length;
        if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
          throw new Error(`Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`);
        }
      }
      val = val.replace(entity.regex, entity.val);
    }
  }
  val = val.replace(this.ampEntity.regex, this.ampEntity.val);
  return val;
}
function saveTextToParentTag(textData, parentNode, matcher, isLeafNode) {
  if (textData) {
    if (isLeafNode === undefined)
      isLeafNode = parentNode.child.length === 0;
    textData = this.parseTextData(textData, parentNode.tagname, matcher, false, parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false, isLeafNode);
    if (textData !== undefined && textData !== "")
      parentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}
function isItStopNode(stopNodeExpressions, matcher) {
  if (!stopNodeExpressions || stopNodeExpressions.length === 0)
    return false;
  for (let i = 0;i < stopNodeExpressions.length; i++) {
    if (matcher.matches(stopNodeExpressions[i])) {
      return true;
    }
  }
  return false;
}
function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
  let attrBoundary;
  let tagExp = "";
  for (let index = i;index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
      if (ch === attrBoundary)
        attrBoundary = "";
    } else if (ch === '"' || ch === "'") {
      attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if (closingChar[1]) {
        if (xmlData[index + 1] === closingChar[1]) {
          return {
            data: tagExp,
            index
          };
        }
      } else {
        return {
          data: tagExp,
          index
        };
      }
    } else if (ch === "\t") {
      ch = " ";
    }
    tagExp += ch;
  }
}
function findClosingIndex(xmlData, str, i, errMsg) {
  const closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}
function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
  const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
  if (!result)
    return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if (separatorIndex !== -1) {
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }
  const rawTagName = tagName;
  if (removeNSPrefix) {
    const colonIndex = tagName.indexOf(":");
    if (colonIndex !== -1) {
      tagName = tagName.substr(colonIndex + 1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }
  return {
    tagName,
    tagExp,
    closeIndex,
    attrExpPresent,
    rawTagName
  };
}
function readStopNodeData(xmlData, tagName, i) {
  const startIndex = i;
  let openTagCount = 1;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
        let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
        if (closeTagName === tagName) {
          openTagCount--;
          if (openTagCount === 0) {
            return {
              tagContent: xmlData.substring(startIndex, i),
              i: closeIndex
            };
          }
        }
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
        i = closeIndex;
      } else {
        const tagData = readTagExp(xmlData, i, ">");
        if (tagData) {
          const openTagName = tagData && tagData.tagName;
          if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
            openTagCount++;
          }
          i = tagData.closeIndex;
        }
      }
    }
  }
}
function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === "string") {
    const newval = val.trim();
    if (newval === "true")
      return true;
    else if (newval === "false")
      return false;
    else
      return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return "";
    }
  }
}
function fromCodePoint(str, base, prefix) {
  const codePoint = Number.parseInt(str, base);
  if (codePoint >= 0 && codePoint <= 1114111) {
    return String.fromCodePoint(codePoint);
  } else {
    return prefix + str + ";";
  }
}
function transformTagName(fn, tagName, tagExp, options) {
  if (fn) {
    const newTagName = fn(tagName);
    if (tagExp === tagName) {
      tagExp = newTagName;
    }
    tagName = newTagName;
  }
  tagName = sanitizeName(tagName, options);
  return { tagName, tagExp };
}
function sanitizeName(name, options) {
  if (criticalProperties.includes(name)) {
    throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
  } else if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
    return options.onDangerousProperty(name);
  }
  return name;
}
var attrsRegx, parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, `
`);
  const xmlObj = new XmlNode("!xml");
  let currentNode = xmlObj;
  let textData = "";
  this.matcher.reset();
  this.entityExpansionCount = 0;
  this.currentExpandedLength = 0;
  const docTypeReader = new DocTypeReader(this.options.processEntities);
  for (let i = 0;i < xmlData.length; i++) {
    const ch = xmlData[i];
    if (ch === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i + 2, closeIndex).trim();
        if (this.options.removeNSPrefix) {
          const colonIndex = tagName.indexOf(":");
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }
        tagName = transformTagName(this.options.transformTagName, tagName, "", this.options).tagName;
        if (currentNode) {
          textData = this.saveTextToParentTag(textData, currentNode, this.matcher);
        }
        const lastTagName = this.matcher.getCurrentTag();
        if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
          this.matcher.pop();
          this.tagsNodeStack.pop();
        }
        this.matcher.pop();
        this.isCurrentNodeStopNode = false;
        currentNode = this.tagsNodeStack.pop();
        textData = "";
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        let tagData = readTagExp(xmlData, i, false, "?>");
        if (!tagData)
          throw new Error("Pi Tag is not closed.");
        textData = this.saveTextToParentTag(textData, currentNode, this.matcher);
        if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {} else {
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, this.matcher, tagData.tagName);
          }
          this.addChild(currentNode, childNode, this.matcher, i);
        }
        i = tagData.closeIndex + 1;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
        if (this.options.commentPropName) {
          const comment = xmlData.substring(i + 4, endIndex - 2);
          textData = this.saveTextToParentTag(textData, currentNode, this.matcher);
          currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
        }
        i = endIndex;
      } else if (xmlData.substr(i + 1, 2) === "!D") {
        const result = docTypeReader.readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9, closeIndex);
        textData = this.saveTextToParentTag(textData, currentNode, this.matcher);
        let val = this.parseTextData(tagExp, currentNode.tagname, this.matcher, true, false, true, true);
        if (val == undefined)
          val = "";
        if (this.options.cdataPropName) {
          currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
        } else {
          currentNode.add(this.options.textNodeName, val);
        }
        i = closeIndex + 2;
      } else {
        let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
        if (!result) {
          const context = xmlData.substring(Math.max(0, i - 50), Math.min(xmlData.length, i + 50));
          throw new Error(`readTagExp returned undefined at position ${i}. Context: "${context}"`);
        }
        let tagName = result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;
        ({ tagName, tagExp } = transformTagName(this.options.transformTagName, tagName, tagExp, this.options));
        if (this.options.strictReservedNames && (tagName === this.options.commentPropName || tagName === this.options.cdataPropName)) {
          throw new Error(`Invalid tag name: ${tagName}`);
        }
        if (currentNode && textData) {
          if (currentNode.tagname !== "!xml") {
            textData = this.saveTextToParentTag(textData, currentNode, this.matcher, false);
          }
        }
        const lastTag = currentNode;
        if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
          currentNode = this.tagsNodeStack.pop();
          this.matcher.pop();
        }
        let isSelfClosing = false;
        if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
          isSelfClosing = true;
          if (tagName[tagName.length - 1] === "/") {
            tagName = tagName.substr(0, tagName.length - 1);
            tagExp = tagName;
          } else {
            tagExp = tagExp.substr(0, tagExp.length - 1);
          }
          attrExpPresent = tagName !== tagExp;
        }
        let prefixedAttrs = null;
        let rawAttrs = {};
        let namespace = undefined;
        namespace = extractNamespace(rawTagName);
        if (tagName !== xmlObj.tagname) {
          this.matcher.push(tagName, {}, namespace);
        }
        if (tagName !== tagExp && attrExpPresent) {
          prefixedAttrs = this.buildAttributesMap(tagExp, this.matcher, tagName);
          if (prefixedAttrs) {
            rawAttrs = extractRawAttributes(prefixedAttrs, this.options);
          }
        }
        if (tagName !== xmlObj.tagname) {
          this.isCurrentNodeStopNode = this.isItStopNode(this.stopNodeExpressions, this.matcher);
        }
        const startIndex = i;
        if (this.isCurrentNodeStopNode) {
          let tagContent = "";
          if (isSelfClosing) {
            i = result.closeIndex;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            i = result.closeIndex;
          } else {
            const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if (!result2)
              throw new Error(`Unexpected end of ${rawTagName}`);
            i = result2.i;
            tagContent = result2.tagContent;
          }
          const childNode = new XmlNode(tagName);
          if (prefixedAttrs) {
            childNode[":@"] = prefixedAttrs;
          }
          childNode.add(this.options.textNodeName, tagContent);
          this.matcher.pop();
          this.isCurrentNodeStopNode = false;
          this.addChild(currentNode, childNode, this.matcher, startIndex);
        } else {
          if (isSelfClosing) {
            ({ tagName, tagExp } = transformTagName(this.options.transformTagName, tagName, tagExp, this.options));
            const childNode = new XmlNode(tagName);
            if (prefixedAttrs) {
              childNode[":@"] = prefixedAttrs;
            }
            this.addChild(currentNode, childNode, this.matcher, startIndex);
            this.matcher.pop();
            this.isCurrentNodeStopNode = false;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            const childNode = new XmlNode(tagName);
            if (prefixedAttrs) {
              childNode[":@"] = prefixedAttrs;
            }
            this.addChild(currentNode, childNode, this.matcher, startIndex);
            this.matcher.pop();
            this.isCurrentNodeStopNode = false;
            i = result.closeIndex;
            continue;
          } else {
            const childNode = new XmlNode(tagName);
            if (this.tagsNodeStack.length > this.options.maxNestedTags) {
              throw new Error("Maximum nested tags exceeded");
            }
            this.tagsNodeStack.push(currentNode);
            if (prefixedAttrs) {
              childNode[":@"] = prefixedAttrs;
            }
            this.addChild(currentNode, childNode, this.matcher, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};
var init_OrderedObjParser = __esm(() => {
  init_util();
  init_xmlNode();
  init_DocTypeReader();
  init_strnum();
  init_src();
  attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
});

// node_modules/fast-xml-parser/src/xmlparser/node2json.js
function stripAttributePrefix(attrs, prefix) {
  if (!attrs || typeof attrs !== "object")
    return {};
  if (!prefix)
    return attrs;
  const rawAttrs = {};
  for (const key in attrs) {
    if (key.startsWith(prefix)) {
      const rawName = key.substring(prefix.length);
      rawAttrs[rawName] = attrs[key];
    } else {
      rawAttrs[key] = attrs[key];
    }
  }
  return rawAttrs;
}
function prettify(node, options, matcher) {
  return compress(node, options, matcher);
}
function compress(arr, options, matcher) {
  let text;
  const compressedObj = {};
  for (let i = 0;i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    if (property !== undefined && property !== options.textNodeName) {
      const rawAttrs = stripAttributePrefix(tagObj[":@"] || {}, options.attributeNamePrefix);
      matcher.push(property, rawAttrs);
    }
    if (property === options.textNodeName) {
      if (text === undefined)
        text = tagObj[property];
      else
        text += "" + tagObj[property];
    } else if (property === undefined) {
      continue;
    } else if (tagObj[property]) {
      let val = compress(tagObj[property], options, matcher);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[":@"]) {
        assignAttributes(val, tagObj[":@"], matcher, options);
      } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode) {
        val = val[options.textNodeName];
      } else if (Object.keys(val).length === 0) {
        if (options.alwaysCreateTextNode)
          val[options.textNodeName] = "";
        else
          val = "";
      }
      if (tagObj[METADATA_SYMBOL2] !== undefined && typeof val === "object" && val !== null) {
        val[METADATA_SYMBOL2] = tagObj[METADATA_SYMBOL2];
      }
      if (compressedObj[property] !== undefined && Object.prototype.hasOwnProperty.call(compressedObj, property)) {
        if (!Array.isArray(compressedObj[property])) {
          compressedObj[property] = [compressedObj[property]];
        }
        compressedObj[property].push(val);
      } else {
        const jPathOrMatcher = options.jPath ? matcher.toString() : matcher;
        if (options.isArray(property, jPathOrMatcher, isLeaf)) {
          compressedObj[property] = [val];
        } else {
          compressedObj[property] = val;
        }
      }
      if (property !== undefined && property !== options.textNodeName) {
        matcher.pop();
      }
    }
  }
  if (typeof text === "string") {
    if (text.length > 0)
      compressedObj[options.textNodeName] = text;
  } else if (text !== undefined)
    compressedObj[options.textNodeName] = text;
  return compressedObj;
}
function propName(obj) {
  const keys = Object.keys(obj);
  for (let i = 0;i < keys.length; i++) {
    const key = keys[i];
    if (key !== ":@")
      return key;
  }
}
function assignAttributes(obj, attrMap, matcher, options) {
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length;
    for (let i = 0;i < len; i++) {
      const atrrName = keys[i];
      const rawAttrName = atrrName.startsWith(options.attributeNamePrefix) ? atrrName.substring(options.attributeNamePrefix.length) : atrrName;
      const jPathOrMatcher = options.jPath ? matcher.toString() + "." + rawAttrName : matcher;
      if (options.isArray(atrrName, jPathOrMatcher, true, true)) {
        obj[atrrName] = [attrMap[atrrName]];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}
function isLeafTag(obj, options) {
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  if (propCount === 0) {
    return true;
  }
  if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
    return true;
  }
  return false;
}
var METADATA_SYMBOL2;
var init_node2json = __esm(() => {
  init_xmlNode();
  METADATA_SYMBOL2 = XmlNode.getMetaDataSymbol();
});

// node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
class XMLParser {
  constructor(options) {
    this.externalEntities = {};
    this.options = buildOptions(options);
  }
  parse(xmlData, validationOption) {
    if (typeof xmlData !== "string" && xmlData.toString) {
      xmlData = xmlData.toString();
    } else if (typeof xmlData !== "string") {
      throw new Error("XML data is accepted in String or Bytes[] form.");
    }
    if (validationOption) {
      if (validationOption === true)
        validationOption = {};
      const result = validate(xmlData, validationOption);
      if (result !== true) {
        throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
      }
    }
    const orderedObjParser = new OrderedObjParser(this.options);
    orderedObjParser.addExternalEntities(this.externalEntities);
    const orderedResult = orderedObjParser.parseXml(xmlData);
    if (this.options.preserveOrder || orderedResult === undefined)
      return orderedResult;
    else
      return prettify(orderedResult, this.options, orderedObjParser.matcher);
  }
  addEntity(key, value) {
    if (value.indexOf("&") !== -1) {
      throw new Error("Entity value can't have '&'");
    } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    } else if (value === "&") {
      throw new Error("An entity with value '&' is not permitted");
    } else {
      this.externalEntities[key] = value;
    }
  }
  static getMetaDataSymbol() {
    return XmlNode.getMetaDataSymbol();
  }
}
var init_XMLParser = __esm(() => {
  init_OptionsBuilder();
  init_OrderedObjParser();
  init_node2json();
  init_validator();
  init_xmlNode();
});

// node_modules/fast-xml-builder/src/orderedJs2Xml.js
function toXml(jArray, options) {
  let indentation = "";
  if (options.format && options.indentBy.length > 0) {
    indentation = EOL;
  }
  const stopNodeExpressions = [];
  if (options.stopNodes && Array.isArray(options.stopNodes)) {
    for (let i = 0;i < options.stopNodes.length; i++) {
      const node = options.stopNodes[i];
      if (typeof node === "string") {
        stopNodeExpressions.push(new Expression(node));
      } else if (node instanceof Expression) {
        stopNodeExpressions.push(node);
      }
    }
  }
  const matcher = new Matcher;
  return arrToStr(jArray, options, indentation, matcher, stopNodeExpressions);
}
function arrToStr(arr, options, indentation, matcher, stopNodeExpressions) {
  let xmlStr = "";
  let isPreviousElementTag = false;
  if (options.maxNestedTags && matcher.getDepth() > options.maxNestedTags) {
    throw new Error("Maximum nested tags exceeded");
  }
  if (!Array.isArray(arr)) {
    if (arr !== undefined && arr !== null) {
      let text = arr.toString();
      text = replaceEntitiesValue2(text, options);
      return text;
    }
    return "";
  }
  for (let i = 0;i < arr.length; i++) {
    const tagObj = arr[i];
    const tagName = propName2(tagObj);
    if (tagName === undefined)
      continue;
    const attrValues = extractAttributeValues(tagObj[":@"], options);
    matcher.push(tagName, attrValues);
    const isStopNode = checkStopNode(matcher, stopNodeExpressions);
    if (tagName === options.textNodeName) {
      let tagText = tagObj[tagName];
      if (!isStopNode) {
        tagText = options.tagValueProcessor(tagName, tagText);
        tagText = replaceEntitiesValue2(tagText, options);
      }
      if (isPreviousElementTag) {
        xmlStr += indentation;
      }
      xmlStr += tagText;
      isPreviousElementTag = false;
      matcher.pop();
      continue;
    } else if (tagName === options.cdataPropName) {
      if (isPreviousElementTag) {
        xmlStr += indentation;
      }
      xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
      isPreviousElementTag = false;
      matcher.pop();
      continue;
    } else if (tagName === options.commentPropName) {
      xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
      isPreviousElementTag = true;
      matcher.pop();
      continue;
    } else if (tagName[0] === "?") {
      const attStr2 = attr_to_str(tagObj[":@"], options, isStopNode);
      const tempInd = tagName === "?xml" ? "" : indentation;
      let piTextNodeName = tagObj[tagName][0][options.textNodeName];
      piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
      xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
      isPreviousElementTag = true;
      matcher.pop();
      continue;
    }
    let newIdentation = indentation;
    if (newIdentation !== "") {
      newIdentation += options.indentBy;
    }
    const attStr = attr_to_str(tagObj[":@"], options, isStopNode);
    const tagStart = indentation + `<${tagName}${attStr}`;
    let tagValue;
    if (isStopNode) {
      tagValue = getRawContent(tagObj[tagName], options);
    } else {
      tagValue = arrToStr(tagObj[tagName], options, newIdentation, matcher, stopNodeExpressions);
    }
    if (options.unpairedTags.indexOf(tagName) !== -1) {
      if (options.suppressUnpairedNode)
        xmlStr += tagStart + ">";
      else
        xmlStr += tagStart + "/>";
    } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
      xmlStr += tagStart + "/>";
    } else if (tagValue && tagValue.endsWith(">")) {
      xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
    } else {
      xmlStr += tagStart + ">";
      if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
        xmlStr += indentation + options.indentBy + tagValue + indentation;
      } else {
        xmlStr += tagValue;
      }
      xmlStr += `</${tagName}>`;
    }
    isPreviousElementTag = true;
    matcher.pop();
  }
  return xmlStr;
}
function extractAttributeValues(attrMap, options) {
  if (!attrMap || options.ignoreAttributes)
    return null;
  const attrValues = {};
  let hasAttrs = false;
  for (let attr in attrMap) {
    if (!Object.prototype.hasOwnProperty.call(attrMap, attr))
      continue;
    const cleanAttrName = attr.startsWith(options.attributeNamePrefix) ? attr.substr(options.attributeNamePrefix.length) : attr;
    attrValues[cleanAttrName] = attrMap[attr];
    hasAttrs = true;
  }
  return hasAttrs ? attrValues : null;
}
function getRawContent(arr, options) {
  if (!Array.isArray(arr)) {
    if (arr !== undefined && arr !== null) {
      return arr.toString();
    }
    return "";
  }
  let content = "";
  for (let i = 0;i < arr.length; i++) {
    const item = arr[i];
    const tagName = propName2(item);
    if (tagName === options.textNodeName) {
      content += item[tagName];
    } else if (tagName === options.cdataPropName) {
      content += item[tagName][0][options.textNodeName];
    } else if (tagName === options.commentPropName) {
      content += item[tagName][0][options.textNodeName];
    } else if (tagName && tagName[0] === "?") {
      continue;
    } else if (tagName) {
      const attStr = attr_to_str_raw(item[":@"], options);
      const nestedContent = getRawContent(item[tagName], options);
      if (!nestedContent || nestedContent.length === 0) {
        content += `<${tagName}${attStr}/>`;
      } else {
        content += `<${tagName}${attStr}>${nestedContent}</${tagName}>`;
      }
    }
  }
  return content;
}
function attr_to_str_raw(attrMap, options) {
  let attrStr = "";
  if (attrMap && !options.ignoreAttributes) {
    for (let attr in attrMap) {
      if (!Object.prototype.hasOwnProperty.call(attrMap, attr))
        continue;
      let attrVal = attrMap[attr];
      if (attrVal === true && options.suppressBooleanAttributes) {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
      } else {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
      }
    }
  }
  return attrStr;
}
function propName2(obj) {
  const keys = Object.keys(obj);
  for (let i = 0;i < keys.length; i++) {
    const key = keys[i];
    if (!Object.prototype.hasOwnProperty.call(obj, key))
      continue;
    if (key !== ":@")
      return key;
  }
}
function attr_to_str(attrMap, options, isStopNode) {
  let attrStr = "";
  if (attrMap && !options.ignoreAttributes) {
    for (let attr in attrMap) {
      if (!Object.prototype.hasOwnProperty.call(attrMap, attr))
        continue;
      let attrVal;
      if (isStopNode) {
        attrVal = attrMap[attr];
      } else {
        attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
        attrVal = replaceEntitiesValue2(attrVal, options);
      }
      if (attrVal === true && options.suppressBooleanAttributes) {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
      } else {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
      }
    }
  }
  return attrStr;
}
function checkStopNode(matcher, stopNodeExpressions) {
  if (!stopNodeExpressions || stopNodeExpressions.length === 0)
    return false;
  for (let i = 0;i < stopNodeExpressions.length; i++) {
    if (matcher.matches(stopNodeExpressions[i])) {
      return true;
    }
  }
  return false;
}
function replaceEntitiesValue2(textValue, options) {
  if (textValue && textValue.length > 0 && options.processEntities) {
    for (let i = 0;i < options.entities.length; i++) {
      const entity = options.entities[i];
      textValue = textValue.replace(entity.regex, entity.val);
    }
  }
  return textValue;
}
var EOL = `
`;
var init_orderedJs2Xml = __esm(() => {
  init_src();
});

// node_modules/fast-xml-builder/src/ignoreAttributes.js
function getIgnoreAttributesFn2(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

// node_modules/fast-xml-builder/src/fxb.js
function Builder(options) {
  this.options = Object.assign({}, defaultOptions3, options);
  if (this.options.stopNodes && Array.isArray(this.options.stopNodes)) {
    this.options.stopNodes = this.options.stopNodes.map((node) => {
      if (typeof node === "string" && node.startsWith("*.")) {
        return ".." + node.substring(2);
      }
      return node;
    });
  }
  this.stopNodeExpressions = [];
  if (this.options.stopNodes && Array.isArray(this.options.stopNodes)) {
    for (let i = 0;i < this.options.stopNodes.length; i++) {
      const node = this.options.stopNodes[i];
      if (typeof node === "string") {
        this.stopNodeExpressions.push(new Expression(node));
      } else if (node instanceof Expression) {
        this.stopNodeExpressions.push(node);
      }
    }
  }
  if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
    this.isAttribute = function() {
      return false;
    };
  } else {
    this.ignoreAttributesFn = getIgnoreAttributesFn2(this.options.ignoreAttributes);
    this.attrPrefixLen = this.options.attributeNamePrefix.length;
    this.isAttribute = isAttribute;
  }
  this.processTextOrObjNode = processTextOrObjNode;
  if (this.options.format) {
    this.indentate = indentate;
    this.tagEndChar = `>
`;
    this.newLine = `
`;
  } else {
    this.indentate = function() {
      return "";
    };
    this.tagEndChar = ">";
    this.newLine = "";
  }
}
function processTextOrObjNode(object, key, level, matcher) {
  const attrValues = this.extractAttributes(object);
  matcher.push(key, attrValues);
  const isStopNode = this.checkStopNode(matcher);
  if (isStopNode) {
    const rawContent = this.buildRawContent(object);
    const attrStr = this.buildAttributesForStopNode(object);
    matcher.pop();
    return this.buildObjectNode(rawContent, key, attrStr, level);
  }
  const result = this.j2x(object, level + 1, matcher);
  matcher.pop();
  if (object[this.options.textNodeName] !== undefined && Object.keys(object).length === 1) {
    return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level, matcher);
  } else {
    return this.buildObjectNode(result.val, key, result.attrStr, level);
  }
}
function indentate(level) {
  return this.options.indentBy.repeat(level);
}
function isAttribute(name) {
  if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
    return name.substr(this.attrPrefixLen);
  } else {
    return false;
  }
}
var defaultOptions3;
var init_fxb = __esm(() => {
  init_orderedJs2Xml();
  init_src();
  defaultOptions3 = {
    attributeNamePrefix: "@_",
    attributesGroupName: false,
    textNodeName: "#text",
    ignoreAttributes: true,
    cdataPropName: false,
    format: false,
    indentBy: "  ",
    suppressEmptyNode: false,
    suppressUnpairedNode: true,
    suppressBooleanAttributes: true,
    tagValueProcessor: function(key, a) {
      return a;
    },
    attributeValueProcessor: function(attrName, a) {
      return a;
    },
    preserveOrder: false,
    commentPropName: false,
    unpairedTags: [],
    entities: [
      { regex: new RegExp("&", "g"), val: "&amp;" },
      { regex: new RegExp(">", "g"), val: "&gt;" },
      { regex: new RegExp("<", "g"), val: "&lt;" },
      { regex: new RegExp("'", "g"), val: "&apos;" },
      { regex: new RegExp('"', "g"), val: "&quot;" }
    ],
    processEntities: true,
    stopNodes: [],
    oneListGroup: false,
    maxNestedTags: 100,
    jPath: true
  };
  Builder.prototype.build = function(jObj) {
    if (this.options.preserveOrder) {
      return toXml(jObj, this.options);
    } else {
      if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
        jObj = {
          [this.options.arrayNodeName]: jObj
        };
      }
      const matcher = new Matcher;
      return this.j2x(jObj, 0, matcher).val;
    }
  };
  Builder.prototype.j2x = function(jObj, level, matcher) {
    let attrStr = "";
    let val = "";
    if (this.options.maxNestedTags && matcher.getDepth() >= this.options.maxNestedTags) {
      throw new Error("Maximum nested tags exceeded");
    }
    const jPath = this.options.jPath ? matcher.toString() : matcher;
    const isCurrentStopNode = this.checkStopNode(matcher);
    for (let key in jObj) {
      if (!Object.prototype.hasOwnProperty.call(jObj, key))
        continue;
      if (typeof jObj[key] === "undefined") {
        if (this.isAttribute(key)) {
          val += "";
        }
      } else if (jObj[key] === null) {
        if (this.isAttribute(key)) {
          val += "";
        } else if (key === this.options.cdataPropName) {
          val += "";
        } else if (key[0] === "?") {
          val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
        } else {
          val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
        }
      } else if (jObj[key] instanceof Date) {
        val += this.buildTextValNode(jObj[key], key, "", level, matcher);
      } else if (typeof jObj[key] !== "object") {
        const attr = this.isAttribute(key);
        if (attr && !this.ignoreAttributesFn(attr, jPath)) {
          attrStr += this.buildAttrPairStr(attr, "" + jObj[key], isCurrentStopNode);
        } else if (!attr) {
          if (key === this.options.textNodeName) {
            let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
            val += this.replaceEntitiesValue(newval);
          } else {
            matcher.push(key);
            const isStopNode = this.checkStopNode(matcher);
            matcher.pop();
            if (isStopNode) {
              const textValue = "" + jObj[key];
              if (textValue === "") {
                val += this.indentate(level) + "<" + key + this.closeTag(key) + this.tagEndChar;
              } else {
                val += this.indentate(level) + "<" + key + ">" + textValue + "</" + key + this.tagEndChar;
              }
            } else {
              val += this.buildTextValNode(jObj[key], key, "", level, matcher);
            }
          }
        }
      } else if (Array.isArray(jObj[key])) {
        const arrLen = jObj[key].length;
        let listTagVal = "";
        let listTagAttr = "";
        for (let j = 0;j < arrLen; j++) {
          const item = jObj[key][j];
          if (typeof item === "undefined") {} else if (item === null) {
            if (key[0] === "?")
              val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
            else
              val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          } else if (typeof item === "object") {
            if (this.options.oneListGroup) {
              matcher.push(key);
              const result = this.j2x(item, level + 1, matcher);
              matcher.pop();
              listTagVal += result.val;
              if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                listTagAttr += result.attrStr;
              }
            } else {
              listTagVal += this.processTextOrObjNode(item, key, level, matcher);
            }
          } else {
            if (this.options.oneListGroup) {
              let textValue = this.options.tagValueProcessor(key, item);
              textValue = this.replaceEntitiesValue(textValue);
              listTagVal += textValue;
            } else {
              matcher.push(key);
              const isStopNode = this.checkStopNode(matcher);
              matcher.pop();
              if (isStopNode) {
                const textValue = "" + item;
                if (textValue === "") {
                  listTagVal += this.indentate(level) + "<" + key + this.closeTag(key) + this.tagEndChar;
                } else {
                  listTagVal += this.indentate(level) + "<" + key + ">" + textValue + "</" + key + this.tagEndChar;
                }
              } else {
                listTagVal += this.buildTextValNode(item, key, "", level, matcher);
              }
            }
          }
        }
        if (this.options.oneListGroup) {
          listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
        }
        val += listTagVal;
      } else {
        if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
          const Ks = Object.keys(jObj[key]);
          const L = Ks.length;
          for (let j = 0;j < L; j++) {
            attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]], isCurrentStopNode);
          }
        } else {
          val += this.processTextOrObjNode(jObj[key], key, level, matcher);
        }
      }
    }
    return { attrStr, val };
  };
  Builder.prototype.buildAttrPairStr = function(attrName, val, isStopNode) {
    if (!isStopNode) {
      val = this.options.attributeValueProcessor(attrName, "" + val);
      val = this.replaceEntitiesValue(val);
    }
    if (this.options.suppressBooleanAttributes && val === "true") {
      return " " + attrName;
    } else
      return " " + attrName + '="' + val + '"';
  };
  Builder.prototype.extractAttributes = function(obj) {
    if (!obj || typeof obj !== "object")
      return null;
    const attrValues = {};
    let hasAttrs = false;
    if (this.options.attributesGroupName && obj[this.options.attributesGroupName]) {
      const attrGroup = obj[this.options.attributesGroupName];
      for (let attrKey in attrGroup) {
        if (!Object.prototype.hasOwnProperty.call(attrGroup, attrKey))
          continue;
        const cleanKey = attrKey.startsWith(this.options.attributeNamePrefix) ? attrKey.substring(this.options.attributeNamePrefix.length) : attrKey;
        attrValues[cleanKey] = attrGroup[attrKey];
        hasAttrs = true;
      }
    } else {
      for (let key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key))
          continue;
        const attr = this.isAttribute(key);
        if (attr) {
          attrValues[attr] = obj[key];
          hasAttrs = true;
        }
      }
    }
    return hasAttrs ? attrValues : null;
  };
  Builder.prototype.buildRawContent = function(obj) {
    if (typeof obj === "string") {
      return obj;
    }
    if (typeof obj !== "object" || obj === null) {
      return String(obj);
    }
    if (obj[this.options.textNodeName] !== undefined) {
      return obj[this.options.textNodeName];
    }
    let content = "";
    for (let key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key))
        continue;
      if (this.isAttribute(key))
        continue;
      if (this.options.attributesGroupName && key === this.options.attributesGroupName)
        continue;
      const value = obj[key];
      if (key === this.options.textNodeName) {
        content += value;
      } else if (Array.isArray(value)) {
        for (let item of value) {
          if (typeof item === "string" || typeof item === "number") {
            content += `<${key}>${item}</${key}>`;
          } else if (typeof item === "object" && item !== null) {
            const nestedContent = this.buildRawContent(item);
            const nestedAttrs = this.buildAttributesForStopNode(item);
            if (nestedContent === "") {
              content += `<${key}${nestedAttrs}/>`;
            } else {
              content += `<${key}${nestedAttrs}>${nestedContent}</${key}>`;
            }
          }
        }
      } else if (typeof value === "object" && value !== null) {
        const nestedContent = this.buildRawContent(value);
        const nestedAttrs = this.buildAttributesForStopNode(value);
        if (nestedContent === "") {
          content += `<${key}${nestedAttrs}/>`;
        } else {
          content += `<${key}${nestedAttrs}>${nestedContent}</${key}>`;
        }
      } else {
        content += `<${key}>${value}</${key}>`;
      }
    }
    return content;
  };
  Builder.prototype.buildAttributesForStopNode = function(obj) {
    if (!obj || typeof obj !== "object")
      return "";
    let attrStr = "";
    if (this.options.attributesGroupName && obj[this.options.attributesGroupName]) {
      const attrGroup = obj[this.options.attributesGroupName];
      for (let attrKey in attrGroup) {
        if (!Object.prototype.hasOwnProperty.call(attrGroup, attrKey))
          continue;
        const cleanKey = attrKey.startsWith(this.options.attributeNamePrefix) ? attrKey.substring(this.options.attributeNamePrefix.length) : attrKey;
        const val = attrGroup[attrKey];
        if (val === true && this.options.suppressBooleanAttributes) {
          attrStr += " " + cleanKey;
        } else {
          attrStr += " " + cleanKey + '="' + val + '"';
        }
      }
    } else {
      for (let key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key))
          continue;
        const attr = this.isAttribute(key);
        if (attr) {
          const val = obj[key];
          if (val === true && this.options.suppressBooleanAttributes) {
            attrStr += " " + attr;
          } else {
            attrStr += " " + attr + '="' + val + '"';
          }
        }
      }
    }
    return attrStr;
  };
  Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
    if (val === "") {
      if (key[0] === "?")
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      else {
        return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
      }
    } else {
      let tagEndExp = "</" + key + this.tagEndChar;
      let piClosingChar = "";
      if (key[0] === "?") {
        piClosingChar = "?";
        tagEndExp = "";
      }
      if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
        return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
        return this.indentate(level) + `<!--${val}-->` + this.newLine;
      } else {
        return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
      }
    }
  };
  Builder.prototype.closeTag = function(key) {
    let closeTag = "";
    if (this.options.unpairedTags.indexOf(key) !== -1) {
      if (!this.options.suppressUnpairedNode)
        closeTag = "/";
    } else if (this.options.suppressEmptyNode) {
      closeTag = "/";
    } else {
      closeTag = `></${key}`;
    }
    return closeTag;
  };
  Builder.prototype.checkStopNode = function(matcher) {
    if (!this.stopNodeExpressions || this.stopNodeExpressions.length === 0)
      return false;
    for (let i = 0;i < this.stopNodeExpressions.length; i++) {
      if (matcher.matches(this.stopNodeExpressions[i])) {
        return true;
      }
    }
    return false;
  };
  Builder.prototype.buildTextValNode = function(val, key, attrStr, level, matcher) {
    if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
      return this.indentate(level) + `<![CDATA[${val}]]>` + this.newLine;
    } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
      return this.indentate(level) + `<!--${val}-->` + this.newLine;
    } else if (key[0] === "?") {
      return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
    } else {
      let textValue = this.options.tagValueProcessor(key, val);
      textValue = this.replaceEntitiesValue(textValue);
      if (textValue === "") {
        return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
      } else {
        return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
      }
    }
  };
  Builder.prototype.replaceEntitiesValue = function(textValue) {
    if (textValue && textValue.length > 0 && this.options.processEntities) {
      for (let i = 0;i < this.options.entities.length; i++) {
        const entity = this.options.entities[i];
        textValue = textValue.replace(entity.regex, entity.val);
      }
    }
    return textValue;
  };
});

// node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var json2xml_default;
var init_json2xml = __esm(() => {
  init_fxb();
  init_fxb();
  json2xml_default = Builder;
});

// node_modules/fast-xml-parser/src/fxp.js
var exports_fxp = {};
__export(exports_fxp, {
  XMLValidator: () => XMLValidator,
  XMLParser: () => XMLParser,
  XMLBuilder: () => json2xml_default
});
var XMLValidator;
var init_fxp = __esm(() => {
  init_validator();
  init_XMLParser();
  init_json2xml();
  XMLValidator = {
    validate
  };
});

// src/engine/handlers/data-handler.ts
class DataHandler {
  canHandle(text) {
    if (text.match(/^(Given|When|Then|And|But)?\s*parse\s+xml\s+/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*validate\s+xml\s+/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*xpath\s+/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*merge\s+json/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*filter\s+json/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*json\s+path/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*current\s+date/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*add\s+\d+\s+(day|hour|minute|second|month|year)/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*date\s+diff/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*format\s+date/i))
      return true;
    if (text.match(/^(And|But)?\s*repeat\s+until/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*for\s+each/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*if\s+/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*unless\s+/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*skip\s+if/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*csv\s+row\s+count/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*csv\s+filter/i))
      return true;
    if (text.match(/^(Given|When|Then|And|But)?\s*csv\s+map/i))
      return true;
    return false;
  }
  async handle(text, step, context, executor) {
    const logger = executor.getLogger();
    const parseXmlMatch = text.match(/^(Given|When|Then|And|But)?\s*parse\s+xml\s+(.+?)\s+into\s+(\w+)$/i);
    if (parseXmlMatch) {
      const xmlContent = executor.stripQuotes(parseXmlMatch[2].trim());
      const varName = parseXmlMatch[3];
      try {
        const { XMLParser: XMLParser2 } = await Promise.resolve().then(() => (init_fxp(), exports_fxp));
        const parser = new XMLParser2({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        const result = parser.parse(xmlContent);
        context.variables[varName] = result;
        logger.log(`\uD83D\uDCE6 Parsed XML into variable '${varName}'`);
      } catch (e) {
        throw new Error(`Failed to parse XML: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    const validateXmlMatch = text.match(/^(Given|When|Then|And|But)?\s*validate\s+xml\s+(.+?)\s+against\s+(.+)$/i);
    if (validateXmlMatch) {
      const xmlContent = executor.stripQuotes(validateXmlMatch[2].trim());
      const schemaPath = executor.stripQuotes(validateXmlMatch[3].trim());
      try {
        const { XMLParser: XMLParser2 } = await Promise.resolve().then(() => (init_fxp(), exports_fxp));
        const parser = new XMLParser2({ ignoreAttributes: false });
        parser.parse(xmlContent);
        logger.log(`\u2705 XML validation passed`);
      } catch (e) {
        throw new Error(`XML validation failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    const xpathMatch = text.match(/^(Given|When|Then|And|But)?\s*xpath\s+(.+?)\s+on\s+(\$\w+)\s+(matches|==)\s+(.+)$/i);
    if (xpathMatch) {
      const xpath = xpathMatch[2].trim();
      const varName = xpathMatch[3].substring(1);
      const expectedValue = executor.stripQuotes(xpathMatch[5].trim());
      const xmlData = context.variables[varName];
      try {
        const { XMLParser: XMLParser2 } = await Promise.resolve().then(() => (init_fxp(), exports_fxp));
        const parser = new XMLParser2({ ignoreAttributes: false, attributeNamePrefix: "@_" });
        const pathParts = xpath.replace(/^\/\//, "").split(/\/|\[|\]/).filter(Boolean);
        let result = xmlData;
        for (const part of pathParts) {
          if (result && typeof result === "object") {
            if (Array.isArray(result)) {
              result = result.find((item) => item[part] !== undefined)?.[part];
            } else {
              result = result[part];
            }
          }
        }
        if (String(result) === expectedValue) {
          logger.log(`\u2705 XPath '${xpath}' matches '${expectedValue}'`);
        } else {
          throw new Error(`XPath '${xpath}' expected '${expectedValue}' but got '${result}'`);
        }
      } catch (e) {
        throw new Error(`XPath evaluation failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    const mergeJsonMatch = text.match(/^(Given|When|Then|And|But)?\s*merge\s+json\s+(\{[\s\S]+?\})\s+and\s+(\{[\s\S]+?\})\s+into\s+(\w+)$/i);
    if (mergeJsonMatch) {
      try {
        const json1 = JSON.parse(mergeJsonMatch[2]);
        const json2 = JSON.parse(mergeJsonMatch[3]);
        const varName = mergeJsonMatch[4];
        const merged = { ...json1, ...json2 };
        context.variables[varName] = merged;
        logger.log(`\uD83D\uDD00 Merged JSON into variable '${varName}':`, JSON.stringify(merged).substring(0, 100));
      } catch (e) {
        throw new Error(`Failed to merge JSON: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    const filterJsonMatch = text.match(/^(Given|When|Then|And|But)?\s*filter\s+json\s+(\$\w+)\s+where\s+(.+?)\s+(==|!=)\s+(.+?)\s+into\s+(\w+)$/i);
    if (filterJsonMatch) {
      const arrayVar = filterJsonMatch[2].substring(1);
      const field = filterJsonMatch[3].trim();
      const operator = filterJsonMatch[4];
      const expectedValue = executor.stripQuotes(filterJsonMatch[5].trim());
      const resultVar = filterJsonMatch[6];
      const array = context.variables[arrayVar];
      if (!Array.isArray(array)) {
        throw new Error(`Variable '${arrayVar}' is not an array`);
      }
      const filtered = array.filter((item) => {
        const actual = item[field];
        if (operator === "==")
          return String(actual) === expectedValue;
        if (operator === "!=")
          return String(actual) !== expectedValue;
        return false;
      });
      context.variables[resultVar] = filtered;
      logger.log(`\uD83D\uDD0D Filtered ${array.length} items to ${filtered.length} in variable '${resultVar}'`);
      return;
    }
    const jsonPathMatch = text.match(/^(Given|When|Then|And|But)?\s*json\s+path\s+(.+?)\s+on\s+(\$\w+)\s+into\s+(\w+)$/i);
    if (jsonPathMatch) {
      const jsonPath = jsonPathMatch[2].trim();
      const varName = jsonPathMatch[3].substring(1);
      const resultVar = jsonPathMatch[4];
      const data = context.variables[varName];
      try {
        const result = this.evaluateJsonPath(data, jsonPath);
        context.variables[resultVar] = result;
        logger.log(`\uD83D\uDD0D JSONPath '${jsonPath}' result:`, JSON.stringify(result).substring(0, 100));
      } catch (e) {
        throw new Error(`JSONPath evaluation failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    const currentDateMatch = text.match(/^(Given|When|Then|And|But)?\s*current\s+date(?:\s+in\s+format\s+(.+?))?\s+into\s+(\w+)$/i);
    if (currentDateMatch) {
      const format = currentDateMatch[2] ? executor.stripQuotes(currentDateMatch[2].trim()) : "YYYY-MM-DD";
      const varName = currentDateMatch[3];
      const now = new Date;
      context.variables[varName] = this.formatDate(now, format);
      logger.log(`\uD83D\uDCC5 Current date into '${varName}': ${context.variables[varName]}`);
      return;
    }
    const addTimeMatch = text.match(/^(Given|When|Then|And|But)?\s*add\s+(\d+)\s+(day|days|hour|hours|minute|minutes|second|seconds|month|months|year|years)\s+to\s+(\$\w+)\s+into\s+(\w+)$/i);
    if (addTimeMatch) {
      const amount = parseInt(addTimeMatch[2]);
      const unit = addTimeMatch[3].toLowerCase().replace(/s$/, "");
      const sourceVar = addTimeMatch[4].substring(1);
      const resultVar = addTimeMatch[5];
      const sourceDate = context.variables[sourceVar];
      const date = sourceDate ? new Date(sourceDate) : new Date;
      switch (unit) {
        case "day":
          date.setDate(date.getDate() + amount);
          break;
        case "hour":
          date.setHours(date.getHours() + amount);
          break;
        case "minute":
          date.setMinutes(date.getMinutes() + amount);
          break;
        case "second":
          date.setSeconds(date.getSeconds() + amount);
          break;
        case "month":
          date.setMonth(date.getMonth() + amount);
          break;
        case "year":
          date.setFullYear(date.getFullYear() + amount);
          break;
      }
      context.variables[resultVar] = date.toISOString();
      logger.log(`\u2795 Added ${amount} ${unit}s to '${sourceVar}' -> '${resultVar}': ${context.variables[resultVar]}`);
      return;
    }
    const dateDiffMatch = text.match(/^(Given|When|Then|And|But)?\s*date\s+diff\s+between\s+(\$\w+)\s+and\s+(\$\w+)\s+in\s+(day|days|hour|hours|minute|minutes)\s+into\s+(\w+)$/i);
    if (dateDiffMatch) {
      const startVar = dateDiffMatch[2].substring(1);
      const endVar = dateDiffMatch[3].substring(1);
      const unit = dateDiffMatch[4].toLowerCase().replace(/s$/, "");
      const resultVar = dateDiffMatch[5];
      const start = new Date(context.variables[startVar]);
      const end = new Date(context.variables[endVar]);
      const diffMs = Math.abs(end.getTime() - start.getTime());
      let diff;
      switch (unit) {
        case "day":
          diff = Math.floor(diffMs / 86400000);
          break;
        case "hour":
          diff = Math.floor(diffMs / 3600000);
          break;
        case "minute":
          diff = Math.floor(diffMs / 60000);
          break;
        default:
          diff = Math.floor(diffMs / 1000);
      }
      context.variables[resultVar] = diff;
      logger.log(`\uD83D\uDCCA Date diff: ${diff} ${unit}(s)`);
      return;
    }
    const formatDateMatch = text.match(/^(Given|When|Then|And|But)?\s*format\s+date\s+(\$\w+)\s+with\s+(.+?)\s+into\s+(\w+)$/i);
    if (formatDateMatch) {
      const dateVar = formatDateMatch[2].substring(1);
      const format = executor.stripQuotes(formatDateMatch[3].trim());
      const resultVar = formatDateMatch[4];
      const date = new Date(context.variables[dateVar]);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value: ${context.variables[dateVar]}`);
      }
      context.variables[resultVar] = this.formatDate(date, format);
      logger.log(`\uD83D\uDCC5 Formatted date: ${context.variables[resultVar]}`);
      return;
    }
    const csvCountMatch = text.match(/^(Given|When|Then|And|But)?\s*csv\s+row\s+count\s+of\s+(\$\w+)\s+into\s+(\w+)$/i);
    if (csvCountMatch) {
      const csvVar = csvCountMatch[2].substring(1);
      const resultVar = csvCountMatch[3];
      const csvData = context.variables[csvVar];
      if (!Array.isArray(csvData)) {
        throw new Error(`Variable '${csvVar}' is not an array (CSV data)`);
      }
      context.variables[resultVar] = csvData.length;
      logger.log(`\uD83D\uDCCA CSV row count: ${csvData.length}`);
      return;
    }
    const csvFilterMatch = text.match(/^(Given|When|Then|And|But)?\s*csv\s+filter\s+(\$\w+)\s+where\s+(.+?)\s+(==|!=)\s+(.+?)\s+into\s+(\w+)$/i);
    if (csvFilterMatch) {
      const csvVar = csvFilterMatch[2].substring(1);
      const column = csvFilterMatch[3].trim();
      const operator = csvFilterMatch[4];
      const expectedValue = executor.stripQuotes(csvFilterMatch[5].trim());
      const resultVar = csvFilterMatch[6];
      const csvData = context.variables[csvVar];
      if (!Array.isArray(csvData)) {
        throw new Error(`Variable '${csvVar}' is not an array (CSV data)`);
      }
      const filtered = csvData.filter((row) => {
        const actual = row[column];
        if (operator === "==")
          return String(actual) === expectedValue;
        if (operator === "!=")
          return String(actual) !== expectedValue;
        return false;
      });
      context.variables[resultVar] = filtered;
      logger.log(`\uD83D\uDD0D CSV filtered: ${csvData.length} -> ${filtered.length} rows`);
      return;
    }
    const csvMapMatch = text.match(/^(Given|When|Then|And|But)?\s*csv\s+map\s+(\$\w+)\s+with\s+(.+?)\s+into\s+(\w+)$/i);
    if (csvMapMatch) {
      const csvVar = csvMapMatch[2].substring(1);
      const field = csvMapMatch[3].trim();
      const resultVar = csvMapMatch[4];
      const csvData = context.variables[csvVar];
      if (!Array.isArray(csvData)) {
        throw new Error(`Variable '${csvVar}' is not an array (CSV data)`);
      }
      const mapped = csvData.map((row) => row[field]);
      context.variables[resultVar] = mapped;
      logger.log(`\uD83D\uDD04 CSV mapped '${field}': ${mapped.length} values`);
      return;
    }
    const ifMatch = text.match(/^(Given|When|Then|And|But)?\s*if\s+(.+?)\s+then\s+def\s+(\w+)\s*=\s*(.+)$/i);
    if (ifMatch) {
      const condition = ifMatch[2].trim();
      const resultVar = ifMatch[3];
      const resultValue = executor.stripQuotes(ifMatch[4].trim());
      const conditionResult = this.evaluateCondition(condition, context, executor);
      context.variables[resultVar] = conditionResult ? this.parseValue(resultValue, context) : null;
      logger.log(`\uD83D\uDD00 If '${condition}' -> '${resultVar}': ${context.variables[resultVar]}`);
      return;
    }
    const unlessMatch = text.match(/^(Given|When|Then|And|But)?\s*unless\s+(.+?)\s+then\s+def\s+(\w+)\s*=\s*(.+)$/i);
    if (unlessMatch) {
      const condition = unlessMatch[2].trim();
      const resultVar = unlessMatch[3];
      const resultValue = executor.stripQuotes(unlessMatch[4].trim());
      const conditionResult = !this.evaluateCondition(condition, context, executor);
      context.variables[resultVar] = conditionResult ? this.parseValue(resultValue, context) : null;
      logger.log(`\uD83D\uDD00 Unless '${condition}' -> '${resultVar}': ${context.variables[resultVar]}`);
      return;
    }
    const skipIfMatch = text.match(/^(Given|When|Then|And|But)?\s*skip\s+if\s+(.+)$/i);
    if (skipIfMatch) {
      const condition = skipIfMatch[2].trim();
      const conditionResult = this.evaluateCondition(condition, context, executor);
      if (conditionResult) {
        logger.log(`\u23ED\uFE0F Skipping step because '${condition}' is true`);
        context.variables["__skipStep"] = true;
      }
      return;
    }
    const forEachMatch = text.match(/^(Given|When|Then|And|But)?\s*for\s+each\s+(\$\w+)\s+into\s+(\w+)$/i);
    if (forEachMatch) {
      const arrayVar = forEachMatch[2].substring(1);
      const itemVar = forEachMatch[3];
      const array = context.variables[arrayVar];
      if (!Array.isArray(array)) {
        throw new Error(`Variable '${arrayVar}' is not an array`);
      }
      context.variables["__loopArray"] = array;
      context.variables["__loopIndex"] = 0;
      context.variables["__loopItemVar"] = itemVar;
      context.variables[itemVar] = array[0];
      logger.log(`\uD83D\uDD01 For each: ${array.length} items, first item in '${itemVar}'`);
      return;
    }
    const repeatMatch = text.match(/^(And|But)?\s*repeat\s+until\s+(.+)$/i);
    if (repeatMatch) {
      const condition = repeatMatch[2].trim();
      logger.log(`\uD83D\uDD01 Repeat until '${condition}' - requires engine support`);
      return;
    }
    throw new Error(`Unknown data operation: ${text}`);
  }
  evaluateJsonPath(data, path5) {
    if (path5 === "$")
      return data;
    let result = data;
    const tokens = this.tokenizeJsonPath(path5);
    for (const token of tokens) {
      if (result === null || result === undefined)
        return;
      if (token.type === "root")
        continue;
      if (token.type === "property" && token.value) {
        result = result[String(token.value)];
      } else if (token.type === "index" && token.value !== undefined) {
        result = result[Number(token.value)];
      } else if (token.type === "wildcard") {
        if (Array.isArray(result)) {
          result = result;
        } else if (typeof result === "object") {
          result = Object.values(result);
        }
      } else if (token.type === "arraySlice") {
        if (Array.isArray(result)) {
          const start = token.start ?? 0;
          const end = token.end ?? result.length;
          result = result.slice(start, end);
        }
      }
    }
    return result;
  }
  tokenizeJsonPath(path5) {
    const tokens = [];
    let remaining = path5;
    while (remaining.length > 0) {
      if (remaining.startsWith("$")) {
        tokens.push({ type: "root" });
        remaining = remaining.substring(1);
      } else if (remaining.startsWith(".")) {
        remaining = remaining.substring(1);
        const match = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (match) {
          tokens.push({ type: "property", value: match[1] });
          remaining = remaining.substring(match[1].length);
        }
      } else if (remaining.startsWith("[")) {
        remaining = remaining.substring(1);
        if (remaining.startsWith("*")) {
          tokens.push({ type: "wildcard" });
          remaining = remaining.substring(1);
        } else if (remaining.includes(":")) {
          const parts = remaining.split(":");
          const start = parts[0] ? parseInt(parts[0]) : undefined;
          const end = parts[1] ? parseInt(parts[1].replace(/\].*$/, "")) : undefined;
          tokens.push({ type: "arraySlice", start, end });
          remaining = remaining.replace(/^\d*:\d*\]/, "");
        } else {
          const match = remaining.match(/^(\d+)/);
          if (match) {
            tokens.push({ type: "index", value: parseInt(match[1]) });
            remaining = remaining.substring(match[1].length);
          }
        }
        if (remaining.startsWith("]")) {
          remaining = remaining.substring(1);
        }
      } else {
        remaining = remaining.substring(1);
      }
    }
    return tokens;
  }
  formatDate(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day).replace("HH", hours).replace("mm", minutes).replace("ss", seconds);
  }
  evaluateCondition(condition, context, executor) {
    const eqMatch = condition.match(/^(.+?)\s*==\s*(.+)$/);
    if (eqMatch) {
      const left = executor.stripQuotes(eqMatch[1].trim());
      const right = executor.stripQuotes(eqMatch[2].trim());
      const leftVal = this.resolveValue(left, context, executor);
      const rightVal = this.resolveValue(right, context, executor);
      return String(leftVal) === String(rightVal);
    }
    const neqMatch = condition.match(/^(.+?)\s*!=\s*(.+)$/);
    if (neqMatch) {
      const left = executor.stripQuotes(neqMatch[1].trim());
      const right = executor.stripQuotes(neqMatch[2].trim());
      const leftVal = this.resolveValue(left, context, executor);
      const rightVal = this.resolveValue(right, context, executor);
      return String(leftVal) !== String(rightVal);
    }
    const gtMatch = condition.match(/^(.+?)\s*>\s*(.+)$/);
    if (gtMatch) {
      const left = executor.stripQuotes(gtMatch[1].trim());
      const right = executor.stripQuotes(gtMatch[2].trim());
      const leftVal = this.resolveValue(left, context, executor);
      const rightVal = this.resolveValue(right, context, executor);
      return Number(leftVal) > Number(rightVal);
    }
    const ltMatch = condition.match(/^(.+?)\s*<\s*(.+)$/);
    if (ltMatch) {
      const left = executor.stripQuotes(ltMatch[1].trim());
      const right = executor.stripQuotes(ltMatch[2].trim());
      const leftVal = this.resolveValue(left, context, executor);
      const rightVal = this.resolveValue(right, context, executor);
      return Number(leftVal) < Number(rightVal);
    }
    const value = this.resolveValue(condition, context, executor);
    return !!value;
  }
  resolveValue(value, context, executor) {
    if (value.startsWith(String.fromCharCode(36))) {
      const varName = value.substring(1);
      return context.variables[varName];
    }
    return executor.parseValue(value, context);
  }
  parseValue(value, context) {
    if (value.startsWith(String.fromCharCode(36))) {
      const varName = value.substring(1);
      return context.variables[varName];
    }
    if (value === "true")
      return true;
    if (value === "false")
      return false;
    if (value === "null")
      return null;
    if (!isNaN(Number(value)))
      return Number(value);
    return value;
  }
}

// src/utils/variable-resolver.ts
class VariableResolver {
  envConfig;
  cache = new Map;
  constructor(envConfig = {}) {
    this.envConfig = envConfig;
  }
  resolve(value, context) {
    if (value === null || value === undefined)
      return value;
    if (Array.isArray(value))
      return value.map((item) => this.resolve(item, context));
    if (typeof value === "object") {
      const result2 = {};
      for (const [key, val] of Object.entries(value)) {
        result2[key] = this.resolve(val, context);
      }
      return result2;
    }
    if (typeof value !== "string")
      return value;
    const cacheKey = `${value}_${JSON.stringify(context.variables)}`;
    if (this.cache.has(cacheKey))
      return this.cache.get(cacheKey);
    let resolved = resolveEnvVariables(value, this.envConfig);
    const fullMatch = resolved.match(/^[#\$]\(?(\w+)\)?$/);
    if (fullMatch) {
      const name = fullMatch[1];
      if (context.variables[name] !== undefined) {
        const result2 = context.variables[name];
        this.cache.set(cacheKey, result2);
        return result2;
      }
    }
    const result = resolved.replace(/\$\{(\w+)\}/g, (_, name) => context.variables[name] ?? "").replace(/#\((\w+)\)/g, (_, name) => context.variables[name] ?? "").replace(/#(\w+)/g, (_, name) => context.variables[name] ?? "");
    this.cache.set(cacheKey, result);
    return result;
  }
}
var init_variable_resolver = __esm(() => {
  init_env_loader();
});

// src/utils/expression-evaluator.ts
class ExpressionEvaluator {
  evaluate(expression, context) {
    try {
      if (expression.startsWith("'") || expression.startsWith('"')) {
        return this.stripQuotes(expression);
      }
      if (expression && !isNaN(Number(expression)) && !expression.includes("-") && !expression.includes(":")) {
        return Number(expression);
      }
      const keys = Object.keys(context.variables);
      const values = Object.values(context.variables);
      const fn = new Function(...keys, `return ${expression}`);
      return fn(...values);
    } catch {
      return expression;
    }
  }
  stripQuotes(value) {
    if (value.startsWith("'") && value.endsWith("'") || value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }
}

// src/utils/json-parser.ts
class JsonParser {
  extractJsonBody(text) {
    const match = text.match(/^(?:(?:Given|When|Then|And|But)\s+)?request\s+(\{[\s\S]*\})/i);
    if (!match)
      return;
    const content = match[1];
    try {
      return JSON.parse(content);
    } catch {
      try {
        const processed = content.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3').replace(/'/g, '"');
        return JSON.parse(processed);
      } catch {
        return content;
      }
    }
  }
  parseGherkinJson(jsonStr) {
    const trimmed = jsonStr.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const result = {};
      const inner = trimmed.slice(1, -1);
      const pairs = this.splitByComma(inner);
      for (const pair of pairs) {
        const colonIndex = pair.indexOf(":");
        if (colonIndex === -1)
          continue;
        let key = pair.substring(0, colonIndex).trim().replace(/^['"]|['"]$/g, "");
        let value = pair.substring(colonIndex + 1).trim();
        result[key] = this.parseGherkinValue(value);
      }
      return result;
    } else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const inner = trimmed.slice(1, -1);
      const items = this.splitByComma(inner);
      return items.map((item) => this.parseGherkinValue(item.trim()));
    }
    return trimmed;
  }
  parseGherkinValue(value) {
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    if (value.startsWith("{") || value.startsWith("[")) {
      return this.parseGherkinJson(value);
    }
    if (value === "true")
      return true;
    if (value === "false")
      return false;
    if (value === "null")
      return null;
    if (!isNaN(Number(value)) && !value.includes("-") && !value.includes(":"))
      return Number(value);
    return value;
  }
  splitByComma(str) {
    const result = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let stringChar = "";
    for (const char of str) {
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        inString = false;
      } else if (!inString && (char === "{" || char === "[")) {
        depth++;
      } else if (!inString && (char === "}" || char === "]")) {
        depth--;
      } else if (char === "," && depth === 0 && !inString) {
        result.push(current);
        current = "";
        continue;
      }
      current += char;
    }
    if (current)
      result.push(current);
    return result;
  }
}

// src/utils/value-parser.ts
class ValueParser {
  variableResolver;
  expressionEvaluator;
  jsonParser;
  constructor(envConfig = {}) {
    this.variableResolver = new VariableResolver(envConfig);
    this.expressionEvaluator = new ExpressionEvaluator;
    this.jsonParser = new JsonParser;
  }
  extractValue(text, regex) {
    const match = text.match(regex);
    return match ? match[1] : "";
  }
  parseKeyValue(text) {
    const match = text.match(/^(.+?)\s*=\s*(.+)$/);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
    return [text, ""];
  }
  extractJsonBody(text) {
    return this.jsonParser.extractJsonBody(text);
  }
  convertDataTable(table) {
    if (table.rows.length === 0)
      return {};
    const result = {};
    for (const row of table.rows) {
      for (let i = 0;i < table.headers.length; i++) {
        result[table.headers[i]] = row[i];
      }
    }
    return result;
  }
  buildUrl(baseUrl, path5, queryParams) {
    let url = baseUrl + path5;
    const params = new URLSearchParams(queryParams);
    if (params.toString()) {
      url += "?" + params.toString();
    }
    return url;
  }
  resolveVariables(value, context) {
    return this.variableResolver.resolve(value, context);
  }
  parseValue(value, context) {
    if (value.startsWith("#") || value.startsWith("$")) {
      const varName = value.replace(/^[#\$]/, "").replace(/[()]/g, "").trim();
      if (context.variables[varName] !== undefined)
        return context.variables[varName];
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value) && context.variables[value] !== undefined) {
      return context.variables[value];
    }
    return this.expressionEvaluator.evaluate(value, context);
  }
  stripQuotes(value) {
    if (value.startsWith("'") && value.endsWith("'") || value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }
  parseGherkinJson(jsonStr) {
    return this.jsonParser.parseGherkinJson(jsonStr);
  }
  getNestedValue(obj, path5) {
    if (!obj)
      return;
    const parts = path5.replace(/\[(\w+)\]/g, ".$1").split(".").filter((p) => p !== "");
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null)
        return;
      current = current[part];
    }
    return current;
  }
}
var init_value_parser = __esm(() => {
  init_variable_resolver();
});

// src/engine/screenshot-manager.ts
import { mkdir } from "fs/promises";
import { join as join9 } from "path";
import * as path5 from "path";

class ScreenshotManager {
  reportDir;
  constructor(reportDir = "./reports") {
    this.reportDir = reportDir;
  }
  async capture(name, context, pw) {
    if (!pw)
      return;
    const page = pw.getPage();
    if (!page)
      return;
    const screenshotsDir = join9(this.reportDir, "screenshots");
    await mkdir(screenshotsDir, { recursive: true });
    const fileName = `${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}.png`;
    const filePath = join9(screenshotsDir, fileName);
    await pw.screenshot({ path: filePath });
    return path5.resolve(filePath);
  }
}
var init_screenshot_manager = () => {};

// src/utils/csv-parser.ts
var exports_csv_parser = {};
__export(exports_csv_parser, {
  CsvParser: () => CsvParser
});

class CsvParser {
  parseCsvContent(content) {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ";" : ",";
    const headers = this.parseCsvLine(lines[0], delimiter);
    const rows = [];
    for (let i = 1;i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        rows.push(this.parseCsvLine(line, delimiter));
      }
    }
    return { headers, rows };
  }
  parseCsvLine(line, delimiter) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0;i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
}

// src/engine/step-executor.ts
import { readFile as readFile3 } from "fs/promises";

class StepExecutor {
  options;
  handlers;
  httpClient;
  validator;
  stepRegistry;
  envConfig;
  playwright = null;
  authManager;
  featureCaller = null;
  db;
  mockServers = [];
  logger;
  valueParser;
  screenshotManager;
  constructor(options) {
    this.options = options;
    this.logger = options.logger || console;
    this.httpClient = new HttpClient({ timeout: options.timeout, verbose: options.verbose, logger: this.logger });
    this.validator = new ResponseValidator;
    this.stepRegistry = new StepRegistry(options.stepsPath);
    this.envConfig = options.envConfig || {};
    this.authManager = new AuthManager;
    this.featureCaller = new FeatureCaller;
    this.featureCaller.setStepExecutor(this);
    this.db = new DbManager;
    this.valueParser = new ValueParser(this.envConfig);
    this.screenshotManager = new ScreenshotManager(options.reportDir || "./reports");
    this.handlers = [
      new DbHandler,
      new CoreHandler,
      new HttpHandler,
      new AssertionHandler,
      new UiHandler,
      new AuthHandler,
      new DataHandler
    ];
  }
  getLogger() {
    return this.logger;
  }
  getHttpClient() {
    return this.httpClient;
  }
  getValidator() {
    return this.validator;
  }
  getAuthManager() {
    return this.authManager;
  }
  getFeatureCaller() {
    return this.featureCaller;
  }
  getDbManager() {
    return this.db;
  }
  getOptions() {
    return this.options;
  }
  getEnvConfig() {
    return this.envConfig;
  }
  getPlaywright(context) {
    return context?.variables["__playwright"] || this.playwright;
  }
  setPlaywright(pw) {
    this.playwright = pw;
  }
  addMockServer(server) {
    this.mockServers.push(server);
  }
  async executeStep(step, context) {
    const text = resolveEnvVariables(step.text, this.envConfig);
    const handler = this.handlers.find((h) => h.canHandle(text));
    if (handler)
      return await handler.handle(text, step, context, this);
    const custom = this.stepRegistry.findHandler(step.keyword, text);
    if (custom)
      return await custom.handler(step, context, custom.params);
    throw new Error(`Unknown step: ${step.keyword} ${step.text}`, { cause: { step, isUndefinedStep: true } });
  }
  resolveVariables(value, context) {
    return this.valueParser.resolveVariables(value, context);
  }
  parseValue(value, context) {
    return this.valueParser.parseValue(value, context);
  }
  getNestedValue(obj, path6) {
    return this.valueParser.getNestedValue(obj, path6);
  }
  stripQuotes(value) {
    return this.valueParser.stripQuotes(value);
  }
  parseKeyValue(text) {
    return this.valueParser.parseKeyValue(text);
  }
  extractJsonBody(text) {
    return this.valueParser.extractJsonBody(text);
  }
  convertDataTable(table) {
    return this.valueParser.convertDataTable(table);
  }
  buildUrl(baseUrl, path6, queryParams) {
    return this.valueParser.buildUrl(baseUrl, path6, queryParams);
  }
  extractValue(text, regex) {
    return this.valueParser.extractValue(text, regex);
  }
  parseGherkinJson(jsonStr) {
    return this.valueParser.parseGherkinJson(jsonStr);
  }
  async takeScreenshot(name, context) {
    return this.screenshotManager.capture(name, context, this.getPlaywright(context));
  }
  async loadCsvFile(csvPath, varName, context) {
    const resolved = resolveEnvVariables(csvPath, this.envConfig);
    try {
      const { CsvParser: CsvParser2 } = await Promise.resolve().then(() => exports_csv_parser);
      const table = new CsvParser2().parseCsvContent(await readFile3(resolved, "utf-8"));
      context.variables[varName] = table.rows.map((row) => Object.fromEntries(table.headers.map((h, i) => [h, row[i]])));
      this.logger.log(`\uD83D\uDCC4 Loaded ${context.variables[varName].length} rows from CSV '${csvPath}'`);
    } catch (e) {
      throw new Error(`Failed to load CSV '${csvPath}': ${e instanceof Error ? e.message : e}`);
    }
  }
  async handleCallFeature(path6, context, args = {}, backgroundOnly = false) {
    if (!this.featureCaller)
      throw new Error("FeatureCaller not initialized");
    const result = await this.featureCaller.call(path6, { args: this.resolveVariables(args, context), backgroundOnly });
    if (!result.success)
      throw new Error(`Failed to call feature '${path6}': ${result.error}`);
    context.variables = { ...context.variables, ...result.variables };
    this.logger.log(`\uD83D\uDD17 Called feature: ${path6} (${result.duration}ms)`);
  }
  async cleanup() {
    await Promise.all(this.mockServers.map((s) => s.stop?.()));
    if (this.playwright)
      await this.playwright.close();
    this.db?.close();
    this.mockServers = [];
    this.playwright = null;
  }
}
var init_step_executor = __esm(() => {
  init_http_client();
  init_response_validator();
  init_step_registry();
  init_env_loader();
  init_auth_manager();
  init_feature_caller();
  init_db_manager();
  init_http_handler();
  init_ui_handler();
  init_core_handler();
  init_value_parser();
  init_screenshot_manager();
});

// src/engine/test-result-collector.ts
class TestResultCollector {
  results = [];
  add(result) {
    this.results.push(result);
  }
  getResults() {
    return this.results;
  }
  getPassed() {
    return this.results.filter((r) => r.status === "passed");
  }
  getFailed() {
    return this.results.filter((r) => r.status === "failed");
  }
  getSkipped() {
    return this.results.filter((r) => r.status === "skipped");
  }
  getTotalDuration() {
    return this.results.reduce((sum, r) => sum + r.duration, 0);
  }
  getSummary() {
    return {
      total: this.results.length,
      passed: this.getPassed().length,
      failed: this.getFailed().length,
      skipped: this.getSkipped().length,
      duration: this.getTotalDuration()
    };
  }
  getFailedTests() {
    return this.getFailed().map((r) => ({
      feature: r.featureName,
      scenario: r.scenarioName,
      step: r.steps.find((s) => s.status === "failed"),
      error: r.error
    }));
  }
  clear() {
    this.results = [];
  }
  toJSON() {
    return JSON.stringify({
      summary: this.getSummary(),
      results: this.results
    }, null, 2);
  }
  toJUnitXML() {
    const failures = this.getFailed();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
    xml += '<testsuite name="hop" tests="' + this.results.length + '" failures="' + failures.length + '" time="' + this.getTotalDuration() / 1000 + `">
`;
    for (const result of this.results) {
      xml += '  <testcase name="' + this.escapeXml(result.scenarioName) + '" classname="' + this.escapeXml(result.featureName) + '" time="' + result.duration / 1000 + `">
`;
      if (result.status === "failed") {
        xml += '    <failure message="' + this.escapeXml(result.error || "Test failed") + `">
`;
        xml += this.escapeXml(result.error || "") + `
`;
        xml += `    </failure>
`;
      }
      xml += `  </testcase>
`;
    }
    xml += "</testsuite>";
    return xml;
  }
  escapeXml(str) {
    return str.replace(/&/g, "&amp").replace(/</g, "&lt").replace(/>/g, "&gt").replace(/"/g, "&quot").replace(/'/g, "&apos");
  }
}

// src/reporter/json-reporter.ts
var exports_json_reporter = {};
__export(exports_json_reporter, {
  JsonReporter: () => JsonReporter
});
import { writeFile } from "fs/promises";
import { join as join10 } from "path";

class JsonReporter {
  outputPath;
  constructor(outputPath = "./reports") {
    this.outputPath = outputPath;
  }
  async generate(results) {
    const report = this.buildReport(results);
    const json = JSON.stringify(report, null, 2);
    const filename = `json-report-${Date.now()}.json`;
    const filepath = join10(this.outputPath, filename);
    await writeFile(filepath, json, "utf-8");
    return filepath;
  }
  buildReport(results) {
    const summary = this.buildSummary(results);
    const features = this.groupByFeature(results);
    return {
      framework: "Hop BDD",
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      summary,
      features,
      results: results.map((r) => this.transformResult(r))
    };
  }
  buildSummary(results) {
    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    return {
      total: results.length,
      passed,
      failed,
      skipped,
      duration: totalDuration,
      passRate: results.length > 0 ? (passed / results.length * 100).toFixed(2) + "%" : "0%"
    };
  }
  groupByFeature(results) {
    const grouped = {};
    for (const result of results) {
      if (!grouped[result.featureName]) {
        grouped[result.featureName] = [];
      }
      grouped[result.featureName].push(result);
    }
    const featureSummary = {};
    for (const [name, featureResults] of Object.entries(grouped)) {
      const passed = featureResults.filter((r) => r.status === "passed").length;
      const failed = featureResults.filter((r) => r.status === "failed").length;
      featureSummary[name] = {
        scenarios: featureResults.length,
        passed,
        failed,
        results: featureResults.map((r) => ({
          name: r.scenarioName,
          status: r.status,
          duration: r.duration,
          error: r.error
        }))
      };
    }
    return featureSummary;
  }
  transformResult(result) {
    return {
      feature: result.featureName,
      scenario: result.scenarioName,
      status: result.status,
      duration: result.duration,
      tags: result.tags,
      error: result.error,
      steps: result.steps.map((s) => ({
        keyword: s.step.keyword,
        text: s.step.text,
        status: s.status,
        duration: s.duration,
        error: s.error
      }))
    };
  }
}
var init_json_reporter = () => {};

// src/reporter/junit-reporter.ts
var exports_junit_reporter = {};
__export(exports_junit_reporter, {
  JunitReporter: () => JunitReporter
});
import { writeFile as writeFile2 } from "fs/promises";
import { join as join11 } from "path";

class JunitReporter {
  outputPath;
  constructor(outputPath = "./reports") {
    this.outputPath = outputPath;
  }
  async generate(results) {
    const xml = this.buildXml(results);
    const filename = `junit-report-${Date.now()}.xml`;
    const filepath = join11(this.outputPath, filename);
    await writeFile2(filepath, xml, "utf-8");
    return filepath;
  }
  buildXml(results) {
    const timestamp = new Date().toISOString();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Hop BDD Tests" tests="${results.length}" failures="${this.getFailureCount(results)}" skipped="0" time="${this.getTotalTime(results)}" timestamp="${timestamp}">
`;
    for (const result of results) {
      xml += this.buildTestSuite(result);
    }
    xml += `</testsuites>`;
    return xml;
  }
  buildTestSuite(result) {
    const className = this.escapeXml(result.featureName);
    const testName = this.escapeXml(result.scenarioName);
    const time = (result.duration / 1000).toFixed(3);
    const ts = new Date().toISOString();
    let suite = `  <testsuite name="${className}" tests="1" failures="${result.status === "failed" ? 1 : 0}" skipped="0" time="${time}" timestamp="${ts}">
`;
    suite += `    <testcase name="${testName}" classname="${className}" time="${time}">
`;
    if (result.status === "failed" && result.error) {
      suite += `      <failure message="${this.escapeXml(result.error)}" type="AssertionError">
`;
      suite += `        <![CDATA[${result.error}]]>
`;
      suite += `      </failure>
`;
    }
    if (result.steps.length > 0) {
      const stepsXml = result.steps.map((s) => `${s.step.keyword} ${s.step.text} (${s.status})`).join(`
`);
      suite += `      <system-out><![CDATA[${stepsXml}]]></system-out>
`;
    }
    suite += `    </testcase>
`;
    suite += `  </testsuite>
`;
    return suite;
  }
  getFailureCount(results) {
    return results.filter((r) => r.status === "failed").length;
  }
  getTotalTime(results) {
    const totalMs = results.reduce((sum, r) => sum + r.duration, 0);
    return +(totalMs / 1000).toFixed(3);
  }
  escapeXml(str) {
    return str.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, '"');
  }
}
var init_junit_reporter = () => {};

// src/reporter/allure-reporter.ts
var exports_allure_reporter = {};
__export(exports_allure_reporter, {
  AllureReporter: () => AllureReporter
});
import { writeFile as writeFile3, mkdir as mkdir2, copyFile, rm } from "fs/promises";
import { join as join12, basename as basename2 } from "path";

class AllureReporter {
  outputPath;
  constructor(outputPath = "./reports/allure-results") {
    this.outputPath = outputPath;
  }
  async generate(results) {
    try {
      await rm(this.outputPath, { recursive: true, force: true });
    } catch (e) {}
    await mkdir2(this.outputPath, { recursive: true });
    let idx = 0;
    for (const result of results) {
      const allureResult = await this.convertToAllure(result, idx++);
      const filename = `${allureResult.uuid}-result.json`;
      const filepath = join12(this.outputPath, filename);
      await writeFile3(filepath, JSON.stringify(allureResult, null, 2), "utf-8");
    }
    return this.outputPath;
  }
  async convertToAllure(result, index) {
    const uuid = `hop-${Date.now()}-${index}`;
    const stop = Date.now();
    const start = stop - result.duration;
    const attachments = [];
    if (result.screenshotPath) {
      try {
        const screenshotName = basename2(result.screenshotPath);
        const attachmentName = `${uuid}-attachment-${screenshotName}`;
        const destPath = join12(this.outputPath, attachmentName);
        await copyFile(result.screenshotPath, destPath);
        attachments.push({
          name: "Screenshot",
          type: "image/png",
          source: attachmentName
        });
      } catch (e) {
        console.warn(`\u26A0\uFE0F Failed to attach screenshot: ${result.screenshotPath}`, e);
      }
    }
    return {
      uuid,
      historyId: this.generateHistoryId(result),
      fullName: `${result.featureName}: ${result.scenarioName}`,
      name: result.scenarioName,
      description: result.featureName,
      status: this.mapStatus(result.status),
      statusDetails: result.error ? {
        message: result.error,
        trace: result.error
      } : undefined,
      stage: "finished",
      start,
      stop,
      labels: [
        { name: "feature", value: result.featureName },
        { name: "suite", value: result.featureName },
        { name: "host", value: process.env.HOSTNAME || "localhost" },
        { name: "thread", value: process.pid.toString() },
        ...result.tags.map((tag) => ({ name: "tag", value: tag }))
      ],
      parameters: [],
      steps: result.steps.map((s) => this.convertStep(s, start)),
      attachments
    };
  }
  convertStep(step, scenarioStart) {
    const start = scenarioStart;
    const stop = start + step.duration;
    return {
      name: `${step.step.keyword} ${step.step.text}`,
      status: this.mapStatus(step.status),
      start,
      stop,
      steps: [],
      attachments: [],
      parameters: []
    };
  }
  generateHistoryId(result) {
    return `${result.featureName}:${result.scenarioName}`.replace(/\s+/g, "-").toLowerCase();
  }
  mapStatus(status) {
    switch (status) {
      case "passed":
        return "passed";
      case "failed":
        return "failed";
      case "skipped":
        return "skipped";
      default:
        return "broken";
    }
  }
}
var init_allure_reporter = () => {};

// src/reporter/hop-reporter-v2.ts
var exports_hop_reporter_v2 = {};
__export(exports_hop_reporter_v2, {
  HopReporterV2: () => HopReporterV2
});
import { writeFile as writeFile4, mkdir as mkdir3, copyFile as copyFile2 } from "fs/promises";
import { join as join13, basename as basename3 } from "path";

class HopReporterV2 {
  outputDir;
  constructor(outputDir = "./reports") {
    this.outputDir = outputDir;
  }
  async generate(results, collector) {
    const reportPath = this.outputDir;
    await mkdir3(reportPath, { recursive: true });
    const summary = this.calculateSummary(results);
    const mediaResults = await this.bundleMedia(results, reportPath);
    const html = this.generateHtml(mediaResults, summary);
    const finalPath = join13(reportPath, "index.html");
    await writeFile4(finalPath, html, "utf-8");
    return finalPath;
  }
  calculateSummary(results) {
    const total = results.length;
    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const duration = results.reduce((acc, r) => acc + r.duration, 0);
    return { total, passed, failed, skipped, duration };
  }
  async bundleMedia(results, reportDir) {
    const assetsDir = join13(reportDir, "assets");
    await mkdir3(assetsDir, { recursive: true });
    const bundledResults = [];
    for (const result of results) {
      const newResult = { ...result, steps: [...result.steps] };
      if (result.screenshotPath) {
        try {
          const name = basename3(result.screenshotPath);
          const dest = join13(assetsDir, name);
          await copyFile2(result.screenshotPath, dest);
          newResult.screenshotPath = `assets/${name}`;
        } catch (e) {
          console.warn(`Failed to copy screenshot: ${result.screenshotPath}`, e);
          newResult.screenshotPath = undefined;
        }
      }
      if (result.videoPath) {
        try {
          const name = basename3(result.videoPath);
          const dest = join13(assetsDir, name);
          await copyFile2(result.videoPath, dest);
          newResult.videoPath = `assets/${name}`;
        } catch (e) {
          console.warn(`Failed to copy video: ${result.videoPath}`, e);
          newResult.videoPath = undefined;
        }
      }
      for (let i = 0;i < newResult.steps.length; i++) {
        const step = { ...newResult.steps[i] };
        if (step.screenshotPath) {
          try {
            const name = basename3(step.screenshotPath);
            const dest = join13(assetsDir, name);
            await copyFile2(step.screenshotPath, dest);
            step.screenshotPath = `assets/${name}`;
          } catch (e) {
            step.screenshotPath = undefined;
          }
        }
        newResult.steps[i] = step;
      }
      bundledResults.push(newResult);
    }
    return bundledResults;
  }
  generateHtml(results, summary) {
    const data = JSON.stringify(results);
    const summaryData = JSON.stringify(summary);
    return `
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hop Framework - Premium Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        :root {
            --bg: #0a0a0c;
            --surface: #141418;
            --surface-accent: #1c1c21;
            --primary: #6366f1;
            --passed: #10b981;
            --failed: #ef4444;
            --skipped: #f59e0b;
            --text-main: #f8fafc;
            --text-dim: #94a3b8;
            --border: rgba(255, 255, 255, 0.08);
            --shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            --modal-bg: rgba(0, 0, 0, 0.85);
        }

        [data-theme="light"] {
            --bg: #f8fafc;
            --surface: #ffffff;
            --surface-accent: #f1f5f9;
            --primary: #4f46e5;
            --passed: #059669;
            --failed: #dc2626;
            --skipped: #d97706;
            --text-main: #0f172a;
            --text-dim: #64748b;
            --border: rgba(0, 0, 0, 0.08);
            --shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            --modal-bg: rgba(255, 255, 255, 0.85);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: var(--bg);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            line-height: 1.5;
            overflow: hidden;
            transition: background 0.3s, color 0.3s;
        }

        .app {
            display: grid;
            grid-template-columns: 340px 1fr;
            height: 100vh;
        }

        /* Sidebar Styling */
        .sidebar {
            background: var(--surface);
            border-right: 1px solid var(--border);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow-y: auto;
        }

        .sidebar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo span {
            background: var(--primary);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
        }

        .theme-toggle {
            background: var(--surface-accent);
            border: 1px solid var(--border);
            color: var(--text-main);
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.2s;
        }
        .theme-toggle:hover { background: var(--border); }

        .summary-card {
            background: var(--surface-accent);
            border-radius: 16px;
            padding: 20px;
            border: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: var(--shadow);
        }

        .chart-container {
            display: flex;
            justify-content: center;
            position: relative;
            cursor: pointer;
        }

        .chart-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            pointer-events: none;
        }

        .chart-label .total { font-size: 24px; font-weight: 700; display: block; }
        .chart-label .sub { font-size: 10px; color: var(--text-dim); text-transform: uppercase; }

        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .stat-item {
            padding: 12px;
            border-radius: 8px;
            background: rgba(var(--primary), 0.05);
            border: 1px solid transparent;
            cursor: pointer;
            transition: 0.2s;
        }
        .stat-item:hover { border-color: var(--primary); background: rgba(var(--primary), 0.1); }

        .stat-item label { font-size: 11px; color: var(--text-dim); display: block; margin-bottom: 2px; }
        .stat-item value { font-weight: 600; font-size: 16px; }
        .stat-item.passed value { color: var(--passed); }
        .stat-item.failed value { color: var(--failed); }

        .history-section {
            padding-top: 10px;
            border-top: 1px solid var(--border);
        }
        .section-title { font-size: 11px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; }

        .nav-links { list-style: none; display: flex; flex-direction: column; gap: 4px; }
        .nav-item {
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-dim);
            font-weight: 500;
        }
        .nav-item:hover { background: var(--surface-accent); color: var(--text-main); }
        .nav-item.active { background: var(--primary); color: white; }

        /* Main Content Styling */
        .main {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--bg);
        }

        .header {
            padding: 20px 40px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--surface);
            z-index: 10;
        }

        .search-box { position: relative; width: 400px; }
        .search-box input {
            width: 100%;
            background: var(--surface-accent);
            border: 1px solid var(--border);
            padding: 10px 16px;
            border-radius: 12px;
            color: var(--text-main);
            outline: none;
            transition: border-color 0.2s;
        }
        .search-box input:focus { border-color: var(--primary); }

        .content-area {
            flex: 1;
            padding: 40px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        .feature-group { display: flex; flex-direction: column; gap: 16px; }
        .feature-title {
            font-weight: 700;
            color: var(--text-main);
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .feature-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        .test-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
            cursor: pointer;
        }
        .test-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); border-color: var(--primary); }

        .test-header {
            padding: 16px 24px;
            display: grid;
            grid-template-columns: 24px 1fr 150px 80px;
            align-items: center;
            gap: 16px;
        }

        .status-dot { width: 12px; height: 12px; border-radius: 50%; }
        .status-dot.passed { background: var(--passed); box-shadow: 0 0 10px rgba(16, 185, 129, 0.3); }
        .status-dot.failed { background: var(--failed); box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }

        .test-name { font-weight: 600; color: var(--text-main); }
        .test-meta { color: var(--text-dim); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .test-details {
            padding: 0 24px 24px 64px;
            display: none;
            border-top: 1px solid var(--border);
            padding-top: 24px;
            background: rgba(0,0,0,0.02);
        }
        .test-card.expanded .test-details { display: block; }

        .step { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .step-keyword { color: var(--primary); font-weight: 700; width: 60px; flex-shrink: 0; text-align: right; }
        .step-text { flex: 1; font-weight: 400; }
        .step-dur { color: var(--text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }

        .media-viewer { margin-top: 24px; display: flex; gap: 16px; flex-wrap: wrap; }
        .thumbnail {
            width: 250px;
            background: var(--bg);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border);
            position: relative;
            cursor: zoom-in;
            transition: 0.2s;
        }
        .thumbnail:hover { transform: scale(1.02); border-color: var(--primary); }
        .thumbnail img, .thumbnail video { width: 100%; height: 140px; object-fit: cover; display: block; }
        .thumbnail label {
            position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7);
            color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
        }

        .error-pre {
            background: #1e1e1e;
            color: #ff8b8b;
            padding: 16px;
            border-radius: 10px;
            margin-top: 20px;
            font-family: 'JetBrains Mono', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.6;
            white-space: pre-wrap;
            border-left: 4px solid var(--failed);
            overflow-x: auto;
        }

        /* Premium Lightbox Modal */
        #lightbox {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: var(--modal-bg);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(12px);
            animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-content-wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            max-width: 90vw;
            max-height: 90vh;
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp { from { transform: translateY(20px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

        .modal-media {
            display: block;
            max-width: 100%;
            max-height: calc(90vh - 60px);
            object-fit: contain;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            background: #000;
        }

        .modal-label {
            margin-top: 16px;
            background: var(--primary);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
        }

        .close-btn {
            position: absolute;
            top: -50px;
            right: 0;
            background: none;
            border: none;
            color: var(--text-main);
            font-size: 32px;
            cursor: pointer;
            padding: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

    </style>
</head>
<body>
    <div class="app">
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">HOP <span>2.0</span></div>
                <button class="theme-toggle" onclick="toggleTheme()" title="Toggle Light/Dark Mode">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sun-icon" style="display:none;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="moon-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </button>
            </div>
            
            <div class="summary-card">
                <div class="chart-container" onclick="filterResults('all')">
                    <canvas id="summaryDonut" width="160" height="160"></canvas>
                    <div class="chart-label">
                        <span class="total" id="totalCount">0</span>
                        <span class="sub">Tests</span>
                    </div>
                </div>
                <div class="stats-grid">
                    <div class="stat-item passed" onclick="filterResults('passed')">
                        <label>Passed</label>
                        <value id="passedCount">0</value>
                    </div>
                    <div class="stat-item failed" onclick="filterResults('failed')">
                        <label>Failed</label>
                        <value id="failedCount">0</value>
                    </div>
                    <div class="stat-item" onclick="filterResults('all')">
                        <label>Average</label>
                        <value id="avgTime">0ms</value>
                    </div>
                    <div class="stat-item" onclick="filterResults('all')">
                        <label>Efficiency</label>
                        <value id="successRate">0%</value>
                    </div>
                </div>
            </div>


            <nav class="nav-links">
                <div class="section-title">Views</div>
                <li class="nav-item active" onclick="filterResults('all')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-7M9 21v-3M14 21v-5M19 21v-10M2 10h20"></path></svg>
                    All Executions
                </li>
                <li class="nav-item" onclick="filterResults('failed')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Failed Only
                </li>
                <li class="nav-item" onclick="filterResults('passed')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Passed Only
                </li>
            </nav>
        </aside>

        <main class="main">
            <header class="header">
                <div class="search-box">
                    <input type="text" placeholder="Search scenarios, features, tags..." oninput="searchTests(this.value)">
                </div>
                <div class="test-meta">
                    Generated <span id="genTime"></span>
                </div>
            </header>

            <div class="content-area" id="resultsArea">
                <!-- Dynamic Content -->
            </div>
        </main>
    </div>

    <div id="lightbox" onclick="closeLightbox()">
        <div class="modal-content-wrapper" onclick="event.stopPropagation()">
            <button class="close-btn" onclick="closeLightbox()">&times;</button>
            <div id="lightbox-content"></div>
            <div id="lightbox-label" class="modal-label"></div>
        </div>
    </div>

    <script id="summaryData" type="application/json">${summaryData}</script>

    <script>
        const summary = JSON.parse(document.getElementById('summaryData').textContent);
        
        // Initialize Theme
        const currentTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcons(currentTheme);

        function toggleTheme() {
            const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateThemeIcons(theme);
            // Refresh charts for theme colors
            initCharts();
        }

        function updateThemeIcons(theme) {
            document.querySelector('.sun-icon').style.display = theme === 'dark' ? 'block' : 'none';
            document.querySelector('.moon-icon').style.display = theme === 'light' ? 'block' : 'none';
        }

        // Dashboard Data
        document.getElementById('totalCount').innerText = summary.total;
        document.getElementById('passedCount').innerText = summary.passed;
        document.getElementById('failedCount').innerText = summary.failed;
        document.getElementById('avgTime').innerText = Math.round(summary.duration / (summary.total || 1)) + 'ms';
        document.getElementById('successRate').innerText = Math.round((summary.passed / (summary.total || 1)) * 100) + '%';
        document.getElementById('genTime').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let summaryChart, historyChart;

        function initCharts() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            const textColor = isDark ? '#94a3b8' : '#64748b';

            if (summaryChart) summaryChart.destroy();

            // Donut Chart
            summaryChart = new Chart(document.getElementById('summaryDonut'), {
                type: 'doughnut',
                data: {
                    labels: ['Passed', 'Failed', 'Skipped'],
                    datasets: [{
                        data: [summary.passed, summary.failed, summary.skipped],
                        backgroundColor: [
                            isDark ? '#10b981' : '#059669',
                            isDark ? '#ef4444' : '#dc2626',
                            isDark ? '#f59e0b' : '#d97706'
                        ],
                        borderWidth: 0,
                        cutout: '80%'
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    animation: { animateRotate: true, duration: 1000 }
                }
            });

        }

        function renderResults(filtered) {
            const area = document.getElementById('resultsArea');
            area.innerHTML = '';
            
            if (filtered.length === 0) {
                area.innerHTML = '<div style="text-align:center; padding: 100px; color: var(--text-dim);">No matching results found</div>';
                return;
            }

            const groups = filtered.reduce((acc, r) => {
                if (!acc[r.featureName]) acc[r.featureName] = [];
                acc[r.featureName].push(r);
                return acc;
            }, {});

            Object.entries(groups).forEach(([feature, tests]) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'feature-group';
                groupDiv.innerHTML = \`<div class="feature-title">\${feature}</div>\`;
                
                tests.forEach(test => {
                    const card = document.createElement('div');
                    card.id = 'test-' + test.scenarioName.replace(/\\s+/g, '-');
                    card.className = \`test-card \${test.status}\`;
                    card.innerHTML = \`
                        <div class="test-header" onclick="toggleCard(this.parentElement)">
                            <div class="status-dot \${test.status}"></div>
                            <div class="test-name">\${test.scenarioName}</div>
                            <div class="test-meta">\${test.tags.map(t => '#' + t).join(' ')}</div>
                            <div class="test-meta">\${test.duration}ms</div>
                        </div>
                        <div class="test-details">
                            <div class="steps-area">
                                \${test.steps.map(s => \`
                                    <div class="step">
                                        <div class="step-keyword">\${s.step.keyword}</div>
                                        <div class="step-text">\${s.step.text}</div>
                                        <div class="step-dur">\${s.duration}ms</div>
                                    </div>
                                \`).join('')}
                            </div>
                            \${test.error ? \`<pre class="error-pre">\${test.error}</pre>\` : ''}
                            <div class="media-viewer">
                                \${test.screenshotPath ? \`
                                    <div class="thumbnail" onclick="openLightbox('\${test.screenshotPath}', 'Scenario Failure Screenshot')">
                                        <img src="\${test.screenshotPath}">
                                        <label>Screenshot</label>
                                    </div>
                                \` : ''}
                                \${test.videoPath ? \`
                                    <div class="thumbnail" onclick="openLightbox('\${test.videoPath}', 'Execution Video', true)">
                                        <video src="\${test.videoPath}" preload="metadata"></video>
                                        <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none;">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5))"><path d="M8 5v14l11-7z"/></svg>
                                        </div>
                                        <label>Execution Video</label>
                                    </div>
                                \` : ''}
                            </div>
                        </div>
                    \`;
                    groupDiv.appendChild(card);
                });
                area.appendChild(groupDiv);
            });
        }

        function toggleCard(card) {
            const isExpanded = card.classList.contains('expanded');
            // Close others if you want, or just toggle
            card.classList.toggle('expanded');
        }

        function filterResults(type) {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            // Find the item matching the type if possible, or use current target
            if (event && event.currentTarget && event.currentTarget.classList.contains('nav-item')) {
              event.currentTarget.classList.add('active');
            }
            
            if (type === 'all') renderResults(results);
            else renderResults(results.filter(r => r.status === type));
        }

        function searchTests(query) {
            const q = query.toLowerCase();
            const filtered = results.filter(r => 
                r.scenarioName.toLowerCase().includes(q) || 
                r.featureName.toLowerCase().includes(q) ||
                r.tags.some(t => t.toLowerCase().includes(q))
            );
            renderResults(filtered);
        }

        function openLightbox(src, label, isVideo = false) {
            const lb = document.getElementById('lightbox');
            const content = document.getElementById('lightbox-content');
            document.getElementById('lightbox-label').innerText = label;
            
            if (isVideo) {
                content.innerHTML = '<video src="' + src + '" class="modal-media" controls autoplay></video>';
            } else {
                content.innerHTML = '<img src="' + src + '" class="modal-media">';
            }
            
            lb.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            const lb = document.getElementById('lightbox');
            const content = document.getElementById('lightbox-content');
            lb.style.display = 'none';
            content.innerHTML = ''; // Stop video playback
            document.body.style.overflow = '';
        }

        // Global Key Listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });

        initCharts();
        renderResults(results);
    </script>
</body>
</html>
`;
  }
}
var init_hop_reporter_v2 = () => {};

// src/reporter/formatters/newman-report-builder.ts
class NewmanReportBuilder {
  static buildHtmlReport(results, timestamp) {
    const totalIterations = results.length;
    const totalAssertions = results.reduce((acc, r) => acc + r.steps.length, 0);
    const failedTests = results.filter((r) => r.status === "failed").length;
    const skippedTests = results.filter((r) => r.status === "skipped").length;
    const totalPassed = results.filter((r) => r.status === "passed").length;
    const duration = results.reduce((acc, r) => acc + r.duration, 0);
    const resultsJson = JSON.stringify(results);
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hop - Newman Run Dashboard</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.10.19/css/dataTables.bootstrap4.min.css">
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
        }
        .container { max-width: 1200px; }
        .dashboard-header {
            background: #fff;
            padding: 20px 0;
            margin-bottom: 30px;
            border-bottom: 1px solid #dee2e6;
        }
        .dashboard-title {
            color: #333;
            font-weight: 700;
            font-size: 48px;
            margin-bottom: 5px;
        }
        .dashboard-timestamp {
            color: #666;
            font-size: 16px;
        }
        .metric-card {
            border-radius: 4px;
            padding: 20px;
            color: #fff;
            text-align: left;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-card h6 {
            text-transform: uppercase;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 5px;
            opacity: 0.8;
        }
        .metric-value {
            font-size: 48px;
            font-weight: 400;
            line-height: 1;
        }
        .bg-teal { background-color: #008c99; }
        .bg-green { background-color: #28a745; }
        .bg-red { background-color: #dc3545; }
        .bg-orange { background-color: #ffc107; color: #333 !important; }
        
        .nav-pills .nav-link {
            border-radius: 0;
            color: #fff;
            background: #999;
            padding: 10px 20px;
            font-weight: 600;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .nav-pills .nav-link.active {
            background-color: #fff !important;
            color: #333 !important;
        }

        /* Color-coded tabs when active */
        .nav-pills .nav-link#pills-summary-tab.active { border-top: 3px solid #008c99; }
        .nav-pills .nav-link#pills-requests-tab.active { border-top: 3px solid #008c99; }
        .nav-pills .nav-link#pills-failed-tab.active { border-top: 3px solid #dc3545; }
        .nav-pills .nav-link#pills-skipped-tab.active { border-top: 3px solid #ffc107; }

        /* Color-coded tabs when not active (Newman style) */
        #pills-summary-tab:not(.active) { background-color: #008c99; }
        #pills-requests-tab:not(.active) { background-color: #008c99; }
        #pills-failed-tab:not(.active) { background-color: #dc3545; }
        #pills-skipped-tab:not(.active) { background-color: #ffc107; color: #333 !important; }

        .nav-container {
            background: #333;
            margin-bottom: 30px;
        }
        
        .section-header {
            background-color: #008c99;
            color: white;
            padding: 8px 15px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 0;
        }
        .info-box {
            background: #fff;
            border: 1px solid #008c99;
            margin-bottom: 20px;
            border-radius: 4px;
            overflow: hidden;
        }
        .info-content {
            padding: 15px;
        }
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 5px;
        }
        .info-label { font-weight: 700; }
        
        .card {
            border: 1px solid #dee2e6;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .card-header {
            background: #fff;
            padding: 10px 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .status-badge {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .status-passed { background: #28a745; }
        .status-failed { background: #dc3545; }
        .status-skipped { background: #ffc107; }
        
        .step {
            display: flex;
            padding: 8px 15px;
            border-bottom: 1px solid #f1f1f1;
        }
        .step-keyword {
            width: 80px;
            font-weight: 700;
            color: #008c99;
        }
        .step-text { flex: 1; }
        .step-dur { font-size: 11px; color: #999; }
        
        .error-pre {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            margin: 15px;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
        }
        
        .thumbnail {
            width: 200px;
            margin: 15px;
            cursor: pointer;
            border: 1px solid #dee2e6;
            border-radius: 4px;
        }

        /* Sidebar stats style */
        .summary-table { width: 100%; margin-bottom: 0; }
        .summary-table th { background: #f8f9fa; font-size: 11px; text-transform: uppercase; }
        .summary-table td, .summary-table th { padding: 8px 15px; border: 1px solid #f1f1f1; }
    </style>
</head>
<body>
    <div class="nav-container">
        <div class="container">
            <ul class="nav nav-pills" id="pills-tab" role="tablist">
                <li class="nav-item">
                    <a class="nav-link active" id="pills-summary-tab" data-toggle="pill" href="#pills-summary" role="tab">Summary</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="pills-requests-tab" data-toggle="pill" href="#pills-requests" role="tab">Total Scenarios (${results.length})</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="pills-failed-tab" data-toggle="pill" href="#pills-failed" role="tab">Failed Tests (${failedTests})</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" id="pills-skipped-tab" data-toggle="pill" href="#pills-skipped" role="tab">Skipped Tests (${skippedTests})</a>
                </li>
            </ul>
        </div>
    </div>

    <div class="container">
        <div class="text-center mb-5">
            <h1 class="dashboard-title">Newman Run Dashboard</h1>
            <div class="dashboard-timestamp">${new Date(timestamp).toLocaleString()}</div>
        </div>

        <div class="row">
            <div class="col-md-3">
                <div class="metric-card bg-teal">
                    <h6>Total Iterations</h6>
                    <div class="metric-value">${totalIterations}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-green">
                    <h6>Total Assertions</h6>
                    <div class="metric-value">${totalAssertions}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-red">
                    <h6>Total Failed Tests</h6>
                    <div class="metric-value">${failedTests}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card bg-orange">
                    <h6>Total Skipped Tests</h6>
                    <div class="metric-value">${skippedTests}</div>
                </div>
            </div>
        </div>

        <div class="tab-content" id="pills-tabContent">
            <!-- SUMMARY TAB -->
            <div class="tab-pane fade show active" id="pills-summary" role="tabpanel">
                <div class="info-box">
                    <h5 class="section-header">File Information</h5>
                    <div class="info-content">
                        <div class="info-item"><span class="info-label">Run Date:</span> <span>${new Date(timestamp).toLocaleDateString()}</span></div>
                        <div class="info-item"><span class="info-label">Framework:</span> <span>Hop Framework</span></div>
                    </div>
                </div>

                <div class="info-box">
                    <h5 class="section-header">Timings and Data</h5>
                    <div class="info-content">
                        <div class="info-item"><span class="info-label">Total run duration:</span> <span>${(duration / 1000).toFixed(2)}s</span></div>
                        <div class="info-item"><span class="info-label">Average response time:</span> <span>${Math.round(duration / (results.length || 1))}ms</span></div>
                    </div>
                </div>

                <div class="info-box">
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Summary Item</th>
                                <th>Total</th>
                                <th>Failed</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Scenarios</td><td>${results.length}</td><td>${failedTests}</td></tr>
                            <tr><td>Steps (Assertions)</td><td>${totalAssertions}</td><td>${results.reduce((acc, r) => acc + r.steps.filter((s) => s.status === "failed").length, 0)}</td></tr>
                            <tr><td>Skipped Tests</td><td>${skippedTests}</td><td>-</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TOTAL REQUESTS TAB -->
            <div class="tab-pane fade" id="pills-requests" role="tabpanel">
                <div id="requests-accordion">
                    ${results.map((r, i) => this.renderScenarioCard(r, i)).join("")}
                </div>
            </div>

            <!-- FAILED TESTS TAB -->
            <div class="tab-pane fade" id="pills-failed" role="tabpanel">
                ${failedTests > 0 ? results.filter((r) => r.status === "failed").map((r, i) => this.renderScenarioCard(r, i, "failed")).join("") : '<div class="alert alert-success">There are no failed tests</div>'}
            </div>

            <!-- SKIPPED TESTS TAB -->
            <div class="tab-pane fade" id="pills-skipped" role="tabpanel">
                ${skippedTests > 0 ? results.filter((r) => r.status === "skipped").map((r, i) => this.renderScenarioCard(r, i, "skipped")).join("") : '<div class="alert alert-info">There are no skipped tests</div>'}
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script>
    <script>
        $(document).ready(function() {
            $('.card-header').click(function() {
                $(this).next('.collapse').collapse('toggle');
            });
        });
    </script>
</body>
</html>
`;
  }
  static renderScenarioCard(result, index, filter) {
    const id = `collapse-${filter || "all"}-${index}`;
    return `
        <div class="card">
            <div class="card-header" id="heading-${id}">
                <div class="d-flex align-items-center">
                    <div class="status-badge status-${result.status}"></div>
                    <div class="font-weight-bold">${result.featureName} / ${result.scenarioName}</div>
                </div>
                <div class="text-muted small">${result.duration}ms</div>
            </div>
            <div id="${id}" class="collapse show">
                <div class="card-body p-0">
                    <div class="steps-area">
                        ${result.steps.map((s) => `
                            <div class="step">
                                <div class="step-keyword">${s.step.keyword}</div>
                                <div class="step-text">${s.step.text}</div>
                                <div class="step-dur">${s.duration}ms</div>
                            </div>
                        `).join("")}
                    </div>
                    ${result.error ? `<div class="error-pre">${result.error}</div>` : ""}
                    ${result.screenshotPath ? `<img src="${result.screenshotPath}" class="thumbnail">` : ""}
                </div>
            </div>
        </div>
    `;
  }
}

// src/reporter/newman-reporter.ts
var exports_newman_reporter = {};
__export(exports_newman_reporter, {
  NewmanReporter: () => NewmanReporter
});
import { writeFile as writeFile5, mkdir as mkdir4, copyFile as copyFile3 } from "fs/promises";
import { join as join14, basename as basename4 } from "path";

class NewmanReporter {
  outputDir;
  constructor(outputDir = "./reports") {
    this.outputDir = outputDir;
  }
  async generate(results, collector) {
    const reportPath = this.outputDir;
    await mkdir4(reportPath, { recursive: true });
    const mediaResults = await this.bundleMedia(results, reportPath);
    const timestamp = new Date().toISOString();
    const html = NewmanReportBuilder.buildHtmlReport(mediaResults, timestamp);
    const finalPath = join14(reportPath, "index.html");
    await writeFile5(finalPath, html, "utf-8");
    return finalPath;
  }
  async bundleMedia(results, reportDir) {
    const assetsDir = join14(reportDir, "assets");
    await mkdir4(assetsDir, { recursive: true });
    const bundledResults = [];
    for (const result of results) {
      const newResult = { ...result, steps: [...result.steps] };
      if (result.screenshotPath) {
        try {
          const name = basename4(result.screenshotPath);
          const dest = join14(assetsDir, name);
          await copyFile3(result.screenshotPath, dest);
          newResult.screenshotPath = `assets/${name}`;
        } catch (e) {
          newResult.screenshotPath = undefined;
        }
      }
      if (result.videoPath) {
        try {
          const name = basename4(result.videoPath);
          const dest = join14(assetsDir, name);
          await copyFile3(result.videoPath, dest);
          newResult.videoPath = `assets/${name}`;
        } catch (e) {
          newResult.videoPath = undefined;
        }
      }
      for (let i = 0;i < newResult.steps.length; i++) {
        const step = { ...newResult.steps[i] };
        if (step.screenshotPath) {
          try {
            const name = basename4(step.screenshotPath);
            const dest = join14(assetsDir, name);
            await copyFile3(step.screenshotPath, dest);
            step.screenshotPath = `assets/${name}`;
          } catch (e) {
            step.screenshotPath = undefined;
          }
        }
        newResult.steps[i] = step;
      }
      bundledResults.push(newResult);
    }
    return bundledResults;
  }
}
var init_newman_reporter = () => {};

// src/cli/hop-initializer.ts
var exports_hop_initializer = {};
__export(exports_hop_initializer, {
  HopInitializer: () => HopInitializer
});
import { mkdir as mkdir5, writeFile as writeFile6 } from "fs/promises";

class HopInitializer {
  async init(projectName) {
    console.log(`Initializing Hop project: ${projectName}`);
    const dirs = [
      projectName,
      `${projectName}/features`,
      `${projectName}/steps`,
      `${projectName}/hooks`,
      `${projectName}/config`,
      `${projectName}/reports`
    ];
    for (const dir of dirs) {
      await mkdir5(dir, { recursive: true });
      console.log(`Created: ${dir}/`);
    }
    const packageJson = {
      name: projectName,
      version: "1.0.0",
      type: "module",
      scripts: {
        test: "hop test",
        hop: "hop"
      },
      dependencies: {
        hop: "^1.0.0"
      }
    };
    await writeFile6(`${projectName}/package.json`, JSON.stringify(packageJson, null, 2), "utf-8");
    console.log(`Created: ${projectName}/package.json`);
    const gitignore = `node_modules/
reports/
.env
*.log
`;
    await writeFile6(`${projectName}/.gitignore`, gitignore, "utf-8");
    console.log(`Created: ${projectName}/.gitignore`);
    const envExample = `# Environment variables
BASE_URL=https://api.example.com
API_KEY=your-api-key-here
`;
    await writeFile6(`${projectName}/.env.example`, envExample, "utf-8");
    console.log(`Created: ${projectName}/.env.example`);
    const sampleFeature = `Feature: Sample API Test

  Background:
    Given url '\${BASE_URL}'
    And header Content-Type = 'application/json'

  Scenario: Get User Details
    Given path '/users/1'
    When method GET
    Then status 200
    And match response == { id: '#number', name: '#string', email: '#email' }

  Scenario: Create New User
    Given path '/users'
    And request { name: 'Test User', email: 'test@example.com' }
    When method POST
    Then status 201
    And match response == { id: '#number', name: 'Test User' }
`;
    await writeFile6(`${projectName}/features/sample.feature`, sampleFeature, "utf-8");
    console.log(`Created: ${projectName}/features/sample.feature`);
    const configFile = `// hop.config.ts
export default {
  features: './features',
  steps: './steps',
  reports: './reports',
  format: ['html', 'junit'],
  timeout: 30000,
  retry: 2,
  parallel: 4,
  tags: {
    include: [],
    exclude: ['@manual']
  },
  headers: {
    'User-Agent': 'Hop/1.0'
  }
}
`;
    await writeFile6(`${projectName}/config/hop.config.ts`, configFile, "utf-8");
    console.log(`Created: ${projectName}/config/hop.config.ts`);
    const customSteps = `// steps/custom-steps.ts
// Define custom step definitions here

export default {
  // Example: Custom step
  // 'Given I am logged in as user {string}': async (step, context) => {
  //   const username = step.text.match(/user '(.+)'/)?.[1];
  //   // Implement your step logic
  // }
}
`;
    await writeFile6(`${projectName}/steps/custom-steps.ts`, customSteps, "utf-8");
    console.log(`Created: ${projectName}/steps/custom-steps.ts`);
    console.log("");
    console.log("\u2705 Project initialized successfully!");
    console.log("");
    console.log("Next steps:");
    console.log(`  cd ${projectName}`);
    console.log("  npm install");
    console.log("  npm test");
    console.log("");
  }
}
var init_hop_initializer = () => {};

// src/generators/k6-generator.ts
var exports_k6_generator = {};
__export(exports_k6_generator, {
  K6Generator: () => K6Generator
});
import * as fs6 from "fs";
import * as path7 from "path";

class K6Generator {
  parser;
  constructor() {
    this.parser = new GherkinParser;
  }
  async generate(featuresPath, outputPath, options = {}) {
    const {
      vus = 10,
      duration = "30s",
      rampUp = "10s",
      rampDown = "10s"
    } = options;
    const featureFiles = await this.parser.discoverFeatures(featuresPath);
    const features = await this.parser.parseFeatures(featureFiles);
    const k6Script = this.generateK6Script(features, { vus, duration, rampUp, rampDown });
    const outputDir = path7.dirname(outputPath);
    if (!fs6.existsSync(outputDir)) {
      fs6.mkdirSync(outputDir, { recursive: true });
    }
    fs6.writeFileSync(outputPath, k6Script, "utf-8");
    console.log(`\u2705 k6 script generated: ${outputPath}`);
    console.log(`   VUs: ${vus}, Duration: ${duration}`);
  }
  generateK6Script(features, options) {
    const { vus, duration, rampUp, rampDown } = options;
    const httpCalls = this.extractHttpCalls(features);
    const script = `import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Export options
export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '${rampUp}', target: ${vus} },
        { duration: '${duration}', target: ${vus} },
        { duration: '${rampDown}', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

// Default function
export default function() {
${this.generateRequests(httpCalls)}
}

// Helper functions
${this.generateHelperFunctions(httpCalls)}
`;
    return script;
  }
  extractHttpCalls(features) {
    const calls = [];
    for (const feature of features) {
      for (const scenario of feature.scenarios) {
        const scenarioCalls = this.extractScenarioHttpCalls(scenario, feature.name);
        calls.push(...scenarioCalls);
      }
    }
    return calls;
  }
  extractScenarioHttpCalls(scenario, featureName) {
    const calls = [];
    let currentUrl = "";
    let currentHeaders = {};
    let currentBody = null;
    let stepIndex = 0;
    for (const step of scenario.steps) {
      stepIndex++;
      const text = step.text;
      const urlMatch = text.match(/url ['"](.+)['"]/i);
      if (urlMatch) {
        currentUrl = urlMatch[1];
        continue;
      }
      const pathMatch = text.match(/path ['"](.+)['"]/i);
      if (pathMatch) {
        currentUrl = currentUrl + pathMatch[1];
        continue;
      }
      const headerMatch = text.match(/header (.+) = ['"](.+)['"]/i);
      if (headerMatch) {
        currentHeaders[headerMatch[1]] = headerMatch[2];
        continue;
      }
      const requestMatch = text.match(/request\s+(\{[\s\S]*\})/i);
      if (requestMatch) {
        try {
          currentBody = JSON.parse(requestMatch[1]);
        } catch {
          currentBody = requestMatch[1];
        }
        continue;
      }
      const methodMatch = text.match(/method (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/i);
      if (methodMatch) {
        const method = methodMatch[1].toUpperCase();
        calls.push({
          featureName,
          scenarioName: scenario.name,
          stepIndex,
          method,
          url: currentUrl,
          headers: { ...currentHeaders },
          body: currentBody
        });
        currentBody = null;
      }
    }
    return calls;
  }
  generateRequests(calls) {
    if (calls.length === 0) {
      return "  // No HTTP calls found in scenarios";
    }
    const requestCode = [];
    for (let i = 0;i < calls.length; i++) {
      const call = calls[i];
      const callVar = `res${i}`;
      let params = "";
      if (Object.keys(call.headers).length > 0) {
        params += `,
    headers: ${JSON.stringify(call.headers)}`;
      }
      if (call.body) {
        params += `,
    body: JSON.stringify(${JSON.stringify(call.body)})`;
      }
      requestCode.push(`
  // ${call.scenarioName}
  const ${callVar} = http.${call.method.toLowerCase()}('${call.url}'${params});
  
  check(${callVar}, {
    'status is 200': (r) => r.status === 200,
  });
  
  errorRate(${callVar}.status !== 200);
  
  sleep(1);`);
    }
    return requestCode.join(`
`);
  }
  generateHelperFunctions(calls) {
    const uniqueUrls = [...new Set(calls.map((c) => c.url))];
    if (uniqueUrls.length === 0) {
      return "";
    }
    const functions = [];
    const hasRelativePaths = uniqueUrls.some((url) => url.startsWith("/"));
    if (hasRelativePaths) {
      functions.push(`
function getBaseUrl() {
  return __ENV.BASE_URL || 'https://jsonplaceholder.typicode.com';
}`);
    }
    return functions.join(`
`);
  }
}
var init_k6_generator = __esm(() => {
  init_gherkin_parser();
});

// node_modules/commander/esm.mjs
var import__ = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help
} = import__.default;

// bin/cli.ts
init_gherkin_parser();

// src/engine/hooks-runner.ts
import * as path from "path";
import * as fs from "fs";

class HooksRunner {
  hooks;
  hooksPath;
  constructor(hooksPath = "./hooks") {
    this.hooksPath = hooksPath;
    this.hooks = {};
    this.loadHooks();
  }
  async loadHooks() {
    try {
      const hooksFile = path.resolve(process.cwd(), this.hooksPath);
      if (fs.existsSync(hooksFile)) {
        const stat3 = fs.statSync(hooksFile);
        if (stat3.isDirectory()) {
          const indexPath = path.join(hooksFile, "index.ts");
          const hooksPath = path.join(hooksFile, "hooks.ts");
          if (fs.existsSync(indexPath)) {
            await this.importHooks(indexPath);
          } else if (fs.existsSync(hooksPath)) {
            await this.importHooks(hooksPath);
          }
        } else if (hooksFile.endsWith(".ts") || hooksFile.endsWith(".js")) {
          await this.importHooks(hooksFile);
        }
      }
    } catch (error) {
      if (process.env.VERBOSE) {
        console.log("\u26A0\uFE0F  Could not load hooks:", error);
      }
    }
  }
  async importHooks(filePath) {
    try {
      const hooksModule = await import(filePath);
      this.hooks = {
        beforeAll: hooksModule.beforeAll,
        afterAll: hooksModule.afterAll,
        beforeScenario: hooksModule.beforeScenario,
        afterScenario: hooksModule.afterScenario,
        beforeStep: hooksModule.beforeStep,
        afterStep: hooksModule.afterStep
      };
    } catch (error) {
      console.warn("\u26A0\uFE0F  Failed to import hooks:", error);
    }
  }
  async beforeAll() {
    if (this.hooks.beforeAll) {
      await this.hooks.beforeAll();
    }
  }
  async afterAll() {
    if (this.hooks.afterAll) {
      await this.hooks.afterAll();
    }
  }
  async beforeScenario(scenario, context) {
    if (this.hooks.beforeScenario) {
      await this.hooks.beforeScenario(scenario, context);
    }
  }
  async afterScenario(scenario, context, result) {
    if (this.hooks.afterScenario) {
      await this.hooks.afterScenario(scenario, context, result);
    }
  }
  async beforeStep(step, context) {
    if (this.hooks.beforeStep) {
      await this.hooks.beforeStep(step, context);
    }
  }
  async afterStep(step, context, result) {
    if (this.hooks.afterStep) {
      await this.hooks.afterStep(step, context, result);
    }
  }
}

// src/engine/test-engine.ts
init_env_loader();
init_gherkin_parser();

// src/engine/snippet-generator.ts
init_cucumber_expression();

// src/engine/snippet-builder.ts
init_cucumber_expression();

class SnippetBuilder {
  static generateTypeScriptCode(keyword, pattern, params, hasParameters) {
    const supportedTypes = getSupportedTypes().map((t) => t.slice(1, -1));
    const handlerName = this.generateHandlerName(keyword, pattern);
    const paramsType = hasParameters ? ", params: Record<string, any>" : "";
    let code = `import type { Step, TestContext } from '../types/index.js';

`;
    code += `// Step definition for: ${keyword} ${pattern}
`;
    code += `export const ${handlerName} = async (step: Step, context: TestContext${paramsType}) => {
`;
    code += `  // TODO: Implement your step logic here
`;
    code += `  
`;
    if (hasParameters) {
      code += `  // Extracted parameters:
`;
      for (const param of params) {
        code += `  // const ${param} = params['${param}'];
`;
      }
      code += `  
`;
    }
    code += `  // Example:
`;
    code += `  // console.log('Step: ${keyword} ${pattern}');
`;
    code += `  // const value = context.variables['yourVariable'];
`;
    code += `  // await context.httpClient.request({ method: 'GET', url: 'https://api.example.com' + value });
`;
    code += `};
`;
    code += `
`;
    code += `// Register this step:
`;
    code += `// {
`;
    code += `//   '${keyword} ${pattern}': ${handlerName},
`;
    code += `// }
`;
    code += `
`;
    code += `// Supported parameter types: ${supportedTypes.join(", ")}
`;
    return code;
  }
  static generateHandlerName(keyword, pattern) {
    let name = keyword.toLowerCase();
    const words = pattern.replace(/[{}]/g, "").split(/[\s_-]+/);
    for (const word of words) {
      if (word) {
        name += word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
    }
    if (!/^[a-zA-Z]/.test(name)) {
      name = "handle" + name;
    }
    return name;
  }
  static generateStepDefinitionsFile(steps) {
    let code = `/**
 * Hop Step Definitions
 * Auto-generated by Hop Framework
 * 
 * Edit this file to implement your step logic
 */

`;
    code += `import type { Step, TestContext } from '../types/index.js';

`;
    for (const step of steps) {
      code += `// ============================================
`;
      code += `// Step: ${step.pattern}
`;
      code += `// ============================================
`;
      code += step.code;
      code += `
`;
    }
    code += `// ============================================
`;
    code += `// Export all step definitions
`;
    code += `// ============================================
`;
    code += `const stepDefinitions = {
`;
    for (const step of steps) {
      const parts = step.pattern.split(" ");
      const handlerName = this.generateHandlerName(parts[0], step.pattern.slice(parts[0].length + 1));
      code += `  '${step.pattern}': ${handlerName},
`;
    }
    code += `};

`;
    code += `export default stepDefinitions;
`;
    return code;
  }
  static generateUndefinedStepMessage(steps) {
    const supportedTypes = getSupportedTypes().map((t) => t.slice(1, -1));
    let message = `
`;
    message += `\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
`;
    message += `\u2551          Undefined Step Definitions Found                 \u2551
`;
    message += `\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

`;
    message += `The following steps have no matching step definition:

`;
    for (const step of steps) {
      message += `  ${step.keyword} ${step.stepText}
`;
    }
    message += `
`;
    message += `To fix this, create a step definition file at './steps/custom-steps.ts':

`;
    message += `  1. Create the file with your step implementations
`;
    message += `  2. Export a default object with step patterns as keys
`;
    message += `  3. Run tests again

`;
    message += `Supported Parameter Types:
`;
    for (const type of supportedTypes) {
      message += `  - {${type}}
`;
    }
    message += `
Example:
`;
    message += `  Given user with id {int} exists
`;
    message += `  When I update user {string} with data {string}
`;
    message += `  Then response status should be {int}
`;
    return message;
  }
}

// src/engine/snippet-generator.ts
function generateUndefinedStepMessage(steps) {
  return SnippetBuilder.generateUndefinedStepMessage(steps);
}

// src/utils/tag-filter.ts
class TagFilter {
  static filter(features, tagExpression) {
    if (!tagExpression || tagExpression.trim() === "")
      return features;
    const expressions = tagExpression.split(",").map((e) => e.trim());
    return features.map((feature) => {
      const filteredScenarios = feature.scenarios.filter((scenario) => {
        const scenarioTags = (scenario.tags || []).concat(feature.tags || []);
        return expressions.every((expr) => {
          if (expr.toLowerCase().startsWith("not ")) {
            const forbiddenTag = expr.substring(4).replace(/^@/, "").trim();
            return !scenarioTags.includes(forbiddenTag);
          } else {
            const requiredTag = expr.replace(/^@/, "").trim();
            return scenarioTags.includes(requiredTag);
          }
        });
      });
      return {
        ...feature,
        scenarios: filteredScenarios
      };
    }).filter((feature) => feature.scenarios.length > 0);
  }
}

// src/utils/debug-logger.ts
class DebugLogger {
  options;
  stepIndex = 0;
  indentLevel = 0;
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled ?? false,
      showStepDetails: options.showStepDetails ?? true,
      showContext: options.showContext ?? true,
      showVariables: options.showVariables ?? true,
      showRequestResponse: options.showRequestResponse ?? true,
      breakpoints: options.breakpoints ?? []
    };
  }
  setEnabled(enabled) {
    this.options.enabled = enabled;
  }
  isEnabled() {
    return this.options.enabled;
  }
  setBreakpoints(breakpoints) {
    this.options.breakpoints = breakpoints;
  }
  isBreakpoint(stepText) {
    return this.options.breakpoints.some((bp) => stepText.includes(bp));
  }
  log(message, ...args) {
    if (!this.options.enabled)
      return;
    const indent = "  ".repeat(this.indentLevel);
    console.log(`${indent}\uD83D\uDD0D [DEBUG] ${message}`, ...args);
  }
  logStep(step, context) {
    if (!this.options.enabled || !this.options.showStepDetails)
      return;
    this.log(`Executing step: ${step.keyword} ${step.text}`);
    this.log(`  - Line: ${step.line}`);
    if (step.docString) {
      this.log(`  - DocString: ${step.docString.substring(0, 100)}...`);
    }
    if (step.dataTable) {
      this.log(`  - DataTable: ${step.dataTable.headers.join(", ")} (${step.dataTable.rows.length} rows)`);
    }
  }
  logContext(context) {
    if (!this.options.enabled || !this.options.showContext)
      return;
    this.log("\u2501\u2501\u2501 Context \u2501\u2501\u2501");
    this.log(`  baseUrl: ${context.baseUrl || "(none)"}`);
    this.log(`  path: ${context.path || "(none)"}`);
    this.log(`  method: ${context.method}`);
    if (Object.keys(context.headers).length > 0) {
      this.log(`  headers: ${JSON.stringify(context.headers)}`);
    }
    if (Object.keys(context.queryParams).length > 0) {
      this.log(`  queryParams: ${JSON.stringify(context.queryParams)}`);
    }
    if (context.body !== undefined && context.body !== null) {
      this.log(`  body: ${JSON.stringify(context.body).substring(0, 200)}...`);
    }
    if (Object.keys(context.cookies).length > 0) {
      this.log(`  cookies: ${JSON.stringify(context.cookies)}`);
    }
  }
  logVariables(context) {
    if (!this.options.enabled || !this.options.showVariables)
      return;
    const vars = context.variables;
    if (Object.keys(vars).length === 0) {
      this.log("  variables: (none)");
      return;
    }
    this.log("\u2501\u2501\u2501 Variables \u2501\u2501\u2501");
    for (const [key, value] of Object.entries(vars)) {
      if (key.startsWith("__"))
        continue;
      const displayValue = typeof value === "object" ? JSON.stringify(value).substring(0, 100) : String(value);
      this.log(`  ${key}: ${displayValue}`);
    }
  }
  logRequest(method, url, headers, body) {
    if (!this.options.enabled || !this.options.showRequestResponse)
      return;
    this.log("\u2501\u2501\u2501 HTTP Request \u2501\u2501\u2501");
    this.log(`  ${method} ${url}`);
    if (headers) {
      this.log(`  Headers: ${JSON.stringify(headers)}`);
    }
    if (body) {
      this.log(`  Body: ${JSON.stringify(body).substring(0, 200)}...`);
    }
  }
  logResponse(status, statusText, headers, body, duration) {
    if (!this.options.enabled || !this.options.showRequestResponse)
      return;
    this.log("\u2501\u2501\u2501 HTTP Response \u2501\u2501\u2501");
    this.log(`  ${status} ${statusText}${duration ? ` (${duration}ms)` : ""}`);
    if (headers) {
      this.log(`  Headers: ${JSON.stringify(headers)}`);
    }
    if (body) {
      const bodyStr = typeof body === "object" ? JSON.stringify(body) : body;
      this.log(`  Body: ${bodyStr.substring(0, 500)}...`);
    }
  }
  logError(error, context) {
    if (!this.options.enabled)
      return;
    this.log("\u2501\u2501\u2501 Error \u2501\u2501\u2501");
    this.log(`  ${error instanceof Error ? error.message : error}`);
    if (error instanceof Error && error.stack) {
      this.log(`  Stack: ${error.stack.split(`
`).slice(0, 3).join(`
`)}`);
    }
    if (context && this.options.showContext) {
      this.logContext(context);
    }
    if (context && this.options.showVariables) {
      this.logVariables(context);
    }
  }
  logScenarioStart(scenario, featureName) {
    if (!this.options.enabled)
      return;
    this.stepIndex = 0;
    this.indentLevel = 0;
    this.log(`\u2501\u2501\u2501\u2501\u2501\u2501\u2501 Starting: ${scenario.name} (Feature: ${featureName}) \u2501\u2501\u2501\u2501\u2501\u2501\u2501`);
    this.indentLevel = 1;
  }
  logScenarioEnd(scenarioName, status, duration) {
    if (!this.options.enabled)
      return;
    this.indentLevel = 0;
    const icon = status === "passed" ? "\u2705" : status === "failed" ? "\u274C" : "\u23ED\uFE0F";
    this.log(`${icon} Finished: ${scenarioName} (${status}) - ${duration}ms`);
  }
  logBreakpoint(step) {
    if (!this.options.enabled)
      return;
    this.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    this.log(`\uD83D\uDED1 BREAKPOINT REACHED: ${step.keyword} ${step.text}`);
    this.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
  }
  formatContextForFailure(context, step, error) {
    const lines = [];
    lines.push("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    lines.push("\uD83D\uDD34 STEP FAILED");
    lines.push("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    lines.push(`Step: ${step.keyword} ${step.text}`);
    lines.push(`Line: ${step.line}`);
    lines.push("");
    lines.push("\uD83D\uDCCD Context:");
    lines.push(`  URL: ${context.baseUrl}${context.path}`);
    lines.push(`  Method: ${context.method}`);
    if (Object.keys(context.headers).length > 0) {
      lines.push(`  Headers: ${JSON.stringify(context.headers)}`);
    }
    if (context.body !== undefined) {
      lines.push(`  Body: ${JSON.stringify(context.body)}`);
    }
    lines.push("");
    lines.push("\uD83D\uDCE6 Variables:");
    for (const [key, value] of Object.entries(context.variables)) {
      if (!key.startsWith("__")) {
        lines.push(`  ${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`);
      }
    }
    lines.push("");
    lines.push("\u274C Error:");
    lines.push(`  ${error}`);
    lines.push("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    return lines.join(`
`);
  }
  increaseIndent() {
    this.indentLevel++;
  }
  decreaseIndent() {
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }
}
var globalDebugLogger = null;
function getDebugLogger() {
  if (!globalDebugLogger) {
    globalDebugLogger = new DebugLogger;
  }
  return globalDebugLogger;
}
function setDebugLogger(logger) {
  globalDebugLogger = logger;
}

// src/engine/step-execution-handler.ts
class StepExecutionHandler {
  hooksRunner;
  undefinedSteps;
  debugLogger = getDebugLogger();
  constructor(hooksRunner, undefinedSteps) {
    this.hooksRunner = hooksRunner;
    this.undefinedSteps = undefinedSteps;
  }
  async execute(step, context, scenarioName, executor) {
    const startTime = Date.now();
    this.debugLogger.logStep(step, context);
    if (this.debugLogger.isBreakpoint(step.text)) {
      this.debugLogger.logBreakpoint(step);
    }
    await this.hooksRunner.beforeStep(step, context);
    try {
      await executor.executeStep(step, context);
      const result = { step, status: "passed", duration: Date.now() - startTime };
      await this.hooksRunner.afterStep(step, context, { status: "passed" });
      return result;
    } catch (error) {
      this.debugLogger.logError(error instanceof Error ? error : new Error(String(error)), context);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const contextInfo = this.debugLogger.formatContextForFailure(context, step, errorMessage);
      console.log(contextInfo);
      let screenshotPath;
      let videoPath;
      try {
        screenshotPath = await executor.takeScreenshot(scenarioName, context);
        const pw = executor.getPlaywright(context);
        const page = pw?.getPage();
        if (page) {
          const video = page.video();
          if (video) {
            videoPath = await video.path();
          }
        }
      } catch (mediaError) {
        executor.getLogger().error("Failed to capture media:", mediaError);
      }
      const result = {
        step,
        status: "failed",
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshotPath,
        videoPath
      };
      this.trackUndefinedStep(step, error);
      await this.hooksRunner.afterStep(step, context, { status: "failed", error });
      return result;
    }
  }
  trackUndefinedStep(step, error) {
    if (error instanceof Error && error.message.startsWith("Unknown step:")) {
      const stepKey = `${step.keyword} ${step.text}`;
      if (!this.undefinedSteps.some((s) => `${s.keyword} ${s.stepText}` === stepKey)) {
        this.undefinedSteps.push({ keyword: step.keyword, stepText: step.text });
      }
    }
  }
}

// src/engine/scenario-runner.ts
class ScenarioRunner {
  hooksRunner;
  stepExecutionHandler;
  constructor(hooksRunner, undefinedSteps) {
    this.hooksRunner = hooksRunner;
    this.stepExecutionHandler = new StepExecutionHandler(hooksRunner, undefinedSteps);
  }
  async runScenarioOutline(feature, scenario, table, collector, featureContext, executor) {
    const results = [];
    for (let i = 0;i < table.rows.length; i++) {
      const row = table.rows[i];
      const context = { ...featureContext, variables: { ...featureContext.variables } };
      table.headers.forEach((h, j) => context.variables[h] = row[j]);
      const result = await this.runScenario(feature, this.inject(scenario, table.headers, row), collector, context, executor, ` (Row ${i + 1})`);
      results.push(result);
    }
    return results;
  }
  async runScenario(feature, scenario, collector, context, executor, suffix = "") {
    const startTime = Date.now();
    const stepResults = [];
    const scenarioContext = { ...context, variables: { ...context.variables } };
    await this.hooksRunner.beforeScenario(scenario, scenarioContext);
    for (const step of scenario.steps) {
      const stepResult = await this.stepExecutionHandler.execute(step, scenarioContext, scenario.name, executor);
      stepResults.push(stepResult);
      if (stepResult.status === "failed")
        break;
    }
    context.variables = { ...context.variables, ...scenarioContext.variables };
    const failedStep = stepResults.find((r) => r.status === "failed");
    const result = {
      featureName: feature.name,
      scenarioName: scenario.name + suffix,
      status: failedStep ? "failed" : "passed",
      duration: Date.now() - startTime,
      steps: stepResults,
      tags: scenario.tags,
      error: failedStep?.error,
      screenshotPath: failedStep?.screenshotPath,
      videoPath: failedStep?.videoPath
    };
    collector.add(result);
    await this.hooksRunner.afterScenario(scenario, scenarioContext, result);
    return result;
  }
  inject(scenario, headers, row) {
    const map = new Map(headers.map((h, i) => [`<${h}>`, row[i]]));
    return {
      ...scenario,
      steps: scenario.steps.map((step) => ({
        ...step,
        text: Array.from(map.entries()).reduce((t, [k, v]) => t.split(k).join(v), step.text)
      }))
    };
  }
}

// src/utils/buffered-logger.ts
class BufferedLogger {
  logs = [];
  log(...args) {
    this.logs.push(`\uD83D\uDCDD ${args.join(" ")}`);
  }
  error(...args) {
    this.logs.push(`\u274C ${args.join(" ")}`);
  }
  warn(...args) {
    this.logs.push(`\u26A0\uFE0F  ${args.join(" ")}`);
  }
  getLogs() {
    return this.logs;
  }
  clear() {
    this.logs = [];
  }
  print() {
    for (const log of this.logs) {
      console.log(log);
    }
  }
}

// src/engine/execution-manager.ts
init_step_executor();

class ExecutionManager {
  options;
  envConfig;
  runFeature;
  constructor(options, envConfig, runFeature) {
    this.options = options;
    this.envConfig = envConfig;
    this.runFeature = runFeature;
  }
  async run(features, collector) {
    if (this.options.parallel) {
      return this.runParallel(features, collector);
    }
    return this.runSequential(features, collector);
  }
  async runSequential(features, collector) {
    const results = [];
    const executor = this.createExecutor();
    for (const feature of features) {
      results.push(...await this.runFeature(feature, collector, executor));
    }
    await executor.cleanup();
    return results;
  }
  async runParallel(features, collector) {
    const concurrency = this.options.concurrency || 4;
    const chunks = this.splitIntoChunks(features, concurrency);
    const featurePromises = chunks.map(async (chunk) => {
      const workerLogger = new BufferedLogger;
      const workerExecutor = this.createExecutor(workerLogger);
      const chunkResults = [];
      for (const feature of chunk) {
        chunkResults.push(...await this.runFeature(feature, collector, workerExecutor));
        if (this.options.verbose && workerLogger.getLogs().length > 0) {
          console.log(`
--- Logs for Feature: ${feature.name} ---`);
          workerLogger.print();
          workerLogger.clear();
        }
      }
      await workerExecutor.cleanup();
      return chunkResults;
    });
    return (await Promise.all(featurePromises)).flat();
  }
  createExecutor(logger) {
    return new StepExecutor({
      featuresPath: this.options.featuresPath,
      stepsPath: this.options.stepsPath,
      env: this.options.env,
      verbose: this.options.verbose,
      timeout: this.options.timeout,
      envConfig: this.envConfig,
      logger,
      video: this.options.video
    });
  }
  splitIntoChunks(array, count) {
    const chunks = Array.from({ length: Math.min(count, array.length) }, () => []);
    array.forEach((item, index) => chunks[index % chunks.length].push(item));
    return chunks;
  }
}

// src/engine/test-engine.ts
class TestEngine {
  options;
  envConfig;
  hooksRunner;
  scenarioRunner;
  executionManager;
  undefinedSteps = [];
  debugLogger;
  constructor(options) {
    this.options = options;
    this.envConfig = loadEnv(options.env);
    this.hooksRunner = new HooksRunner("./hooks");
    this.scenarioRunner = new ScenarioRunner(this.hooksRunner, this.undefinedSteps);
    this.executionManager = new ExecutionManager(options, this.envConfig, this.runFeature.bind(this));
    this.debugLogger = getDebugLogger();
    this.debugLogger.setEnabled(options.debug || false);
    if (options.breakpoint) {
      this.debugLogger.setBreakpoints([options.breakpoint]);
    }
    setDebugLogger(this.debugLogger);
  }
  async run(features, collector) {
    await this.hooksRunner.beforeAll();
    const filteredFeatures = TagFilter.filter(features, this.options.tags);
    const results = await this.executionManager.run(filteredFeatures, collector);
    if (this.undefinedSteps.length > 0) {
      console.log(generateUndefinedStepMessage(this.undefinedSteps));
    }
    await this.hooksRunner.afterAll();
    return results;
  }
  async runFeature(feature, collector, executor) {
    const results = [];
    const featureContext = this.createContext(feature.filePath, executor.getLogger());
    if (feature.background) {
      for (const step of feature.background.steps) {
        try {
          await executor.executeStep(step, featureContext);
        } catch (error) {
          console.error(`Background step failed in ${feature.filePath}:`, error);
        }
      }
    }
    for (const scenario of feature.scenarios) {
      if (scenario.outline && scenario.examples) {
        for (const example of scenario.examples) {
          const exampleResults = await this.scenarioRunner.runScenarioOutline(feature, scenario, example.table, collector, featureContext, executor);
          results.push(...exampleResults);
        }
      } else {
        const result = await this.scenarioRunner.runScenario(feature, scenario, collector, featureContext, executor);
        results.push(result);
      }
    }
    return results;
  }
  createContext(featureFilePath, logger = console) {
    const parser = new GherkinParser;
    return {
      baseUrl: "",
      path: "",
      method: "GET",
      headers: {},
      queryParams: {},
      body: undefined,
      variables: {},
      cookies: {},
      read: async (filePath) => await parser.read(filePath, featureFilePath),
      logger
    };
  }
}

// src/reporter/console-reporter.ts
class ConsoleReporter {
  printFeatures(features) {
    for (const feature of features) {
      console.log(`\uD83D\uDCC1 ${feature.name}`);
      if (feature.description) {
        console.log(`   ${feature.description}`);
      }
      if (feature.tags.length > 0) {
        console.log(`   Tags: @${feature.tags.join(" @")}`);
      }
      console.log("");
      for (const scenario of feature.scenarios) {
        const outline = scenario.outline ? " (Outline)" : "";
        console.log(`   \uD83D\uDCDD ${scenario.name}${outline}`);
        if (scenario.tags.length > 0) {
          console.log(`      Tags: @${scenario.tags.join(" @")}`);
        }
        for (const step of scenario.steps) {
          console.log(`      ${step.keyword} ${step.text}`);
        }
        if (scenario.examples && scenario.examples.length > 0) {
          for (const example of scenario.examples) {
            console.log(`      Examples:`);
            console.log(`        | ${example.table.headers.join(" | ")} |`);
            for (const row of example.table.rows) {
              console.log(`        | ${row.join(" | ")} |`);
            }
          }
        }
        console.log("");
      }
      console.log("");
    }
  }
  printResults(results) {
    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
    console.log("                    TEST RESULTS");
    console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
    console.log("");
    console.log(`  Total:   ${results.length}`);
    console.log(`  \u2705 Passed:  ${passed}`);
    console.log(`  \u274C Failed:  ${failed}`);
    console.log(`  \u23ED\uFE0F  Skipped: ${skipped}`);
    console.log(`  \u23F1\uFE0F  Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log("");
    const failedTests = results.filter((r) => r.status === "failed");
    if (failedTests.length > 0) {
      console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      console.log("                    FAILED TESTS");
      console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      console.log("");
      for (const result of failedTests) {
        console.log(`\u274C ${result.featureName} - ${result.scenarioName}`);
        console.log(`   Duration: ${result.duration}ms`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        const failedStep = result.steps.find((s) => s.status === "failed");
        if (failedStep) {
          console.log(`   Failed at: ${failedStep.step.keyword} ${failedStep.step.text}`);
          if (failedStep.error) {
            console.log(`   Step Error: ${failedStep.error}`);
          }
        }
        console.log("");
      }
    }
    if (passed > 0) {
      console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      console.log("                    PASSED TESTS");
      console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
      console.log("");
      for (const result of results.filter((r) => r.status === "passed").slice(0, 20)) {
        console.log(`\u2705 ${result.featureName} - ${result.scenarioName} (${result.duration}ms)`);
      }
      if (passed > 20) {
        console.log(`... and ${passed - 20} more`);
      }
      console.log("");
    }
    console.log("\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550");
  }
  printProgress(current, total) {
    const width = 40;
    const percent = current / total;
    const filled = Math.floor(width * percent);
    const empty = width - filled;
    const bar = "\u2588".repeat(filled) + "\u2591".repeat(empty);
    process.stdout.write(`\r[${bar}] ${current}/${total} (${Math.round(percent * 100)}%)`);
  }
}
// src/config/config-loader.ts
import * as path6 from "path";
import * as fs5 from "fs";
var DEFAULT_CONFIG = {
  features: "./features",
  steps: "./steps",
  reports: "./reports",
  format: ["html"],
  timeout: 30000,
  retry: 0,
  parallel: 1,
  tags: {
    include: [],
    exclude: []
  },
  headers: {},
  environments: {}
};
function loadConfig(configPath) {
  const searchPaths = [
    path6.resolve(process.cwd(), "hop.config.ts"),
    path6.resolve(process.cwd(), "hop.config.js"),
    path6.resolve(process.cwd(), "config/hop.config.ts"),
    path6.resolve(process.cwd(), "config/hop.config.js")
  ];
  if (configPath) {
    searchPaths.unshift(path6.resolve(process.cwd(), configPath));
  }
  for (const filePath of searchPaths) {
    if (fs5.existsSync(filePath)) {
      try {
        const configModule = __require(filePath);
        const config = configModule.default || configModule;
        return mergeConfig(DEFAULT_CONFIG, config);
      } catch (error) {
        console.warn(`\u26A0\uFE0F  Failed to load config from ${filePath}:`, error);
      }
    }
  }
  return DEFAULT_CONFIG;
}
function mergeConfig(defaults, userConfig) {
  return {
    features: userConfig.features || defaults.features,
    steps: userConfig.steps || defaults.steps,
    reports: userConfig.reports || defaults.reports,
    format: userConfig.format || defaults.format,
    timeout: userConfig.timeout ?? defaults.timeout,
    retry: userConfig.retry ?? defaults.retry,
    parallel: userConfig.parallel ?? defaults.parallel,
    tags: {
      include: userConfig.tags?.include || defaults.tags.include,
      exclude: userConfig.tags?.exclude || defaults.tags.exclude
    },
    headers: { ...defaults.headers, ...userConfig.headers },
    environments: { ...defaults.environments, ...userConfig.environments }
  };
}
function mergeOptions(config, cliOptions) {
  return {
    features: cliOptions.features || config.features,
    steps: cliOptions.steps || config.steps,
    reports: cliOptions.reports || config.reports,
    format: cliOptions.format || config.format[0],
    timeout: cliOptions.timeout ?? config.timeout,
    retry: cliOptions.retry ?? config.retry,
    parallel: cliOptions.parallel ?? config.parallel > 1,
    concurrency: cliOptions.concurrency ?? (config.parallel || 4),
    tags: cliOptions.tags || getTagString(config.tags),
    env: cliOptions.env || "test",
    verbose: cliOptions.verbose || false,
    debug: cliOptions.debug || false,
    breakpoint: cliOptions.breakpoint || "",
    report: cliOptions.report || false,
    reportDir: cliOptions.reportDir || config.reports,
    video: cliOptions.video || false
  };
}
function getTagString(tags) {
  if (tags.include.length > 0) {
    return tags.include.map((t) => `@${t}`).join(",");
  }
  return "";
}

// bin/cli.ts
import * as path8 from "path";
import { spawn } from "child_process";
import { readdir as readdir2, stat as stat3 } from "fs/promises";
var program2 = new Command;
var config = loadConfig();
program2.name("hop").description("High-performance BDD automation testing framework").version("1.0.0");
program2.command("test [path]").description("Run BDD tests").option("-f, --features <path>", "Path to features directory", config.features).option("-s, --steps <path>", "Path to custom steps directory", config.steps).option("-t, --tags <tags>", "Filter scenarios by tags", "").option("-e, --env <env>", "Environment to use", "test").option("-r, --report", "Generate Allure report", true).option("-v, --verbose", "Verbose output", false).option("-d, --debug", "Enable debug mode with detailed logging", false).option("--breakpoint <step>", "Set breakpoint on step containing this text", "").option("-frm, --format <format>", "Output format (console, json, junit, allure, html, hop, newman)", "console,allure,hop").option("--retry <count>", "Number of retries for failed tests", config.retry.toString()).option("--timeout <ms>", "Test timeout in milliseconds", config.timeout.toString()).option("-p, --parallel", "Run tests in parallel", false).option("-cn, --concurrency <count>", "Maximum concurrent tests", "4").option("--video", "Record video of UI tests", false).option("-c, --config <path>", "Path to config file").option("--report-dir <path>", "Directory to save reports", "./reports").action(async (pathArg, options) => {
  try {
    if (!options)
      options = {};
    const now = new Date;
    const timestamp = now.toISOString().replace(/[:.]/g, "-").split("T")[0] + "_" + now.toTimeString().split(" ")[0].replace(/:/g, "-");
    const baseReportDir = options.reportDir || config.reportDir || "./reports";
    const reportDir = path8.join(baseReportDir, timestamp);
    const customConfig = options.config ? loadConfig(options.config) : config;
    const mergedOptions = mergeOptions(customConfig, { ...options, reportDir });
    if (pathArg) {
      mergedOptions.features = pathArg;
    }
    console.log("\uD83D\uDD37 Hop - BDD Testing Framework");
    console.log(`================================
`);
    if (mergedOptions.verbose) {
      console.log("\uD83D\uDCCB Using config:");
      console.log(`   Features: ${mergedOptions.features}`);
      console.log(`   Steps: ${mergedOptions.steps}`);
      console.log(`   Environment: ${mergedOptions.env}`);
      console.log("");
    }
    const featuresPath = path8.resolve(mergedOptions.features);
    const stepsPath = path8.resolve(mergedOptions.steps);
    const parser = new GherkinParser;
    const featureFiles = await parser.discoverFeatures(featuresPath);
    if (featureFiles.length === 0) {
      console.log("\u26A0\uFE0F  No .feature files found in", featuresPath);
      process.exit(0);
    }
    console.log(`\uD83D\uDCC1 Found ${featureFiles.length} feature file(s)
`);
    const parsedFeatures = await parser.parseFeatures(featureFiles);
    const reporter = new ConsoleReporter;
    reporter.printFeatures(parsedFeatures);
    const engine = new TestEngine({
      featuresPath,
      stepsPath,
      tags: mergedOptions.tags,
      env: mergedOptions.env,
      verbose: mergedOptions.verbose,
      debug: mergedOptions.debug || false,
      breakpoint: mergedOptions.breakpoint,
      timeout: mergedOptions.timeout,
      retry: mergedOptions.retry,
      parallel: mergedOptions.parallel || false,
      concurrency: Number(mergedOptions.concurrency) || 4,
      video: mergedOptions.video || false,
      report: mergedOptions.report ? "html" : undefined,
      reportDir: mergedOptions.reportDir || "./reports"
    });
    const collector = new TestResultCollector;
    const results = await engine.run(parsedFeatures, collector);
    reporter.printResults(results);
    const formats = (mergedOptions.format || "console").split(",").map((f) => f.trim());
    const finalReportDir = mergedOptions.reportDir || "./reports";
    for (const format of formats) {
      if (format === "json") {
        const { JsonReporter: JsonReporter2 } = await Promise.resolve().then(() => (init_json_reporter(), exports_json_reporter));
        const jsonReporter = new JsonReporter2(finalReportDir);
        const jsonPath = await jsonReporter.generate(results);
        console.log(`\uD83D\uDCCA JSON report generated: ${jsonPath}`);
      }
      if (format === "junit") {
        const { JunitReporter: JunitReporter2 } = await Promise.resolve().then(() => (init_junit_reporter(), exports_junit_reporter));
        const junitReporter = new JunitReporter2(finalReportDir);
        const junitPath = await junitReporter.generate(results);
        console.log(`\uD83D\uDCCA JUnit XML report generated: ${junitPath}`);
      }
      if (format === "allure") {
        const { AllureReporter: AllureReporter2 } = await Promise.resolve().then(() => (init_allure_reporter(), exports_allure_reporter));
        const allureReporter = new AllureReporter2;
        const allurePath = await allureReporter.generate(results);
        console.log(`
\uD83D\uDCCA Allure results generated: ${allurePath}`);
      }
      if (format === "hop" || format === "html") {
        const { HopReporterV2: HopReporterV22 } = await Promise.resolve().then(() => (init_hop_reporter_v2(), exports_hop_reporter_v2));
        const hopReporter = new HopReporterV22(finalReportDir);
        const reportPath = await hopReporter.generate(results, collector);
        console.log(`
\u2728 Premium Hop Report generated: ${reportPath}`);
      }
      if (format === "newman") {
        const { NewmanReporter: NewmanReporter2 } = await Promise.resolve().then(() => (init_newman_reporter(), exports_newman_reporter));
        const newmanReporter = new NewmanReporter2(finalReportDir);
        const reportPath = await newmanReporter.generate(results, collector);
        console.log(`
\uD83D\uDCCA Newman-style Report generated: ${reportPath}`);
      }
    }
    const { mkdir: mkdir6, writeFile: writeFile7 } = await import("fs/promises");
    await mkdir6(path8.join(finalReportDir, "history"), { recursive: true });
    await writeFile7(path8.join(finalReportDir, "history", `${Date.now()}.json`), JSON.stringify(results, null, 2), "utf-8");
    const totalRun = results.length;
    const failed = results.filter((r) => r.status === "failed").length;
    if (failed > 0) {
      console.log(`
\u274C Test run failed with ${failed} failure(s) out of ${totalRun} scenario(s).`);
      process.exit(1);
    } else {
      console.log(`
\u2705 Test run passed! ${totalRun} scenario(s) executed successfully.`);
      process.exit(0);
    }
  } catch (error) {
    console.error("\u274C Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
program2.command("init <project-name>").description("Initialize a new Hop project").action(async (projectName) => {
  const { HopInitializer: HopInitializer2 } = await Promise.resolve().then(() => (init_hop_initializer(), exports_hop_initializer));
  const initializer = new HopInitializer2;
  await initializer.init(projectName);
});
program2.command("gen-k6").description("Generate k6 load test script from features").option("-o, --output <path>", "Output file path", "./load-test.js").option("-f, --features <path>", "Path to features directory", "./features").action(async (options) => {
  const { K6Generator: K6Generator2 } = await Promise.resolve().then(() => (init_k6_generator(), exports_k6_generator));
  const generator = new K6Generator2;
  await generator.generate(options.features, options.output);
});
program2.command("parse").description("Parse feature files without running tests").option("-f, --features <path>", "Path to features directory", "./features").action(async (options) => {
  try {
    const parser = new GherkinParser;
    const featuresPath = path8.resolve(options.features);
    const featureFiles = await parser.discoverFeatures(featuresPath);
    const parsedFeatures = await parser.parseFeatures(featureFiles);
    const reporter = new ConsoleReporter;
    reporter.printFeatures(parsedFeatures);
  } catch (error) {
    console.error("\u274C Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
program2.command("mock").description("Start a mock API server from a feature file").option("-f, --feature <path>", "Path to mock feature file").option("-p, --port <port>", "Port number", "8080").option("-v, --verbose", "Verbose output", false).action(async (options) => {
  try {
    if (!options.feature) {
      console.error("\u274C Error: Path to mock feature file is required (-f, --feature)");
      process.exit(1);
    }
    const { MockServer: MockServer2 } = await Promise.resolve().then(() => (init_mock_server(), exports_mock_server));
    const server = new MockServer2(path8.resolve(options.feature), parseInt(options.port), options.verbose);
    await server.start();
  } catch (error) {
    console.error("\u274C Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
program2.command("report").description("View the test reports (prioritizes Hop Premium)").option("-p, --port <port>", "Port number", "9090").option("-a, --allure", "Explicitly serve Allure report", false).action(async (options) => {
  try {
    const baseReportDir = config.reports || "./reports";
    if (options.allure) {
      const allureResultsDir = path8.join(baseReportDir, "allure-results");
      console.log(`
\uD83D\uDE80 Starting Allure Report server...`);
      console.log(`\uD83D\uDCC2 Using results from: ${allureResultsDir}`);
      const allurePort = options.port === "9090" ? "9091" : options.port;
      spawn("npx", ["allure", "serve", allureResultsDir, "-p", allurePort], {
        stdio: "inherit",
        shell: true
      });
      return;
    }
    console.log(`
\uD83D\uDD0D Searching for the latest Hop Premium Report...`);
    const dirs = await readdir2(baseReportDir);
    const timestampedDirs = [];
    for (const dir of dirs) {
      if (dir === "allure-results" || dir === "history" || dir === "screenshots" || dir === "videos")
        continue;
      const fullPath = path8.join(baseReportDir, dir);
      const s = await stat3(fullPath);
      if (s.isDirectory()) {
        timestampedDirs.push({ name: dir, path: fullPath, mtime: s.mtime });
      }
    }
    if (timestampedDirs.length === 0) {
      console.error("\u274C No Hop reports found. Run tests first with --format hop");
      process.exit(1);
    }
    timestampedDirs.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    const latestReportDir = timestampedDirs[0].path;
    console.log(`
\u2728 Found latest report: ${timestampedDirs[0].name}`);
    console.log(`\uD83D\uDCC2 Serving report from: ${latestReportDir}`);
    const { existsSync: existsSync7 } = await import("fs");
    if (!existsSync7(path8.join(latestReportDir, "index.html"))) {
      console.error("\u274C index.html not found in the latest report directory.");
      process.exit(1);
    }
    console.log(`\uD83D\uDD17 Access your report at: http://localhost:${options.port}`);
    const server = spawn("npx", ["-y", "serve", latestReportDir, "-l", options.port], {
      stdio: "inherit",
      shell: true
    });
    server.on("error", (err) => {
      console.error("\u274C Failed to start report server:", err.message);
    });
  } catch (error) {
    console.error("\u274C Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
program2.parse();
