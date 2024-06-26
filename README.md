# Module Templates

A flexible VSCode extension for creating (and using) file/folder templates. If you're bored of typing the same boilerplate stuff every time you create a new thing, this might be for you.

**There are no templates included with this extension**.

![Screen capture](screencap.gif)

## Use

The plugin is used in one of two ways:

- Right click in the file explorer and select `New From Template`. The template files will be output here.

- Run `New From Template` using the command palette. Files will be output relative to the current workspace folder (and the `defaultPath` option if set)

## Templates

Templates are defined in VS Code settings. If your code is shared by many people it can be nice to put templates in workspace settings (`.vscode/settings.json`) so that they can be used by everyone!

Below is a config example, showing how a template for a React component can be defined. The example template defines a folder, a `.jsx` file and an `.scss` file.

```json
{
  "module-templates.engine": "handlebars",
  "module-templates.templates": {
    "react-component": {
      "displayName": "React component",
      "defaultPath": "source/components",
      "folder": "{{kebab name}}",
      "questions": {
        "name": "Component name",
        "className": "HTML class name"
      },
      "files": [
        {
          "name": "{{kebab name}}.jsx",
          "content": [
            "import React from 'react';",
            "",
            "const {{pascal name}} = () =>",
            "  <div className=\"{{kebab className}}\" />",
            "",
            "export default {{pascal name}};"
          ]
        },
        {
          "name": "{{kebab name}}.scss",
          "content": [".{{kebab className}} {}"]
        }
      ]
    }
  }
}
```

## Configuration API

### module-templates.engine

Optional. `"handlebars"`.

This option used to support a `"legacy"` option, which is now deprecated. If you haven't set this option, or set it to `"legacy"` you'll get a warning each time you use a legacy template. Support for legacy templates will be entirely dropped in the next major version. Set this option to `"handlebars"` and see below for how to convert legacy template syntax into Handlebars syntax.

### module-templates.handlebarsConfig

Optional. `string`

Path to a javascript file that can be used to configure Handlebars. The javascript file should export a function or an object.

If the file exports an object, it's passed to Handlebars as [runtime options](https://handlebarsjs.com/api-reference/runtime-options.html). This can f. ex. be used to add custom helpers and partials.

Note that when you edit this file, you might need to reload VSCode in order for the changes to take effect.

```js
module.exports = {
  helpers: {
    myHelper: () => "Hello!",
  },
};
```

