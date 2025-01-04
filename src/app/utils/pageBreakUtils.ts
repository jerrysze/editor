export const PAGE_BREAK_MARKER = '<!-- pagebreak -->';

export const A4_DIMENSIONS = {
  width: 794, // pixels at 96 DPI
  height: 1123, // pixels at 96 DPI
  padding: 40
};

export const splitContentByPages = (content: string): string[] => {
  return content.split(PAGE_BREAK_MARKER).map(page => page.trim());
};

export const addPageBreakStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .page-break-preview {
      border-bottom: 2px dashed #999;
      margin: 20px 0;
      page-break-after: always;
    }
    
    .markdown-page {
      min-height: ${A4_DIMENSIONS.height}px;
      width: ${A4_DIMENSIONS.width}px;
      padding: ${A4_DIMENSIONS.padding}px;
      box-sizing: border-box;
      background-color: white;
      margin-bottom: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
  `;
  document.head.appendChild(style);
}; 