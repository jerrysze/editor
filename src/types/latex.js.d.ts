declare module 'latex.js' {
  export interface Environment {
    begin: (optionalTitle?: string) => string[];
    end: () => string[];
    counter?: number;
    caption?: string;
  }

  export interface Generator {
    theorems: Record<string, { caption: string; counter: number }>;
    environments: Record<string, Environment>;
    setFontWeight: (weight: string) => void;
    setFontStyle: (style: string) => void;
  }

  export interface CustomMacrosConstructor {
    new (generator: Generator): any;
    args: Record<string, string[]>;
  }

  export interface HtmlGeneratorOptions {
    hyphenate?: boolean;
    CustomMacros?: CustomMacrosConstructor;
  }

  export class HtmlGenerator {
    constructor(options?: HtmlGeneratorOptions);
    theorems: Record<string, { caption: string; counter: number }>;
    environments: Record<string, Environment>;
  }

  export function parse(latex: string, options?: { generator: HtmlGenerator }): {
    domFragment: () => DocumentFragment;
    stylesAndScripts: (baseURL: string) => HTMLElement;
  };

  const LatexJS: {
    parse: typeof parse;
    HtmlGenerator: typeof HtmlGenerator;
  };
  export default LatexJS;
}
