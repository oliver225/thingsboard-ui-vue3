declare module 'js-beautify/js/lib/beautify.js' {
  interface BeautifyOptions {
    brace_style?: string;
    end_with_newline?: boolean;
    eol?: string;
    indent_size?: number;
    indent_with_tabs?: boolean;
    preserve_newlines?: boolean;
    unescape_strings?: boolean;
    wrap_line_length?: number;
  }
  export function js_beautify(
    source: string,
    options?: BeautifyOptions,
  ): string;
}
