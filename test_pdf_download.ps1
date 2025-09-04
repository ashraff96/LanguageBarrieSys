$headers = @{"Content-Type"="application/json"; "Accept"="application/json"}

# Test PDF download
$body = @{
    text = "வணக்கம்! இது ஒரு சோதனை ஆவணம். எங்கள் மொழிபெயர்ப்பு சேவை மிகவும் சிறப்பானது. இது தமிழ் மொழியில் மொழிபெயர்க்கப்பட்ட உரையாகும். நாங்கள் PDF வடிவத்தில் பதிவிறக்கம் செய்வதை சோதிக்கிறோம்."
    format = "pdf"
    filename = "test-translation"
} | ConvertTo-Json

Write-Host "Testing PDF download generation..."

try {
    # This will download the PDF file
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/download-formatted" -Method POST -Headers $headers -Body $body -OutFile "test-translation.pdf"
    
    Write-Host "PDF downloaded successfully as test-translation.pdf"
    
    # Check if file exists and get size
    if (Test-Path "test-translation.pdf") {
        $fileSize = (Get-Item "test-translation.pdf").Length
        Write-Host "File size: $fileSize bytes"
        Write-Host "File created successfully! Try opening it with a PDF viewer."
    }
} catch {
    Write-Host "Error:" $_.Exception.Message
}
