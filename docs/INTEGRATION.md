# 모듈 연결 안내 · 2.0

## 설치와 기존 앱 닉네임

`npm ci` 후 `npm run build`를 실행합니다. `dist/module/lumi-run.js`는 그림·QR·스타일을 포함하는 ES 모듈입니다. 타입은 `dist/module/types/src/game/module.d.ts`와 이 파일이 참조하는 `types/shared`에 있습니다. 게임 서버는 프로젝트 루트에서 `npm start`로 실행합니다.

```js
import {mountLumiRun} from '/vendor/lumi-run.js';
const handled = new Set();
const game = mountLumiRun(document.querySelector('#activity'), {
  title: '우리 반의 모험',
  description: '다음 활동 주인공을 찾아요',
  participant: {id: currentStudent.id, name: currentStudent.nickname},
  activityId: 'science-week-03',
  storageKey: 'science-week-03-slot-1',
  map: 2,
  rules: {mode:'race', duration:60, lives:0, count:3},
  serverUrl: 'wss://your-game.example/ws',
  joinBaseUrl: 'https://your-lesson.example/activity',
  onReady: state => console.log('방 준비', state.code),
  onStart: state => console.log('출발', state.matchId),
  onEnd: result => console.log('종료', result.endReason),
  onResult: result => {
    if (handled.has(result.matchId)) return;
    handled.add(result.matchId);
    // 강의 앱에서 저장·점수·다음 화면을 결정합니다.
    console.log(result.selectedIds);
  }
});
```

`currentStudent`는 기존 앱이 가진 학생 정보입니다. `participant.name`을 전달하면 입력란은 그 닉네임으로 고정되고 입장 메시지·머리 위 이름표·결과에도 같은 이름을 사용합니다. 참가 ID는 표시 이름과 분리되어 있습니다. 닉네임은 18자 이내로 전달하세요. 이 설정은 계정 인증을 대신하지 않습니다.

교사 화면에는 `participant`를 생략해도 됩니다. 같은 페이지에 여러 게임을 넣을 때는 서로 다른 `storageKey`를 사용합니다. 개별 소켓·키보드·타이머·렌더링을 제거하는 `destroy()`가 제공되며 학생 화면 제거가 방 전체 종료를 뜻하지 않습니다. 스타일은 Shadow DOM으로 격리됩니다.

## 현재 설정

| 값 | 지원 범위 |
|---|---|
| map | 1 초원, 2 공중정원, 3 사막, 4 수정동굴, 5 별빛공장 |
| mode | race: 도착 보상, last: 꼴찌 선정, ranks: 등수 발표(`ranks` 필요 · 결과 때까지 비밀) |
| duration | 30 / 45 / 60 / 90. **코스 길이**, 제한 시간이 아님 |
| lives | 0(무한), 1, 3, 5 |
| count | 선정 인원 1~30, 시작 시 연결 참가 인원 이하 (ranks 방식은 ranks 개수로 맞춰지고 인원 검사 없음) |
| ranks | ranks 방식의 발표 등수 — 1~30 사이 서로 다른 수 1~5개 (예: [6,9]) |
| timeLimit | 출발 뒤 제한 시간(초). 0(없음) 또는 10~600. 강의 앱 연동은 60 |
| text | 외부 앱 결과 제목, 80자 이내. 게임의 세부 설정 화면에는 노출하지 않음 |

도착 보상은 상위 N명, 꼴찌는 N명 탈락 또는 첫 완주 발생 시점의 뒤쪽 순서, 동점은 공동 선정으로 고정합니다. 자세한 예외는 `RULES.md`에 있습니다. 임의 규칙 코드는 받지 않습니다.

