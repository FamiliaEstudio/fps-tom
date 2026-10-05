param([Parameter(Mandatory=$true)][string]$Binary)
$ErrorActionPreference = 'Stop'
$process = [System.Diagnostics.Process]::new()
$process.StartInfo.FileName = $Binary
$process.StartInfo.WorkingDirectory = [System.IO.Path]::GetTempPath()
$process.StartInfo.UseShellExecute = $false
$process.StartInfo.RedirectStandardOutput = $true
$process.StartInfo.RedirectStandardError = $true
[void]$process.Start()
$stdoutTask = $process.StandardOutput.ReadToEndAsync()
$stderrTask = $process.StandardError.ReadToEndAsync()
[long]$peakWorkingSet = 0
while (-not $process.HasExited) {
  $process.Refresh()
  if (-not $process.HasExited) {
    $peakWorkingSet = [Math]::Max($peakWorkingSet, $process.PeakWorkingSet64)
  }
  Start-Sleep -Milliseconds 20
}
$process.WaitForExit()
[System.Console]::Out.Write($stdoutTask.GetAwaiter().GetResult())
[System.Console]::Error.Write($stderrTask.GetAwaiter().GetResult())
[System.Console]::Error.WriteLine("PEAK_WORKING_SET_BYTES=$peakWorkingSet")
$status = $process.ExitCode
$process.Dispose()
exit $status
