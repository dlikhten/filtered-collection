(function(Backbone) {
  /**
   * This represents a filtered collection. You can either pass a filter or
   * invoke setFilter(filter) to give a filter. The filter is identical to
   * that which is used for _.select(array, filter)
   *
   * null filter indicates no filtering.
   *
   * do not modify this collection directly via #add/#remove, modify the
   * underlying origModel.
   */
  Backbone.FilteredCollection = Backbone.Collection.extend({
    defaultFilter: function() {return true;},
    filter: null,
    origModel: null,
    model: null,

    initialize: function(data) {
      this.origModel = data.origModel;

      var origModel = this.origModel;
      // has to be done like this to properly handle insertions in middle...
      origModel.bind("add", this.resetOrigModel, this);

      // this can be optimized
      origModel.bind("remove", this.removeModel, this);

      origModel.bind("reset", this.resetOrigModel, this);
      this.setFilter(data.filter);
    },

    resetOrigModel: function() {
      this.setFilter();
    },

    removeModel: function(removed) {
      this.remove(removed);
    },

    setFilter: function(newFilter) {
      this.filter = newFilter || this.filter || this.defaultFilter;
      console.log(this.filter);
      var filtered = this.origModel.filter(this.filter, this);
      this.reset(filtered);
    }
  });
})(Backbone);