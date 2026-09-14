@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js가 필요합니다. https://nodejs.org 에서 LTS 버전을 설치해 주세요.
  pause
  exit /b 1
)
if not exist "node_modules\tsx\dist\cli.mjs" (
  echo 처음 실행에 필요한 파일을 설치합니다.
  call npm.cmd ci
  if errorlevel 1 (
    echo 설치를 완료하지 못했습니다. 인터넷 연결을 확인해 주세요.
    pause
    exit /b 1
  )
)
echo.
echo 루미 런과 게임 서버를 함께 켭니다.
echo 브라우저에서 http://localhost:3000 을 열어 주세요.
echo 이 창을 닫으면 게임 서버도 꺼집니다.
echo 이미 서버가 켜져 있으면 새로 켜지 말고 위 주소에 접속하세요.
echo.
if not exist "build\server\index.js" (
  echo 게임 실행 파일을 처음 구성합니다.
  call npm.cmd run build
  if errorlevel 1 (
    echo 실행 파일을 만들지 못했습니다. 오류 내용을 확인해 주세요.
    pause
    exit /b 1
  )
)
call npm.cmd start
pause
