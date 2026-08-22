// Utility to capture and download 4 path audit PNG images from the live SVG map

export async function captureSvgAsPng(
  svgElement: SVGSVGElement,
  fileName: string,
  width = 1200,
  height = 860,
): Promise<void> {
  return new Promise((resolve) => {
    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

      // Add namespace if missing
      if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          URL.revokeObjectURL(url);
          resolve();
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        URL.revokeObjectURL(url);

        canvas.toBlob(blob => {
          if (!blob) {
            resolve();
            return;
          }
          const a = document.createElement('a');
          a.download = fileName;
          a.href = URL.createObjectURL(blob);
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          resolve();
        }, 'image/png');
      };

      image.onerror = (err) => {
        URL.revokeObjectURL(url);
        console.warn('SVG render error:', err);
        resolve(); // resolve gracefully
      };

      image.src = url;
    } catch (e) {
      console.warn('Capture error:', e);
      resolve();
    }
  });
}