`theme`(light/night), `accent`(#RRGGBB), `title`, `description`, `activityId`, `serverUrl`, `joinBaseUrl`도 지원합니다.

## 공개 메서드와 결과

- `practice()`: 무한 재도전 로컬 연습.
- `start()`: 교사 또는 참가자가 현재 방 전체 출발을 요청.
- `stop()`: 교사만 강제 종료.
- `restart()`: 교사만 결과 후 새 경기 ID로 같은 방 재경기.
- `destroy()`: 현재 화면과 연결 자원 정리.
- `getState()`: 최근 서버 상태. `version`, `capabilities`로 버전·지원 기능 확인.

결과 예시(형식 설명용):

```json
{
  "gameVersion":"2.0.0","moduleVersion":"2.0.0","resultVersion":"2.0",
  "matchId":"server-generated-uuid","activityId":"science-week-03","map":1,
  "rules":{"mode":"race","duration":60,"lives":0,"count":1,"text":"이번 모험의 선정자"},
  "players":[{"id":"student-1042","name":"하나","status":"finished","rank":1,"finishTime":47.1,"progress":12161,"connected":true,"bot":false}],
  "selectedIds":["student-1042"],"selectionReason":"완주 순서 상위 1명",
  "tieHandling":"경계의 같은 도착 틱·탈락 틱·현재 위치는 공동 선정",
  "endReason":"normal","endedAt":"2026-09-14T00:00:00.000Z"
}
```

저장에는 `matchId`를 중복 방지 키로 사용합니다. 표시 이름을 학생 식별 키로 쓰지 마세요. 결과 순위표는 정상 도착 순위를 표시하고 선정 ID를 별도로 전달하므로 꼴찌 모드에서 표의 1등과 선정자가 다를 수 있습니다.

## iframe 연결

```html
<iframe id="lumi" title="루미 런"
 src="https://your-game.example/embed.html?parentOrigin=https%3A%2F%2Fyour-lesson.example"
 allow="fullscreen" style="width:100%;height:900px;border:0"></iframe>
```

부모는 메시지의 `origin`과 `source`를 확인하고, `lumi:available` 수신 후 정확한 게임 출처를 대상으로 다음 메시지를 보냅니다.

```js
frame.contentWindow.postMessage({type:'lumi:mount',config:{
  participant:{id:currentStudent.id,name:currentStudent.nickname},
  activityId:'math-01',map:3,rules:{mode:'last',lives:3,count:2},
  serverUrl:'wss://your-game.example/ws'
}}, 'https://your-game.example');
```

수신 이벤트: `lumi:available`, `lumi:ready`, `lumi:lobby`(로비 참가자·접속 변동), `lumi:start`, `lumi:end`, `lumi:result`, `lumi:error`(서버가 거절한 이유 — 티켓·방 없음 등).
송신 명령: `lumi:mount`, `lumi:create`, `lumi:join`, `lumi:start`, `lumi:stop`, `lumi:restart`, `lumi:destroy`.

## 강의 앱 연동 (2.1 · 발표자 선정)

강의 앱(Science Lesson Studio, `scienced`)의 3·4강 발표자 선정이 이 게임을 쓴다. 학생은 코드·닉네임을 입력하지 않고 자기 계정으로 저절로 들어오고, 결과는 서버가 서명해 강의 앱 서버 함수로 보낸다. 브라우저의 `lumi:result` 는 화면용일 뿐이고 발표자는 그 webhook 으로만 확정된다.

### 티켓

강의 앱 서버 함수(`/api/lumi/ticket`)가 로그인·역할·수강 등록을 확인하고 발급한다. 형식은 `base64url(JSON) + '.' + base64url(HMAC-SHA256(secret, base64url(JSON)))`.

| 필드 | 뜻 |
|---|---|
| iss / aud | `scienced` / `lumi-run` |
| cid / lid / act | 클래스 · 차시 · 활동 실행 id (같은 차시를 두 번 해도 다른 값) |
| sub / name / role | 계정 uid · 표시 이름(18자) · `teacher` | `student` |
| iat / exp | 발급·만료(초). 한 수업 시간(120분) |

게임 서버는 티켓의 서명·만료·활동만 믿고 브라우저가 보낸 id·이름은 무시한다.
`create` 는 교사 티켓만, 같은 `act` 로 다시 만들면 새 방이 아니라 그 방에 교사로 다시 잇는다(`reused`).
`join` 은 학생 티켓이 방의 `act` 와 같아야 한다. 티켓이 없거나 다른 활동이면 거절. 연동 방은 시작·종료·재경기를 교사만 한다(`LESSON_START_POLICY='teacher'`).

### mount config (연동에 추가된 것)

```js
{ entryRole:'teacher'|'student', integrationTicket, activityId, roomCode, autoJoin:true,
  participant:{id,name}, storageKey, rules:{mode,count,text}, serverUrl, joinBaseUrl }
```

- 연동 방의 로비는 QR·참가 링크·설정 패널을 숨긴다. 교사는 참가자 명단을 보고 「다 함께 시작」만 누른다.
- 학생 config 의 `rules` 에는 `ranks` 를 넣지 않는다(학생 브라우저에 등수가 가지 않게). 서버 스냅숏도 결과 전에는 `ranks` 를 뺀다.
- 교사: `lumi:mount` 뒤 `lumi:create` 로 방을 만든다. 로비에 들어가면 `lumi:ready`(방 코드) — 강의 앱이 세션에 적는다. `roomCode` 를 주고 다시 mount 하면 그 방에 다시 잇는다(새로고침).
- 학생: `roomCode` + `autoJoin` 이면 한 번만 저절로 참가한다. 시작 단추와 참가 코드 입력은 보이지 않는다.
- `lumi:lobby` 는 로비에서 참가자나 접속 상태가 바뀔 때마다 온다 — 강의 콘솔의 「게임 연결 N명」이 이것으로 산다.

### 결과 전달 (webhook)

경기가 끝나면 `LESSON_RESULT_URL` 로 POST 한다. 본문은 `{type:'lumi.result', sentAt, room:{code, activityId, cid, lid}, result}`,
헤더 `x-lumi-signature: sha256=<hex HMAC-SHA256(LESSON_SHARED_SECRET, 본문 그대로)>`.
실패하면 5·20·60초 뒤 다시 보내고, 같은 경기는 한 번만 보낸다. 강의 앱은 `(activityId, matchId)` 로 멱등 저장한다. `/health` 의 `lesson.pendingResults` 가 재시도 대기 수다.

### 환경 변수 (Render)

| 변수 | 값 |
|---|---|
| `LESSON_SHARED_SECRET` | 강의 앱 Cloudflare 의 `LUMI_SHARED_SECRET` 과 **같은 값**. 없으면 연동 방을 열지 않는다 |
| `LESSON_RESULT_URL` | `https://scienced.labbitory.com/api/lumi/result` |
| `ALLOWED_ORIGINS` | **두지 않는다.** iframe 이 게임 origin 에 있으므로 WebSocket 의 Origin 은 게임 자신이고 기본 같은-host 검사로 충분하다. 굳이 두려면 게임 주소를 반드시 포함 — 강의 앱 주소만 넣으면 모든 접속이 403 이다 |

검사: `npm test`(티켓·방 규칙), `LESSON_SHARED_SECRET=… npx tsx scripts/lesson-check.ts`(서버를 띄워 두고 티켓 생성·참가·거절·webhook 수신까지 17항목).

## 1.x에서 2.0으로 변경

맵 ID는 1~5로 바뀌었습니다. `survival`, `rank`, `selection`, `ties`, `fallback`, `lastScope`, `early` 옵션은 제거했습니다. `duration`은 시간 종료를 만들지 않습니다. 서버·클라이언트·모듈을 같은 2.0 빌드로 함께 교체하고 이전 방은 새로 만드세요. 방 상태는 메모리이므로 서버 재시작으로 없어집니다.

샘플 강의 A는 도착 보상으로 다음 발표자를 표시합니다. B는 꼴찌 선정 결과에 선정 3점·참여 1점을 기록합니다. 게임 본체를 수정하지 않고 규칙·제목·결과 콜백만 다르게 전달합니다. 외부 배포 절차는 `DEPLOYMENT.md`를 참고하세요.
