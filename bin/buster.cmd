@IF EXIST "%~dp0"\"node.exe" (
  "%~dp0"\"node.exe"  "%~dp0\..\..\buster\bin\buster" %*
) ELSE (
  node "%~dp0\..\..\buster\bin\buster" %*
)