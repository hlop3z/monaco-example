async function PyodideCompletion(monaco) {
  // Ignored Keywords
  const ignoredKeywords = ["print", "def", "class"];

  // Pyodide pip-install Library
  await pyodide.loadPackage("jedi");

  // Helper to map Jedi types to Monaco CompletionItemKind
  function mapJediTypeToMonacoKind(jediType) {
    const { CompletionItemKind } = monaco.languages;
    switch (jediType) {
      case "module":
        return CompletionItemKind.Module;
      case "class":
        return CompletionItemKind.Class;
      case "instance":
        return CompletionItemKind.Variable; // Instances are like variables holding objects
      case "function":
        return CompletionItemKind.Function;
      case "param":
        return CompletionItemKind.Parameter;
      case "property":
        return CompletionItemKind.Property;
      case "keyword":
        return CompletionItemKind.Keyword;
      case "statement":
        return CompletionItemKind.Statement;
      case "variable":
        return CompletionItemKind.Variable;
      case "method":
        return CompletionItemKind.Method;
      case "file":
        return CompletionItemKind.File;
      // Add more mappings as needed based on jedi's types
      default:
        return CompletionItemKind.Text; // Fallback for unknown types
    }
  }

  // Ensure the language is registered, although Monaco often does this if a model is created with the language 'python'
  monaco.languages.register({ id: "python" });

  monaco.languages.registerCompletionItemProvider("python", {
    // Trigger characters are useful, but completions can also be manually triggered (Ctrl+Space)
    // triggerCharacters: [".", ...],
    triggerCharacters: ["."],
    provideCompletionItems: async (model, position) => {
      const code = model.getValue();
      const offset = model.getOffsetAt(position);

      pyodide.globals.set("code", code);
      pyodide.globals.set("offset", offset);

      const result = pyodide.runPython(`
        import jedi
        script = jedi.Script(code, path="example.py")
        completions = script.complete(column=0, line=1)
        [dict(name=c.name, type=c.type, complete=c.complete) for c in completions]        
      `);

      const suggestions = result
        .toJs()
        .map((item) => {
          return {
            label: item.name, // The primary text shown in the suggestion list
            kind: mapJediTypeToMonacoKind(item.type), // Monaco icon/category
            insertText: item.complete, // The actual text to insert
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            // Optional
            detail: item.type, // Optional - shown next to the label (e.g., 'function', 'class')
            documentation: item.description, // Optional - markdown documentation (docstring)
            filterText: item.name, // Optional - text used for filtering
            sortText: item.name, // Optional - text used for sorting
          };
        })
        .filter((item) => !ignoredKeywords.includes(item.label));

      return { suggestions };
    },
  });
}
