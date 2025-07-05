$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")

$body = @{
    email = "daniellofficial@gmail.com"
    subscriptionType = "single"
    targetDate = $tomorrow
} | ConvertTo-Json

Write-Host "Testing API with body:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-WebRequest -Uri "https://tor-ramel.netlify.app/api/notify-request" -Method POST -ContentType "application/json" -Body $body
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Content:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" -ForegroundColor Red
        Write-Host $responseBody
    }
} 