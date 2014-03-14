@IF EXIST "%~dp0"\"node.exe" (
  "%~dp0"\"node.exe"  "%~dp0\..\..\buster\bin\buster-autotest" %*
) ELSE (
  node "%~dp0\..\..\buster\bin\buster-autotest" %*
)