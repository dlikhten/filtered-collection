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
    ,_mapping: []

    ,initialize: function(data) {
      this.collection = data.collection;
      this.collectionFilter = data.collectionFilter;

      // has to be done like this to properly handle insertions in middle...
      this.collection.on("add", this.addModel, this);

      // this can be optimized
      this.collection.on("remove", this.removeModel, this);

      this.collection.on("reset", this.resetCollection, this);
      this.on("remove", this.syncMapping, this);
      this.setFilter(this.collectionFilter);
    }

    ,resetCollection: function() {
      this.setFilter();
    }

    ,removeModel: function(removed) {
      this.remove(removed);
    }

    ,syncMapping: function(model, collection, options) {
      this._mapping.splice(options.index, 1);
    }

    ,addModel: function(added, collection, options) {
      if (this.collectionFilter(added)) {
        var desiredIndex = options.index;
        console.log("desired:", desiredIndex);
        // determine where to add, look at mapping and find first object with the index
        // great than the one that we are given
        var addToIndex = _.sortedIndex(this._mapping, desiredIndex, function(origIndex) {
          return origIndex;
        });

        // add it there
        this._mapping.splice(addToIndex, 0, options.index);
        this.add(added, {at: addToIndex});
      }
    }

    ,setFilter: function(newFilter) {
      if (newFilter === false) { newFilter = this.defaultFilter } // false = clear out filter
      this.collectionFilter = newFilter || this.collectionFilter || this.defaultFilter;
      this._mapping = [];
      var filtered = [];
      this.collection.each(function(model, index) {
        if (this.collectionFilter(model, index)) {
          filtered.push(model);
          this._mapping.push(index);
        }
      }, this);
      this.reset(filtered);
    }
  });
})(_, Backbone);