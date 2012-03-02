describe("Backbone.FilteredCollection", function() {
  var TehModel = Backbone.Model.extend({
    defaults: {value: -1}
  });

  var RegularModelCollection = Backbone.Collection.extend({
    model: TehModel
  });

  var ModelCollection = Backbone.FilteredCollection.extend({
    model: TehModel
  });

  var allModels;
  var collection;

  var createLessthanFilter = function(lessThan) {
    return function(model) {
      return model.get('value') < lessThan;
    }
  };

  beforeEach(function() {
    allModels = new RegularModelCollection();
    for(var i = 0; i < 10; i++) {
      allModels.add(new TehModel({id: i, value: i}));
    }

    collection = new ModelCollection(null, {collection: allModels});
  });

  describe("#setFilter", function() {
    it("should filter the given model", function() {
      collection.setFilter(createLessthanFilter(5));

      expect(collection.length).toEqual(5);
      expect(collection.at(0).get('value')).toEqual(0);
    });

    it("should change filters", function() {
      collection.setFilter(createLessthanFilter(5));

      collection.setFilter(function(model) {
        return model.get('value') > 7;
      });

      expect(collection.length).toEqual(2);
      expect(collection.at(0).get('value')).toEqual(8);
    });

    it("should take a false filter as a return to no filter", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      collection.setFilter(undefined); // no change
      expect(collection.length).toEqual(5);
      collection.setFilter(null); // no change
      expect(collection.length).toEqual(5);
      collection.setFilter(false); // filter reset
      expect(collection.length).toEqual(10);
    });
  });

  describe("event:add", function() {
    it("should not add the new object, since it is already filtered out", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.add(new TehModel({value: 6}));
      expect(collection.length).toEqual(5);
    });

    it("should add the new object, since it passes the filter", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.add(new TehModel({value: 1}));
      expect(collection.length).toEqual(6);
      expect(collection.at(5).get('value')).toEqual(1);
    });

    it("should add the new object to the correct location", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.add(new TehModel({value: 4}), {at: 0});
      expect(collection.length).toEqual(6);
      expect(collection.at(0).get('value')).toEqual(4);
    });
  });

  describe("event:remove", function() {
    it("should be a noop since the object is filtered", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.remove(allModels.at(6));
      expect(collection.length).toEqual(5);
    });

    it("should be a remove the removed object", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.remove(allModels.at(4));
      expect(collection.length).toEqual(4);
      expect(collection.at(collection.length - 1).get('value')).toEqual(3);
    });
  });

  describe("event:reset", function() {
    it("should be a noop since the object is filtered", function() {
      collection.setFilter(createLessthanFilter(15));
      var newAll = [];
      for (var i = 10; i < 20; i++) {
        newAll.push(new TehModel({value: i}));
      }
      allModels.reset(newAll);
      expect(collection.length).toEqual(5);
      expect(collection.at(4).get('value')).toEqual(14);
    });
  });
});