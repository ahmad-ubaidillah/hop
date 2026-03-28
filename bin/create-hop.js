#!/usr/bin/env node
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

// node_modules/sisteransi/src/index.js
var require_src = __commonJS((exports, module) => {
  var ESC = "\x1B";
  var CSI = `${ESC}[`;
  var beep = "\x07";
  var cursor = {
    to(x, y) {
      if (!y)
        return `${CSI}${x + 1}G`;
      return `${CSI}${y + 1};${x + 1}H`;
    },
    move(x, y) {
      let ret = "";
      if (x < 0)
        ret += `${CSI}${-x}D`;
      else if (x > 0)
        ret += `${CSI}${x}C`;
      if (y < 0)
        ret += `${CSI}${-y}A`;
      else if (y > 0)
        ret += `${CSI}${y}B`;
      return ret;
    },
    up: (count = 1) => `${CSI}${count}A`,
    down: (count = 1) => `${CSI}${count}B`,
    forward: (count = 1) => `${CSI}${count}C`,
    backward: (count = 1) => `${CSI}${count}D`,
    nextLine: (count = 1) => `${CSI}E`.repeat(count),
    prevLine: (count = 1) => `${CSI}F`.repeat(count),
    left: `${CSI}G`,
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    save: `${ESC}7`,
    restore: `${ESC}8`
  };
  var scroll = {
    up: (count = 1) => `${CSI}S`.repeat(count),
    down: (count = 1) => `${CSI}T`.repeat(count)
  };
  var erase = {
    screen: `${CSI}2J`,
    up: (count = 1) => `${CSI}1J`.repeat(count),
    down: (count = 1) => `${CSI}J`.repeat(count),
    line: `${CSI}2K`,
    lineEnd: `${CSI}K`,
    lineStart: `${CSI}1K`,
    lines(count) {
      let clear = "";
      for (let i = 0;i < count; i++)
        clear += this.line + (i < count - 1 ? cursor.up() : "");
      if (count)
        clear += cursor.left;
      return clear;
    }
  };
  module.exports = { cursor, scroll, erase, beep };
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS((exports, module) => {
  var p = process || {};
  var argv = p.argv || [];
  var env = p.env || {};
  var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
  var formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
  var replaceClose = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  var createColors = (enabled = isColorSupported) => {
    let f = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f("\x1B[0m", "\x1B[0m"),
      bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f("\x1B[3m", "\x1B[23m"),
      underline: f("\x1B[4m", "\x1B[24m"),
      inverse: f("\x1B[7m", "\x1B[27m"),
      hidden: f("\x1B[8m", "\x1B[28m"),
      strikethrough: f("\x1B[9m", "\x1B[29m"),
      black: f("\x1B[30m", "\x1B[39m"),
      red: f("\x1B[31m", "\x1B[39m"),
      green: f("\x1B[32m", "\x1B[39m"),
      yellow: f("\x1B[33m", "\x1B[39m"),
      blue: f("\x1B[34m", "\x1B[39m"),
      magenta: f("\x1B[35m", "\x1B[39m"),
      cyan: f("\x1B[36m", "\x1B[39m"),
      white: f("\x1B[37m", "\x1B[39m"),
      gray: f("\x1B[90m", "\x1B[39m"),
      bgBlack: f("\x1B[40m", "\x1B[49m"),
      bgRed: f("\x1B[41m", "\x1B[49m"),
      bgGreen: f("\x1B[42m", "\x1B[49m"),
      bgYellow: f("\x1B[43m", "\x1B[49m"),
      bgBlue: f("\x1B[44m", "\x1B[49m"),
      bgMagenta: f("\x1B[45m", "\x1B[49m"),
      bgCyan: f("\x1B[46m", "\x1B[49m"),
      bgWhite: f("\x1B[47m", "\x1B[49m"),
      blackBright: f("\x1B[90m", "\x1B[39m"),
      redBright: f("\x1B[91m", "\x1B[39m"),
      greenBright: f("\x1B[92m", "\x1B[39m"),
      yellowBright: f("\x1B[93m", "\x1B[39m"),
      blueBright: f("\x1B[94m", "\x1B[39m"),
      magentaBright: f("\x1B[95m", "\x1B[39m"),
      cyanBright: f("\x1B[96m", "\x1B[39m"),
      whiteBright: f("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f("\x1B[100m", "\x1B[49m"),
      bgRedBright: f("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f("\x1B[107m", "\x1B[49m")
    };
  };
  module.exports = createColors();
  module.exports.createColors = createColors;
});

// node_modules/@clack/core/dist/index.mjs
var import_sisteransi = __toESM(require_src(), 1);
import { styleText as D } from "util";
import { stdout as R, stdin as q } from "process";
import * as k from "readline";
import ot from "readline";
import { ReadStream as J } from "tty";
function x(t, e, s) {
  if (!s.some((u) => !u.disabled))
    return t;
  const i = t + e, r = Math.max(s.length - 1, 0), n = i < 0 ? r : i > r ? 0 : i;
  return s[n].disabled ? x(n, e < 0 ? -1 : 1, s) : n;
}
var at = (t) => t === 161 || t === 164 || t === 167 || t === 168 || t === 170 || t === 173 || t === 174 || t >= 176 && t <= 180 || t >= 182 && t <= 186 || t >= 188 && t <= 191 || t === 198 || t === 208 || t === 215 || t === 216 || t >= 222 && t <= 225 || t === 230 || t >= 232 && t <= 234 || t === 236 || t === 237 || t === 240 || t === 242 || t === 243 || t >= 247 && t <= 250 || t === 252 || t === 254 || t === 257 || t === 273 || t === 275 || t === 283 || t === 294 || t === 295 || t === 299 || t >= 305 && t <= 307 || t === 312 || t >= 319 && t <= 322 || t === 324 || t >= 328 && t <= 331 || t === 333 || t === 338 || t === 339 || t === 358 || t === 359 || t === 363 || t === 462 || t === 464 || t === 466 || t === 468 || t === 470 || t === 472 || t === 474 || t === 476 || t === 593 || t === 609 || t === 708 || t === 711 || t >= 713 && t <= 715 || t === 717 || t === 720 || t >= 728 && t <= 731 || t === 733 || t === 735 || t >= 768 && t <= 879 || t >= 913 && t <= 929 || t >= 931 && t <= 937 || t >= 945 && t <= 961 || t >= 963 && t <= 969 || t === 1025 || t >= 1040 && t <= 1103 || t === 1105 || t === 8208 || t >= 8211 && t <= 8214 || t === 8216 || t === 8217 || t === 8220 || t === 8221 || t >= 8224 && t <= 8226 || t >= 8228 && t <= 8231 || t === 8240 || t === 8242 || t === 8243 || t === 8245 || t === 8251 || t === 8254 || t === 8308 || t === 8319 || t >= 8321 && t <= 8324 || t === 8364 || t === 8451 || t === 8453 || t === 8457 || t === 8467 || t === 8470 || t === 8481 || t === 8482 || t === 8486 || t === 8491 || t === 8531 || t === 8532 || t >= 8539 && t <= 8542 || t >= 8544 && t <= 8555 || t >= 8560 && t <= 8569 || t === 8585 || t >= 8592 && t <= 8601 || t === 8632 || t === 8633 || t === 8658 || t === 8660 || t === 8679 || t === 8704 || t === 8706 || t === 8707 || t === 8711 || t === 8712 || t === 8715 || t === 8719 || t === 8721 || t === 8725 || t === 8730 || t >= 8733 && t <= 8736 || t === 8739 || t === 8741 || t >= 8743 && t <= 8748 || t === 8750 || t >= 8756 && t <= 8759 || t === 8764 || t === 8765 || t === 8776 || t === 8780 || t === 8786 || t === 8800 || t === 8801 || t >= 8804 && t <= 8807 || t === 8810 || t === 8811 || t === 8814 || t === 8815 || t === 8834 || t === 8835 || t === 8838 || t === 8839 || t === 8853 || t === 8857 || t === 8869 || t === 8895 || t === 8978 || t >= 9312 && t <= 9449 || t >= 9451 && t <= 9547 || t >= 9552 && t <= 9587 || t >= 9600 && t <= 9615 || t >= 9618 && t <= 9621 || t === 9632 || t === 9633 || t >= 9635 && t <= 9641 || t === 9650 || t === 9651 || t === 9654 || t === 9655 || t === 9660 || t === 9661 || t === 9664 || t === 9665 || t >= 9670 && t <= 9672 || t === 9675 || t >= 9678 && t <= 9681 || t >= 9698 && t <= 9701 || t === 9711 || t === 9733 || t === 9734 || t === 9737 || t === 9742 || t === 9743 || t === 9756 || t === 9758 || t === 9792 || t === 9794 || t === 9824 || t === 9825 || t >= 9827 && t <= 9829 || t >= 9831 && t <= 9834 || t === 9836 || t === 9837 || t === 9839 || t === 9886 || t === 9887 || t === 9919 || t >= 9926 && t <= 9933 || t >= 9935 && t <= 9939 || t >= 9941 && t <= 9953 || t === 9955 || t === 9960 || t === 9961 || t >= 9963 && t <= 9969 || t === 9972 || t >= 9974 && t <= 9977 || t === 9979 || t === 9980 || t === 9982 || t === 9983 || t === 10045 || t >= 10102 && t <= 10111 || t >= 11094 && t <= 11097 || t >= 12872 && t <= 12879 || t >= 57344 && t <= 63743 || t >= 65024 && t <= 65039 || t === 65533 || t >= 127232 && t <= 127242 || t >= 127248 && t <= 127277 || t >= 127280 && t <= 127337 || t >= 127344 && t <= 127373 || t === 127375 || t === 127376 || t >= 127387 && t <= 127404 || t >= 917760 && t <= 917999 || t >= 983040 && t <= 1048573 || t >= 1048576 && t <= 1114109;
var lt = (t) => t === 12288 || t >= 65281 && t <= 65376 || t >= 65504 && t <= 65510;
var ht = (t) => t >= 4352 && t <= 4447 || t === 8986 || t === 8987 || t === 9001 || t === 9002 || t >= 9193 && t <= 9196 || t === 9200 || t === 9203 || t === 9725 || t === 9726 || t === 9748 || t === 9749 || t >= 9800 && t <= 9811 || t === 9855 || t === 9875 || t === 9889 || t === 9898 || t === 9899 || t === 9917 || t === 9918 || t === 9924 || t === 9925 || t === 9934 || t === 9940 || t === 9962 || t === 9970 || t === 9971 || t === 9973 || t === 9978 || t === 9981 || t === 9989 || t === 9994 || t === 9995 || t === 10024 || t === 10060 || t === 10062 || t >= 10067 && t <= 10069 || t === 10071 || t >= 10133 && t <= 10135 || t === 10160 || t === 10175 || t === 11035 || t === 11036 || t === 11088 || t === 11093 || t >= 11904 && t <= 11929 || t >= 11931 && t <= 12019 || t >= 12032 && t <= 12245 || t >= 12272 && t <= 12287 || t >= 12289 && t <= 12350 || t >= 12353 && t <= 12438 || t >= 12441 && t <= 12543 || t >= 12549 && t <= 12591 || t >= 12593 && t <= 12686 || t >= 12688 && t <= 12771 || t >= 12783 && t <= 12830 || t >= 12832 && t <= 12871 || t >= 12880 && t <= 19903 || t >= 19968 && t <= 42124 || t >= 42128 && t <= 42182 || t >= 43360 && t <= 43388 || t >= 44032 && t <= 55203 || t >= 63744 && t <= 64255 || t >= 65040 && t <= 65049 || t >= 65072 && t <= 65106 || t >= 65108 && t <= 65126 || t >= 65128 && t <= 65131 || t >= 94176 && t <= 94180 || t === 94192 || t === 94193 || t >= 94208 && t <= 100343 || t >= 100352 && t <= 101589 || t >= 101632 && t <= 101640 || t >= 110576 && t <= 110579 || t >= 110581 && t <= 110587 || t === 110589 || t === 110590 || t >= 110592 && t <= 110882 || t === 110898 || t >= 110928 && t <= 110930 || t === 110933 || t >= 110948 && t <= 110951 || t >= 110960 && t <= 111355 || t === 126980 || t === 127183 || t === 127374 || t >= 127377 && t <= 127386 || t >= 127488 && t <= 127490 || t >= 127504 && t <= 127547 || t >= 127552 && t <= 127560 || t === 127568 || t === 127569 || t >= 127584 && t <= 127589 || t >= 127744 && t <= 127776 || t >= 127789 && t <= 127797 || t >= 127799 && t <= 127868 || t >= 127870 && t <= 127891 || t >= 127904 && t <= 127946 || t >= 127951 && t <= 127955 || t >= 127968 && t <= 127984 || t === 127988 || t >= 127992 && t <= 128062 || t === 128064 || t >= 128066 && t <= 128252 || t >= 128255 && t <= 128317 || t >= 128331 && t <= 128334 || t >= 128336 && t <= 128359 || t === 128378 || t === 128405 || t === 128406 || t === 128420 || t >= 128507 && t <= 128591 || t >= 128640 && t <= 128709 || t === 128716 || t >= 128720 && t <= 128722 || t >= 128725 && t <= 128727 || t >= 128732 && t <= 128735 || t === 128747 || t === 128748 || t >= 128756 && t <= 128764 || t >= 128992 && t <= 129003 || t === 129008 || t >= 129292 && t <= 129338 || t >= 129340 && t <= 129349 || t >= 129351 && t <= 129535 || t >= 129648 && t <= 129660 || t >= 129664 && t <= 129672 || t >= 129680 && t <= 129725 || t >= 129727 && t <= 129733 || t >= 129742 && t <= 129755 || t >= 129760 && t <= 129768 || t >= 129776 && t <= 129784 || t >= 131072 && t <= 196605 || t >= 196608 && t <= 262141;
var O = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y;
var y = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
var L = /\t{1,1000}/y;
var P = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/yu;
var M = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
var ct = /\p{M}+/gu;
var ft = { limit: 1 / 0, ellipsis: "" };
var X = (t, e = {}, s = {}) => {
  const i = e.limit ?? 1 / 0, r = e.ellipsis ?? "", n = e?.ellipsisWidth ?? (r ? X(r, ft, s).width : 0), u = s.ansiWidth ?? 0, a = s.controlWidth ?? 0, l = s.tabWidth ?? 8, E = s.ambiguousWidth ?? 1, g = s.emojiWidth ?? 2, m = s.fullWidthWidth ?? 2, A = s.regularWidth ?? 1, V = s.wideWidth ?? 2;
  let h = 0, o = 0, p = t.length, v = 0, F = false, d = p, b = Math.max(0, i - n), C = 0, w = 0, c = 0, f = 0;
  t:
    for (;; ) {
      if (w > C || o >= p && o > h) {
        const ut = t.slice(C, w) || t.slice(h, o);
        v = 0;
        for (const Y of ut.replaceAll(ct, "")) {
          const $ = Y.codePointAt(0) || 0;
          if (lt($) ? f = m : ht($) ? f = V : E !== A && at($) ? f = E : f = A, c + f > b && (d = Math.min(d, Math.max(C, h) + v)), c + f > i) {
            F = true;
            break t;
          }
          v += Y.length, c += f;
        }
        C = w = 0;
      }
      if (o >= p)
        break;
      if (M.lastIndex = o, M.test(t)) {
        if (v = M.lastIndex - o, f = v * A, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / A))), c + f > i) {
          F = true;
          break;
        }
        c += f, C = h, w = o, o = h = M.lastIndex;
        continue;
      }
      if (O.lastIndex = o, O.test(t)) {
        if (c + u > b && (d = Math.min(d, o)), c + u > i) {
          F = true;
          break;
        }
        c += u, C = h, w = o, o = h = O.lastIndex;
        continue;
      }
      if (y.lastIndex = o, y.test(t)) {
        if (v = y.lastIndex - o, f = v * a, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / a))), c + f > i) {
          F = true;
          break;
        }
        c += f, C = h, w = o, o = h = y.lastIndex;
        continue;
      }
      if (L.lastIndex = o, L.test(t)) {
        if (v = L.lastIndex - o, f = v * l, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / l))), c + f > i) {
          F = true;
          break;
        }
        c += f, C = h, w = o, o = h = L.lastIndex;
        continue;
      }
      if (P.lastIndex = o, P.test(t)) {
        if (c + g > b && (d = Math.min(d, o)), c + g > i) {
          F = true;
          break;
        }
        c += g, C = h, w = o, o = h = P.lastIndex;
        continue;
      }
      o += 1;
    }
  return { width: F ? b : c, index: F ? d : p, truncated: F, ellipsed: F && i >= n };
};
var pt = { limit: 1 / 0, ellipsis: "", ellipsisWidth: 0 };
var S = (t, e = {}) => X(t, pt, e).width;
var T = "\x1B";
var Z = "\x9B";
var Ft = 39;
var j = "\x07";
var Q = "[";
var dt = "]";
var tt = "m";
var U = `${dt}8;;`;
var et = new RegExp(`(?:\\${Q}(?<code>\\d+)m|\\${U}(?<uri>.*)${j})`, "y");
var mt = (t) => {
  if (t >= 30 && t <= 37 || t >= 90 && t <= 97)
    return 39;
  if (t >= 40 && t <= 47 || t >= 100 && t <= 107)
    return 49;
  if (t === 1 || t === 2)
    return 22;
  if (t === 3)
    return 23;
  if (t === 4)
    return 24;
  if (t === 7)
    return 27;
  if (t === 8)
    return 28;
  if (t === 9)
    return 29;
  if (t === 0)
    return 0;
};
var st = (t) => `${T}${Q}${t}${tt}`;
var it = (t) => `${T}${U}${t}${j}`;
var gt = (t) => t.map((e) => S(e));
var G = (t, e, s) => {
  const i = e[Symbol.iterator]();
  let r = false, n = false, u = t.at(-1), a = u === undefined ? 0 : S(u), l = i.next(), E = i.next(), g = 0;
  for (;!l.done; ) {
    const m = l.value, A = S(m);
    a + A <= s ? t[t.length - 1] += m : (t.push(m), a = 0), (m === T || m === Z) && (r = true, n = e.startsWith(U, g + 1)), r ? n ? m === j && (r = false, n = false) : m === tt && (r = false) : (a += A, a === s && !E.done && (t.push(""), a = 0)), l = E, E = i.next(), g += m.length;
  }
  u = t.at(-1), !a && u !== undefined && u.length > 0 && t.length > 1 && (t[t.length - 2] += t.pop());
};
var vt = (t) => {
  const e = t.split(" ");
  let s = e.length;
  for (;s > 0 && !(S(e[s - 1]) > 0); )
    s--;
  return s === e.length ? t : e.slice(0, s).join(" ") + e.slice(s).join("");
};
var Et = (t, e, s = {}) => {
  if (s.trim !== false && t.trim() === "")
    return "";
  let i = "", r, n;
  const u = t.split(" "), a = gt(u);
  let l = [""];
  for (const [h, o] of u.entries()) {
    s.trim !== false && (l[l.length - 1] = (l.at(-1) ?? "").trimStart());
    let p = S(l.at(-1) ?? "");
    if (h !== 0 && (p >= e && (s.wordWrap === false || s.trim === false) && (l.push(""), p = 0), (p > 0 || s.trim === false) && (l[l.length - 1] += " ", p++)), s.hard && a[h] > e) {
      const v = e - p, F = 1 + Math.floor((a[h] - v - 1) / e);
      Math.floor((a[h] - 1) / e) < F && l.push(""), G(l, o, e);
      continue;
    }
    if (p + a[h] > e && p > 0 && a[h] > 0) {
      if (s.wordWrap === false && p < e) {
        G(l, o, e);
        continue;
      }
      l.push("");
    }
    if (p + a[h] > e && s.wordWrap === false) {
      G(l, o, e);
      continue;
    }
    l[l.length - 1] += o;
  }
  s.trim !== false && (l = l.map((h) => vt(h)));
  const E = l.join(`
`), g = E[Symbol.iterator]();
  let m = g.next(), A = g.next(), V = 0;
  for (;!m.done; ) {
    const h = m.value, o = A.value;
    if (i += h, h === T || h === Z) {
      et.lastIndex = V + 1;
      const F = et.exec(E)?.groups;
      if (F?.code !== undefined) {
        const d = Number.parseFloat(F.code);
        r = d === Ft ? undefined : d;
      } else
        F?.uri !== undefined && (n = F.uri.length === 0 ? undefined : F.uri);
    }
    const p = r ? mt(r) : undefined;
    o === `
` ? (n && (i += it("")), r && p && (i += st(p))) : h === `
` && (r && p && (i += st(r)), n && (i += it(n))), V += h.length, m = A, A = g.next();
  }
  return i;
};
function K(t, e, s) {
  return String(t).normalize().replaceAll(`\r
`, `
`).split(`
`).map((i) => Et(i, e, s)).join(`
`);
}
var At = ["up", "down", "left", "right", "space", "enter", "cancel"];
var _ = { actions: new Set(At), aliases: new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["\x03", "cancel"], ["escape", "cancel"]]), messages: { cancel: "Canceled", error: "Something went wrong" }, withGuide: true };
function H(t, e) {
  if (typeof t == "string")
    return _.aliases.get(t) === e;
  for (const s of t)
    if (s !== undefined && H(s, e))
      return true;
  return false;
}
function _t(t, e) {
  if (t === e)
    return;
  const s = t.split(`
`), i = e.split(`
`), r = Math.max(s.length, i.length), n = [];
  for (let u = 0;u < r; u++)
    s[u] !== i[u] && n.push(u);
  return { lines: n, numLinesBefore: s.length, numLinesAfter: i.length, numLines: r };
}
var bt = globalThis.process.platform.startsWith("win");
var z = Symbol("clack:cancel");
function Ct(t) {
  return t === z;
}
function W(t, e) {
  const s = t;
  s.isTTY && s.setRawMode(e);
}
function xt({ input: t = q, output: e = R, overwrite: s = true, hideCursor: i = true } = {}) {
  const r = k.createInterface({ input: t, output: e, prompt: "", tabSize: 1 });
  k.emitKeypressEvents(t, r), t instanceof J && t.isTTY && t.setRawMode(true);
  const n = (u, { name: a, sequence: l }) => {
    const E = String(u);
    if (H([E, a, l], "cancel")) {
      i && e.write(import_sisteransi.cursor.show), process.exit(0);
      return;
    }
    if (!s)
      return;
    const g = a === "return" ? 0 : -1, m = a === "return" ? -1 : 0;
    k.moveCursor(e, g, m, () => {
      k.clearLine(e, 1, () => {
        t.once("keypress", n);
      });
    });
  };
  return i && e.write(import_sisteransi.cursor.hide), t.once("keypress", n), () => {
    t.off("keypress", n), i && e.write(import_sisteransi.cursor.show), t instanceof J && t.isTTY && !bt && t.setRawMode(false), r.terminal = false, r.close();
  };
}
var rt = (t) => ("columns" in t) && typeof t.columns == "number" ? t.columns : 80;
var nt = (t) => ("rows" in t) && typeof t.rows == "number" ? t.rows : 20;
function Bt(t, e, s, i = s) {
  const r = rt(t ?? R);
  return K(e, r - s.length, { hard: true, trim: false }).split(`
`).map((n, u) => `${u === 0 ? i : s}${n}`).join(`
`);
}

