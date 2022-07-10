const { EditorState } = require("prosemirror-state");
const { EditorView } = require("prosemirror-view");
const { Schema, DOMParser } = require("prosemirror-model");
const { schema } = require("prosemirror-schema-basic");
const { addListNodes } = require("prosemirror-schema-list");
const { exampleSetup } = require("prosemirror-example-setup");

const { MenuItem } = require("prosemirror-menu");
const { buildMenuItems } = require("prosemirror-example-setup");

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const placeholders = {
	f_name: "Vorname",
	l_name: "Nachname",
	case_name: "Aktenzeichen",
	company_name: "Kunde (Firmenname)",
	case_id: "Akten-ID",
};

const svNodeSpec = {
	attrs: {
		type: { default: "" },
		label: { default: "" },
	},
	inline: true,
	group: "inline",
	draggable: true,
	toDOM: (node) => [
		"span",
		{
			"data-placeholder": node.attrs.type,
			"data-tooltip": "Test Simple Variable",
			class: "replacement",
		},
		placeholders[node.attrs.type],
	],
	parseDOM: [
		{
			tag: "span[data-placeholder]",
			getAttrs: (dom) => {
				let type = dom.getAttribute("data-placeholder");
				return type in placeholders ? { type: type } : false;
			},
		},
	],
};

const mySchema = new Schema({
	// nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
	nodes: schema.spec.nodes.addBefore("image", "placeholder", svNodeSpec),
	marks: schema.spec.marks,
});

window.useschema = mySchema;

let svType = mySchema.nodes.placeholder;
function insertSV(type) {
	return function (state, dispatch) {
		let { $from } = state.selection,
			index = $from.index();
		if (!$from.parent.canReplaceWith(index, index, svType)) return false;
		if (dispatch)
			dispatch(state.tr.replaceSelectionWith(svType.create({ type })));
		return true;
	};
}

let myMenu = buildMenuItems(mySchema);

for (let name in placeholders) {
	myMenu.insertMenu.content.push(
		new MenuItem({
			title: "Insert " + placeholders[name],
			label: placeholders[name],
			enable(state) {
				return insertSV(name)(state);
			},
			run: insertSV(name),
		})
	);
}

window.view = new EditorView(document.querySelector("#editor"), {
	state: EditorState.create({
		doc: DOMParser.fromSchema(mySchema).parse(
			document.querySelector("#content")
		),
		plugins: exampleSetup({ schema: mySchema, menuContent: myMenu.fullMenu }),
	}),
});

function require(name) {
	let id = /^prosemirror-(.*)/.exec(name),
		mod = id && PM[id[1].replace(/-/g, "_")];
	if (!mod) throw new Error(`Library basic isn't loaded`);
	return mod;
}
