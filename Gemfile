source "https://rubygems.org"

# GitHub Pages gem includes all Jekyll plugins supported by GitHub Pages
# This will install the correct Jekyll version automatically
gem "github-pages", "~> 232", group: :jekyll_plugins

# Additional Jekyll plugins (already included in github-pages but explicit for clarity)
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :windows do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.2.0", :platforms => [:mingw, :x64_mingw, :mswin]

# Webrick is needed for Ruby 3.0+
gem "webrick", "~> 1.8"
