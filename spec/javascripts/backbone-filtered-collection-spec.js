describe("Backbone.FilteredCollection", function() {
  var TehModel = Backbone.Model.extend({
    defaults: {value: -1}
  });

  var RegularModelCollection = Backbone.Collection.extend({
    model: TehModel
  });

  var allModels;
  var collection;

  var createLessthanFilter = function(lessThan) {
    return function(model) {
      return model.get('value') < lessThan;
    }
  };

  var evenFilter = function(model) {
    return model.get("value") % 2 == 0;
  };

  beforeEach(function() {
    allModels = new RegularModelCollection();
    for(var i = 0; i < 10; i++) {
      allModels.add(new TehModel({id: i, value: i}));
    }

    collection = new Backbone.FilteredCollection(null, {collection: allModels});
  });

  afterEach(function() {
    if (collection) collection.off(null, null, null);
  });

  describe("#setFilter", function() {
    it("filters the given model", function() {
      collection.setFilter(createLessthanFilter(5));

      expect(collection.length).toEqual(5);
      expect(collection.at(0).get('value')).toEqual(0);
    });

    it("uses the given filter", function() {
      collection.setFilter(createLessthanFilter(5));
      collection.setFilter(function(model) {
        return model.get('value') > 7;
      });

      expect(collection.length).toEqual(2);
      expect(collection.at(0).get('value')).toEqual(8);
    });

    it("accepts false to remove all filters", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      collection.setFilter(undefined); // no change
      expect(collection.length).toEqual(5);
      collection.setFilter(null); // no change
      expect(collection.length).toEqual(5);
      collection.setFilter(false); // filter reset
      expect(collection.length).toEqual(10);
    });

    it("works correctly after filtering is changed constantly", function() {
      collection.setFilter(createLessthanFilter(0));
      expect(collection.models.length).toEqual(0);

      collection.setFilter(createLessthanFilter(3));
      expect(collection.models.length).toEqual(3);
      expect(collection.at(0).get("value")).toEqual(0);
      expect(collection.at(1).get("value")).toEqual(1);
      expect(collection.at(2).get("value")).toEqual(2);

      collection.setFilter(evenFilter);
      expect(collection.models.length).toEqual(5);
      expect(collection.at(0).get("value")).toEqual(0);
      expect(collection.at(1).get("value")).toEqual(2);
      expect(collection.at(2).get("value")).toEqual(4);
      expect(collection.at(3).get("value")).toEqual(6);
      expect(collection.at(4).get("value")).toEqual(8);
    });

    it("does not trigger a filter-complete event if options.silent is true", function() {
      var eventSpy = jasmine.createSpy('filter-complete listener');
      collection.on("filter-complete", eventSpy);

      collection.setFilter(createLessthanFilter(0), {silent: true});
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });

  describe("event:add", function() {
    it("does not add an already filtered out new object", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.add(new TehModel({value: 6}));
      expect(collection.length).toEqual(5);
    });

    it("adds the new object, since it passes the filter", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.add(new TehModel({value: 1}));
      expect(collection.length).toEqual(6);
      expect(collection.at(5).get('value')).toEqual(1);
    });

    it("adds the new object to the correct location", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.add(new TehModel({value: 4}), {at: 0});
      expect(collection.length).toEqual(6);
      expect(collection.at(0).get('value')).toEqual(4);
    });

    it("triggers an add event if the object was added", function() {
      collection.setFilter(createLessthanFilter(5));
      var newModel = new TehModel({value: 3});
      var eventSpy = jasmine.createSpy('reset event listener');

      collection.on("add", eventSpy);
      allModels.add(newModel, {at: 0});

      expect(eventSpy).toHaveBeenCalledWith(newModel, collection, {index: 0})
    });

    it("re-numbers elements properly in the mapping according to what the atual indices are in the original collection", function() {
      collection.setFilter(createLessthanFilter(10));
      expect(collection.length).toEqual(10);

      allModels.add(new TehModel({value: 4}), {at: 6});

      expect(collection._mapping).toEqual([0,1,2,3,4,5,6,7,8,9,10])
    });
  });

  describe("event:remove", function() {
    it("is a no-op if the item removed is already not filtered", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.remove(allModels.at(6));
      expect(collection.length).toEqual(5);
    });

    it("removes the model that was removed from the underlying collection", function() {
      collection.setFilter(createLessthanFilter(5));
      expect(collection.length).toEqual(5);
      allModels.remove(allModels.at(4));
      expect(collection.length).toEqual(4);
      expect(collection.at(collection.length - 1).get('value')).toEqual(3);
    });

    it("should re-number elements properly in the mapping according to what the actual indices are in the original collection", function() {
      collection.setFilter(createLessthanFilter(10));
      expect(collection.length).toEqual(10);

      allModels.remove(allModels.at(4));

      expect(collection._mapping).toEqual([0,1,2,3,4,5,6,7,8])
    });
  });

  describe("event:reset", function() {
    it("resets all models to those in the underlying collection", function() {
      collection.setFilter(createLessthanFilter(15));
      var newAll = [];
      for (var i = 10; i < 20; i++) {
        newAll.push(new TehModel({value: i}));
      }
      allModels.reset(newAll);
      expect(collection.length).toEqual(5);
      expect(collection.at(4).get('value')).toEqual(14);
    });

    it("triggers exactly one reset event", function() {
      var eventSpy = jasmine.createSpy('reset event listener');
      collection.on('reset', eventSpy);

      allModels.reset([{id: 11, value: 11}]);

      expect(eventSpy).toHaveBeenCalledWith(collection);
      expect(eventSpy.callCount).toEqual(1);
    });
  });

  describe("event:sort", function() {
    it("continues to filter the collection, except with a new order", function() {
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
    it("triggers when the underlying collection triggers it (thus we're done filtering too)", function() {
      var eventSpy = jasmine.createSpy('filter-complete event listener');
      collection.on("filter-complete", eventSpy);

      allModels.trigger("filter-complete");

      expect(eventSpy).toHaveBeenCalled();
    });

    it("triggers once only at the end of a filter", function() {
      var eventSpy = jasmine.createSpy('filter-complete event listener');
      collection.on("filter-complete", eventSpy);

      collection.setFilter(createLessthanFilter(3));

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.callCount).toEqual(1);
    });

    it("triggers once when a change is propagated from an underlying model", function() {
      var filterFired = 0;
      collection.on("filter-complete", function() {
        filterFired += 1;
      });
      collection.setFilter(createLessthanFilter(3));
      filterFired = 0;

      collection.at(0).trigger("change", collection.at(0), allModels)
      expect(filterFired).toEqual(1);
    });
  });

  describe("model - event:destroy", function() {
    it("just removes the model from the base collection like normal, and raise no problems with the filter", function() {
      collection.setFilter(createLessthanFilter(5));
      origModelZero = collection.at(0);
      // simulate an ajax destroy
      origModelZero.trigger("destroy", origModelZero, origModelZero.collection);

      expect(collection.at(0).get("value")).toEqual(1);
    });

    it("removes elements from the model as events occur", function() {
      collection.setFilter(createLessthanFilter(10));

      // start removing in weird orders, make sure vents are done properly
      model = collection.at(0);
      model.trigger("destroy", model, model.collection);
      expect(collection.at(0).get("value")).toEqual(1);

      model = collection.at(3);
      model.trigger("destroy", model, model.collection);
      expect(collection.at(3).get("value")).toEqual(5);

      model = collection.at(3);
      model.trigger("destroy", model, model.collection);
      expect(collection.at(3).get("value")).toEqual(6);

      model = collection.at(3);
      model.trigger("destroy", model, model.collection);
      expect(collection.at(3).get("value")).toEqual(7);

      model = collection.at(2);
      model.trigger("destroy", model, model.collection);
      expect(collection.at(2).get("value")).toEqual(7);

      model = collection.at(1);
      model.trigger("destroy", model, model.collection);
      expect(collection.at(1).get("value")).toEqual(7);
    });

    it("triggers remove events for every deleted model", function() {
      collection.setFilter(createLessthanFilter(10));
      var lastModelRemoved = null;
      var count = 0;
      collection.on("remove", function(removedModel) {
        lastModelRemoved = removedModel;
        count += 1;
      });

      // start removing in weird orders, make sure vents are done properly
      count = 0;
      model = collection.at(0);
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.at(3);
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.at(3);
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.at(3);
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.at(2);
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);

      count = 0;
      model = collection.at(1);
      model.trigger("destroy", model, model.collection)
      expect(lastModelRemoved).toEqual(model);
      expect(count).toEqual(1);
    });
  });

  describe("model - event:change", function() {
    var changeSpy, addSpy, removeSpy;

    beforeEach(function() {
      changeSpy = jasmine.createSpy("change listener");
      addSpy = jasmine.createSpy("add listener");
      removeSpy = jasmine.createSpy("remove listener");
    });

    it("removes the model because it failed the filter post change, triggers remove event", function() {
      collection.setFilter(createLessthanFilter(5));
      collection.on("change", changeSpy);
      collection.on("add", addSpy);
      collection.on("remove", removeSpy);

      origModelZero = collection.at(0);
      origModelZero.set("value", 10)

      expect(collection.models.length).toEqual(4)
      expect(collection.at(0).get("value")).toEqual(1)
      expect(changeSpy).not.toHaveBeenCalled();
      expect(addSpy).not.toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledWith(origModelZero, collection, jasmine.any(Object));
    });

    it("does not alter the collection if the model is still passing, triggers change event", function() {
      collection.setFilter(createLessthanFilter(5));
      collection.on("change", changeSpy);
      collection.on("add", addSpy);
      collection.on("remove", removeSpy);

      origModelZero = collection.at(0);
      origModelZero.set("value", 3)

      expect(collection.models.length).toEqual(5)
      expect(collection.at(0).get("value")).toEqual(3)
      expect(changeSpy).toHaveBeenCalledWith(origModelZero, collection);
      expect(addSpy).not.toHaveBeenCalled();
      expect(removeSpy).not.toHaveBeenCalled();
    });

    it("adds the model that is now passing the filter, triggers add event", function() {
      collection.setFilter(createLessthanFilter(5));
      collection.on("change", changeSpy);
      collection.on("add", addSpy);
      collection.on("remove", removeSpy);

      origModelZero = allModels.at(9);
      origModelZero.set("value", 2)

      expect(collection.models.length).toEqual(6)
      expect(collection.at(5).get("value")).toEqual(2)
      expect(changeSpy).not.toHaveBeenCalled();
      expect(addSpy).toHaveBeenCalledWith(origModelZero, collection, jasmine.any(Object));
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe("#resetWith", function() {
    var moreModels;

    beforeEach(function(){
      moreModels = new RegularModelCollection();
      for(var i = 10; i < 16; i++) {
        moreModels.add(new TehModel({id: i, value: i}));
      }
      collection.setFilter(evenFilter);
    });

    it("updates the collection's length to match that of the new collection", function() {
      var lengthBefore = collection.length;
      collection.resetWith(moreModels);
      var lengthAfter = collection.length;

      expect(lengthBefore).toEqual(5); // even models
      expect(lengthAfter).toEqual(3); // even models
    });

    it("handles add events on the new collection", function() {
      collection.resetWith(moreModels);

      var lengthBefore = collection.length;
      newModel = new TehModel({id: 16, value: 16});
      moreModels.add(newModel);
      var lengthAfter = collection.length;

      expect(lengthAfter).toEqual(lengthBefore + 1);
      expect(collection.indexOf(newModel)).toBeGreaterThan(-1);
    });

    it("handles remove events on the new collection", function() {
      collection.resetWith(moreModels);

      var lengthBefore = collection.length;
      var toRemove = moreModels.get(12);
      moreModels.remove(toRemove);
      var lengthAfter = collection.length;

      expect(lengthAfter).toEqual(lengthBefore - 1);
      expect(collection.indexOf(toRemove)).toEqual(-1)
    });

    it("handles change events on the new collection", function() {
      collection.resetWith(moreModels);

      var lengthBefore = collection.length;
      var changeModel = moreModels.get(10);
      changeModel.set('value', 11);
      var lengthAfter = collection.length;

      expect(lengthAfter).toEqual(lengthBefore - 1);
      expect(collection.indexOf(changeModel)).toEqual(-1);
    });

    it("ignores the old collection events", function() {
      var eventSpy = jasmine.createSpy('all event listener');

      collection.resetWith(moreModels);

      collection.on('all', eventSpy);

      allModels.add(new TehModel({id: 16, value: 16}));
      allModels.remove(allModels.at(0));
      allModels.get(2).set("value", "3");
      allModels.comparator = function(a, b) { return 0 };
      allModels.sort();
      allModels.reset([{value: 5}]);

      expect(eventSpy).not.toHaveBeenCalled();
    });

    it("fire a reset with the new filtered data, exactly once", function() {
      var eventSpy = jasmine.createSpy('reset event listener');

      collection.on('reset', eventSpy);

      collection.resetWith(moreModels);

      expect(eventSpy).toHaveBeenCalledWith(collection);
      expect(eventSpy.callCount).toEqual(1);
    });
  });
});
