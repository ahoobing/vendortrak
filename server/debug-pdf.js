const puppeteer = require('puppeteer');

async function testSimplePDF() {
  try {
    console.log('Testing simple PDF generation...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Simple HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test PDF</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>Test PDF Generation</h1>
        <p>This is a test PDF to verify Puppeteer is working correctly.</p>
        <p>Generated at: ${new Date().toISOString()}</p>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    // Save test PDF
    const fs = require('fs');
    const filename = 'test_simple.pdf';
    fs.writeFileSync(filename, pdfBuffer);
    
    console.log(`✅ Simple PDF generated successfully: ${filename}`);
    console.log(`PDF size: ${pdfBuffer.length} bytes`);
    console.log('First 100 bytes:', pdfBuffer.slice(0, 100));
    
  } catch (error) {
    console.error('❌ Simple PDF test failed:', error);
  }
}

testSimplePDF();
