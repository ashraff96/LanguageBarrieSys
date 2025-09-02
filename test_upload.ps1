# PowerShell script to test file upload
$baseUrl = "http://localhost:8000/api"

Write-Host "1. Logging in..." -ForegroundColor Yellow

# Login to get token
$loginBody = @{
    email = "admin@docutranslate.com"
    password = "password"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success) {
        $token = $loginData.data.token
        Write-Host "✅ Login successful, token: $($token.Substring(0, 20))..." -ForegroundColor Green
        
        Write-Host "`n2. Testing file upload..." -ForegroundColor Yellow
        
        # Create a test file
        $testContent = "This is a test document for translation.`nHello world!"
        $testFileName = "test_document.txt"
        $tempFile = [System.IO.Path]::GetTempFileName()
        Set-Content -Path $tempFile -Value $testContent
        
        # Prepare form data
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        # Create multipart form data
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$testFileName`"",
            "Content-Type: text/plain",
            "",
            $testContent,
            "--$boundary",
            "Content-Disposition: form-data; name=`"source_language`"",
            "",
            "en",
            "--$boundary", 
            "Content-Disposition: form-data; name=`"target_language`"",
            "",
            "es",
            "--$boundary",
            "Content-Disposition: form-data; name=`"original_name`"",
            "",
            $testFileName,
            "--$boundary",
            "Content-Disposition: form-data; name=`"file_type`"",
            "",
            "text/plain",
            "--$boundary",
            "Content-Disposition: form-data; name=`"file_size`"",
            "",
            "$([System.Text.Encoding]::UTF8.GetByteCount($testContent))",
            "--$boundary--"
        )
        
        $body = $bodyLines -join $LF
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }
        
        Write-Host "Uploading file with:" -ForegroundColor Cyan
        Write-Host "- Source Language: en" -ForegroundColor Cyan
        Write-Host "- Target Language: es" -ForegroundColor Cyan
        Write-Host "- File Name: $testFileName" -ForegroundColor Cyan
        Write-Host "- File Size: $([System.Text.Encoding]::UTF8.GetByteCount($testContent)) bytes" -ForegroundColor Cyan
        
        $uploadResponse = Invoke-WebRequest -Uri "$baseUrl/files/upload" -Method POST -Body $body -Headers $headers -UseBasicParsing
        
        Write-Host "✅ Upload response status: $($uploadResponse.StatusCode)" -ForegroundColor Green
        Write-Host "Response: $($uploadResponse.Content)" -ForegroundColor Green
        
        # Clean up temp file
        Remove-Item $tempFile -Force
        
    } else {
        Write-Host "❌ Login failed: $($loginData.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorText = $reader.ReadToEnd()
        Write-Host "Error details: $errorText" -ForegroundColor Red
    }
}
