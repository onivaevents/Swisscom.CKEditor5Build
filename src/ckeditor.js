/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

// The editor creator to use.
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import InlineEditorBase from '@ckeditor/ckeditor5-editor-inline/src/inlineeditor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import CKFinder from '@ckeditor/ckeditor5-ckfinder/src/ckfinder';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';

// Zoon Custom Plugins
import Placeholder from './plugins/Placeholder';

import './styles.css';

// Link Decorators
//
// We currently use the following link decorators rather than implementing an own
// plugin for each of them for pragmatic reasons. Sadly ck does not allow us to define
// the decorators here and switch them of by default. We only want to activate them if needed.
// For now the best solution seems to be copying this config, when initializing an editor instance.
//
// -> see React Component for the RichtText Editor in the Zoon.Admin UI for an example
//
// link: {
//    decorators: {
// 		toggleCallToAction: {
// 			mode: "manual",
// 			label: "CallToAction Button",
// 			attributes: {
// 				class: "swisscom_ck5_calltoaction",
// 			},
// 		},
//	  },
// }


// Plugins to include in the build.
const plugins = [
	Essentials,
	UploadAdapter,
	Autoformat,
	Bold,
	Italic,
	CKFinder,
	Link,
	List,
	Paragraph,
	PasteFromOffice,
	Table,
	TableToolbar,
	Placeholder,
	// CallToAction -> is not a plugin but a link decorator defined in the editor config
];

// Editor configuration.
const defaultConfig = {
	toolbar: {
		items: [
			'bold',
			'italic',
			'|',
			'bulletedList',
			'numberedList',
			'|',
			'link',
			'|',
			'insertTable',
			// 'placeholder' -> not by default
			// callToAction -> is not a plugin but a link decorator defined in the editor config
		]
	},
	// This value must be kept in sync with the language defined in webpack.config.js.
	language: 'en',
};

export class ClassicEditor extends ClassicEditorBase {}
ClassicEditor.builtinPlugins = plugins;
ClassicEditor.defaultConfig = defaultConfig;
// TODO: remove after refactor, use named import instead

export class InlineEditor extends InlineEditorBase {}
InlineEditor.builtinPlugins = plugins;
InlineEditor.defaultConfig = defaultConfig;

export default {
	ClassicEditor: ClassicEditor,
	InlineEditor: InlineEditor
}
