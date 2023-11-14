// ==UserScript==
// @name         screeps-chinese-pack
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  用于汉化 screeps.com 网站的油猴脚本
// @author       hopgoldy
// @match        https://screeps.com/*
// @grant        none
// @license      MIT
// ==/UserScript==
import translate from "./translate";
import listener from "./eventListener";
import { updateSource } from "./storage";
import pages from "./pages";

// 设置初始翻译源
updateSource(document.location.hash, pages);

// 翻译初始内容
translate([document.body]);

listener({
  // 页面变更时重新加载翻译源
  onHashChange: updateSource,
  // 内容变更时翻译后续内容
  onElementChange: translate,
});
