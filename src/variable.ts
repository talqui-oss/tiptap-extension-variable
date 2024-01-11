import { mergeAttributes, Node } from '@tiptap/core'
import { DOMOutputSpec, Node as ProseMirrorNode } from '@tiptap/pm/model'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'

export type VariableOptions = {
  HTMLAttributes: Record<string, any>
  /** @deprecated use renderText and renderHTML instead  */
  renderLabel?: (props: { options: VariableOptions; node: ProseMirrorNode }) => string
  renderText: (props: { options: VariableOptions; node: ProseMirrorNode }) => string
  renderHTML: (props: { options: VariableOptions; node: ProseMirrorNode }) => DOMOutputSpec
  suggestion: Omit<SuggestionOptions, 'editor'>
}

export const VariablePluginKey = new PluginKey('variable')

const COLORS = [
  ["ab7df6"],
  ["7f8fa4"],
  ["26c1c9"],
  ["fd7b1f"],
  ["e0102b"],
  ["40b630"],
  ["0079c4"],
];
const generatePalette = function (e: any) {
  let i = 0;
  for (let a = 0; a < e.length; a++) {
    i += e.charCodeAt(a);
  }
  return COLORS[i % COLORS.length];
};

export const Variable = Node.create<VariableOptions>({
  name: 'variable',

  addOptions() {
    return {
      HTMLAttributes: {
        class: "variable",
      },
      renderText({ options, node }) {
        return `${node.attrs.id}`
      },
      renderHTML({ options, node }) {
        const htmlAttributes = Object.assign(this.HTMLAttributes, { class: 'variable' })
        htmlAttributes.style = `background-color: #${generatePalette(node.attrs.id)};`

        return [
          'span',
          htmlAttributes,
          `${node.attrs.label}`,
        ]
      },
      suggestion: {
        char: '@',
        pluginKey: VariablePluginKey,
        command: ({ editor, range, props }) => {
          const nodeAfter = editor.view.state.selection.$to.nodeAfter
          const overrideSpace = nodeAfter?.text?.startsWith(' ')

          if (overrideSpace) {
            range.to += 1
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props,
              },
            ])
            .run()

          window.getSelection()?.collapseToEnd()
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from)
          const type = state.schema.nodes[this.name]
          const allow = !!$from.parent.type.contentMatch.matchType(type)

          return allow
        },

        /**
         * Default values for suggestions
         */
        items: ({ query }) => {
          return [
            { label: "Primeiro Nome", value: "{{ contact.contactFirstname }}" },
            { label: "Sobrenome", value: "{{ contact.contactLastname }}" },
            { label: "E-mail", value: "{{ contact.contactEmail }}" },
            { label: "Telefone", value: "{{ contact.contactPhone }}" }
          ].filter(item => item.label.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
        },

      },
    }
  },

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }

          return {
            'data-id': attributes.id,
          }
        },
      },

      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }

          return {
            'data-label': attributes.label,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    if (this.options.renderLabel !== undefined) {
      console.warn('renderLabel is deprecated use renderText and renderHTML instead')
      return [
        'span',
        mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes),
        this.options.renderLabel({
          options: this.options,
          node,
        }),
      ]
    }
    const html = this.options.renderHTML({
      options: this.options,
      node,
    })

    if (typeof html === 'string') {
      return [
        'span',
        mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes),
        html,
      ]
    }
    return html
  },

  renderText({ node }) {
    if (this.options.renderLabel !== undefined) {
      console.warn('renderLabel is deprecated use renderText and renderHTML instead')
      return this.options.renderLabel({
        options: this.options,
        node,
      })
    }
    return this.options.renderText({
      options: this.options,
      node,
    })
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => this.editor.commands.command(({ tr, state }) => {
        let isMention = false
        const { selection } = state
        const { empty, anchor } = selection

        if (!empty) {
          return false
        }

        state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
          if (node.type.name === this.name) {
            isMention = true
            tr.insertText(this.options.suggestion.char || '', pos, pos + node.nodeSize)

            return false
          }
        })

        return isMention
      }),
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