class B {
  input;
  output;
  _abortSignal;
  rl;
  opts;
  _render;
  _track = false;
  _prevFrame = "";
  _subscribers = new Map;
  _cursor = 0;
  state = "initial";
  error = "";
  value;
  userInput = "";
  constructor(e, s = true) {
    const { input: i = q, output: r = R, render: n, signal: u, ...a } = e;
    this.opts = a, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = n.bind(this), this._track = s, this._abortSignal = u, this.input = i, this.output = r;
  }
  unsubscribe() {
    this._subscribers.clear();
  }
  setSubscriber(e, s) {
    const i = this._subscribers.get(e) ?? [];
    i.push(s), this._subscribers.set(e, i);
  }
  on(e, s) {
    this.setSubscriber(e, { cb: s });
  }
  once(e, s) {
    this.setSubscriber(e, { cb: s, once: true });
  }
  emit(e, ...s) {
    const i = this._subscribers.get(e) ?? [], r = [];
    for (const n of i)
      n.cb(...s), n.once && r.push(() => i.splice(i.indexOf(n), 1));
    for (const n of r)
      n();
  }
  prompt() {
    return new Promise((e) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted)
          return this.state = "cancel", this.close(), e(z);
        this._abortSignal.addEventListener("abort", () => {
          this.state = "cancel", this.close();
        }, { once: true });
      }
      this.rl = ot.createInterface({ input: this.input, tabSize: 2, prompt: "", escapeCodeTimeout: 50, terminal: true }), this.rl.prompt(), this.opts.initialUserInput !== undefined && this._setUserInput(this.opts.initialUserInput, true), this.input.on("keypress", this.onKeypress), W(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), W(this.input, false), e(this.value);
      }), this.once("cancel", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), W(this.input, false), e(z);
      });
    });
  }
  _isActionKey(e, s) {
    return e === "\t";
  }
  _setValue(e) {
    this.value = e, this.emit("value", this.value);
  }
  _setUserInput(e, s) {
    this.userInput = e ?? "", this.emit("userInput", this.userInput), s && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
  }
  _clearUserInput() {
    this.rl?.write(null, { ctrl: true, name: "u" }), this._setUserInput("");
  }
  onKeypress(e, s) {
    if (this._track && s.name !== "return" && (s.name && this._isActionKey(e, s) && this.rl?.write(null, { ctrl: true, name: "h" }), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), s?.name && (!this._track && _.aliases.has(s.name) && this.emit("cursor", _.aliases.get(s.name)), _.actions.has(s.name) && this.emit("cursor", s.name)), e && (e.toLowerCase() === "y" || e.toLowerCase() === "n") && this.emit("confirm", e.toLowerCase() === "y"), this.emit("key", e?.toLowerCase(), s), s?.name === "return") {
      if (this.opts.validate) {
        const i = this.opts.validate(this.value);
        i && (this.error = i instanceof Error ? i.message : i, this.state = "error", this.rl?.write(this.userInput));
      }
      this.state !== "error" && (this.state = "submit");
    }
    H([e, s?.name, s?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), W(this.input, false), this.rl?.close(), this.rl = undefined, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const e = K(this._prevFrame, process.stdout.columns, { hard: true, trim: false }).split(`
`).length - 1;
    this.output.write(import_sisteransi.cursor.move(-999, e * -1));
  }
  render() {
    const e = K(this._render(this) ?? "", process.stdout.columns, { hard: true, trim: false });
    if (e !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(import_sisteransi.cursor.hide);
      else {
        const s = _t(this._prevFrame, e), i = nt(this.output);
        if (this.restoreCursor(), s) {
          const r = Math.max(0, s.numLinesAfter - i), n = Math.max(0, s.numLinesBefore - i);
          let u = s.lines.find((a) => a >= r);
          if (u === undefined) {
            this._prevFrame = e;
            return;
          }
          if (s.lines.length === 1) {
            this.output.write(import_sisteransi.cursor.move(0, u - n)), this.output.write(import_sisteransi.erase.lines(1));
            const a = e.split(`
`);
            this.output.write(a[u]), this._prevFrame = e, this.output.write(import_sisteransi.cursor.move(0, a.length - u - 1));
            return;
          } else if (s.lines.length > 1) {
            if (r < n)
              u = r;
            else {
              const l = u - n;
              l > 0 && this.output.write(import_sisteransi.cursor.move(0, l));
            }
            this.output.write(import_sisteransi.erase.down());
            const a = e.split(`
`).slice(u);
            this.output.write(a.join(`
`)), this._prevFrame = e;
            return;
          }
        }
        this.output.write(import_sisteransi.erase.down());
      }
      this.output.write(e), this.state === "initial" && (this.state = "active"), this._prevFrame = e;
    }
  }
}
function wt(t, e) {
  if (t === undefined || e.length === 0)
    return 0;
  const s = e.findIndex((i) => i.value === t);
  return s !== -1 ? s : 0;
}
function Dt(t, e) {
  return (e.label ?? String(e.value)).toLowerCase().includes(t.toLowerCase());
}
function St(t, e) {
  if (e)
    return t ? e : e[0];
}

