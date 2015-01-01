import Type from './content-kit-compiler/types/type';
import BlockModel from './content-kit-compiler/models/block';
import EmbedModel from './content-kit-compiler/models/embed';
import Compiler from './content-kit-compiler/compiler';
import HTMLParser from './content-kit-compiler/parsers/html-parser';
import HTMLRenderer from './content-kit-compiler/renderers/html-renderer';

/**
 * @namespace ContentKit
 * Merge public modules into the common ContentKit namespace.
 */
var ContentKit = window.ContentKit = window.ContentKit || {};
ContentKit.Type = Type;
ContentKit.BlockModel = BlockModel;
ContentKit.EmbedModel = EmbedModel;
ContentKit.Compiler = Compiler;
ContentKit.HTMLParser = HTMLParser;
ContentKit.HTMLRenderer = HTMLRenderer;
