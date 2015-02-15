import Type from './types/type';
import BlockModel from './models/block';
import EmbedModel from './models/embed';
import Compiler from './compiler';
import HTMLParser from './parsers/html-parser';
import HTMLRenderer from './renderers/html-renderer';

/**
 * @namespace ContentKit
 * Register public ContentKit compiler modules
 */
var ContentKit = {};
ContentKit.Type = Type;
ContentKit.BlockModel = BlockModel;
ContentKit.EmbedModel = EmbedModel;
ContentKit.Compiler = Compiler;
ContentKit.HTMLParser = HTMLParser;
ContentKit.HTMLRenderer = HTMLRenderer;

export default ContentKit;
