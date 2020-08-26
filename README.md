# CKEditor5 editor build with custom plugins

This is a custom CKEditor5 build with the following features:

* ClassicEditor and InlineEditor in one build
* subset of available toolbar items
* plugin for placeholders
* optional button styling for links -> deprecated, will be removed

## Using this build in your projects

**Adding it as a dependency:**

`yarn add git+ssh://git@github.com:swisscomeventandmedia/Swisscom.CKEditor5Build.git`

**Upgrading to a new release:**

`yarn upgrade ckeditor5-build-swisscom`

## Development

`npm install`

`npm run watch`

You can open `/sample/index.html` for development.

**Keep in mind which plugins and modifications should be bundled in this build and which should be activated by default. E.g. the placeholder plugin is bundled but needs to be activated for every instance of the editor.**

When developing you might want to activate behavior that should not be activated in the production build by default. You can do this by overwriting the editor config in `/sample/index.html`

## Creating a new release

* increase the version number in package.json
* run `npm run build`
* merge your changes into master
* upgrade dependencies in your projects



## UPSTREAM DOCS

* [ckeditor5-build-classic](https://github.com/ckeditor/ckeditor5/tree/master/packages/ckeditor5-build-classic)
* [ckeditor5-build-inline](https://github.com/ckeditor/ckeditor5/tree/master/packages/ckeditor5-build-inline)
