/* global QUnit, ok, equal, test */
QUnit.module('Model');

import {
  BlockModel,
  Type
} from 'content-kit-compiler';

test('can create a BlockModel', function() {
  var model = new BlockModel();
  ok ( model, 'BlockModel created' );
  ok ( model instanceof BlockModel, 'instance of BlockModel' );
});

test('can create a model from a type', function() {
  var imageType = Type.IMAGE;
  var model = BlockModel.createWithType(imageType);
  ok ( model, 'BlockModel created' );
  ok ( model instanceof BlockModel, 'instance of BlockModel' );
  equal ( model.type, imageType.id );
  equal ( model.type_name, imageType.name );
});
