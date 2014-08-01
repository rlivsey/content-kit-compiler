import Type from './types/type';
import TextModel from './models/text';
import Compiler from './compiler';
import HTMLParser from './parsers/html-parser';
import HTMLRenderer from './renderers/html-renderer';

/**
 * @namespace ContentKit
 * Merge public modules into the common ContentKit namespace.
 * Handy for working in the browser with globals.
 */
var ContentKit = window.ContentKit || {};
ContentKit.Type = Type;
ContentKit.TextModel = TextModel;
ContentKit.Compiler = Compiler;
ContentKit.HTMLParser = HTMLParser;
ContentKit.HTMLRenderer = HTMLRenderer;

export default ContentKit;
