module('Model');


test('can create a BlockModel', function() {
  var model = new ContentKit.BlockModel();
  ok ( model, 'BlockModel created' );
  ok ( model instanceof ContentKit.BlockModel, 'instance of BlockModel' );
});

test('can create a model from a type', function() {
  var imageType = ContentKit.Type.IMAGE
  var model = ContentKit.BlockModel.createWithType(imageType);
  ok ( model, 'BlockModel created' );
  ok ( model instanceof ContentKit.BlockModel, 'instance of BlockModel' );
  equal ( model.type, imageType.id );
  equal ( model.type_name, imageType.name );
});