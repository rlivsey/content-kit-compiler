import Type from './types/type';
import BlockModel from './models/block';
import EmbedModel from './models/embed';
import Compiler from './compiler';
import HTMLParser from './parsers/html-parser';
import HTMLRenderer from './renderers/html-renderer';
import NewHTMLParser from './parsers/new-html-parser';
import doc from './parsers/document';
import MobiledocParser from './parsers/mobiledoc';

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
  NewHTMLParser,
  MobiledocParser
};

export {
  Type,
  BlockModel,
  EmbedModel,
  Compiler,
  HTMLParser,
  HTMLRenderer,
  NewHTMLParser,
  MobiledocParser,
  doc
};

export function registerGlobal(window) {
  window.ContentKitCompiler = ContentKitCompiler;
}

export default ContentKitCompiler;
