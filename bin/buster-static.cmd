@IF EXIST "%~dp0"\"node.exe" (
  "%~dp0"\"node.exe"  "%~dp0\..\..\buster\bin\buster-static" %*
) ELSE (
  node "%~dp0\..\..\buster\bin\buster-static" %*
)