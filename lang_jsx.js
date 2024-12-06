/**
 * @ JSX Coloring
 */

const JSXMonaco = (function () {
  const JSX_TAG = "predefined.sql";
  const HTML_TAG = "keyword";
  const HTML_VAR = "attribute.name";
  const NAMESPACES_TAG = "number.hex";
  const KW_TAG = "regexp";

  const Attrs = (custom = false) => [
    // JSX attribute names
    [/[a-zA-Z-]+(?=\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\}))/, HTML_VAR],

    // Continue tokenizing attributes
    {
      include: "@whitespace",
    },

    // self-closing tag
    [
      /\/?>/,
      {
        token: custom ? JSX_TAG : HTML_TAG,
        bracket: "@close",
        next: "@pop",
      },
    ],

    // Text
    [/"/, "string", "@string_double"],
    [/'/, "string", "@string_single"],
    [/`/, "string", "@string_backtick"],
    [/[\w+]/, ""],
  ];
  const JSX_TOKENS = {
    // Common
    namespaces: [/[a-zA-Z_$][\w$]*(?=\.)/, NAMESPACES_TAG],
    html: [
      [
        /<\/?[\$\w+]+[.A-Z]+[.\$\w+]*/,
        {
          token: JSX_TAG,
          bracket: "@open",
          next: "@jsxAttributes",
        },
      ],
      [
        /<\/?[\$A-Z]+[.A-Za-z]+[.\$\w+]*/,
        {
          token: JSX_TAG,
          bracket: "@open",
          next: "@jsxAttributes",
        },
      ],
      [
        /<\/?[a-z0-9]*\/?/,
        {
          token: HTML_TAG,
          bracket: "@open",
          next: "@htmlAttributes",
        },
      ],
    ],
    attrs: {
      jsxAttributes: Attrs(true, "jsxAttributes"),
      htmlAttributes: Attrs(),
    },
  };
  const TOKENS = {
    root: [[/[{}]/, "delimiter.bracket"], { include: "common" }],

    ...JSX_TOKENS.attrs,

    common: [
      [/\b(?:function|class|const|let|var)\b/, "keyword"],

      // words with dot as JavaScript namespaces
      JSX_TOKENS.namespaces,

      // identifiers and keywords
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            "@keywords": KW_TAG,
            "@default": "identifier",
          },
        },
      ],
      // [/[\w+].(<)?/, ""],
      [/[A-Z][\w\$]*\(/, "type.identifier"], // to show class names nicely

      // whitespace
      { include: "@whitespace" },

      // JSX element
      ...JSX_TOKENS.html,

      // regular expression: ensure it is terminated before beginning (otherwise it is an opeator)
      [
        /\/(?=([^\\\/]|\\.)+\/([dgimsuy]*)(\s*)(\.|;|,|\)|\]|\}|$))/,
        { token: "regexp", bracket: "@open", next: "@regexp" },
      ],

      // delimiters and operators
      [/[()\[\]]/, "@brackets"],
      [/[<>](?!@symbols)/, "@brackets"],
      [/!(?=([^=]|$))/, "delimiter"],
      [
        /@symbols/,
        {
          cases: {
            "@operators": "delimiter",
            "@default": "",
          },
        },
      ],

      // numbers
      [/(@digits)[eE]([\-+]?(@digits))?/, "number.float"],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, "number.float"],
      [/0[xX](@hexdigits)n?/, "number.hex"],
      [/0[oO]?(@octaldigits)n?/, "number.octal"],
      [/0[bB](@binarydigits)n?/, "number.binary"],
      [/(@digits)n?/, "number"],

      // delimiter: after number because of .\d floats
      [/[;,.]/, "delimiter"],

      // strings
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/'([^'\\]|\\.)*$/, "string.invalid"],
      [/"/, "string", "@string_double"],
      [/'/, "string", "@string_single"],
      [/`/, "string", "@string_backtick"],

      //[/(^.*[a]*)./, HTML_TAG],
    ],

    whitespace: [
      [/[ \t\r\n]+/, ""],
      [/\/\*\*(?!\/)/, "comment.doc", "@jsdoc"],
      [/\/\*/, "comment", "@comment"],
      [/\/\/.*$/, "comment"],
    ],

    comment: [
      [/[^\/*]+/, "comment"],
      [/\*\//, "comment", "@pop"],
      [/[\/*]/, "comment"],
    ],

    jsdoc: [
      [/[^\/*]+/, "comment.doc"],
      [/\*\//, "comment.doc", "@pop"],
      [/[\/*]/, "comment.doc"],
    ],

    // We match regular expression quite precisely
    regexp: [
      [
        /(\{)(\d+(?:,\d*)?)(\})/,
        [
          "regexp.escape.control",
          "regexp.escape.control",
          "regexp.escape.control",
        ],
      ],
      [
        /(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/,
        [
          "regexp.escape.control",
          { token: "regexp.escape.control", next: "@regexrange" },
        ],
      ],
      [/(\()(\?:|\?=|\?!)/, ["regexp.escape.control", "regexp.escape.control"]],
      [/[()]/, "regexp.escape.control"],
      [/@regexpctl/, "regexp.escape.control"],
      [/[^\\\/]/, "regexp"],
      [/@regexpesc/, "regexp.escape"],
      [/\\\./, "regexp.invalid"],
      [
        /(\/)([dgimsuy]*)/,
        [{ token: "regexp", bracket: "@close", next: "@pop" }, "keyword.other"],
      ],
    ],

    regexrange: [
      [/-/, "regexp.escape.control"],
      [/\^/, "regexp.invalid"],
      [/@regexpesc/, "regexp.escape"],
      [/[^\]]/, "regexp"],
      [
        /\]/,
        {
          token: "regexp.escape.control",
          next: "@pop",
          bracket: "@close",
        },
      ],
    ],

    string_double: [
      [/[^\\"]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, "string", "@pop"],
    ],

    string_single: [
      [/[^\\']+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/'/, "string", "@pop"],
    ],

    string_backtick: [
      [/\$\{/, { token: "delimiter.bracket", next: "@bracketCounting" }],
      [/[^\\`$]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/`/, "string", "@pop"],
    ],

    bracketCounting: [
      [/\{/, "delimiter.bracket", "@bracketCounting"],
      [/\}/, "delimiter.bracket", "@pop"],
      { include: "common" },
    ],
  };

  const JSXMonacoTokens = {
    tokenizer: TOKENS,

    keywords: [
      // Should match the keys of textToKeywordObj in
      // https://github.com/microsoft/TypeScript/blob/master/src/compiler/scanner.ts
      "abstract",
      "any",
      "as",
      "asserts",
      "bigint",
      "boolean",
      "break",
      "case",
      "catch",
      "class",
      "continue",
      "const",
      "constructor",
      "debugger",
      "declare",
      "default",
      "delete",
      "do",
      "else",
      "enum",
      "export",
      "extends",
      "false",
      "finally",
      "for",
      "from",
      "function",
      "get",
      "if",
      "implements",
      "import",
      "in",
      "infer",
      "instanceof",
      "interface",
      "is",
      "keyof",
      "let",
      "module",
      "namespace",
      "never",
      "new",
      "null",
      "number",
      "object",
      "out",
      "package",
      "private",
      "protected",
      "public",
      "override",
      "readonly",
      "require",
      "global",
      "return",
      "satisfies",
      "set",
      "static",
      "string",
      "super",
      "switch",
      "symbol",
      "this",
      "throw",
      "true",
      "try",
      "type",
      "typeof",
      "undefined",
      "unique",
      "unknown",
      "var",
      "void",
      "while",
      "with",
      "yield",
      "async",
      "await",
      "of",
    ],

    operators: [
      "<=",
      ">=",
      "==",
      "!=",
      "===",
      "!==",
      "=>",
      "+",
      "-",
      "**",
      "*",
      "/",
      "%",
      "++",
      "--",
      "<<",
      "</",
      ">>",
      ">>>",
      "&",
      "|",
      "^",
      "!",
      "~",
      "&&",
      "||",
      "??",
      "?",
      ":",
      "=",
      "+=",
      "-=",
      "*=",
      "**=",
      "/=",
      "%=",
      "<<=",
      ">>=",
      ">>>=",
      "&=",
      "|=",
      "^=",
      "@",
    ],

    // we include these common regular expressions
    symbols: /[=><!~?:&|+\-*\/\^%]+/,
    escapes:
      /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    digits: /\d+(_+\d+)*/,
    octaldigits: /[0-7]+(_+[0-7]+)*/,
    binarydigits: /[0-1]+(_+[0-1]+)*/,
    hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

    regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
    regexpesc:
      /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,
  };

  // Return => JSX-Tokens
  return JSXMonacoTokens;
})();
