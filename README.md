# tiptap-extension-variable

## Introduction

Tiptap is a headless wrapper around [ProseMirror](https://ProseMirror.net) – a toolkit for building rich text WYSIWYG editors, which is already in use at many well-known companies such as _New York Times_, _The Guardian_ or _Atlassian_.

## Official Documentation

Documentation can be found on the [Tiptap website](https://tiptap.dev).

## License

Tiptap is open sourced software licensed under the [MIT license](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md).

## Usage

```javascript
//es-6
import { VueRenderer } from "@tiptap/vue-3";
import tippy from "tippy.js";
import VariableList from "./VariableList.vue";

new Editor({
  extensions: [
    Variable.configure({
      suggestion: {
        render: () => {
          let component;
          let popup;

          return {
            onStart: (props) => {
              component = new VueRenderer(VariableList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },

            onUpdate(props) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === "Escape") {
                popup[0].hide();

                return true;
              }

              return component?.ref?.onKeyDown(props);
            },

            onExit() {
              popup[0]?.destroy();
              component.destroy();
            },
          };
        },
      },
    }),
  ]
});
```
