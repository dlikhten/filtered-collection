/*
Copyright (C) 2012 Dmitriy Likhten

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function(_, Backbone) {
  var defaultFilter = function() {return true;};
  /**
   * This represents a filtered collection. You can either pass a filter or
   * invoke setFilter(filter) to give a filter. The filter is identical to
   * that which is used for _.select(array, filter)
   *
   * false filter indicates no filtering.
   *
   * do not modify this collection directly via #add/#remove, modify the
   * underlying origModel.
   */
  Backbone.FilteredCollection = Backbone.Collection.extend({
    collectionFilter: null
    ,defaultFilter: defaultFilter

    ,initialize: function(models, data) {
      if (models) throw "models cannot be set directly, unfortunately first argument is the models.";
      this.collection = data.collection;
      this.setFilter(data.collectionFilter);

      this.collection.on("add",     this.addModel, this);
      this.collection.on("remove",  this.removeModel, this);
      this.collection.on("reset",   this.resetCollection, this);
    }

    ,_reset: function(options) {
      Backbone.Collection.prototype._reset.call(this, options);
      this._mapping = [];
    }

    ,add: function() {
      throw "Do not invoke directly";
    }

    ,remove: function() {
      throw "Do not invoke directly";
    }

    ,reset: function() {
      throw "Do not invoke directly";
    }

    ,resetCollection: function() {
      this._mapping = [];
      this._reset();
      this.setFilter(undefined, {silent: true});
      this.trigger("reset", this);
    }

    ,removeModel: function(model, colleciton, options) {
      var at = this._mapping.indexOf(options.index);
      if (at > -1) {
        this._forceRemoveModel(model, _.extend({index: at}, options));
      }
    }

    ,_forceRemoveModel: function(model, options) {
      this._mapping.splice(options.index, 1);
      Backbone.Collection.prototype.remove.call(this, model, {silent: options.silent});
    }

    ,addModel: function(model, collection, options) {
      if (this.collectionFilter(model)) {
        this._forcedAddModel(model, options);
      }
    }

    ,_forcedAddModel: function(model, options) {
      var desiredIndex = options.index;
      // determine where to add, look at mapping and find first object with the index
      // great than the one that we are given
      var addToIndex = _.sortedIndex(this._mapping, desiredIndex, function(origIndex) {
        return origIndex;
      });

      // add it there
      Backbone.Collection.prototype.add.call(this, model, {at: addToIndex, silent: options.silent});
      this._mapping.splice(addToIndex, 0, desiredIndex);
    }

    ,setFilter: function(newFilter, options) {
      if (newFilter === false) { newFilter = this.defaultFilter } // false = clear out filter
      this.collectionFilter = newFilter || this.collectionFilter || this.defaultFilter;
      options || (options = {});

      // this assumes that the original collection was unmodified
      // without the use of add/remove/reset events. If it was, a
      // reset event must be thrown, or this object's .resetCollection
      // method must be invoked, or this will most likely fall out-of-sync

      // why HashMap lookup when you can get it off the stack
      var filter = this.collectionFilter;
      var mapping = this._mapping;

      // this is the option object to pass, it will be mutated on each
      // iteration
      var passthroughOption = _.extend({}, options);
      this.collection.each(function(model, index) {
        var foundIndex = mapping.indexOf(index);
        passthroughOption.index = foundIndex == -1 ? this.length : foundIndex;

        if (filter(model, index)) {
          // if already added, no touchy
          if (foundIndex == -1) {
            this._forcedAddModel(model, passthroughOption);
          }
        }
        else {
          if (foundIndex > -1) {
            this._forceRemoveModel(model, passthroughOption);
          }
        }
      }, this);
    }
  });
})(_, Backbone);
