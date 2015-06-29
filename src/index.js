import Type from './types/type';
import BlockModel from './models/block';
import EmbedModel from './models/embed';
import Compiler from './compiler';
import HTMLParser from './parsers/html-parser';
import HTMLRenderer from './renderers/html-renderer';
import doc from './parsers/document';

/**
 * @namespace ContentKit
 * Register public ContentKit compiler modules
 */
var ContentKitCompiler = {};
ContentKitCompiler.Type = Type;
ContentKitCompiler.BlockModel = BlockModel;
ContentKitCompiler.EmbedModel = EmbedModel;
ContentKitCompiler.Compiler = Compiler;
ContentKitCompiler.HTMLParser = HTMLParser;
ContentKitCompiler.HTMLRenderer = HTMLRenderer;

export {
  Type,
  BlockModel,
  EmbedModel,
  Compiler,
  HTMLParser,
  HTMLRenderer,
  doc
};

export default ContentKitCompiler;