class Vt extends B {
  filteredOptions;
  multiple;
  isNavigating = false;
  selectedValues = [];
  focusedValue;
  #t = 0;
  #s = "";
  #i;
  #e;
  get cursor() {
    return this.#t;
  }
  get userInputWithCursor() {
    if (!this.userInput)
      return D(["inverse", "hidden"], "_");
    if (this._cursor >= this.userInput.length)
      return `${this.userInput}\u2588`;
    const e = this.userInput.slice(0, this._cursor), [s, ...i] = this.userInput.slice(this._cursor);
    return `${e}${D("inverse", s)}${i.join("")}`;
  }
  get options() {
    return typeof this.#e == "function" ? this.#e() : this.#e;
  }
  constructor(e) {
    super(e), this.#e = e.options;
    const s = this.options;
    this.filteredOptions = [...s], this.multiple = e.multiple === true, this.#i = e.filter ?? Dt;
    let i;
    if (e.initialValue && Array.isArray(e.initialValue) ? this.multiple ? i = e.initialValue : i = e.initialValue.slice(0, 1) : !this.multiple && this.options.length > 0 && (i = [this.options[0].value]), i)
      for (const r of i) {
        const n = s.findIndex((u) => u.value === r);
        n !== -1 && (this.toggleSelected(r), this.#t = n);
      }
    this.focusedValue = this.options[this.#t]?.value, this.on("key", (r, n) => this.#r(r, n)), this.on("userInput", (r) => this.#n(r));
  }
  _isActionKey(e, s) {
    return e === "\t" || this.multiple && this.isNavigating && s.name === "space" && e !== undefined && e !== "";
  }
  #r(e, s) {
    const i = s.name === "up", r = s.name === "down", n = s.name === "return";
    i || r ? (this.#t = x(this.#t, i ? -1 : 1, this.filteredOptions), this.focusedValue = this.filteredOptions[this.#t]?.value, this.multiple || (this.selectedValues = [this.focusedValue]), this.isNavigating = true) : n ? this.value = St(this.multiple, this.selectedValues) : this.multiple ? this.focusedValue !== undefined && (s.name === "tab" || this.isNavigating && s.name === "space") ? this.toggleSelected(this.focusedValue) : this.isNavigating = false : (this.focusedValue && (this.selectedValues = [this.focusedValue]), this.isNavigating = false);
  }
  deselectAll() {
    this.selectedValues = [];
  }
  toggleSelected(e) {
    this.filteredOptions.length !== 0 && (this.multiple ? this.selectedValues.includes(e) ? this.selectedValues = this.selectedValues.filter((s) => s !== e) : this.selectedValues = [...this.selectedValues, e] : this.selectedValues = [e]);
  }
  #n(e) {
    if (e !== this.#s) {
      this.#s = e;
      const s = this.options;
      e ? this.filteredOptions = s.filter((n) => this.#i(e, n)) : this.filteredOptions = [...s];
      const i = wt(this.focusedValue, this.filteredOptions);
      this.#t = x(i, 0, this.filteredOptions);
      const r = this.filteredOptions[this.#t];
      r && !r.disabled ? this.focusedValue = r.value : this.focusedValue = undefined, this.multiple || (this.focusedValue !== undefined ? this.toggleSelected(this.focusedValue) : this.deselectAll());
    }
  }
}

class kt extends B {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(e) {
    super(e, false), this.value = !!e.initialValue, this.on("userInput", () => {
      this.value = this._value;
    }), this.on("confirm", (s) => {
      this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = s, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
}

class yt extends B {
  options;
  cursor = 0;
  #t;
  getGroupItems(e) {
    return this.options.filter((s) => s.group === e);
  }
  isGroupSelected(e) {
    const s = this.getGroupItems(e), i = this.value;
    return i === undefined ? false : s.every((r) => i.includes(r.value));
  }
  toggleValue() {
    const e = this.options[this.cursor];
    if (this.value === undefined && (this.value = []), e.group === true) {
      const s = e.value, i = this.getGroupItems(s);
      this.isGroupSelected(s) ? this.value = this.value.filter((r) => i.findIndex((n) => n.value === r) === -1) : this.value = [...this.value, ...i.map((r) => r.value)], this.value = Array.from(new Set(this.value));
    } else {
      const s = this.value.includes(e.value);
      this.value = s ? this.value.filter((i) => i !== e.value) : [...this.value, e.value];
    }
  }
  constructor(e) {
    super(e, false);
    const { options: s } = e;
    this.#t = e.selectableGroups !== false, this.options = Object.entries(s).flatMap(([i, r]) => [{ value: i, group: true, label: i }, ...r.map((n) => ({ ...n, group: i }))]), this.value = [...e.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: i }) => i === e.cursorAt), this.#t ? 0 : 1), this.on("cursor", (i) => {
      switch (i) {
        case "left":
        case "up": {
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          const r = this.options[this.cursor]?.group === true;
          !this.#t && r && (this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1);
          break;
        }
        case "down":
        case "right": {
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          const r = this.options[this.cursor]?.group === true;
          !this.#t && r && (this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1);
          break;
        }
        case "space":
          this.toggleValue();
          break;
      }
    });
  }
}
class Tt extends B {
  options;
  cursor = 0;
  get _selectedValue() {
    return this.options[this.cursor];
  }
  changeValue() {
    this.value = this._selectedValue.value;
  }
  constructor(e) {
    super(e, false), this.options = e.options;
    const s = this.options.findIndex(({ value: r }) => r === e.initialValue), i = s === -1 ? 0 : s;
    this.cursor = this.options[i].disabled ? x(i, 1, this.options) : i, this.changeValue(), this.on("cursor", (r) => {
      switch (r) {
        case "left":
        case "up":
          this.cursor = x(this.cursor, -1, this.options);
          break;
        case "down":
        case "right":
          this.cursor = x(this.cursor, 1, this.options);
          break;
      }
      this.changeValue();
    });
  }
}

// node_modules/@clack/prompts/dist/index.mjs
import { styleText as t, stripVTControlCharacters as ue } from "util";
import N2 from "process";
var import_sisteransi2 = __toESM(require_src(), 1);
function pt2() {
  return N2.platform !== "win32" ? N2.env.TERM !== "linux" : !!N2.env.CI || !!N2.env.WT_SESSION || !!N2.env.TERMINUS_SUBLIME || N2.env.ConEmuTask === "{cmd::Cmder}" || N2.env.TERM_PROGRAM === "Terminus-Sublime" || N2.env.TERM_PROGRAM === "vscode" || N2.env.TERM === "xterm-256color" || N2.env.TERM === "alacritty" || N2.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var ee = pt2();
var ce = () => process.env.CI === "true";
var I2 = (e, r) => ee ? e : r;
var Re = I2("\u25C6", "*");
var $e = I2("\u25A0", "x");
var de = I2("\u25B2", "x");
var V = I2("\u25C7", "o");
var he = I2("\u250C", "T");
var h = I2("\u2502", "|");
var x2 = I2("\u2514", "\u2014");
var Oe = I2("\u2510", "T");
var Pe = I2("\u2518", "\u2014");
var z2 = I2("\u25CF", ">");
var H2 = I2("\u25CB", " ");
var te = I2("\u25FB", "[\u2022]");
var U2 = I2("\u25FC", "[+]");
var q2 = I2("\u25FB", "[ ]");
var Ne = I2("\u25AA", "\u2022");
var se = I2("\u2500", "-");
var pe = I2("\u256E", "+");
var We = I2("\u251C", "+");
var me = I2("\u256F", "+");
var ge = I2("\u2570", "+");
var Ge = I2("\u256D", "+");
var fe = I2("\u25CF", "\u2022");
var Fe = I2("\u25C6", "*");
var ye = I2("\u25B2", "!");
var Ee = I2("\u25A0", "x");
var W2 = (e) => {
  switch (e) {
    case "initial":
    case "active":
      return t("cyan", Re);
    case "cancel":
      return t("red", $e);
    case "error":
      return t("yellow", de);
    case "submit":
      return t("green", V);
  }
};
var ve = (e) => {
  switch (e) {
    case "initial":
    case "active":
      return t("cyan", h);
    case "cancel":
      return t("red", h);
    case "error":
      return t("yellow", h);
    case "submit":
      return t("green", h);
  }
};
var mt2 = (e) => e === 161 || e === 164 || e === 167 || e === 168 || e === 170 || e === 173 || e === 174 || e >= 176 && e <= 180 || e >= 182 && e <= 186 || e >= 188 && e <= 191 || e === 198 || e === 208 || e === 215 || e === 216 || e >= 222 && e <= 225 || e === 230 || e >= 232 && e <= 234 || e === 236 || e === 237 || e === 240 || e === 242 || e === 243 || e >= 247 && e <= 250 || e === 252 || e === 254 || e === 257 || e === 273 || e === 275 || e === 283 || e === 294 || e === 295 || e === 299 || e >= 305 && e <= 307 || e === 312 || e >= 319 && e <= 322 || e === 324 || e >= 328 && e <= 331 || e === 333 || e === 338 || e === 339 || e === 358 || e === 359 || e === 363 || e === 462 || e === 464 || e === 466 || e === 468 || e === 470 || e === 472 || e === 474 || e === 476 || e === 593 || e === 609 || e === 708 || e === 711 || e >= 713 && e <= 715 || e === 717 || e === 720 || e >= 728 && e <= 731 || e === 733 || e === 735 || e >= 768 && e <= 879 || e >= 913 && e <= 929 || e >= 931 && e <= 937 || e >= 945 && e <= 961 || e >= 963 && e <= 969 || e === 1025 || e >= 1040 && e <= 1103 || e === 1105 || e === 8208 || e >= 8211 && e <= 8214 || e === 8216 || e === 8217 || e === 8220 || e === 8221 || e >= 8224 && e <= 8226 || e >= 8228 && e <= 8231 || e === 8240 || e === 8242 || e === 8243 || e === 8245 || e === 8251 || e === 8254 || e === 8308 || e === 8319 || e >= 8321 && e <= 8324 || e === 8364 || e === 8451 || e === 8453 || e === 8457 || e === 8467 || e === 8470 || e === 8481 || e === 8482 || e === 8486 || e === 8491 || e === 8531 || e === 8532 || e >= 8539 && e <= 8542 || e >= 8544 && e <= 8555 || e >= 8560 && e <= 8569 || e === 8585 || e >= 8592 && e <= 8601 || e === 8632 || e === 8633 || e === 8658 || e === 8660 || e === 8679 || e === 8704 || e === 8706 || e === 8707 || e === 8711 || e === 8712 || e === 8715 || e === 8719 || e === 8721 || e === 8725 || e === 8730 || e >= 8733 && e <= 8736 || e === 8739 || e === 8741 || e >= 8743 && e <= 8748 || e === 8750 || e >= 8756 && e <= 8759 || e === 8764 || e === 8765 || e === 8776 || e === 8780 || e === 8786 || e === 8800 || e === 8801 || e >= 8804 && e <= 8807 || e === 8810 || e === 8811 || e === 8814 || e === 8815 || e === 8834 || e === 8835 || e === 8838 || e === 8839 || e === 8853 || e === 8857 || e === 8869 || e === 8895 || e === 8978 || e >= 9312 && e <= 9449 || e >= 9451 && e <= 9547 || e >= 9552 && e <= 9587 || e >= 9600 && e <= 9615 || e >= 9618 && e <= 9621 || e === 9632 || e === 9633 || e >= 9635 && e <= 9641 || e === 9650 || e === 9651 || e === 9654 || e === 9655 || e === 9660 || e === 9661 || e === 9664 || e === 9665 || e >= 9670 && e <= 9672 || e === 9675 || e >= 9678 && e <= 9681 || e >= 9698 && e <= 9701 || e === 9711 || e === 9733 || e === 9734 || e === 9737 || e === 9742 || e === 9743 || e === 9756 || e === 9758 || e === 9792 || e === 9794 || e === 9824 || e === 9825 || e >= 9827 && e <= 9829 || e >= 9831 && e <= 9834 || e === 9836 || e === 9837 || e === 9839 || e === 9886 || e === 9887 || e === 9919 || e >= 9926 && e <= 9933 || e >= 9935 && e <= 9939 || e >= 9941 && e <= 9953 || e === 9955 || e === 9960 || e === 9961 || e >= 9963 && e <= 9969 || e === 9972 || e >= 9974 && e <= 9977 || e === 9979 || e === 9980 || e === 9982 || e === 9983 || e === 10045 || e >= 10102 && e <= 10111 || e >= 11094 && e <= 11097 || e >= 12872 && e <= 12879 || e >= 57344 && e <= 63743 || e >= 65024 && e <= 65039 || e === 65533 || e >= 127232 && e <= 127242 || e >= 127248 && e <= 127277 || e >= 127280 && e <= 127337 || e >= 127344 && e <= 127373 || e === 127375 || e === 127376 || e >= 127387 && e <= 127404 || e >= 917760 && e <= 917999 || e >= 983040 && e <= 1048573 || e >= 1048576 && e <= 1114109;
var gt2 = (e) => e === 12288 || e >= 65281 && e <= 65376 || e >= 65504 && e <= 65510;
var ft2 = (e) => e >= 4352 && e <= 4447 || e === 8986 || e === 8987 || e === 9001 || e === 9002 || e >= 9193 && e <= 9196 || e === 9200 || e === 9203 || e === 9725 || e === 9726 || e === 9748 || e === 9749 || e >= 9800 && e <= 9811 || e === 9855 || e === 9875 || e === 9889 || e === 9898 || e === 9899 || e === 9917 || e === 9918 || e === 9924 || e === 9925 || e === 9934 || e === 9940 || e === 9962 || e === 9970 || e === 9971 || e === 9973 || e === 9978 || e === 9981 || e === 9989 || e === 9994 || e === 9995 || e === 10024 || e === 10060 || e === 10062 || e >= 10067 && e <= 10069 || e === 10071 || e >= 10133 && e <= 10135 || e === 10160 || e === 10175 || e === 11035 || e === 11036 || e === 11088 || e === 11093 || e >= 11904 && e <= 11929 || e >= 11931 && e <= 12019 || e >= 12032 && e <= 12245 || e >= 12272 && e <= 12287 || e >= 12289 && e <= 12350 || e >= 12353 && e <= 12438 || e >= 12441 && e <= 12543 || e >= 12549 && e <= 12591 || e >= 12593 && e <= 12686 || e >= 12688 && e <= 12771 || e >= 12783 && e <= 12830 || e >= 12832 && e <= 12871 || e >= 12880 && e <= 19903 || e >= 19968 && e <= 42124 || e >= 42128 && e <= 42182 || e >= 43360 && e <= 43388 || e >= 44032 && e <= 55203 || e >= 63744 && e <= 64255 || e >= 65040 && e <= 65049 || e >= 65072 && e <= 65106 || e >= 65108 && e <= 65126 || e >= 65128 && e <= 65131 || e >= 94176 && e <= 94180 || e === 94192 || e === 94193 || e >= 94208 && e <= 100343 || e >= 100352 && e <= 101589 || e >= 101632 && e <= 101640 || e >= 110576 && e <= 110579 || e >= 110581 && e <= 110587 || e === 110589 || e === 110590 || e >= 110592 && e <= 110882 || e === 110898 || e >= 110928 && e <= 110930 || e === 110933 || e >= 110948 && e <= 110951 || e >= 110960 && e <= 111355 || e === 126980 || e === 127183 || e === 127374 || e >= 127377 && e <= 127386 || e >= 127488 && e <= 127490 || e >= 127504 && e <= 127547 || e >= 127552 && e <= 127560 || e === 127568 || e === 127569 || e >= 127584 && e <= 127589 || e >= 127744 && e <= 127776 || e >= 127789 && e <= 127797 || e >= 127799 && e <= 127868 || e >= 127870 && e <= 127891 || e >= 127904 && e <= 127946 || e >= 127951 && e <= 127955 || e >= 127968 && e <= 127984 || e === 127988 || e >= 127992 && e <= 128062 || e === 128064 || e >= 128066 && e <= 128252 || e >= 128255 && e <= 128317 || e >= 128331 && e <= 128334 || e >= 128336 && e <= 128359 || e === 128378 || e === 128405 || e === 128406 || e === 128420 || e >= 128507 && e <= 128591 || e >= 128640 && e <= 128709 || e === 128716 || e >= 128720 && e <= 128722 || e >= 128725 && e <= 128727 || e >= 128732 && e <= 128735 || e === 128747 || e === 128748 || e >= 128756 && e <= 128764 || e >= 128992 && e <= 129003 || e === 129008 || e >= 129292 && e <= 129338 || e >= 129340 && e <= 129349 || e >= 129351 && e <= 129535 || e >= 129648 && e <= 129660 || e >= 129664 && e <= 129672 || e >= 129680 && e <= 129725 || e >= 129727 && e <= 129733 || e >= 129742 && e <= 129755 || e >= 129760 && e <= 129768 || e >= 129776 && e <= 129784 || e >= 131072 && e <= 196605 || e >= 196608 && e <= 262141;
var we = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y;
var re = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
var ie = /\t{1,1000}/y;
var Ae = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/yu;
var ne = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
var Ft2 = /\p{M}+/gu;
var yt2 = { limit: 1 / 0, ellipsis: "" };
var Le = (e, r = {}, s = {}) => {
  const i = r.limit ?? 1 / 0, a = r.ellipsis ?? "", o = r?.ellipsisWidth ?? (a ? Le(a, yt2, s).width : 0), u = s.ansiWidth ?? 0, l = s.controlWidth ?? 0, n = s.tabWidth ?? 8, c = s.ambiguousWidth ?? 1, p = s.emojiWidth ?? 2, f = s.fullWidthWidth ?? 2, g = s.regularWidth ?? 1, E = s.wideWidth ?? 2;
  let $ = 0, m = 0, d = e.length, F = 0, y2 = false, v = d, C = Math.max(0, i - o), A = 0, b = 0, w = 0, S2 = 0;
  e:
    for (;; ) {
      if (b > A || m >= d && m > $) {
        const T2 = e.slice(A, b) || e.slice($, m);
        F = 0;
        for (const M2 of T2.replaceAll(Ft2, "")) {
          const O2 = M2.codePointAt(0) || 0;
          if (gt2(O2) ? S2 = f : ft2(O2) ? S2 = E : c !== g && mt2(O2) ? S2 = c : S2 = g, w + S2 > C && (v = Math.min(v, Math.max(A, $) + F)), w + S2 > i) {
            y2 = true;
            break e;
          }
          F += M2.length, w += S2;
        }
        A = b = 0;
      }
      if (m >= d)
        break;
      if (ne.lastIndex = m, ne.test(e)) {
        if (F = ne.lastIndex - m, S2 = F * g, w + S2 > C && (v = Math.min(v, m + Math.floor((C - w) / g))), w + S2 > i) {
          y2 = true;
          break;
        }
        w += S2, A = $, b = m, m = $ = ne.lastIndex;
        continue;
      }
      if (we.lastIndex = m, we.test(e)) {
        if (w + u > C && (v = Math.min(v, m)), w + u > i) {
          y2 = true;
          break;
        }
        w += u, A = $, b = m, m = $ = we.lastIndex;
        continue;
      }
      if (re.lastIndex = m, re.test(e)) {
        if (F = re.lastIndex - m, S2 = F * l, w + S2 > C && (v = Math.min(v, m + Math.floor((C - w) / l))), w + S2 > i) {
          y2 = true;
          break;
        }
        w += S2, A = $, b = m, m = $ = re.lastIndex;
        continue;
      }
      if (ie.lastIndex = m, ie.test(e)) {
        if (F = ie.lastIndex - m, S2 = F * n, w + S2 > C && (v = Math.min(v, m + Math.floor((C - w) / n))), w + S2 > i) {
          y2 = true;
          break;
        }
        w += S2, A = $, b = m, m = $ = ie.lastIndex;
        continue;
      }
      if (Ae.lastIndex = m, Ae.test(e)) {
        if (w + p > C && (v = Math.min(v, m)), w + p > i) {
          y2 = true;
          break;
        }
        w += p, A = $, b = m, m = $ = Ae.lastIndex;
        continue;
      }
      m += 1;
    }
  return { width: y2 ? C : w, index: y2 ? v : d, truncated: y2, ellipsed: y2 && i >= o };
};
var Et2 = { limit: 1 / 0, ellipsis: "", ellipsisWidth: 0 };
var D2 = (e, r = {}) => Le(e, Et2, r).width;
var ae = "\x1B";
var je = "\x9B";
var vt2 = 39;
var Ce = "\x07";
var ke = "[";
var wt2 = "]";
var Ve = "m";
var Se = `${wt2}8;;`;
var He = new RegExp(`(?:\\${ke}(?<code>\\d+)m|\\${Se}(?<uri>.*)${Ce})`, "y");
var At2 = (e) => {
  if (e >= 30 && e <= 37 || e >= 90 && e <= 97)
    return 39;
  if (e >= 40 && e <= 47 || e >= 100 && e <= 107)
    return 49;
  if (e === 1 || e === 2)
    return 22;
  if (e === 3)
    return 23;
  if (e === 4)
    return 24;
  if (e === 7)
    return 27;
  if (e === 8)
    return 28;
  if (e === 9)
    return 29;
  if (e === 0)
    return 0;
};
var Ue = (e) => `${ae}${ke}${e}${Ve}`;
var Ke = (e) => `${ae}${Se}${e}${Ce}`;
var Ct2 = (e) => e.map((r) => D2(r));
var Ie = (e, r, s) => {
  const i = r[Symbol.iterator]();
  let a = false, o = false, u = e.at(-1), l = u === undefined ? 0 : D2(u), n = i.next(), c = i.next(), p = 0;
  for (;!n.done; ) {
    const f = n.value, g = D2(f);
    l + g <= s ? e[e.length - 1] += f : (e.push(f), l = 0), (f === ae || f === je) && (a = true, o = r.startsWith(Se, p + 1)), a ? o ? f === Ce && (a = false, o = false) : f === Ve && (a = false) : (l += g, l === s && !c.done && (e.push(""), l = 0)), n = c, c = i.next(), p += f.length;
  }
  u = e.at(-1), !l && u !== undefined && u.length > 0 && e.length > 1 && (e[e.length - 2] += e.pop());
};
var St2 = (e) => {
  const r = e.split(" ");
  let s = r.length;
  for (;s > 0 && !(D2(r[s - 1]) > 0); )
    s--;
  return s === r.length ? e : r.slice(0, s).join(" ") + r.slice(s).join("");
};
var It2 = (e, r, s = {}) => {
  if (s.trim !== false && e.trim() === "")
    return "";
  let i = "", a, o;
  const u = e.split(" "), l = Ct2(u);
  let n = [""];
  for (const [$, m] of u.entries()) {
    s.trim !== false && (n[n.length - 1] = (n.at(-1) ?? "").trimStart());
    let d = D2(n.at(-1) ?? "");
    if ($ !== 0 && (d >= r && (s.wordWrap === false || s.trim === false) && (n.push(""), d = 0), (d > 0 || s.trim === false) && (n[n.length - 1] += " ", d++)), s.hard && l[$] > r) {
      const F = r - d, y2 = 1 + Math.floor((l[$] - F - 1) / r);
      Math.floor((l[$] - 1) / r) < y2 && n.push(""), Ie(n, m, r);
      continue;
    }
    if (d + l[$] > r && d > 0 && l[$] > 0) {
      if (s.wordWrap === false && d < r) {
        Ie(n, m, r);
        continue;
      }
      n.push("");
    }
    if (d + l[$] > r && s.wordWrap === false) {
      Ie(n, m, r);
      continue;
    }
    n[n.length - 1] += m;
  }
  s.trim !== false && (n = n.map(($) => St2($)));
  const c = n.join(`
`), p = c[Symbol.iterator]();
  let f = p.next(), g = p.next(), E = 0;
  for (;!f.done; ) {
    const $ = f.value, m = g.value;
    if (i += $, $ === ae || $ === je) {
      He.lastIndex = E + 1;
      const y2 = He.exec(c)?.groups;
      if (y2?.code !== undefined) {
        const v = Number.parseFloat(y2.code);
        a = v === vt2 ? undefined : v;
      } else
        y2?.uri !== undefined && (o = y2.uri.length === 0 ? undefined : y2.uri);
    }
    const d = a ? At2(a) : undefined;
    m === `
` ? (o && (i += Ke("")), a && d && (i += Ue(d))) : $ === `
` && (a && d && (i += Ue(a)), o && (i += Ke(o))), E += $.length, f = g, g = p.next();
  }
  return i;
};
function J2(e, r, s) {
  return String(e).normalize().replaceAll(`\r
`, `
`).split(`
`).map((i) => It2(i, r, s)).join(`
`);
}
var bt2 = (e, r, s, i, a) => {
  let o = r, u = 0;
  for (let l = s;l < i; l++) {
    const n = e[l];
    if (o = o - n.length, u++, o <= a)
      break;
  }
  return { lineCount: o, removals: u };
};
var X2 = ({ cursor: e, options: r, style: s, output: i = process.stdout, maxItems: a = Number.POSITIVE_INFINITY, columnPadding: o = 0, rowPadding: u = 4 }) => {
  const l = rt(i) - o, n = nt(i), c = t("dim", "..."), p = Math.max(n - u, 0), f = Math.max(Math.min(a, p), 5);
  let g = 0;
  e >= f - 3 && (g = Math.max(Math.min(e - f + 3, r.length - f), 0));
  let E = f < r.length && g > 0, $ = f < r.length && g + f < r.length;
  const m = Math.min(g + f, r.length), d = [];
  let F = 0;
  E && F++, $ && F++;
  const y2 = g + (E ? 1 : 0), v = m - ($ ? 1 : 0);
  for (let A = y2;A < v; A++) {
    const b = J2(s(r[A], A === e), l, { hard: true, trim: false }).split(`
`);
    d.push(b), F += b.length;
  }
  if (F > p) {
    let A = 0, b = 0, w = F;
    const S2 = e - y2, T2 = (M2, O2) => bt2(d, w, M2, O2, p);
    E ? ({ lineCount: w, removals: A } = T2(0, S2), w > p && ({ lineCount: w, removals: b } = T2(S2 + 1, d.length))) : ({ lineCount: w, removals: b } = T2(S2 + 1, d.length), w > p && ({ lineCount: w, removals: A } = T2(0, S2))), A > 0 && (E = true, d.splice(0, A)), b > 0 && ($ = true, d.splice(d.length - b, b));
  }
  const C = [];
  E && C.push(c);
  for (const A of d)
    for (const b of A)
      C.push(b);
  return $ && C.push(c), C;
};
var Rt = (e) => {
  const r = e.active ?? "Yes", s = e.inactive ?? "No";
  return new kt({ active: r, inactive: s, signal: e.signal, input: e.input, output: e.output, initialValue: e.initialValue ?? true, render() {
    const i = e.withGuide ?? _.withGuide, a = `${i ? `${t("gray", h)}
` : ""}${W2(this.state)}  ${e.message}
`, o = this.value ? r : s;
    switch (this.state) {
      case "submit": {
        const u = i ? `${t("gray", h)}  ` : "";
        return `${a}${u}${t("dim", o)}`;
      }
      case "cancel": {
        const u = i ? `${t("gray", h)}  ` : "";
        return `${a}${u}${t(["strikethrough", "dim"], o)}${i ? `
${t("gray", h)}` : ""}`;
      }
      default: {
        const u = i ? `${t("cyan", h)}  ` : "", l = i ? t("cyan", x2) : "";
        return `${a}${u}${this.value ? `${t("green", z2)} ${r}` : `${t("dim", H2)} ${t("dim", r)}`}${e.vertical ? i ? `
${t("cyan", h)}  ` : `
` : ` ${t("dim", "/")} `}${this.value ? `${t("dim", H2)} ${t("dim", s)}` : `${t("green", z2)} ${s}`}
${l}
`;
      }
    }
  } }).prompt();
};
var Ot = async (e, r) => {
  const s = {}, i = Object.keys(e);
  for (const a of i) {
    const o = e[a], u = await o({ results: s })?.catch((l) => {
      throw l;
    });
    if (typeof r?.onCancel == "function" && Ct(u)) {
      s[a] = "canceled", r.onCancel({ results: s });
      continue;
    }
    s[a] = u;
  }
  return s;
};
var Kt = (e) => t("magenta", e);
var be = ({ indicator: e = "dots", onCancel: r, output: s = process.stdout, cancelMessage: i, errorMessage: a, frames: o = ee ? ["\u25D2", "\u25D0", "\u25D3", "\u25D1"] : ["\u2022", "o", "O", "0"], delay: u = ee ? 80 : 120, signal: l, ...n } = {}) => {
  const c = ce();
  let p, f, g = false, E = false, $ = "", m, d = performance.now();
  const F = rt(s), y2 = n?.styleFrame ?? Kt, v = (B2) => {
    const P2 = B2 > 1 ? a ?? _.messages.error : i ?? _.messages.cancel;
    E = B2 === 1, g && (k2(P2, B2), E && typeof r == "function" && r());
  }, C = () => v(2), A = () => v(1), b = () => {
    process.on("uncaughtExceptionMonitor", C), process.on("unhandledRejection", C), process.on("SIGINT", A), process.on("SIGTERM", A), process.on("exit", v), l && l.addEventListener("abort", A);
  }, w = () => {
    process.removeListener("uncaughtExceptionMonitor", C), process.removeListener("unhandledRejection", C), process.removeListener("SIGINT", A), process.removeListener("SIGTERM", A), process.removeListener("exit", v), l && l.removeEventListener("abort", A);
  }, S2 = () => {
    if (m === undefined)
      return;
    c && s.write(`
`);
    const B2 = J2(m, F, { hard: true, trim: false }).split(`
`);
    B2.length > 1 && s.write(import_sisteransi2.cursor.up(B2.length - 1)), s.write(import_sisteransi2.cursor.to(0)), s.write(import_sisteransi2.erase.down());
  }, T2 = (B2) => B2.replace(/\.+$/, ""), M2 = (B2) => {
    const P2 = (performance.now() - B2) / 1000, G2 = Math.floor(P2 / 60), L2 = Math.floor(P2 % 60);
    return G2 > 0 ? `[${G2}m ${L2}s]` : `[${L2}s]`;
  }, O2 = n.withGuide ?? _.withGuide, le = (B2 = "") => {
    g = true, p = xt({ output: s }), $ = T2(B2), d = performance.now(), O2 && s.write(`${t("gray", h)}
`);
    let P2 = 0, G2 = 0;
    b(), f = setInterval(() => {
      if (c && $ === m)
        return;
      S2(), m = $;
      const L2 = y2(o[P2]);
      let Z2;
      if (c)
        Z2 = `${L2}  ${$}...`;
      else if (e === "timer")
        Z2 = `${L2}  ${$} ${M2(d)}`;
      else {
        const et2 = ".".repeat(Math.floor(G2)).slice(0, 3);
        Z2 = `${L2}  ${$}${et2}`;
      }
      const Ze = J2(Z2, F, { hard: true, trim: false });
      s.write(Ze), P2 = P2 + 1 < o.length ? P2 + 1 : 0, G2 = G2 < 4 ? G2 + 0.125 : 0;
    }, u);
  }, k2 = (B2 = "", P2 = 0, G2 = false) => {
    if (!g)
      return;
    g = false, clearInterval(f), S2();
    const L2 = P2 === 0 ? t("green", V) : P2 === 1 ? t("red", $e) : t("red", de);
    $ = B2 ?? $, G2 || (e === "timer" ? s.write(`${L2}  ${$} ${M2(d)}
`) : s.write(`${L2}  ${$}
`)), w(), p();
  };
  return { start: le, stop: (B2 = "") => k2(B2, 0), message: (B2 = "") => {
    $ = T2(B2 ?? $);
  }, cancel: (B2 = "") => k2(B2, 1), error: (B2 = "") => k2(B2, 2), clear: () => k2("", 0, true), get isCancelled() {
    return E;
  } };
};
var ze = { light: I2("\u2500", "-"), heavy: I2("\u2501", "="), block: I2("\u2588", "#") };
var oe = (e, r) => e.includes(`
`) ? e.split(`
`).map((s) => r(s)).join(`
`) : r(e);
var Jt = (e) => {
  const r = (s, i) => {
    const a = s.label ?? String(s.value);
    switch (i) {
      case "disabled":
        return `${t("gray", H2)} ${oe(a, (o) => t("gray", o))}${s.hint ? ` ${t("dim", `(${s.hint ?? "disabled"})`)}` : ""}`;
      case "selected":
        return `${oe(a, (o) => t("dim", o))}`;
      case "active":
        return `${t("green", z2)} ${a}${s.hint ? ` ${t("dim", `(${s.hint})`)}` : ""}`;
      case "cancelled":
        return `${oe(a, (o) => t(["strikethrough", "dim"], o))}`;
      default:
        return `${t("dim", H2)} ${oe(a, (o) => t("dim", o))}`;
    }
  };
  return new Tt({ options: e.options, signal: e.signal, input: e.input, output: e.output, initialValue: e.initialValue, render() {
    const s = e.withGuide ?? _.withGuide, i = `${W2(this.state)}  `, a = `${ve(this.state)}  `, o = Bt(e.output, e.message, a, i), u = `${s ? `${t("gray", h)}
` : ""}${o}
`;
    switch (this.state) {
      case "submit": {
        const l = s ? `${t("gray", h)}  ` : "", n = Bt(e.output, r(this.options[this.cursor], "selected"), l);
        return `${u}${n}`;
      }
      case "cancel": {
        const l = s ? `${t("gray", h)}  ` : "", n = Bt(e.output, r(this.options[this.cursor], "cancelled"), l);
        return `${u}${n}${s ? `
${t("gray", h)}` : ""}`;
      }
      default: {
        const l = s ? `${t("cyan", h)}  ` : "", n = s ? t("cyan", x2) : "", c = u.split(`
`).length, p = s ? 2 : 1;
        return `${u}${l}${X2({ output: e.output, cursor: this.cursor, options: this.options, maxItems: e.maxItems, columnPadding: l.length, rowPadding: c + p, style: (f, g) => r(f, f.disabled ? "disabled" : g ? "active" : "inactive") }).join(`
${l}`)}
${n}
`;
      }
    }
  } }).prompt();
};
var Qe = `${t("gray", h)}  `;

// bin/lib/create-project.ts
var import_picocolors = __toESM(require_picocolors(), 1);
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
var HOP_VERSION = "1.0.0";
var HOP_LOGO = `
${import_picocolors.default.cyan("\u2588\u2588\u2557  \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557")} ${import_picocolors.default.magenta("\u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 ")}
${import_picocolors.default.cyan("\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557")} ${import_picocolors.default.magenta("\u2588\u2588\u2551 \u2588\u2588\u2554\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557")}
${import_picocolors.default.cyan("\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551")} ${import_picocolors.default.magenta("\u2588\u2588\u2588\u2588\u2588\u2554\u255D \u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D")}
${import_picocolors.default.cyan("\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551")} ${import_picocolors.default.magenta("\u2588\u2588\u2554\u2550\u2588\u2588\u2557 \u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557")}
${import_picocolors.default.cyan("\u2588\u2588\u2551  \u2588\u2588\u2551\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D")} ${import_picocolors.default.magenta("\u2588\u2588\u2551  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2551")}
${import_picocolors.default.cyan("\u255A\u2550\u255D  \u255A\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D ")} ${import_picocolors.default.magenta("\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D")}
`;
async function createProject(projectName) {
  console.log(HOP_LOGO);
  console.log(import_picocolors.default.dim(`  High-Performance BDD Automation Testing Framework v${HOP_VERSION}`));
  console.log("");
  const projectPath = join(process.cwd(), projectName);
  if (existsSync(projectPath)) {
    console.log(import_picocolors.default.red(`\u274C Directory "${projectName}" already exists!`));
    process.exit(1);
  }
  const s = be();
  console.log(import_picocolors.default.cyan("\u250C") + import_picocolors.default.cyan("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log(import_picocolors.default.cyan("\u2502") + import_picocolors.default.bold("  \uD83C\uDFAF Project Configuration"));
  console.log(import_picocolors.default.cyan("\u2514") + import_picocolors.default.cyan("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log("");
  const config = await Ot({
    projectType: () => Jt({
      message: "What type of testing do you want to do?",
      options: [
        { value: "api", label: "\uD83C\uDF10 API Testing", hint: "REST/GraphQL API automation" },
        { value: "e2e", label: "\uD83D\uDDA5\uFE0F E2E/UI Testing", hint: "Browser automation with Playwright" },
        { value: "full", label: "\uD83D\uDE80 Full Stack (API + E2E)", hint: "Complete testing solution" },
        { value: "load", label: "\u26A1 Load Testing", hint: "Performance testing with K6" }
      ],
      initialValue: "api"
    }),
    language: () => Jt({
      message: "Which language do you prefer?",
      options: [
        { value: "ts", label: "TypeScript", hint: "Recommended for better IDE support" },
        { value: "js", label: "JavaScript", hint: "Simpler setup, no types" }
      ],
      initialValue: "ts"
    }),
    framework: () => Jt({
      message: "Which test runner do you want to use?",
      options: [
        { value: "bun", label: "\u26A1 Bun (Fast)", hint: "Blazing fast test execution" },
        { value: "vitest", label: "\uD83E\uDDEA Vitest", hint: "Vite-native test runner" },
        { value: "node", label: "\uD83D\uDCE6 Node.js", hint: "Standard Node.js setup" }
      ],
      initialValue: "bun"
    }),
    installDeps: () => Rt({
      message: "Install dependencies?",
      initialValue: true
    })
  }, {
    onCancel: () => {
      console.log(import_picocolors.default.red(`
\u274C Setup cancelled.`));
      process.exit(0);
    }
  });
  console.log("");
  console.log(import_picocolors.default.cyan("\u250C") + import_picocolors.default.cyan("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log(import_picocolors.default.cyan("\u2502") + import_picocolors.default.bold("  \uD83D\uDCC1 Creating Project Structure"));
  console.log(import_picocolors.default.cyan("\u2514") + import_picocolors.default.cyan("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log("");
  s.start("Creating directories...");
  const dirs = [
    projectName,
    `${projectName}/hop`,
    `${projectName}/hop/e2e`,
    `${projectName}/hop/fixtures`,
    `${projectName}/hop/support`
  ];
  if (config.projectType === "e2e" || config.projectType === "full") {
    dirs.push(`${projectName}/hop/screenshots`);
    dirs.push(`${projectName}/hop/videos`);
  }
  for (const dir of dirs) {
    await mkdir(join(process.cwd(), dir), { recursive: true });
  }
  s.stop("Directories created");
  s.start("Creating configuration files...");
  const hopConfig = `// Hop Configuration
// https://github.com/ahmad-ubaidillah/hop

export default {
  // Feature files location
  features: './hop/e2e/**/*.feature',
  
  // Custom step definitions
  steps: './hop/support/steps.${config.language}',
  
  // Hooks
  hooks: './hop/support/hooks.${config.language}',
  
  // Fixtures
  fixtures: './hop/fixtures',
  
  // Reports output
  reports: './hop/reports',
  
  // Output formats
  format: ['console', 'html'],
  
  // Test timeout (30 seconds)
  timeout: 30000,
  
  // Retry failed tests
  retry: 0,
  
  // Parallel execution
  parallel: 1,
  
  // Tag filtering
  tags: {
    include: [],
    exclude: ['@skip', '@wip'],
  },
  
  // Default headers for all requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Environment-specific configurations
  environments: {
    dev: {
      baseUrl: 'https://jsonplaceholder.typicode.com',
    },
    staging: {
      baseUrl: 'https://staging-api.example.com',
    },
    prod: {
      baseUrl: 'https://api.example.com',
    },
  },
  
  // Screenshots configuration (for E2E)
  screenshots: {
    enabled: true,
    onFailure: true,
    path: './hop/screenshots',
  },
  
  // Logging
  logging: {
    verbose: false,
    debug: false,
  },
};
`;
  await writeFile(join(projectPath, "hop.config.ts"), hopConfig);
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description: `Hop BDD tests for ${projectName}`,
    type: "module",
    scripts: {
      hop: "hop",
      "hop:open": "hop open",
      "hop:run": "hop test",
      "hop:report": "hop report",
      test: "hop test"
    },
    devDependencies: {
      "hop-framework": `^${HOP_VERSION}`
    }
  };
  if (config.language === "ts") {
    packageJson.devDependencies["typescript"] = "^5.3.0";
    packageJson.devDependencies["@types/node"] = "^20.0.0";
  }
  if (config.projectType === "e2e" || config.projectType === "full") {
    packageJson.devDependencies["playwright"] = "^1.40.0";
  }
  await writeFile(join(projectPath, "package.json"), JSON.stringify(packageJson, null, 2));
  s.stop("Configuration files created");
  s.start("Creating support files...");
  const hooksFile = `// Hop Hooks
// Run code before/after tests

import { BeforeAll, AfterAll, Before, After } from 'hop-framework';

// Runs once before all tests
BeforeAll(async () => {
  console.log('\uD83D\uDE80 Starting test suite...');
});

// Runs once after all tests
AfterAll(async () => {
  console.log('\u2705 Test suite completed!');
});

// Runs before each scenario
Before(async (context) => {
  // Setup test context
  context.startTime = Date.now();
});

// Runs after each scenario
After(async (context, result) => {
  const duration = Date.now() - context.startTime;
  console.log(\`  \u23F1\uFE0F Duration: \${duration}ms\`);
});
`;
  await writeFile(join(projectPath, "hop", "support", `hooks.${config.language}`), hooksFile);
  const stepsFile = `// Hop Custom Step Definitions
// Define your custom steps here

import { Given, When, Then } from 'hop-framework';

// ========================================
// URL & Path Steps
// ========================================

Given('url {string}', (url) => {
  // Set base URL
  console.log('Setting base URL:', url);
});

Given('path {string}', (path) => {
  // Set endpoint path
  console.log('Setting path:', path);
});

// ========================================
// HTTP Method Steps
// ========================================

When('method GET', async () => {
  // Perform GET request
  console.log('Performing GET request');
});

When('method POST', async () => {
  // Perform POST request
  console.log('Performing POST request');
});

When('method PUT', async () => {
  // Perform PUT request
  console.log('Performing PUT request');
});

When('method DELETE', async () => {
  // Perform DELETE request
  console.log('Performing DELETE request');
});

// ========================================
// Response Validation Steps
// ========================================

Then('status {int}', (status) => {
  // Validate response status code
  console.log('Validating status:', status);
});

Then('match response contains {string}', (key) => {
  // Validate response contains key
  console.log('Checking for key:', key);
});

// Add your custom steps below...
`;
  await writeFile(join(projectPath, "hop", "support", `steps.${config.language}`), stepsFile);
  s.stop("Support files created");
  s.start("Creating example fixtures...");
  const fixtureData = {
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com"
    },
    product: {
      id: 101,
      name: "Test Product",
      price: 99.99
    }
  };
  await writeFile(join(projectPath, "hop", "fixtures", "example.json"), JSON.stringify(fixtureData, null, 2));
  const usersFixture = [
    { id: 1, name: "User 1", email: "user1@test.com" },
    { id: 2, name: "User 2", email: "user2@test.com" },
    { id: 3, name: "User 3", email: "user3@test.com" }
  ];
  await writeFile(join(projectPath, "hop", "fixtures", "users.json"), JSON.stringify(usersFixture, null, 2));
  s.stop("Example fixtures created");
  s.start("Creating example feature files...");
  if (config.projectType === "api" || config.projectType === "full") {
    const apiFeature = `# API Testing Example
# This example uses JSONPlaceholder (https://jsonplaceholder.typicode.com)

Feature: API Testing - Posts API

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  @api @smoke
  Scenario: Get all posts
    Given path '/posts'
    When method GET
    Then status 200
    And match response is array
    And response time < 1000ms

  @api @smoke
  Scenario: Get single post by ID
    Given path '/posts/1'
    When method GET
    Then status 200
    And match response.id == 1
    And match response.title == #string
    And match response.body == #string

  @api @crud
  Scenario: Create a new post
    Given path '/posts'
    And request
      """
      {
        "title": "Test Post",
        "body": "This is a test post body",
        "userId": 1
      }
      """
    When method POST
    Then status 201
    And match response.title == 'Test Post'
    And match response.id == #number

  @api @crud
  Scenario: Update an existing post
    Given path '/posts/1'
    And request
      """
      {
        "id": 1,
        "title": "Updated Title",
        "body": "Updated body content",
        "userId": 1
      }
      """
    When method PUT
    Then status 200
    And match response.title == 'Updated Title'

  @api @crud
  Scenario: Delete a post
    Given path '/posts/1'
    When method DELETE
    Then status 200

  @api @validation
  Scenario Outline: Get post with different IDs
    Given path '/posts/<id>'
    When method GET
    Then status <status>
    
    Examples:
      | id | status |
      | 1  | 200    |
      | 2  | 200    |
      | 99 | 200    |

  @api @performance
  Scenario: Check API response time
    Given path '/posts'
    When method GET
    Then status 200
    And response time < 500ms
`;
    await writeFile(join(projectPath, "hop", "e2e", "api-posts.feature"), apiFeature);
    const usersFeature = `# Users API Testing Example

Feature: API Testing - Users API

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And header Content-Type = 'application/json'

  @api @smoke
  Scenario: Get all users
    Given path '/users'
    When method GET
    Then status 200
    And match response is array
    And match response[0].name == #string
    And match response[0].email == #email

  @api @smoke
  Scenario: Get user by ID
    Given path '/users/1'
    When method GET
    Then status 200
    And match response contains 'name'
    And match response contains 'email'
    And match response contains 'phone'
    And match response.company.name == #string

  @api @data-driven
  Scenario Outline: Validate user emails
    Given path '/users/<id>'
    When method GET
    Then status 200
    And match response.email == #email
    
    Examples:
      | id |
      | 1  |
      | 2  |
      | 3  |
      | 5  |
`;
    await writeFile(join(projectPath, "hop", "e2e", "api-users.feature"), usersFeature);
  }
  if (config.projectType === "e2e" || config.projectType === "full") {
    const e2eFeature = `# E2E/UI Testing Example
# Uses SauceDemo (https://www.saucedemo.com)

Feature: E2E Testing - Login Flow

  Background:
    Given I open browser 'chromium'
    And I navigate to 'https://www.saucedemo.com'

  @ui @login @smoke
  Scenario: Successful login with valid credentials
    When I fill '#user-name' with 'standard_user'
    And I fill '#password' with 'secret_sauce'
    And I click '#login-button'
    Then I should see '.inventory_list'
    And URL should contain '/inventory.html'
    And I take screenshot 'login-success'

  @ui @login
  Scenario: Login fails with invalid credentials
    When I fill '#user-name' with 'invalid_user'
    And I fill '#password' with 'wrong_password'
    And I click '#login-button'
    Then I should see '.error-message-container'
    And I should see text 'Epic sadface'

  @ui @login @data-driven
  Scenario Outline: Login with different users
    When I fill '#user-name' with '<username>'
    And I fill '#password' with '<password>'
    And I click '#login-button'
    Then I should <result>
    
    Examples:
      | username        | password     | result              |
      | standard_user   | secret_sauce | see '.inventory_list' |
      | locked_out_user | secret_sauce | see '.error-message'  |

Feature: E2E Testing - Shopping Cart

  Background:
    Given I open browser 'chromium'
    And I navigate to 'https://www.saucedemo.com'
    And I login as 'standard_user'

  @ui @cart @smoke
  Scenario: Add item to cart
    When I click '[data-test="add-to-cart-sauce-labs-backpack"]'
    Then cart badge should show '1'
    And I click '.shopping_cart_link'
    Then I should see '.cart_item'

  @ui @cart
  Scenario: Remove item from cart
    Given I add 'Sauce Labs Backpack' to cart
    When I click '.shopping_cart_link'
    And I click '[data-test="remove-sauce-labs-backpack"]'
    Then cart should be empty
`;
    await writeFile(join(projectPath, "hop", "e2e", "ui-login.feature"), e2eFeature);
  }
  if (config.projectType === "load") {
    const loadFeature = `# Load Testing Example
# Run with: hop test --tags @load

Feature: Load Testing - API Performance

  Background:
    Given url 'https://jsonplaceholder.typicode.com'
    And concurrency 10
    And duration '30s'
    And ramp up '5s'

  @load @api
  Scenario: Load test GET /posts
    Given path '/posts'
    When load test GET '/posts'
    Then average response time < 500ms
    And error rate < 1%
    And throughput > 50 req/s
    And print performance metrics

  @load @api
  Scenario: Load test POST /posts
    Given path '/posts'
    And request
      """
      {
        "title": "Load Test",
        "body": "Testing under load",
        "userId": 1
      }
      """
    When load test POST '/posts'
    Then average response time < 600ms
    And error rate < 2%
    And SLA response time met
    And SLA availability met
`;
    await writeFile(join(projectPath, "hop", "e2e", "load-test.feature"), loadFeature);
  }
  s.stop("Example feature files created");
  s.start("Creating additional files...");
  const gitignore = `# Dependencies
node_modules/

# Hop
hop/reports/
hop/screenshots/
hop/videos/

# Environment
.env
.env.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Build
dist/
`;
  await writeFile(join(projectPath, ".gitignore"), gitignore);
  const envExample = `# Environment Variables
# Copy this file to .env and fill in your values

# API Configuration
BASE_URL=https://api.example.com
API_KEY=your-api-key-here

# Authentication
AUTH_TOKEN=your-auth-token

# Test Users
TEST_USERNAME=testuser
TEST_PASSWORD=testpass123

# Browser (for E2E)
BROWSER=chromium
HEADLESS=true
`;
  await writeFile(join(projectPath, ".env.example"), envExample);
  if (config.language === "ts") {
    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        outDir: "./dist",
        rootDir: "."
      },
      include: ["hop/**/*", "hop.config.ts"],
      exclude: ["node_modules", "dist"]
    };
    await writeFile(join(projectPath, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
  }
  const readme = `# ${projectName}

BDD automation testing with Hop Framework.

## Getting Started

### Open Hop GUI
\`\`\`bash
npx hop open
\`\`\`

### Run Tests
\`\`\`bash
npx hop test
\`\`\`

### Run Specific Tests
\`\`\`bash
# By tag
npx hop test --tags @smoke

# By file
npx hop test hop/e2e/api-posts.feature
\`\`\`

### View Reports
\`\`\`bash
npx hop report
\`\`\`

## Project Structure

\`\`\`
${projectName}/
\u251C\u2500\u2500 hop/
\u2502   \u251C\u2500\u2500 e2e/              # Feature files
\u2502   \u2502   \u251C\u2500\u2500 api-posts.feature
\u2502   \u2502   \u2514\u2500\u2500 ui-login.feature
\u2502   \u251C\u2500\u2500 fixtures/         # Test data
\u2502   \u2502   \u2514\u2500\u2500 example.json
\u2502   \u251C\u2500\u2500 support/          # Step definitions & hooks
\u2502   \u2502   \u251C\u2500\u2500 steps.ts
\u2502   \u2502   \u2514\u2500\u2500 hooks.ts
\u2502   \u251C\u2500\u2500 screenshots/      # Screenshots (auto-generated)
\u2502   \u2514\u2500\u2500 reports/          # Test reports (auto-generated)
\u251C\u2500\u2500 hop.config.ts         # Configuration
\u2514\u2500\u2500 package.json
\`\`\`

## Documentation

- [Hop Documentation](https://github.com/ahmad-ubaidillah/hop)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/)
- [Best Practices](https://github.com/ahmad-ubaidillah/hop/wiki)

## License

MIT
`;
  await writeFile(join(projectPath, "README.md"), readme);
  s.stop("Additional files created");
  if (config.installDeps) {
    console.log("");
    s.start("Installing dependencies...");
    try {
      process.chdir(projectPath);
      if (config.framework === "bun") {
        execSync("bun install", { stdio: "inherit" });
      } else {
        execSync("npm install", { stdio: "inherit" });
      }
      s.stop("Dependencies installed");
    } catch (error) {
      s.stop("Failed to install dependencies");
      console.log(import_picocolors.default.yellow(`
\u26A0\uFE0F  Could not install dependencies automatically.`));
      console.log(import_picocolors.default.yellow("   Please run manually: npm install"));
    }
  }
  console.log("");
  console.log(import_picocolors.default.green("\u250C") + import_picocolors.default.green("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log(import_picocolors.default.green("\u2502") + import_picocolors.default.bold("  \u2705 Project Created Successfully!"));
  console.log(import_picocolors.default.green("\u2514") + import_picocolors.default.green("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log("");
  console.log(import_picocolors.default.dim("  Project: ") + import_picocolors.default.cyan(projectName));
  console.log(import_picocolors.default.dim("  Type: ") + import_picocolors.default.cyan(config.projectType.toUpperCase()));
  console.log(import_picocolors.default.dim("  Language: ") + import_picocolors.default.cyan(config.language.toUpperCase()));
  console.log("");
  console.log(import_picocolors.default.bold("  Next Steps:"));
  console.log("");
  console.log(import_picocolors.default.dim("  1.") + " cd " + projectName);
  if (!config.installDeps) {
    console.log(import_picocolors.default.dim("  2.") + " npm install");
  }
  console.log(import_picocolors.default.dim("  " + (config.installDeps ? "2" : "3") + ".") + " " + import_picocolors.default.magenta("npx hop open") + import_picocolors.default.dim("  (Open GUI)"));
  console.log(import_picocolors.default.dim("  " + (config.installDeps ? "3" : "4") + ".") + " " + import_picocolors.default.magenta("npx hop test") + import_picocolors.default.dim("   (Run tests)"));
  console.log("");
  console.log(import_picocolors.default.dim("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"));
  console.log(import_picocolors.default.dim("  Documentation: ") + import_picocolors.default.cyan("https://github.com/ahmad-ubaidillah/hop"));
  console.log("");
}

// bin/create-hop.ts
var projectName = process.argv[2];
if (!projectName) {
  console.log("");
  console.log("Usage: npx create-hop <project-name>");
  console.log("");
  console.log("Examples:");
  console.log("  npx create-hop my-api-tests");
  console.log("  npx create-hop e2e-tests");
  console.log("");
  process.exit(1);
}
createProject(projectName);
