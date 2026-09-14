# 루미 런 단독 배포와 모듈 연결

설정 확인: 2026-09-14. 공개 주소는 Render에서 서비스 생성과 빌드가 성공한 뒤 확정됩니다. 이 문서의 `your-game.onrender.com`은 예시입니다.

## 1. Render · GitHub · Cloudflare의 역할

| 서비스 | 하는 일 | 이번 게임에 필요한가? |
|---|---|---|
| Render | 게임 화면과 실시간 Node.js 서버를 인터넷에서 실행 | 이번 단독 배포에 사용 |
| GitHub | 소스 보관·변경 이력·Render에 빌드할 코드 제공 | 권장. 기술적으로 필수는 아님 |
| Cloudflare | 기존 강의 사이트 호스팅, 별도 도메인의 DNS 관리 등에 사용 가능 | 단독 배포에는 불필요 |

Render는 게임 엔진이 아닌 호스팅 서비스입니다. 루미 런은 TypeScript와 Canvas로 화면을 그리고 Node.js와 WebSocket으로 참가자를 동기화합니다. Render **Web Service 하나**가 게임 화면과 실시간 서버를 함께 제공합니다. 배포 후 학생은 HTTPS 주소로 접속하며, 교사의 컴퓨터를 계속 켜두거나 같은 Wi-Fi에 있을 필요가 없습니다.

GitHub 주소는 개발·배포용이고, Render 주소는 학생에게 나눠줄 게임 주소입니다. GitHub 저장소는 **Private(비공개)**이어도 Render에 접근 권한을 연결하면 배포할 수 있습니다. 게임 공개와 소스 공개는 별개이며, 별도 도메인 구매도 필요 없습니다.

