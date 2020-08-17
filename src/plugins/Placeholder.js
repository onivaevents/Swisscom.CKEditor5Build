/**
 * Placeholder Plugin
 *
 * This code is based on an example from
 * https://ckeditor.com/docs/ckeditor5/latest/framework/guides/tutorials/implementing-an-inline-widget.html
 *
 * It was changed to support a translatable label and a value. -> {label: "First Name", value: "firstname"}
 *
 * Generates/Parses Markup:
 *
 * 		<span class="swisscom_ck5_placeholder" data-value="firstname">First Name</span>
 *
 * We do not use the localisation feature `t()` of ckeditor5 but directly pass in
 * the translated options. e.g. via Fusion -> React -> CKEditor
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';

import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';

import './Placeholder.css';

const CONFIG_PATH = 'placeholderPlugin';
const OPTIONS_CONFIG_PATH = `${CONFIG_PATH}.options`;
const LABEL_CONFIG_PATH = `${CONFIG_PATH}.label`;
const CLASS_ATTRIBUTE = 'swisscom_ck5_placeholder';
const ALLOWED_OPTION_TYPES = ["calltoaction"];

// this is the config required to be passed in from the outside
const DEFAULT_CONFIG = {
	options: [
		{label: "[First Name]", value: "firstname"},
		{label: "[Last Name]", value: "lastname"},
		{label: "[User Link to Overview]", value: "personallink", type: ALLOWED_OPTION_TYPES[0]},
	],
	label: "Placeholder"
}

export default class Placeholder extends Plugin {
    static get requires() {
        return [ PlaceholderEditing, PlaceholderUI ];
    }
}

// Command to manipulate editor contents and state
class PlaceholderCommand extends Command {
    execute( option ) {
		const editor = this.editor;

        editor.model.change( writer => {
			// Create a <placeholder> elment with the "name" attribute...
            const placeholder = writer.createElement( 'placeholder', option );

            // ... and insert it into the document.
            editor.model.insertContent( placeholder );

            // Put the selection on the inserted element.
            writer.setSelection( placeholder, 'on' );
        } );
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;

        const isAllowed = model.schema.checkChild( selection.focus.parent, 'placeholder' );

        this.isEnabled = isAllowed;
    }
}

// Dropdown with options that can be selected a will add a placeholder to the editor
class PlaceholderUI extends Plugin {
    init() {
        const editor = this.editor;
		validateConfig(editor.config);

		const t = editor.t;

		const options = editor.config.get( OPTIONS_CONFIG_PATH );

        // The "placeholder" dropdown must be registered among the UI components of the editor
        // to be displayed in the toolbar.
        editor.ui.componentFactory.add( 'placeholder', locale => {
            const dropdownView = createDropdown( locale );

            // Populate the list in the dropdown with items.
            addListToDropdown( dropdownView, getDropdownItemsDefinitions( options ) );

            dropdownView.buttonView.set( {
                // The t() function helps localize the editor. All strings enclosed in t() can be
                // translated and change when the language of the editor changes.
                label: t(editor.config.get( LABEL_CONFIG_PATH )),
                tooltip: true,
                withText: true
            } );

            // Disable the placeholder button when the command is disabled.
            const command = editor.commands.get( 'placeholder' );
            dropdownView.bind( 'isEnabled' ).to( command );

            // Execute the command when the dropdown item is clicked (executed).
            this.listenTo( dropdownView, 'execute', evt => {
                editor.execute( 'placeholder', evt.source.commandParam );
                editor.editing.view.focus();
            } );

            return dropdownView;
        } );
    }
}

function getDropdownItemsDefinitions( options ) {
    const itemDefinitions = new Collection();

    for ( const option of options ) {
        const definition = {
            type: 'button',
            model: new Model( {
                commandParam: option,
                label: option.label,
                withText: true
            } )
        };

        // Add the item definition to the collection.
        itemDefinitions.add( definition );
    }

    return itemDefinitions;
}

// Parsing markup and creating the internal model. -> upcasting
// Redering markup using an internal model. -> downcasting
class PlaceholderEditing extends Plugin {
    static get requires() {
        return [ Widget ];
    }

    init() {
        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'placeholder', new PlaceholderCommand( this.editor ) );

        this.editor.editing.mapper.on(
            'viewToModelPosition',
            viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( CLASS_ATTRIBUTE ) )
        );
        this.editor.config.define( CONFIG_PATH, DEFAULT_CONFIG );
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register( 'placeholder', {
            // Allow wherever text is allowed:
            allowWhere: '$text',

            // The placeholder will act as an inline node:
            isInline: true,

            // The inline widget is self-contained so it cannot be split by the caret and it can be selected:
			isObject: true,

			// Attributes that should not be removed from the model when downcasting
			allowAttributes: [ 'value', 'label', 'type' ]
        } );
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

		// Parsing the current markup an creating an internal model for the editor
        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'span',
                classes: [ CLASS_ATTRIBUTE ]
            },
            model: ( viewElement, modelWriter ) => {
				const options = this.editor.config.get( OPTIONS_CONFIG_PATH );
				const value = viewElement.getAttribute( 'data-value' );

				// Here we prevent unsupported types from beeing parsed when ck initializes
				// with existing markup.
				const type = ((type) => {
					// if type is allowed
					if(ALLOWED_OPTION_TYPES.indexOf(type) >= 0) {
						return type;
					}
					return undefined;
				})(viewElement.getAttribute('data-type'))

				// We use the current label as a fallback here. If an option was removed
				// from the placeholder plugin the old placeholder will still be recognised
				// as a valid widget when upcasting and will keep its label. We do not want to
				// alter the value of the editor or remove information just by initializing
				// the editor. This should be done explicitly e.g. with a database migration.
				const label = getLabelForOptionValue(options, value, viewElement.getChild( 0 ).data);

                return modelWriter.createElement( 'placeholder', { value, label, type } );
            }
        } );

		// Rerender the inline widget when the user is typing, removing ... editing
        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'placeholder',
            view: ( modelItem, viewWriter ) => {
                const widgetElement = createPlaceholderView( modelItem, viewWriter );

                // Enable widget handling on a placeholder element inside the editing view.
                return toWidget( widgetElement, viewWriter );
            }
        } );

		// Rerender the inline widget if an option is selected in the dropdown
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'placeholder',
            view: createPlaceholderView
        });

        // Helper method for both downcast converters.
        function createPlaceholderView( modelItem, viewWriter ) {
            const value = modelItem.getAttribute( 'value' );
			const label = modelItem.getAttribute( 'label' );
			const type = modelItem.getAttribute( 'type' ) || "";

            const placeholderView = viewWriter.createContainerElement( 'span', {
				class: CLASS_ATTRIBUTE,
				"data-value": value,
				"data-type": type,
            } );

            // Insert the placeholder name (as a text).
            const innerText = viewWriter.createText( label );
            viewWriter.insert( viewWriter.createPositionAt( placeholderView, 0 ), innerText );

            return placeholderView;
        }
    }
}

// We want to give feeback if wrong config is passed to the editor
// to improve development and debugging.
function validateConfig(config) {
	const placeholderConfig = config.get( CONFIG_PATH );
	const options = config.get( OPTIONS_CONFIG_PATH );
	const dropdownLabel = config.get( LABEL_CONFIG_PATH );

	if(!placeholderConfig) {
		console.error('Placeholder Plugin: You need to provide a config!');
		return false;
	}

	if(!dropdownLabel) {
		console.error('Placeholder Plugin: You need to provide a label for the dropdown in the toolbar');
		return false;
	}

	if(!options) {
		console.error('Placeholder Plugin: You need to provide options to be displayed in the toolbar!');
		return false;
	}
	if(!options.length > 0) {
		console.error('Placeholder Plugin: You need to provide a least one option!');
		return false;
	};

	for(let i=0; i < options.length; i++) {
		const option = options[i];
		if(!option.label) {
			console.error(`Placeholder Plugin: Option [${i}] needs a label!`);
			return false;
		}
		if(!option.value) {
			console.error(`Placeholder Plugin: Option [${i}] needs a value!`);
			return false;
		};

		if(option.type && ALLOWED_OPTION_TYPES.indexOf(option.type) < 0) {
			console.error(`Placeholder Plugin: Option [${i}] needs a valid type! Type was "${option.type}"`);
			return false;
		};
	}

	return true
}

// The translation of a label might change over time. This is why we try to find
// a corresponding option and overwrite the current label.
function getLabelForOptionValue( options, value, fallback = "FALLBACK" ){
	const option = options.find((option) => {
		return option.value === value;
	})

	if(option && option.label.length > 0) {
		return option.label;
	} else {
		return fallback
	}
}
