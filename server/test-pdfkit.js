const PDFDocument = require('pdfkit');

async function testPDFKit() {
  try {
    console.log('Testing PDFKit PDF generation...');
    
    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Collect PDF data
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      
      // Save test PDF file
      const fs = require('fs');
      const filename = 'test_pdfkit.pdf';
      fs.writeFileSync(filename, pdfBuffer);
      
      console.log(`✅ PDFKit PDF generated successfully: ${filename}`);
      console.log(`PDF size: ${pdfBuffer.length} bytes`);
      console.log('First 100 bytes:', pdfBuffer.slice(0, 100));
    });

    // Generate simple PDF content
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#111827')
       .text('Test PDF Generation', { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(16)
       .font('Helvetica')
       .fillColor('#6B7280')
       .text('This is a test PDF generated with PDFKit', { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#1F2937')
       .text('Generated at: ' + new Date().toISOString());

    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('❌ PDFKit test failed:', error);
  }
}

testPDFKit();
