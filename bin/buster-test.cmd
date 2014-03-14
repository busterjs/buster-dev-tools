@IF EXIST "%~dp0"\"node.exe" (
  "%~dp0"\"node.exe"  "%~dp0\..\..\buster\bin\buster-test" %*
) ELSE (
  node "%~dp0\..\..\buster\bin\buster-test" %*
)