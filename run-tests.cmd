@IF EXIST "%~dp0"\"node.exe" (
  "%~dp0"\"node.exe"  "%~dp0\run-tests" %*
) ELSE (
  node "%~dp0\run-tests" %*
)