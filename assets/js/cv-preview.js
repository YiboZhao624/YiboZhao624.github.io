const container = document.getElementById('cv-pages');
const status = document.getElementById('cv-status');

try {
  const pdfjs = await import('./pdfjs/pdf.js');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdfjs/pdf.worker.js', import.meta.url).href;
  const pdf = await pdfjs.getDocument({ url: container.dataset.pdfUrl }).promise;

  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const baseViewport = page.getViewport({ scale: 1 });
    // Render sharply at desktop width; CSS scales the result to smaller screens.
    const viewport = page.getViewport({ scale: 820 / baseViewport.width });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const figure = document.createElement('figure');
    figure.className = 'cv-sheet';
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width * pixelRatio);
    canvas.height = Math.ceil(viewport.height * pixelRatio);
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `CV page ${number} of ${pdf.numPages}`);
    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
    }).promise;
    const caption = document.createElement('figcaption');
    caption.textContent = `${number} / ${pdf.numPages}`;
    figure.append(canvas, caption);
    container.append(figure);
  }
  status.textContent = '';
  status.hidden = true;
} catch (error) {
  status.textContent = 'The preview could not be loaded. Please use Download PDF to view the CV.';
  console.error('CV preview failed:', error);
} finally {
  container.setAttribute('aria-busy', 'false');
}