공식 자료: [Render Web Services](https://render.com/docs/web-services), [WebSocket 지원](https://render.com/docs/websocket).

## 2. 준비한 배포 설정

프로젝트 루트의 `render.yaml`에 아래 값을 지정했습니다.

| 항목 | 값 |
|---|---|
| 서비스 종류 | Web Service / Node |
| 이름 | lumi-run — 실제 주소는 생성 후 확인 |
| 요금제 | Free — 첫 공개 접속 시험용 |
| 지역 | Singapore |
| 서버 수 | 1 |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| 자동 배포 | Off — 수업 종료 후 수동 배포 |
| 환경변수 | `NODE_ENV=production`, `NODE_VERSION=24.16.0`, `ENABLE_TEST_ROOMS=false` |

`PORT`는 Render가 제공하므로 고정하지 않습니다. 저장소 루트에 `package.json`이 있으면 Root Directory는 비웁니다. 하위 폴더에 게임을 올렸다면 그 폴더를 지정합니다.

현재 Blueprint 명세에서는 요금제를 생략하면 새 Web Service에 유료 기본값이 적용될 수 있어 Free를 명시했습니다. 자동 배포는 수업 중 코드 수정으로 서버가 재시작되는 일을 피하도록 껐습니다. 파일 수정은 이미 배포된 서비스에 자동 적용되는 것이 아니며 Blueprint 동기화나 대시보드 적용이 필요합니다.

공식 설정: [Render Blueprint 명세](https://render.com/docs/blueprint-spec).

## 3. 권장 단독 배포: GitHub 비공개 저장소 → Render

1. GitHub에 로그인하고 원하는 이름(예: `lumi-run`)으로 **Private** 저장소를 만듭니다.
2. 프로젝트 소스를 올립니다. Git을 사용하면 `.gitignore`가 생성물과 로컬 파일을 제외합니다. 브라우저 업로드에는 이 규칙이 자동 적용되지 않으므로 배포용 소스 ZIP을 풀어서 **내용물**을 올립니다. ZIP 파일 자체를 올리는 것이 아닙니다.
3. 저장소 루트에 `package.json`, `package-lock.json`, `render.yaml`, `src/`, `shared/`, `server/`와 빌드 설정이 있는지 확인합니다. `node_modules/`, `.env`, 로그, 시험 결과, `releases/`는 올리지 않습니다. `dist/`, `build/`는 Render가 다시 만듭니다.
4. Render에 로그인하고 GitHub 저장소를 연결합니다. 처음 연결할 때는 해당 저장소에 필요한 접근 권한을 허용합니다.
5. **New → Blueprint**에서 저장소를 골라 루트의 `render.yaml`을 읽게 합니다. 생성 전 **Free**, **Singapore**, 서버 1개인지 확인합니다. 결제나 유료 상품 선택이 나오면 구매 전에 조건을 확인합니다.
6. 또는 **New → Web Service**에서 저장소를 연결하고 위 표의 값을 직접 입력합니다. Instance Type은 **Free**를 고릅니다. Static Site는 선택하지 않습니다.
7. 배포 로그에서 빌드 성공과 서비스 실행을 확인합니다. 첫 빌드에는 패키지 설치 시간이 필요합니다.
8. 서비스 화면의 실제 `https://…onrender.com` 주소를 엽니다. `/health`가 정상 응답하는지, 두 브라우저가 같은 방에 참가하고 함께 출발·종료하는지 확인합니다.
9. 휴대폰과 학교 Wi-Fi에서도 확인한 뒤 게임 주소를 학생에게 공유합니다.

명령줄로 처음 저장소를 올릴 때의 예시입니다. `OWNER`는 본인 GitHub 계정 이름으로 바꾸고 GitHub에 빈 저장소를 먼저 만듭니다. 기존 Git 저장소에서는 초기화부터 다시 하지 않습니다.

```powershell
git init -b main
git add .
git status
git commit -m "Prepare Lumi Run 2.0 deployment"
git remote add origin https://github.com/OWNER/lumi-run.git
git push -u origin main
```

`git status`로 올릴 파일을 확인한 뒤 커밋합니다. 인증은 GitHub 로그인 절차를 사용합니다. 배포에는 실제 접근 가능한 **저장소 주소**가 필요하며 계정 프로필 주소만으로는 배포할 수 없습니다.

업데이트는 코드 수정 → 검사·빌드 → GitHub에 커밋·푸시 → 수업 종료 후 Render의 **Manual Deploy → Deploy latest commit** 순서입니다. 자동 배포는 꺼두었습니다.

공식 절차: [Node 앱 배포](https://render.com/docs/deploy-node-express-app), [Web Service 생성](https://render.com/docs/web-services).

## 4. 배포 후 게임 켜고 참가하기

1. 교사는 Render의 게임 주소를 열고 방을 만듭니다.
2. 맵, 경기 방식, 선정 인원, 코스 길이, 목숨을 설정하고 참가 코드나 QR을 공유합니다.
3. 학생은 같은 게임 주소에서 참가 코드와 닉네임을 입력합니다. 설치는 필요 없습니다.
4. 참가자가 모이면 시작합니다. 참가자의 시작 요청도 방 전체 출발로 처리됩니다. 교사는 선두를 보고 학생은 자기 캐릭터를 따라갑니다.
5. 휴대폰은 가로 모드로 사용합니다. 교사는 필요하면 강제 종료하고 결과를 저장합니다.

로컬 실행도 계속 가능합니다. `루미런-시작.cmd`를 실행하고 `http://localhost:3000/`을 엽니다. `localhost`는 다른 컴퓨터나 휴대폰에 공유할 공개 주소가 아닙니다.

## 5. 무료 시험과 수업 운영

Render Free Web Service는 15분 동안 들어오는 HTTP 요청이나 WebSocket 메시지가 없으면 잠들 수 있습니다. 다시 접근하면 약 1분 정도 준비 시간이 생길 수 있습니다. 현재 방·진행 상태는 메모리에 있어 서버 재시작이나 재배포 시 없어집니다. 무료 인스턴스 시간, 네트워크·빌드 사용량에도 한도가 있으므로 계정의 현재 한도와 결제 설정을 확인하세요.

처음에는 Free로 공개 접속을 시험할 수 있습니다. 수업에서 일정한 시작 속도와 가용성이 필요하면 실제 학교망 시험 후 유료 인스턴스의 필요성을 판단하세요. 요금제 변경·결제는 별도 선택입니다. 유료로 바꾸어도 방의 영구 저장이 자동으로 생기지는 않습니다.

로컬 30명 동시 연결 시험은 완료했지만 Render Free에서 30명이 원활하다는 보장은 아닙니다. 실제 공개 서버의 지연·휴대폰·학교망 시험이 추가로 필요합니다. 현재 서버를 여러 개로 늘리면 메모리 방이 분리되므로 1개로 운영합니다. 수업 종료 후 결과를 내려받거나 강의 앱에 저장하세요.

공식 조건: [Render Free 안내](https://render.com/docs/free). 시험 범위: [검증 기록](VERIFICATION.md).

## 6. GitHub 없이 배포할 수 있나?

가능합니다. Render는 GitLab·Bitbucket 저장소와 미리 빌드한 Docker 이미지도 지원합니다. 현재 프로젝트는 GitHub 연결 방식으로 준비되어 있습니다. 인터넷 배포 없이 로컬 실행만 하는 데도 GitHub는 필요 없습니다.

Render에 ZIP을 올려 현재 Node 서버를 바로 실행하는 것은 위의 배포 방식이 아닙니다. ZIP은 소스 전달·보관·GitHub 업로드 준비용입니다. 별도 이미지 저장소와 Docker 빌드를 준비하는 것보다 GitHub 비공개 저장소를 연결하는 편이 간단합니다.

공식 대안: [Docker 이미지 배포](https://render.com/docs/deploying-an-image).

## 7. 모듈화를 위해 GitHub에 올려야 하나?

**아니요. 모듈화는 코드 구조와 연결 규약의 문제이며 GitHub 가입·공개와는 별개입니다.** 현재 ES 모듈과 iframe 연결 방식을 모두 제공합니다.

### A. iframe — 간단하게 기존 강의 앱에 넣기

Render 게임의 `/embed.html`을 강의 앱 안의 iframe으로 엽니다. 기존 닉네임은 `lumi:mount` 메시지의 `participant.name`으로 전달하고 결과는 `lumi:result`로 받습니다. `parentOrigin`을 정확하게 지정하고 메시지의 출처를 확인하는 초기화 코드가 필요합니다.

게임 업데이트는 Render 한 곳에서 관리합니다. 강의 앱이 Cloudflare에 있다면 **강의 앱은 Cloudflare, 게임 화면과 서버는 Render**에 둡니다. 게임 소스를 강의 앱 저장소에 복사할 필요가 없습니다.

### B. ES 모듈 — 강의 앱 화면과 직접 연결

1. 프로젝트에서 `npm ci`, `npm run build`를 실행합니다.
2. `dist/module/lumi-run.js`를 강의 앱의 공개 파일 경로(예: `/vendor/lumi-run.js`)에 복사합니다. TypeScript 앱은 `dist/module/types/` 전체도 참고합니다.
3. `mountLumiRun`에 `participant: {id, name}`과 실제 Render 서버의 `serverUrl: 'wss://게임-주소/ws'`를 전달합니다.
4. Render의 `ALLOWED_ORIGINS` 환경변수에 게임 주소와 강의 앱 주소를 쉼표로 구분해 추가합니다. 경로 없이 origin만 씁니다.
5. `onResult`로 결과를 저장하거나 다음 활동으로 넘어갑니다. 화면을 닫을 때 `destroy()`로 연결을 정리합니다.

```text
ALLOWED_ORIGINS=https://your-game.onrender.com,https://your-lesson.example
```

현재 서버는 다른 출처에서 JS를 바로 import하기 위한 HTTP CORS 헤더를 제공하지 않습니다. 위 절차처럼 모듈 파일을 강의 앱과 같은 출처에 복사하세요. `ALLOWED_ORIGINS`는 WebSocket 설정이며 JS 파일의 HTTP CORS 설정을 대신하지 않습니다.

모듈 파일만 복사해도 실시간 서버까지 함께 옮겨지는 것은 아닙니다. 멀티플레이 서버는 계속 Render에서 실행합니다. 서버·클라이언트·모듈 버전을 함께 관리하세요. npm에 패키지를 공개할 필요도 없습니다.

전체 코드 예시와 API: [모듈 연결 안내](INTEGRATION.md).

## 8. Cloudflare에서 전부 배포하려면?

Cloudflare Pages는 정적 화면을 배포할 수 있지만 현재 Node.js WebSocket 서버를 그대로 실행하는 환경은 아닙니다. 화면만 옮길 때도 실시간 서버는 별도로 필요합니다. Workers와 Durable Objects로 통합하려면 방 관리·연결·상태 동기화 코드를 해당 환경에 맞게 변경하고 다시 시험해야 합니다.

지금은 Render Web Service 하나로 시작하는 것이 간단합니다. Cloudflare는 기존 강의 앱이나 별도 도메인 관리가 필요할 때 추가하면 됩니다. GitHub Pages도 현재 Node 서버의 대체 호스팅이 아닙니다.

공식 자료: [Cloudflare Pages 직접 업로드](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Durable Objects WebSocket 서버](https://developers.cloudflare.com/durable-objects/examples/websocket-server/).
