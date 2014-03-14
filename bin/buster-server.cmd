@IF EXIST "%~dp0"\"node.exe" (
  "%~dp0"\"node.exe"  "%~dp0\..\..\buster\bin\buster-server" %*
) ELSE (
  node "%~dp0\..\..\buster\bin\buster-server" %*
)