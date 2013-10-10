# Filtered Collection

[![Build Status](https://travis-ci.org/dlikhten/filtered-collection.png?branch=master)](https://travis-ci.org/dlikhten/filtered-collection)

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

# Installation to rails

With bundler

    gem 'backbone-filtered-collection'

Inside your sprockets file:

    //= require backbone-filtered-collection

# Installation anywhere else

Download the [source][1], minify as you see fit by your minification strategy.

# Usage

    var YourCollection = Backbone.Collection.extend({model: YourModel});
    var YourFilteredCollection = Backbone.FilteredCollection.extend({model: YourModel});

    var allItems = new YourCollection(...);

    // note the null, backbone collections want the pre-populated model here
    // we can't do that since this collection does not accept mutations, it
    // only mutates as a proxy for the underlying collection
    var filteredItems = new YourFilteredCollection(null, {collection: allItems});

    var filteredItems.setFilter(function(item) { return item.get('included') == true;});

And now filteredItems contains only those items that pass the filter.
You can still manipulate the original:

    allItems.add(..., {at: 5}); // at is supported too...

However, if you invoke {silent: true} on the original model, then you
must reset the filter by invoking:

    filteredItems.setFilter(); // no args = just re-filter

Same goes for remove and reset.

To clear the filtering completely, pass the value false to setFilter.

## Filters

- `setFilter(function() {})`: Set the given function as the filter. Same api as `_.each`.
- `setFilter(false)`: Turn filtering off. This collection will have all elements of the original collection.
- `setFilter()`: Re-filter. Don't change the filter function but execute it on all elements. Useful after the original collection was modified via `silent: true`

## Events

The collection will create events much like a regular collection. There are a few to note:

 - `add`: An object was added to the collection (via filter OR via orig collection)
 - `remove`: An object was removed from the collection (via filter OR via orig collection)
 - `reset`: The original collection was reset, filtering happened
 - `sort`: The collection was sorted. No changes in models represented.
 - `change`: An object in the collection was changed. The object was already accepted by the filter, and is still.
 - `filter-complete`: Filtering was completed. If you are not listening to add/remove then just listen to filter-complete and reset your views.

## Change Collection

You can change the underlying collection if you really need to by invoking `#resetWith(newCollection)`, only one `reset`
event will be triggered with the new data.

# Testing

    bundle install
    rake jasmine

I also included a .rvmrc file incase you have rvm installed.

# Contributing

Please, do not contribute without a spec. Being tested is critically important
to this project, as it's a framework level component, and so its failure
will be damn hard to detect.

Also, no tab characters, 2 spaces only. Minifiers can handle this stuff for you.

[1]: https://raw.github.com/dlikhten/filtered-collection/master/vendor/assets/javascripts/backbone-filtered-collection.js
