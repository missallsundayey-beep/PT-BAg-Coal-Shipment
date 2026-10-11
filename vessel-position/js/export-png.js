// Export uses the same self-contained SVG as the preview.
function exportPng(res, onError) {
    const exportW = W * 2, exportH = H * 2;
    // Render the SVG at the export size so vector text stays sharp.
    const svgStr = res.svg.replace('width="' + W + '" height="' + H + '"',
      'width="' + exportW + '" height="' + exportH + '"');
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = exportW; c.height = exportH;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, exportW, exportH); g.drawImage(img, 0, 0, exportW, exportH);
      c.toBlob(b => {
        const a = document.createElement('a');
        const r = res.report;
        a.download = 'Vessel_Position_' + r.y + '-' + pad(r.m + 1) + '-' + pad(r.d) + '.png';
        if (!b) { onError('PNG gagal dibuat.'); return; }
        const pngUrl = URL.createObjectURL(b);
        a.href = pngUrl; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
      }, 'image/png');
    };
    const svgUrl = URL.createObjectURL(new Blob([svgStr], {type:'image/svg+xml;charset=utf-8'}));
    img.addEventListener('load', () => URL.revokeObjectURL(svgUrl), {once:true});
    img.onerror = () => { URL.revokeObjectURL(svgUrl); onError('Gambar gagal diekspor.'); };
    img.src = svgUrl;
}
