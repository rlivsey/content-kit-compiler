import Type from './content-kit-compiler/types/type';
import BlockModel from './content-kit-compiler/models/block';
import TextModel from './content-kit-compiler/models/text';
import ImageModel from './content-kit-compiler/models/image';
import EmbedModel from './content-kit-compiler/models/embed';
import Compiler from './content-kit-compiler/compiler';
import HTMLParser from './content-kit-compiler/parsers/html-parser';
import HTMLRenderer from './content-kit-compiler/renderers/html-renderer';

/**
 * @namespace ContentKit
 * Merge public modules into the common ContentKit namespace.
 * Handy for working in the browser with globals.
 */
var ContentKit = window.ContentKit || {};
ContentKit.Type = Type;
ContentKit.BlockModel = BlockModel;
ContentKit.TextModel = TextModel;
ContentKit.ImageModel = ImageModel;
ContentKit.EmbedModel = EmbedModel;
ContentKit.Compiler = Compiler;
ContentKit.HTMLParser = HTMLParser;
ContentKit.HTMLRenderer = HTMLRenderer;

export default ContentKit;
