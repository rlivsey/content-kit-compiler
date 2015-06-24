/**
 * @class CardRenderer
 * @constructor
 */
function CardRenderer(cards) {
  this.cards = cards;
}

/**
 * @method render
 * @param model a card model
 * @return String html
 */
CardRenderer.prototype.render = function(model) {
  var render = this.cards[model.attributes.name];
  return render(model.attributes.payload);
};

export default CardRenderer;
