import Type from './types/type';
import BlockModel from './models/block';
import EmbedModel from './models/embed';
import Compiler from './compiler';
import HTMLParser from './parsers/html-parser';
import HTMLRenderer from './renderers/html-renderer';
import NewHTMLParser from './parsers/new-html-parser';
import doc from './parsers/document';

/**
 * @namespace ContentKit
 * Register public ContentKit compiler modules
 */
const ContentKitCompiler = {
  Type,
  BlockModel,
  EmbedModel,
  Compiler,
  HTMLParser,
  HTMLRenderer,
  NewHTMLParser
};

export {
  Type,
  BlockModel,
  EmbedModel,
  Compiler,
  HTMLParser,
  HTMLRenderer,
  NewHTMLParser,
  doc
};

export function registerGlobal(window) {
  window.ContentKitCompiler = ContentKitCompiler;
}

export default ContentKitCompiler;
