# Filtered Collection

This is a simple filtered collection implemented using
Backbone.Collection. The goal here is to create a collection which,
given a filter function, will just contain elements of the original
which pass the filter. Supports add/remove/reset events of the original
to modify the filtered version.

# Why not just extend backbone?

The main reason I did not just extend backbone is because by extending
it, you shove all behaviors into one model, making it a
jack-of-all-trades and potentially conflicting with behaviors of other
extentions, not to mention making normal operaitons potentially slower.
So the intention is to compose a filter chain pattern using
these guys.

# Usage

    var YourCollection = Backbone.Collection.extend({model: YourModel});
    var YourFilteredCollection = Backbone.FilteredCollection.extend({model: YourModel});
    var allItems = new YourCollection(...);
    var filteredItems = new YourFilteredCollection({origModel: allItems});
    var filteredItems.setFilter(function(item) { return item.get('included') == true;});

And now filteredItems contains only those items that pass the filter.
You can still manipulate the original:

    allItems.add(..., {at: 5}); // at is supported too...

However, if you invoke {silent: true} on the original model, then you
must reset the filter by invoking:

    filteredItems.setFilter(); // no args = just re-filter

Same goes for remove and reset.

To clear the filtering completely, pass the value false to setFilter.