If the file exports a function, that function will be called with `Handlebars`. This enables [configuration of the Handlebars runtime](https://handlebarsjs.com/api-reference/runtime.html). This can also be used to load some third party helper libraries that register themselves to the Handlebars runtime. The function can also return a [runtime options object](https://handlebarsjs.com/api-reference/runtime-options.html).

```js
module.exports = handlebars => {
  handlebars.registerPartial("foo", () => "Hello!");

  return {
    helpers: {
      myHelper: () => "Hello!",
    },
  };
};
```

### module-templates.templateFiles

Optional. `string[]`

A list of file paths to load templates from. The files should be named like `<some-name>.module-templates.json` (f ex `my-project.module-templates.json`). The `.module-templates` part of the file name is optional but _strongly_ recommended, because you get schema validation in VSCode when editing those files.

Paths can either be absolute, relative to the home directory (`~`) or relative to `.vscode/settings.json`. Relative paths will not work in user settings.

Example:

```json
{
  "module-templates.templateFiles": ["./my-templates.module-templates.json"]
}
```

### module-templates.templates

An object whose keys are id strings (which can be used in other templates, see `extends`) and values are template objects. Templates have the following properties:

#### displayName

Optional. This name is used when selecting a template to create from. If this property is empty, the template will not be shown in the template selector (this can be useful if you create templates that are just for inheritance).

#### defaultPath

Optional. A path relative to the workspace root. When running the extension from the command palette files will be output to this path. When running from the right-click menu this option has no effect.

#### extends

Optional. List of template ids (string). When set, the template objects corresponding to the given ids are merged into the current template (overriding left to right, current template last). Questions are also merged, and files are concatenated. In short, you get all properties, files and questions from the inherited templates. See below for example.

#### folder

Optional. If this is option is set, a folder is created using the name from the option. This field is a template; you can use any syntax supported by the template engine.

#### files

Required. A list of file templates. File templates are objects with the following properties:

- `name`: Required. A name for the file to create (with file extension). Can also be a path (non-existing folders will be created). This field is a template; you can use any syntax supported by the template engine. If the template resolves to an empty string, the file will not be created.
- `open`: Optional. A `boolean` that indicates whether this file should be opened after creation or not.
- `content`: Required unless `contentFile` is set. The template for the file to create, given as an array of strings.
- `contentFile`: Required unless `content` is set. Path to a file to read the content template from. The file can have any extension and is read as a string. The path must be absolute, relative to home (`~`) or relative to the config file you're editing. Note that if you plan on using `contentFiles` with both user settings and workspace settings, the paths used in user settings must be absolute or relative to `~`.

#### questions

Optional. A dictionary of questions to ask when using the template. The answers are used as data when rendering the template. The aswers are referenced in templates by their key in the `questions` object.

Question values can be one of three types:

- `string`: The value is displayed as a label for the input box
- `object` with properties:
  - `displayName (string)`: Displayed as a label for the input box
  - `defaultValue (string)`: A value that is used if no text is input
- `array` of `object` (displayed as a selecttion menu). Properties:
  - `displayName (string)`: Displayed as the name of the option
  - `value (any value)`: The value to use when the value is selected

Note that the `legacy` engine only supports strings even if the `value` for array questions can be anything.

```json
{
  "questions": {
    "name": "File name",
    "myQuestion": "Some description",
    "myOtherQuestion": [
      { "displayName": "A", "value": [1, 2] },
      { "displayName": "B", "value": [3, 4] }
    ]
  },
  "folder": "{{name}}",
  "files": [
    {
      "name": "{{name}}.md",
      "content": [
        "{{myQuestion}}", // Outputs the answer from the prompt
        "{{#each myOtherQuestion}}",
        "{{this}}",
        "{{/each}}"
      ]
    }
  ]
}
```

## Composition / inheritance

Templates can be combined to create new ones. The id of a template can be referenced from other templates using `extends` (see `extends` option above for more technical details). When referencing a template ids in `extends`, you inherit all properties, questions and files from that template. You can inherit multiple templates. Inheritance is recursive, so you can inherit other templates that inherit something else and so on.

By omitting `displayName` from templates, you can create hidden templates that are only used to create other templates. In the example below, only "React component with SCSS" will be available when selecting templates.

```json
{
  "module-templates.engine": "handlebars",
  "module-templates.templates": {
    "jsx-file": {
      "files": [
        {
          "name": "{{kebab name}}.jsx",
          "content": [
            "const {{pascal name}} = () => null;",
            "export default {{pascal name}};"
          ]
        }
      ]
    },
    "scss-file": {
      "files": [
        {
          "name": "{{kebab name}}.scss",
          "content": [".{{kebab name}} {}"]
        }
      ]
    },
    "react-component": {
      "extends": ["jsx-file", "scss-file"],
      "defaultPath": "source/components",
      "displayName": "React component with SCSS",
      "folder": "{{kebab name}}",
      "questions": { "name": "Component name" },
      "files": []
    }
  }
}
```

## Legacy templates

Legacy templates are deprecated. Please enable the `handlebars` engine and see below for how to convert legacy templates to handlebars templates.

- `{<question-key>.raw}` -> `{{<question-key>}}`
- `{<question-key>.pascal}` -> `{{pascal <question-key>}}`
- `{<question-key>.kebab}` -> `{{kebab <question-key>}}`
- `{<question-key>.camel}` -> `{{camel <question-key>}}`
- `{<question-key>.snake}` -> `{{snake <question-key>}}`

## Handlebars templates

Enable Handlebars templates by setting `module-templates.engine` to `"handlebars"`. See the [Handlebars documentation](https://handlebarsjs.com/) for syntax. The answers object is passed directly to Handlebars as view data.

### Helpers

This plugin defines a few Handlebars helpers that you can use in templates. If you want more helpers, consider submitting a PR!

#### eq

Check whether thing A is equal to thing B. In the following example, `Yes!` will be output if the answer is `yes` and `No!` otherwise.

```json
[
  "{{#eq answer \"yes\"}}Yes!{{else}}No!{{/eq}}",
  "{{#if (eq answer \"yes\")}}Yes!{{else}}No!{{/if}}"
]
```

#### Casing helpers

Casing helpers are used to transform answers into a specific casing convention. F. ex. to convert the answer `"some name"` into `"SomeName"` (PascalCase):

```json
["{{pascal answer}}"]
```

| Name         | Input       | Output      |
| ------------ | ----------- | ----------- |
| **camel**    | `some text` | `someText`  |
| **capital**  | `some_text` | `Some Text` |
| **constant** | `some text` | `SOME_TEXT` |
| **lower**    | `SOME_TEXT` | `some_text` |
| **kebab**    | `some text` | `some-text` |
| **pascal**   | `some text` | `SomeText`  |
| **sentence** | `some_text` | `Some text` |
| **snake**    | `some text` | `some_text` |
| **upper**    | `some-text` | `SOME-TEXT` |
| **words**    | `some_text` | `some text` |

Note that handlebars helpers can be combined, which you can use to create some unsupported casing conventions. F. ex. to ouput text in `COBOL-CASE` you can use `{{upper (kebab input)}}`, or to get `UPPERCASE WORDS` use `{{upper (words input)}}`.

### Context object

For Handlebars templates this extension exposes a `context` object (in the global scope) that contains some metadata that might be useful. Note that if you have a question with id `"context"`, the answer to that question will replace the context object.

Example:

```hbs
{{context.template.displayName}}
```

```ts
type Context = {
  // Contents of the clipboard:
  clipboard: string | undefined;
  // The data for the selected template:
  template: Template;
  vscode: {
    // The item that was right-clicked in the file explorer (if any):
    clickedItem: {
      path: string | undefined;
    };
    // The currently open document (tab):
    currentDocument: {
      name: string | undefined;
      path: string | undefined;
    };
    workspace: {
      name: string | undefined;
      path: string | undefined;
    };
  };
};
```
