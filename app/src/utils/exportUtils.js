import html2canvas from 'html2canvas';

// SVG Icon for Download
export const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
  </svg>
);

// Function to trigger the browser download
export const triggerDownload = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to export an HTML element as an image using html2canvas
export const exportElementAsImage = async (elementRef, format = 'png', filenamePrefix = 'element') => {
  if (!elementRef || !elementRef.current) {
    console.error("Element ref is not valid for export.");
    alert("Could not export element: Reference not found.");
    return;
  }

  try {
    const canvas = await html2canvas(elementRef.current, {
      useCORS: true, // For external images/fonts if any, though likely not needed for self-contained components
      scale: 2, // Increase scale for better resolution
      backgroundColor: '#ffffff', // Explicitly set background to white, as default is transparent
    });
    
    let imageDataUrl;
    const filename = `${filenamePrefix}_${new Date().toISOString().slice(0,10)}.${format}`;

    if (format === 'jpeg') {
      imageDataUrl = canvas.toDataURL('image/jpeg', 0.9); // 0.9 quality for JPEG
    } else { // Default to png
      imageDataUrl = canvas.toDataURL('image/png');
    }
    triggerDownload(imageDataUrl, filename);
  } catch (error) {
    console.error('Error exporting element as image:', error);
    alert('Sorry, there was an error exporting the image. Please try again.');
  }
}; 