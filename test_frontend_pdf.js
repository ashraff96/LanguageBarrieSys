// Quick test to verify the PDF download API works from frontend context
const testPDFDownload = async () => {
    const testText = "வணக்கம்! இது ஒரு PDF சோதனை ஆவணம். எங்கள் மொழிபெயர்ப்பு சேவை இப்போது சரியான PDF கோப்புகளை உருவாக்குகிறது.";
    
    try {
        console.log('Testing PDF download API...');
        
        const response = await fetch('/api/download-formatted', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: testText,
                format: 'pdf',
                filename: 'test-download'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        if (response.ok) {
            const blob = await response.blob();
            console.log('PDF blob size:', blob.size, 'bytes');
            console.log('PDF blob type:', blob.type);
            
            // Create download
            const url = window.URL.createObjectURL(blob);
            const element = document.createElement('a');
            element.href = url;
            element.download = 'test-download.pdf';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ PDF download test successful!');
            return true;
        } else {
            const error = await response.text();
            console.error('❌ API error:', error);
            return false;
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        return false;
    }
};

// Run test (paste this in browser console on the frontend page)
testPDFDownload();
