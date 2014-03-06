# -*- encoding: utf-8 -*-
require File.expand_path('../lib/backbone/filtered_collection/version', __FILE__)

Gem::Specification.new do |gem|
  gem.name          = "backbone-filtered-collection"
  gem.version       = Backbone::FilteredCollection::VERSION
  gem.platform      = Gem::Platform::RUBY
  gem.authors       = ["Dmitriy Likhten"]
  gem.email         = ["dlikhten@gmail.com"]
  gem.description   = %q{A filtered collection for backbone.js}
  gem.summary       = %q{Allowing implementation of a chain-of-responsibility pattern in backbone's collection filtering}
  gem.homepage      = "http://github.com/dlikhten/filtered-collection"
  gem.license       = "MIT"

  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ["lib"]

  gem.add_dependency "railties", ">= 3.0", "< 5.0"

  gem.add_development_dependency 'rake'
  gem.add_development_dependency 'jasmine', '< 2.0'
end
