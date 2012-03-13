@IF EXIST "%~dp0"\"node.exe" (
  "%~dp0"\"node.exe"  "%~dp0\buster-dev-tools" %*
) ELSE (
  node "%~dp0\buster-dev-tools" %*
)