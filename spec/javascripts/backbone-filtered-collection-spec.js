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

  var oddFilter = function(model) {
    return model.get("value") % 2 == 1;
  }
  var evenFilter = function(model) {
    return model.get("value") % 2 == 0;
  }

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

    it("should work correctly after filtering is changed constantly", function() {
      collection.setFilter(createLessthanFilter(0));
      expect(collection.models.length).toEqual(0);

      collection.setFilter(createLessthanFilter(3));
      expect(collection.models.length).toEqual(3);
      expect(collection.models[0].get("value")).toEqual(0)
      expect(collection.models[1].get("value")).toEqual(1)
      expect(collection.models[2].get("value")).toEqual(2)

      collection.setFilter(evenFilter);
      expect(collection.models.length).toEqual(5);
      expect(collection.models[0].get("value")).toEqual(0)
      expect(collection.models[1].get("value")).toEqual(2)
      expect(collection.models[2].get("value")).toEqual(4)
      expect(collection.models[3].get("value")).toEqual(6)
      expect(collection.models[4].get("value")).toEqual(8)
    });

    it("should not trigger a filter-complete event if options.silent is true", function() {
      count = 0;
      collection.on("filter-complete", function() {
        count += 1;
      });

      collection.setFilter(createLessthanFilter(0), {silent: true});

      expect(count).toEqual(0);
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

    it("should trigger an add event if the object was added", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);

      var newModel = new TehModel({value: 3});
      count = 0;
      collection.on("add", function(model, collection, options) {
        expect(model).toEqual(newModel);
        expect(options.index).toEqual(0);
        count += 1;
      });
      allModels.add(newModel, {at: 0});

      expect(count).toEqual(1);
    });

    it("should re-number elements propperly in the mapping according to what the actualy indices are in the original collection", function() {
      collection.setFilter(createLessthanFilter(10));
      expect(collection.length).toEqual(10);

      allModels.add(new TehModel({value: 4}), {at: 6});

      expect(collection._mapping).toEqual([0,1,2,3,4,5,6,7,8,9,10])
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

    it("should re-number elements propperly in the mapping according to what the actualy indices are in the original collection", function() {
      collection.setFilter(createLessthanFilter(10));
      expect(collection.length).toEqual(10);

      allModels.remove(allModels.at(4));

      expect(collection._mapping).toEqual([0,1,2,3,4,5,6,7,8])
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

  describe("event:sort", function() {
    it("should continue filtering the collection, except with a new order", function() {
      collection.setFilter(createLessthanFilter(5));
      allModels.comparator = function(v1, v2) {
        return v2.get("value") - v1.get("value");
      };
      allModels.sort();

      expect(collection.length).toEqual(5);
      expect(collection.at(0).get('value')).toEqual(4);
      expect(collection.at(1).get('value')).toEqual(3);
      expect(collection.at(2).get('value')).toEqual(2);
      expect(collection.at(3).get('value')).toEqual(1);
      expect(collection.at(4).get('value')).toEqual(0);
    });
  });

  describe("event:filter-complete", function() {
    it("should fire when the underlying collection fires it (thus we're done filtering too)", function() {
      var filterFired = 0;
      collection.on("filter-complete", function() {
        filterFired += 1;
      });
      allModels.trigger("filter-complete");
      expect(filterFired).toEqual(1);
    });

    it("should fire once only at the end of a filter", function() {
      var filterFired = 0;
      collection.on("filter-complete", function() {
        filterFired += 1;
      });
      collection.setFilter(createLessthanFilter(3));
      expect(filterFired).toEqual(1);
    });

    it("should fire once when a change is propagated from an underlying model", function() {
      var filterFired = 0;
      collection.on("filter-complete", function() {
        filterFired += 1;
      });
      collection.setFilter(createLessthanFilter(3));
      filterFired = 0;

      collection.models[0].trigger("change", collection.models[0], allModels)
      expect(filterFired).toEqual(1);
    });
  });

  describe("model - event:destroy", function() {
    it("should just remove the model from the base collection like normal, and raise no problems with the filter", function() {
      collection.setFilter(createLessthanFilter(5));
      origModelZero = collection.models[0];
      // simulate an ajax destroy
      origModelZero.trigger("destroy", origModelZero, origModelZero.collection)

      expect(collection.models[0].get("value")).toEqual(1)
    });

    it("should remove elements from the model as events occur", function() {
      collection.setFilter(createLessthanFilter(10));

      // start removing in weird orders, make sure vents are done properly
      model = collection.models[0];
      model.trigger("destroy", model, model.collection)
      expect(collection.models[0].get("value")).toEqual(1)

      model = collection.models[3];
      model.trigger("destroy", model, model.collection)
      expect(collection.models[3].get("value")).toEqual(5)

      model = collection.models[3];
      model.trigger("destroy", model, model.collection)
      expect(collection.models[3].get("value")).toEqual(6)

      model = collection.models[3];
      model.trigger("destroy", model, model.collection)
      expect(collection.models[3].get("value")).toEqual(7)

      model = collection.models[2];
      model.trigger("destroy", model, model.collection)
      expect(collection.models[2].get("value")).toEqual(7)

      model = collection.models[1];
      model.trigger("destroy", model, model.collection)
      expect(collection.models[1].get("value")).toEqual(7)
    });

    it("should create remove events for every deleted model", function() {
      collection.setFilter(createLessthanFilter(10));
      var lastModelRemoved = null;
      var count = 0;
      collection.on("remove", function(removedModel) {
        lastModelRemoved = removedModel;
        count += 1;
      });

      // start removing in weird orders, make sure vents are done properly
      count = 0;
      model = collection.models[0];
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.models[3];
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.models[3];
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.models[3];
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.models[2];
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.models[1];
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);
    });
  });

  describe("model - event:change", function() {
    it("should remove the model because it failed the filter post change", function() {
      collection.setFilter(createLessthanFilter(5));
      origModelZero = collection.models[0];
      origModelZero.set("value", 10)

      expect(collection.models.length).toEqual(4)
      expect(collection.models[0].get("value")).toEqual(1)
    });

    it("should trigger change event if the model is altered", function () {
      origModelZero = collection.models[0];
      var triggered = false;

      collection.on("change", function (model) {
        triggered = true;
      });

      origModelZero.set("value", 10);

      expect(triggered).toEqual(true)
    });

    it("should pass the changed model to the handler", function () {
      origModelZero = collection.models[0];
      var changedValue = null;

      collection.on("change", function (model) {
        changedValue = model.get('value');
      });

      origModelZero.set("value", 10);

      expect(changedValue).toEqual(10);
    });

    it("should do nothing if the model is still passing the filter", function() {
      collection.setFilter(createLessthanFilter(5));
      origModelZero = collection.models[0];
      origModelZero.set("value", 3)

      expect(collection.models.length).toEqual(5)
      expect(collection.models[0].get("value")).toEqual(3)
    });

    it("should add the model that is now passing the filter", function() {
      collection.setFilter(createLessthanFilter(5));
      origModelZero = allModels.models[9];
      origModelZero.set("value", 2)

      expect(collection.models.length).toEqual(6)
      expect(collection.models[5].get("value")).toEqual(2)
    });
  });
});
